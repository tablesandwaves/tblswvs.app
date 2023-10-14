import * as path from "path";

const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");

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
  ticks: number = 0;
  superMeasure: number = 4;
  gui: BrowserWindow;
  key: Key;
  queuedMelody: note[] = new Array();
  queuedChordProgression: note[][] = new Array();
  testing: boolean;


  constructor(testing: boolean = false) {
    this.testing = testing;

    if (!this.testing) {

      // To Live
      this.emitter = new OscEmitter();
      this.emitter.add("localhost", 33333);

      // From Live
      this.receiver = new OscReceiver();
      this.receiver.bind(33334, "localhost");
      this.receiver.on("/live/clips", (tIdx: number, cIdx: number) => this.#syncLiveTrackClip(tIdx, cIdx));
      this.receiver.on("/live/chains", (tIdx: number, chIdx: number, active: number) => this.#syncLiveTrackChain(tIdx, chIdx, active));
      this.receiver.on("/live/transport", (step: number) => this.transport(step));

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


  transport(step: number) {
    // If the current track is set to an 8n pulse, for example, don't advance on fractions of a step.
    const trackStep = Math.floor(step / pulseRateMap[this.daw.getActiveTrack().pulseRate].size);
    this.grid.displayRhythmWithTransport(trackStep % this.daw.getActiveTrack().beatLength, step);

    const measure = Math.floor(step / 16) + 1;
    this.gui.webContents.send("transport-beat", measure);

    // If on the last beat of the last measure of a super measure, update mutations that may be active.
    if (step == (this.superMeasure * 16) - 4) {
      // Update randomizing and mutating tracks.
      this.#syncTracksToSuperMeasure();

      // Update soloing tracks.
      if (this.daw.mutating && this.daw.soloists.length > 0) {
        this.#queueNextSoloist();
      }
    }
  }


  setNotesInLive(track: AbletonTrack) {
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
    track.updateCurrentAbletonNotes();
    try {
      this.emitter.emit(
        `/tracks/${track.dawIndex}/clips/${clipIndex}/notes`,
        ...track.currentAbletonNotes.flatMap(note => note.toOscAddedNote())
      );

      if (track.createNewClip) {
        this.emitter.emit(`/tracks/${track.dawIndex}/clips/${track.currentClip}/fire`);
      }
    } catch (e) {
      console.error(e.name, e.message, "while sending notes to Live:");
      console.error("input notes:", track.currentAbletonNotes);
      console.error("OSC mapped notes", ...track.currentAbletonNotes.flatMap(note => note.toOscAddedNote()));
      console.error("trackIndex", track.dawIndex, "mutating", track.mutating);
      console.error("trackIndex", track.dawIndex, "randomizing", track.randomizing);
      console.error("Current track mutation", track.currentMutation);
    }
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


  setSuperMeasure() {
    if (this.testing) return;
    try {
      this.emitter.emit(`/set/super_measure`, this.superMeasure);
    } catch (e) {
      console.error(e.name, e.message, "while updating the super measure in Live:");
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
    // If the DAW is not mutating AND the DAW stopMutationFlag is set
    // * Get all tracks back to their current clip (which may be -1 for stopped)
    // * reset the DAW's stopMutationFlag
    if (!this.daw.mutating && this.daw.stopMutationQueued) {

      this.daw.tracks.forEach(track => {
        if (track.currentClip >= 0) {
          this.emitter.emit(`/tracks/${track.dawIndex}/clips/${track.currentClip}/fire`);
        } else {
          this.emitter.emit(`/tracks/${track.dawIndex}/clips/stop`);
        }
        track.updateCurrentAbletonNotes();
        if (track.dawIndex == this.daw.getActiveTrack().dawIndex) {
          track.updateGuiPianoRoll();
        }
      });
      this.daw.stopMutationQueued = false;

    } else if (this.daw.mutating) {

      // Otherwise, evolve all mutating and randomizing tracks
      this.daw.tracks.forEach(track => {
        if (track.randomizing || track.mutating) {
          track.evolve();
          this.emitter.emit(`/tracks/${track.dawIndex}/clips/${AbletonLive.EVOLUTION_SCENE_INDEX}/fire`);
        }
      });
    }
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
