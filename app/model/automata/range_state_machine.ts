export class RangeStateMachine {
  min: number;
  max: number;


  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }


  next() {
    return (Math.random() * (this.max - this.min)) + this.min;
  }
}
