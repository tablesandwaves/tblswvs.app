import { AbletonClip } from "./clip";


export class AbletonTrack {
  clips: AbletonClip[];
  currentClip: number = 0;

  constructor(superMeasureLength: number) {
    this.clips = [
      new AbletonClip(superMeasureLength)
    ]
  }
}
