export class Track {
  name: string;
  rhythm: number[] = new Array(16).fill(0);
  weightedRhythm: boolean = false;


  constructor(name: string) {
    this.name = name;
  }
}
