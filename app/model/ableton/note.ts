type noteLength = {
  size: number,
  index: number
}


export const noteLengthMap: Record<string, noteLength> = {
  "16n": {size: 0.25, index: 0},
  "8n":  {size: 0.5,  index: 1},
  "8nd": {size: 0.75, index: 2},
  "4n":  {size: 1,    index: 3},
  "4nd": {size: 1.5,  index: 4},
  "2n":  {size: 2,    index: 5},
  "2nd": {size: 3,    index: 6},
  "1n":  {size: 4,    index: 7}
}


export const fillLengthMap: Record<string, noteLength> = {
  "16n":  {size: 0.25,  index: 0},
  "16nd": {size: 0.375, index: 1},
  "8n":   {size: 0.5,   index: 2},
  "8nd":  {size: 0.75,  index: 3},
  "4n":   {size: 1,     index: 4},
  "4nd":  {size: 1.5,   index: 5},
  "2n":   {size: 2,     index: 6},
  "2nd":  {size: 3,     index: 7}
}


export class AbletonNote {
  midiNote: number;
  clipPosition: number;
  duration: number;
  velocity: number;
  probability: number = 1;


  constructor(midiNote: number, clipPosition: number, duration: number, velocity: number, probability?: number) {
    this.midiNote = midiNote;
    this.clipPosition = clipPosition;
    this.duration = duration;
    this.velocity = velocity;
    this.probability = probability == undefined ? this.probability : probability;
  }


  toOscAddedNote(): {}[] {
    return [
      {type: "integer", value: this.midiNote},
      {type: "float",   value: this.clipPosition},
      {type: "float",   value: this.duration},
      {type: "float",   value: this.velocity},
      {type: "float",   value: this.probability}
    ];
  }
}
