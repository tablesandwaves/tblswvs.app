const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");

import { Track } from "./track";
import { AbletonNote } from "./ableton_note";
import { Sequencer } from "./sequencer";


export class AbletonLive {
  emitter: any;
  receiver: any;
  sequencer: Sequencer;

  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;

    // To Live
    this.emitter = new OscEmitter();
    this.emitter.add("localhost", 11000);

    // From Live
    this.receiver = new OscReceiver();
    this.receiver.bind(11001, "localhost");
    this.receiver.on("message", (...response: any[]) => this.#processLiveMessages(...response));
  }


  // trackNumber: number, clipNumber: number, track: Track, superMeasure: number
  syncAbletonClip(newClip: boolean) {
    console.log(newClip);
    const track = this.sequencer.getActiveTrack();

    if (newClip) track.currentClip = (track.currentClip + 1) % 8;
    const trackClip = [{type: 'integer', value: this.sequencer.activeTrack}, {type: 'integer', value: track.currentClip}];

    if (newClip) {
      this.emitter.emit("/live/clip_slot/delete_clip", ...trackClip);
      this.emitter.emit("/live/clip_slot/create_clip", ...trackClip, {type: 'integer', value: this.sequencer.superMeasure * 4});
      // Delete the current notes so the note diff doesn't result in trying to remove notes not present in the new clip
      track.abletonNotes = new Array();
    }


    let noteIndex = 0, nextNote, nextMeasureOffset;
    let abletonNotes: AbletonNote[] = new Array();
    for (let measure = 0; measure < this.sequencer.superMeasure; measure++) {
      abletonNotes.push(...track.rhythm.reduce((abletonNotes: AbletonNote[], step: number, i) => {
        if (step == 1) {
          nextNote = track.outputMelody[noteIndex % track.outputMelody.length];
          // An undefined note in the notes array corresponds to a rest in the melody.
          if (nextNote != undefined)
            abletonNotes.push(new AbletonNote(nextNote.midi, ((measure * 4) + (i * 0.25)), 0.25, 64));
          noteIndex += 1;
        }
        return abletonNotes;
      }, []));
    }

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
    console.log(response[0], response.slice(1).join(", "));

    if (response[0] == "/live/song/beat" && Number(response[1]) % 4 == 0) {
      const measure = ((Number(response[1]) / 4) % this.sequencer.superMeasure) + 1;
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
}
