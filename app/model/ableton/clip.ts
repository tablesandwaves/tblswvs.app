import { AbletonNote } from "./note";


export class AbletonClip {
  notes: AbletonNote[] = new Array();
  length: number;


  constructor(length: number) {
    this.length = length;
  }
}
