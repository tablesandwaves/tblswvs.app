const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");

import { AbletonNote } from "./note";
import { AbletonTrack } from "./track";
import { Sequencer } from "../sequencer";


export class AbletonLive {
  emitter: any;
  receiver: any;
  trackNotes: any = {};
  fetchedNotes: AbletonNote[] = new Array();
  tracks: AbletonTrack[] = [
    new AbletonTrack(),
    new AbletonTrack(),
    new AbletonTrack(),
    new AbletonTrack(),
    new AbletonTrack(),
    new AbletonTrack()
  ];
  sequencer: Sequencer;


  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;

    // To Live
    this.emitter = new OscEmitter();
    this.emitter.add("localhost", 11000);

    // From Live
    this.receiver = new OscReceiver();
    this.receiver.bind(11001, "localhost");
    this.receiver.on("/live/clip/get/notes", (...response: any[]) => this.#syncNotes(this, ...response));
    this.receiver.on("/live/song/beat", (beatNumber: number) => this.#syncSuperMeasure(beatNumber));
  }


  setNotes(trackIndex: number, clipIndex: number, notes: AbletonNote[]) {
    this.tracks[trackIndex].clips[clipIndex].queuedNotes = notes;

    let clipPath = [{type: 'integer', value: trackIndex}, {type: 'integer', value: clipIndex}];
    this.emitter.emit("/live/clip/get/notes", ...clipPath);
  }


  #syncNotes(daw: AbletonLive, ...response: any[]) {

    const [trackIndex, clipIndex] = [response[0], response[1]];
    let clipPath = [{type: 'integer', value: trackIndex}, {type: 'integer', value: clipIndex}];

    this.fetchedNotes = new Array();
    for (let i = 2; i < response.length; i += 5)
      this.fetchedNotes.push(new AbletonNote(response[i], response[i + 1], response[i + 2], response[i + 3]));

    const noteDiff = AbletonNote.diffAbletonNotes(this.fetchedNotes, daw.tracks[trackIndex].clips[clipIndex].queuedNotes);

    // AbletonOSC does not seem to allow removing multiple notes as it does for adding muliple notes?
    if (noteDiff.removedNotes.length > 0) {
      noteDiff.removedNotes.forEach(n => {
        this.emitter.emit("/live/clip/remove/notes", ...clipPath, ...n.toOscRemovedNote());
      });
    }

    if (noteDiff.addedNotes.length > 0)
      this.emitter.emit("/live/clip/add/notes", ...clipPath, ...noteDiff.addedNotes.flatMap(n => n.toOscAddedNote()));

    daw.tracks[trackIndex].clips[clipIndex].notes = daw.tracks[trackIndex].clips[clipIndex].queuedNotes;
    daw.tracks[trackIndex].clips[clipIndex].queuedNotes = [];
  }


  #syncSuperMeasure(beat: number) {
    if (beat % 4 == 0) {
      const measure = ((beat / 4) % this.sequencer.superMeasure) + 1;
      if (measure == this.sequencer.superMeasure) {
        let trackClip;
        this.sequencer.tracks.forEach((track, i) => {
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
