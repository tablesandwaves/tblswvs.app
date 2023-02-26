// import { AbletonNote } from "./ableton_note";
import { note } from "tblswvs";


export class Track {
  name: string;
  rhythm: number[] = new Array(16).fill(0);
  // Notes keyed in on the grid. Will be passed to a melody algorithm, resulting in output melody.
  inputMelody: note[] = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];
  // Notes resulting from the input melody being processed by a melody algorithm.
  outputMelody: note[] = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];
  algorithm: string = "simple";
  weightedRhythm: boolean = false;
  clipLength: number = 4;
  currentClip: number = 0;


  constructor(name: string) {
    this.name = name;
  }
}
