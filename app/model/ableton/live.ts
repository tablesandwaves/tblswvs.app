const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");

import { AbletonNote } from "./note";
import { AbletonTrack } from "./track";
import { Sequencer } from "../sequencer";


// Used so the tests, which may not have access to this.sequencer, have a value
const DEFAULT_SUPER_MEASURE_LENGTH = 16;


export class AbletonLive {
  static EVOLUTION_SCENE_INDEX = 4;

  emitter: any;
  receiver: any;
  fetchedNotes: AbletonNote[] = new Array();
  tracks: AbletonTrack[];
  sequencer: Sequencer;


  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;

    // When testing the Ableton classes, the sequencer is undefined, so use a default value.
    const superMeasureLength: number = this.sequencer ? this.sequencer.superMeasure : DEFAULT_SUPER_MEASURE_LENGTH;
    this.tracks = [
      new AbletonTrack(superMeasureLength),
      new AbletonTrack(superMeasureLength),
      new AbletonTrack(superMeasureLength),
      new AbletonTrack(superMeasureLength),
      new AbletonTrack(superMeasureLength),
      new AbletonTrack(superMeasureLength)
    ];

    // To Live
    this.emitter = new OscEmitter();
    this.emitter.add("localhost", 33333);

    // From Live
    this.receiver = new OscReceiver();
    this.receiver.bind(33334, "localhost");
    this.receiver.on("/live/song/beat", (beatNumber: number) => this.#syncSuperMeasure(beatNumber));

    // For debugging: all messages are logged.
    // this.receiver.on("message", this.#processLiveMessages);
  }


  setNotes(trackIndex: number, notes: AbletonNote[], newClip: boolean, clipIndex?: number) {
    let timeout = 0;

    if (newClip) {
      this.tracks[trackIndex].currentClip = (this.tracks[trackIndex].currentClip + 1) % 8;
      this.emitter.emit(
        `/tracks/${trackIndex}/clips/${this.tracks[trackIndex].currentClip}/create`,
        this.sequencer.superMeasure * 4
      );
    }

    clipIndex = clipIndex == undefined ? this.tracks[trackIndex].currentClip : clipIndex;
    setTimeout(() => {
      this.emitter.emit(
        `/tracks/${trackIndex}/clips/${clipIndex}/notes`,
        ...notes.flatMap(note => note.toOscAddedNote())
      );
    }, timeout);
  }


  #syncSuperMeasure(beat: number) {
    if (beat % 4 == 0) {
      const measure = ((beat / 4) % this.sequencer.superMeasure) + 1;
      if (measure == this.sequencer.superMeasure) {
        this.tracks.forEach((track, i) => {
          let currentClip = track.mutating ? AbletonLive.EVOLUTION_SCENE_INDEX : track.currentClip;
          this.emitter.emit(`/tracks/${i}/clips/${currentClip}/fire`)
        });
      }

      this.sequencer.grid.sequencer.gui.webContents.send("transport-beat", measure);
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
