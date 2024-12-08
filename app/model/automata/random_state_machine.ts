export class RandomStateMachine {
  choices: any[];


  constructor(choices: any[]) {
    this.choices = choices;
  }


  next() {
    return this.choices[Math.floor(Math.random() * this.choices.length)];
  }
}
