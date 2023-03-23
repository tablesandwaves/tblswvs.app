const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");

import { AbletonNote } from "./note";
import { AbletonTrack } from "./track";
import { Sequencer } from "../sequencer";


export class AbletonLive {
  static EVOLUTION_SCENE_INDEX = 4;

  emitter: any;
  receiver: any;
  fetchedNotes: AbletonNote[] = new Array();
  tracks: AbletonTrack[];
  sequencer: Sequencer;


  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;

    this.tracks = [
      new AbletonTrack(sequencer.superMeasure),
      new AbletonTrack(sequencer.superMeasure),
      new AbletonTrack(sequencer.superMeasure),
      new AbletonTrack(sequencer.superMeasure),
      new AbletonTrack(sequencer.superMeasure),
      new AbletonTrack(sequencer.superMeasure)
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
    // let timeout = 0;

    if (newClip) {
      this.tracks[trackIndex].currentClip = (this.tracks[trackIndex].currentClip + 1) % 8;
      this.emitter.emit(
        `/tracks/${trackIndex}/clips/${this.tracks[trackIndex].currentClip}/create`,
        this.sequencer.superMeasure * 4
      );
    }

    clipIndex = clipIndex == undefined ? this.tracks[trackIndex].currentClip : clipIndex;
    try {
      this.emitter.emit(
        `/tracks/${trackIndex}/clips/${clipIndex}/notes`,
        ...notes.flatMap(note => note.toOscAddedNote())
      );
    } catch (e) {
      console.error(e.name, e.message, "while sending notes to Live:");
      console.error("input notes:", notes);
      console.error("OSC mapped notes", ...notes.flatMap(note => note.toOscAddedNote()));
      console.error("trackIndex", trackIndex, "mutating", this.sequencer.daw.tracks[trackIndex].mutating);
      console.error("Current track mutation", this.sequencer.tracks[trackIndex].currentMutation);
    }

    // setTimeout(() => {
    //   this.emitter.emit(
    //     `/tracks/${trackIndex}/clips/${clipIndex}/notes`,
    //     ...notes.flatMap(note => note.toOscAddedNote())
    //   );
    // }, timeout);
  }


  #syncSuperMeasure(beat: number) {
    if (beat % 4 == 0) {
      const measure = ((beat / 4) % this.sequencer.superMeasure) + 1;
      if (measure == this.sequencer.superMeasure) {
        this.tracks.forEach((track, trackIndex) => {
          // If the current track is in the soloists group, skip this step as it will sync via soloing rules below.
          if (!this.sequencer.soloists.includes(trackIndex)) {
            // The track may be set to mutating before the evolutionary/mutation cycle has been queued.
            let currentClip = (this.sequencer.mutating && track.mutating) ?
                              AbletonLive.EVOLUTION_SCENE_INDEX :
                              track.currentClip;
            this.emitter.emit(`/tracks/${trackIndex}/clips/${currentClip}/fire`);

            // If the sequencer is in mutation and the current track, but not while trading solos,
            // evolve the curent track.
            if (this.sequencer.mutating && track.mutating) {
              this.sequencer.evolve(trackIndex);
            }
          }
        });

        // If the sequencer is mutating and there are soloists, setup the next soloists melody.
        if (this.sequencer.mutating && this.sequencer.soloists.length > 0) {
          this.sequencer.soloistIndex++;
          const soloingTrackIndex = this.sequencer.soloists[this.sequencer.soloistIndex % this.sequencer.soloists.length];
          this.sequencer.evolve(soloingTrackIndex, true);
          this.sequencer.soloists.forEach(trackIndex => {
            if (trackIndex == soloingTrackIndex) {
              this.emitter.emit(`/tracks/${trackIndex}/clips/${AbletonLive.EVOLUTION_SCENE_INDEX}/fire`);
            } else {
              this.emitter.emit(`/tracks/${trackIndex}/clips/stop`);
            }
          })
        }
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
