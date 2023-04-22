const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");

const easymidi = require("easymidi");
import { Key, Scale } from "tblswvs";
import { BrowserWindow } from "electron";
import { MonomeGrid } from "./grid/monome_grid";
import { AbletonLive } from "./ableton/live";
import { AbletonNote } from "./ableton/note";
import { note } from "tblswvs";


export class Sequencer {
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


  constructor(testing: boolean = false) {
    if (!testing) {
      this.grid   = new MonomeGrid(this);
      this.midiIn = new easymidi.Input("tblswvs in", true);

      // To Live
      this.emitter = new OscEmitter();
      this.emitter.add("localhost", 33333);

      // From Live
      this.receiver = new OscReceiver();
      this.receiver.bind(33334, "localhost");
      this.receiver.on("/live/song/beat", (beatNumber: number) => this.#syncWithLiveBeat(beatNumber));

      // For debugging: all messages are logged.
      // this.receiver.on("message", this.#processLiveMessages);
    }
    this.daw = new AbletonLive(this);
    this.key = new Key(60, Scale.Minor);
  }


  async connectToGrid() {
    const msg = await this.grid.connect();
    return msg;
  }


  async follow() {
    this.midiIn.on("clock", () => {
      this.ticks++;
      if (this.ticks % 6 != 0) return;

      this.grid.displayRhythmWithTransport(this.step % this.daw.getActiveTrack().beatLength);
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


  setNotes(trackIndex: number, notes: AbletonNote[], clipIndex?: number) {
    // let timeout = 0;

    if (this.daw.tracks[trackIndex].createNewClip) {
      this.daw.tracks[trackIndex].currentClip = (this.daw.tracks[trackIndex].currentClip + 1) % 4;
      this.emitter.emit(
        `/tracks/${trackIndex}/clips/${this.daw.tracks[trackIndex].currentClip}/create`,
        this.superMeasure * 4
      );
    }

    clipIndex = clipIndex == undefined ? this.daw.tracks[trackIndex].currentClip : clipIndex;
    try {
      this.emitter.emit(
        `/tracks/${trackIndex}/clips/${clipIndex}/notes`,
        ...notes.flatMap(note => note.toOscAddedNote())
      );
    } catch (e) {
      console.error(e.name, e.message, "while sending notes to Live:");
      console.error("input notes:", notes);
      console.error("OSC mapped notes", ...notes.flatMap(note => note.toOscAddedNote()));
      console.error("trackIndex", trackIndex, "mutating", this.daw.tracks[trackIndex].mutating);
      console.error("Current track mutation", this.daw.tracks[trackIndex].currentMutation);
    }

    // setTimeout(() => {
    //   this.emitter.emit(
    //     `/tracks/${trackIndex}/clips/${clipIndex}/notes`,
    //     ...notes.flatMap(note => note.toOscAddedNote())
    //   );
    // }, timeout);
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


  #syncTracksToSuperMeasure() {
    this.daw.tracks.forEach((track, trackIndex) => {
      // If the current track is in the soloists group, skip this step as it will sync via #queueNextSoloist()
      if (this.daw.soloists.includes(trackIndex)) return;

      // The track may be set to mutating before the evolutionary/mutation cycle has been queued.
      let currentClip = (this.daw.mutating && track.mutating) ? AbletonLive.EVOLUTION_SCENE_INDEX : track.currentClip;
      this.emitter.emit(`/tracks/${trackIndex}/clips/${currentClip}/fire`);

      // If the sequencer is in mutation and the current track, but not while trading solos (caught by return above),
      // evolve the curent track.
      if (this.daw.mutating && track.mutating) {
        track.evolve();
      }
    });
  }


  #queueNextSoloist() {
    // If the sequencer is mutating and there are soloists, setup the next soloists melody.
    if (this.daw.mutating && this.daw.soloists.length > 0) {
      this.daw.soloistIndex++;
      const soloingTrackIndex = this.daw.soloists[this.daw.soloistIndex % this.daw.soloists.length];
      this.daw.tracks[soloingTrackIndex].evolve(true);
      this.daw.soloists.forEach(trackIndex => {
        if (trackIndex == soloingTrackIndex) {
          this.emitter.emit(`/tracks/${trackIndex}/clips/${AbletonLive.EVOLUTION_SCENE_INDEX}/fire`);
        } else {
          this.emitter.emit(`/tracks/${trackIndex}/clips/stop`);
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
