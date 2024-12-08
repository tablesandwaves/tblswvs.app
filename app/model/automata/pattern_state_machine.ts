export class PatternStateMachine {
  pattern: any[];
  counter: number;


  constructor(choices: any[]) {
    this.pattern = choices;
    this.counter = 0;
  }


  next() {
    const nextValue = this.pattern[this.counter];
    this.counter = (this.counter + 1) % this.pattern.length;
    return nextValue;
  }
}
