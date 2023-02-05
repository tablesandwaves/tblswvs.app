export class Track {
  name: string;
  rhythm: number[];


  constructor(name: string) {
    this.name = name;
    this.rhythm = new Array(16).fill(0);
  }
}
