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
  // Input melody is the set of notes that were keyed in on the grid and which will be
  // passed to a melody algorithm that results in an output melody stored in output melody.
  inputMelody: note[] = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];
  // Output Melody is the set of notes resulting from the input melody being processed
  // by a melody algorithm.
  outputMelody: note[] = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];
  algorithm: string = "simple";
  // Ableton notes is the output melody transformed to AbletonNote objects. It includes
  // details like placement within a clip
  abletonNotes: AbletonNote[] = new Array();
  weightedRhythm: boolean = false;
  clipLength: number = 4;
  currentClip: number = 0;


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
