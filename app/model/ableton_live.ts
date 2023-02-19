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

    let noteIndex = 0, nextNote;
    let abletonNotes = track.rhythm.reduce((abletonNotes: AbletonNote[], step: number, i) => {
      if (step == 1) {
        nextNote = track.notes[noteIndex % track.notes.length];
        // An undefined note in the notes array corresponds to a rest in the melody.
        if (nextNote != undefined)
          abletonNotes.push(new AbletonNote(nextNote.midi, i * 0.25, 0.25, 64));
        noteIndex += 1;
      }
      return abletonNotes;
    }, []);

    const noteDiff = track.diffAbletonNotes(abletonNotes);

    // AbletonOSC does not seem to allow removing multiple notes as it does for adding muliple notes?
    if (noteDiff.removedNotes.length > 0) {
      noteDiff.removedNotes.forEach(n => {
        this.emitter.emit("/live/clip/remove/notes", ...trackClip, ...n.toOscRemovedNote());
      });
    }

    if (noteDiff.addedNotes.length > 0)
      this.emitter.emit("/live/clip/add/notes", ...trackClip, ...noteDiff.addedNotes.flatMap(n => n.toOscAddedNote()));

    track.abletonNotes = abletonNotes;
  }


  #processLiveMessages(...response: any[]) {
    console.log(response[0], response.slice(1).join(", "))
  }
}
