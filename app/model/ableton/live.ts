const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");

import { AbletonNote } from "./note";
import { AbletonTrack } from "./track";
import { AbletonClip } from "./clip";
import { Sequencer } from "../sequencer";


export class AbletonLive {
  emitter: any;
  receiver: any;
  fetchedNotes: AbletonNote[] = new Array();
  tracks: AbletonTrack[];
  sequencer: Sequencer;


  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;

    // When testing the Ableton classes, the sequencer is undefined, so use a default value.
    const superMeasureLength: number = this.sequencer ? this.sequencer.superMeasure : 16;
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
    this.emitter.add("localhost", 11000);

    // From Live
    this.receiver = new OscReceiver();
    this.receiver.bind(11001, "localhost");
    this.receiver.on("/live/song/beat", (beatNumber: number) => this.#syncSuperMeasure(beatNumber));
  }


  setNotes(trackIndex: number, notes: AbletonNote[], newClip: boolean) {
    let timeout = 0;

    if (newClip) {
      this.tracks[trackIndex].currentClip = (this.tracks[trackIndex].currentClip + 1) % 8;
      timeout = 100;
      this.#generateNewClip(trackIndex);
      this.tracks[trackIndex].clips[this.tracks[trackIndex].currentClip] = new AbletonClip(this.sequencer.superMeasure);
    }

    setTimeout(() => this.#syncNotes(trackIndex, this.tracks[trackIndex].currentClip, notes), timeout);
  }


  createClip(trackIndex: number, clipIndex: number, length: number) {
    this.tracks[trackIndex].clips[clipIndex] = new AbletonClip(length);
    this.emitter.emit(
      "/live/clip_slot/create_clip",
      ...this.#clipPath(trackIndex, clipIndex),
      {type: 'integer', value: length}
    );
  }


  deleteClip(trackIndex: number, clipIndex: number) {
    this.tracks[trackIndex].clips[clipIndex] = null;
    this.emitter.emit(
      "/live/clip_slot/delete_clip",
      ...this.#clipPath(trackIndex, clipIndex)
    );
  }


  async #generateNewClip(trackIndex: number) {
    let timeout = 0;

    // Check the truthiness of the requested clip. If it exists (not null or undefined), must be removed before adding a new one.
    if (this.tracks[trackIndex].clips[this.tracks[trackIndex].currentClip]) {
      timeout = 100;
      this.deleteClip(trackIndex, this.tracks[trackIndex].currentClip);
    }

    setTimeout(() => this.createClip(trackIndex, this.tracks[trackIndex].currentClip, this.sequencer.superMeasure * 4), timeout);
  }


  #clipPath(trackIndex: number, clipIndex: number) {
    return [{type: 'integer', value: trackIndex}, {type: 'integer', value: clipIndex}];
  }


  #syncNotes(trackIndex: number, clipIndex: number, newNotes: AbletonNote[]) {
    let clipPath = this.#clipPath(trackIndex, clipIndex);

    const noteDiff = AbletonNote.diffAbletonNotes(
      this.tracks[trackIndex].clips[clipIndex].notes,
      newNotes
    );

    // AbletonOSC does not seem to allow removing multiple notes as it does for adding muliple notes?
    if (noteDiff.removedNotes.length > 0) {
      noteDiff.removedNotes.forEach(n => {
        this.emitter.emit("/live/clip/remove/notes", ...clipPath, ...n.toOscRemovedNote());
      });
    }

    if (noteDiff.addedNotes.length > 0)
      this.emitter.emit("/live/clip/add/notes", ...clipPath, ...noteDiff.addedNotes.flatMap(n => n.toOscAddedNote()));

    this.tracks[trackIndex].clips[clipIndex].notes = newNotes;
  }


  #syncSuperMeasure(beat: number) {
    if (beat % 4 == 0) {
      const measure = ((beat / 4) % this.sequencer.superMeasure) + 1;
      if (measure == this.sequencer.superMeasure) {
        let trackClip;
        this.tracks.forEach((track, i) => {
          trackClip = [{type: 'integer', value: i}, {type: 'integer', value: track.currentClip}];
          this.emitter.emit("/live/clip/fire", ...trackClip);
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
