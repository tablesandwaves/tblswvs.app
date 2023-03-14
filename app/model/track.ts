import { note } from "tblswvs";


export type RhythmStep = {
  state: number;
  probability: number;
};


export class Track {
  name: string;
  rhythm: RhythmStep[] = new Array(16);
  defaultProbability: number = 1;
  // Notes keyed in on the grid. Will be passed to a melody algorithm, resulting in output melody.
  inputMelody: note[]   = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];
  // Chords keyed in on the grid.
  inputChords: note[][] = [];
  // Notes resulting from the input melody being processed by a melody algorithm.
  // Using a 2-dimensional array to accommodate polyphony.
  outputNotes: note[][] = [[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]];
  algorithm: string = "simple";
  weightedRhythm: boolean = false;
  noteLength: string = "16n";
  beatLength: number = 16;


  constructor(name: string) {
    this.name = name;
    for (let i = 0; i < this.rhythm.length; i++)
      this.rhythm[i] = {state: 0, probability: this.defaultProbability};
  }
}
