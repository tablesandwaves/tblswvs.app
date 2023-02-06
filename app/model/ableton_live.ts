const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");

import { Track } from "./track";
import { AbletonNote } from "./ableton_note";


export class AbletonLive {
  emitter: any;
  receiver: any;


  constructor() {
    // To Live
    this.emitter = new OscEmitter();
    this.emitter.add("localhost", 11000);

    // From Live
    this.receiver = new OscReceiver();
    this.receiver.bind(11001, "localhost");
    this.receiver.on("message", (...response: any[]) => this.#processLiveMessages(...response));
  }


  syncAbletonClip(trackNumber: number, clipNumber: number, track: Track) {
    const trackClip = [{type: 'integer', value: trackNumber}, {type: 'integer', value: clipNumber}];

    let abletonNotes = track.rhythm.reduce((abletonNotes: AbletonNote[], step: number, i) => {
      if (step == 1) abletonNotes.push(new AbletonNote(track.notes[i % track.notes.length], i * 0.25, 0.25, 64));
      return abletonNotes;
    }, []);

    const noteDiff = track.diffAbletonNotes(abletonNotes);

    if (noteDiff.removedNotes.length > 0)
      this.emitter.emit("/live/clip/remove/notes", ...trackClip, ...noteDiff.removedNotes.flatMap(n => n.toOscRemovedNote()));

    if (noteDiff.addedNotes.length > 0)
      this.emitter.emit("/live/clip/add/notes", ...trackClip, ...noteDiff.addedNotes.flatMap(n => n.toOscAddedNote()));

    track.abletonNotes = abletonNotes;
  }


  #processLiveMessages(...response: any[]) {
    // console.log(response[0], response.slice(1).join(", "))
  }
}
