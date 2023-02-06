import { AbletonNote } from "./ableton_note";


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
  notes: number[] = [60];
  abletonNotes: AbletonNote[] = new Array();
  weightedRhythm: boolean = false;


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
