import * as path from "path";

const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");
const easymidi    = require("easymidi");

import { Key, Scale } from "tblswvs";
import { BrowserWindow } from "electron";
import { MonomeGrid } from "./grid/monome_grid";
import { AbletonLive } from "./ableton/live";
import { note } from "tblswvs";
import { AbletonTrack } from "./ableton/track";
import { pulseRateMap } from "./ableton/note";


export class Sequencer {
  static CONFIG_DIRECTORY: string = path.resolve(__dirname, "../../config");

  emitter: any;
  receiver: any;
  grid: MonomeGrid;
  daw: AbletonLive;
  midiIn: any;
  // midiOut: any;
  ticks: number = 0;
  superMeasure: number = 4;
  step: number = 0;
  gui: BrowserWindow;
  key: Key;
  queuedMelody: note[] = new Array();
  queuedChordProgression: note[][] = new Array();
  testing: boolean;


  constructor(testing: boolean = false) {
    this.testing = testing;

    if (!this.testing) {
      this.midiIn = new easymidi.Input("tblswvs in", true);

      // To Live
      this.emitter = new OscEmitter();
      this.emitter.add("localhost", 33333);

      // From Live
      this.receiver = new OscReceiver();
      this.receiver.bind(33334, "localhost");
      this.receiver.on("/live/song/beat", (beatNumber: number) => this.#syncWithLiveBeat(beatNumber));
      this.receiver.on("/live/clips", (tIdx: number, cIdx: number) => this.#syncLiveTrackClip(tIdx, cIdx));
      this.receiver.on("/live/chains", (tIdx: number, chIdx: number, active: number) => this.#syncLiveTrackChain(tIdx, chIdx, active));

      // For debugging: all messages are logged.
      // this.receiver.on("message", this.#processLiveMessages);
    }
    this.grid = new MonomeGrid(this, testing);
    this.daw  = new AbletonLive(this);
    this.key  = new Key(60, Scale.Minor);
  }


  async connectToGrid() {
    const msg = await this.grid.connect();
    return msg;
  }


  async follow() {
    this.midiIn.on("clock", () => {
      this.ticks++;
      // 6 MIDI clock ticks equals a 16th note.
      if (this.ticks % 6 != 0) return;

      // If the current track is set to an 8n pulse, for example, don't advance on fractions of a step.
      const trackStep = Math.floor(this.step / pulseRateMap[this.daw.getActiveTrack().pulseRate].size);
      this.grid.displayRhythmWithTransport(trackStep % this.daw.getActiveTrack().beatLength);

      this.step = this.step == this.superMeasure * 16 - 1 ? 0 : this.step + 1;
    });

    this.midiIn.on("start", () => {
    });

    this.midiIn.on("position", (data: any) => {
      if (data.value != 0) return;

      this.ticks = 0;
      this.step  = 0;
      this.grid.displayRhythmWithTransport(this.step);
    });
  }


  setNotes(track: AbletonTrack) {
    // let timeout = 0;

    if (track.createNewClip) {
      track.currentClip = (track.currentClip + 1) % 4;
      this.emitter.emit(
        `/tracks/${track.dawIndex}/clips/${track.currentClip}/create`,
        this.superMeasure * 4
      );
    }

    const clipIndex = this.daw.mutating && (track.mutating || track.randomizing) ?
                      AbletonLive.EVOLUTION_SCENE_INDEX :
                      track.currentClip;
    const notes     = track.abletonNotes();
    try {
      this.emitter.emit(
        `/tracks/${track.dawIndex}/clips/${clipIndex}/notes`,
        ...notes.flatMap(note => note.toOscAddedNote())
      );
    } catch (e) {
      console.error(e.name, e.message, "while sending notes to Live:");
      console.error("input notes:", notes);
      console.error("OSC mapped notes", ...notes.flatMap(note => note.toOscAddedNote()));
      console.error("trackIndex", track.dawIndex, "mutating", track.mutating);
      console.error("trackIndex", track.dawIndex, "randomizing", track.randomizing);
      console.error("Current track mutation", track.currentMutation);
    }

    // setTimeout(() => {
    //   this.emitter.emit(
    //     `/tracks/${trackIndex}/clips/${clipIndex}/notes`,
    //     ...notes.flatMap(note => note.toOscAddedNote())
    //   );
    // }, timeout);
  }


  setRampSequence(track: AbletonTrack, rampSequenceIndex: (0|1)) {
    if (this.testing) return;
    try {
      this.emitter.emit(
        `/tracks/${track.dawIndex}/ramp_seq/${rampSequenceIndex}`,
        ...track.getRampSequence(rampSequenceIndex).deviceData()
      );
    } catch (e) {
      console.error(e.name, e.message, "while sending ramp sequence data to Live:");
      console.error("ramp sequence data:", track.getRampSequence(rampSequenceIndex).deviceData());
      console.error("trackIndex", track.dawIndex);
    }
  }


  clearRampSequence(track: AbletonTrack, rampSequenceIndex: (0|1)) {
    if (this.testing) return;
    try {
      this.emitter.emit(`/tracks/${track.dawIndex}/ramp_seq/${rampSequenceIndex}`, "clear_macro");
    } catch (e) {
      console.error(e.name, e.message, "while clearing ramp sequence in Live:");
      console.error("ramp sequence data:", track.getRampSequence(rampSequenceIndex).deviceData());
      console.error("trackIndex", track.dawIndex);
    }
  }


  activateRampSequence(track: AbletonTrack, rampSequenceIndex: (0|1)) {
    if (this.testing) return;
    try {
      this.emitter.emit(`/tracks/${track.dawIndex}/ramp_seq/${rampSequenceIndex}`, "map_macro");
    } catch (e) {
      console.error(e.name, e.message, "while activating ramp sequence in Live:");
      console.error("ramp sequence data:", track.getRampSequence(rampSequenceIndex).deviceData());
      console.error("trackIndex", track.dawIndex);
    }
  }


  selectActiveTrack(track: AbletonTrack) {
    if (this.testing) return;
    try {
      this.emitter.emit(`/tracks/${track.dawIndex}`);
    } catch (e) {
      console.error(e.name, e.message, "while selecting the active track in Live:");
      console.error("trackIndex", track.dawIndex);
    }
  }


  #syncWithLiveBeat(beat: number) {
    // Only sync during measure boundaries
    if (beat % 4 != 0) return;

    // Sync the UI measure transport
    const measure = ((beat / 4) % this.superMeasure) + 1;
    this.gui.webContents.send("transport-beat", measure);

    // If not on the last measure of a super measure, finished.
    if (measure != this.superMeasure) return;

    // Fire clips for all tracks not participating in voice trading to resync to super measure
    this.#syncTracksToSuperMeasure();

    // For any tracks that are participating in voice trading evolution, evolve the melody and fire clips
    if (this.daw.mutating && this.daw.soloists.length > 0) {
      this.#queueNextSoloist();
    }
  }


  #syncLiveTrackClip(trackIndex: number, clipIndex: number) {
    // Only sync track indices that were loaded by tracks.yml and clip scenes 1-4 (index 0-3).
    // Clip scene 5 is for melodic mutations.
    if (this.daw.dawIndices.includes(trackIndex) && clipIndex < 4) {
      const track = this.daw.tracks.find(t => t.dawIndex == trackIndex);

      if (track.mutating) return;

      track.currentClip = clipIndex == -2 ? -1 : clipIndex;
      if (this.daw.getActiveTrack().dawIndex == trackIndex) {
        track.updateGuiCurrentClip();
      }
    }
  }


  #syncLiveTrackChain(trackIndex: number, chainIndex: number, active: number) {
    const track = this.daw.tracks.find(t => t.dawIndex == trackIndex);
    if (track && track.chains.length > chainIndex) {
      track.chains[chainIndex].active = active == 1;
      if (this.daw.getActiveTrack().dawIndex == trackIndex) {
        track.updateGuiChains();
      }
    }
  }


  #syncTracksToSuperMeasure() {
    this.daw.tracks.forEach((track) => {
      // If the current track is in the soloists group, skip this step as it will sync via #queueNextSoloist()
      if (this.daw.soloists.includes(track.dawIndex)) return;

      // If the current track is not mutating and has had its clips stopped on the Live side, do not fire it.
      if (!track.mutating && !track.randomizing && track.currentClip == -1) return;

      // The track may be set to mutating before the evolutionary/mutation cycle has been queued.
      let currentClip = (this.daw.mutating && (track.mutating || track.randomizing)) ? AbletonLive.EVOLUTION_SCENE_INDEX : track.currentClip;
      this.emitter.emit(`/tracks/${track.dawIndex}/clips/${currentClip}/fire`);

      // If the sequencer is in mutation and the current track, but not while trading solos (caught by return above),
      // evolve the curent track.
      if (this.daw.mutating && (track.mutating || track.randomizing)) {
        track.evolve();
      }
    });
  }


  #queueNextSoloist() {
    // If the sequencer is mutating and there are soloists, setup the next soloists melody.
    if (this.daw.mutating && this.daw.soloists.length > 0) {
      this.daw.soloistIndex++;
      const soloingTrackDawIndex = this.daw.soloists[this.daw.soloistIndex % this.daw.soloists.length];

      this.daw.tracks.filter(t => t.dawIndex == soloingTrackDawIndex)[0].evolve(true);
      this.daw.soloists.forEach(dawIndex => {
        if (dawIndex == soloingTrackDawIndex) {
          this.emitter.emit(`/tracks/${dawIndex}/clips/${AbletonLive.EVOLUTION_SCENE_INDEX}/fire`);
        } else {
          this.emitter.emit(`/tracks/${dawIndex}/clips/stop`);
        }
      });
    }
  }


  /**
   * For debugging.
   *
   * @param response OSC response array
   */
  #processLiveMessages(...response: any[]) {
    console.log(response[0], response.slice(1).join(", "));
  }
}
