import { AbletonClip } from "./clip";


export class AbletonTrack {
  clips: AbletonClip[];
  currentClip: number = 0;
  mutating: boolean = false;

  constructor(superMeasureLength: number) {
    this.clips = [
      new AbletonClip(superMeasureLength)
    ]
  }
}
