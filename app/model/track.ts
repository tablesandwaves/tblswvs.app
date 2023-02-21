import { AbletonNote } from "./ableton_note";
import { note } from "tblswvs";


const missingNotes = (notes: AbletonNote[], otherNotes: AbletonNote[]) => {
  return notes.reduce((notesMissing: AbletonNote[], note: AbletonNote) => {
    let found = false;
    for (let i = 0; i < otherNotes.length; i++) {
      if (otherNotes[i].equals(note)) {
        found = true;
        break;
      }
    }
    if (!found) notesMissing.push(note);

    return notesMissing;
  }, []);
}


export class Track {
  name: string;
  rhythm: number[] = new Array(16).fill(0);
  notes: note[] = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];
  inputMelody: note[] = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];
  algorithm: string = "simple";
  abletonNotes: AbletonNote[] = new Array();
  weightedRhythm: boolean = false;
  clipLength: number = 4;


  constructor(name: string) {
    this.name = name;
  }


  diffAbletonNotes(otherAbletonNotes: AbletonNote[]) {
    return {
      addedNotes:   missingNotes(otherAbletonNotes, this.abletonNotes),
      removedNotes: missingNotes(this.abletonNotes, otherAbletonNotes)
    }
  }
}
