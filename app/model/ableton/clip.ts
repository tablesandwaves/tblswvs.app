import { note } from "tblswvs";
import { AbletonNote } from "./note";


export class AbletonClip {
  #outputNotes: note[][] = [[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]];
  currentAbletonNotes: AbletonNote[] = new Array();


  constructor() {
  }


  get outputNotes() {
    return this.#outputNotes;
  }


  set outputNotes(notes: note[][]) {
    this.#outputNotes = notes;
  }
}
