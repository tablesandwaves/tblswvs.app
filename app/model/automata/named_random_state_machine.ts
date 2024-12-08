export class NamedRandomStateMachine {
  choices: Record<string, any[]>;


  constructor(choices: any) {
    this.choices = choices;
  }


  next(name: string) {
    return this.choices[name][Math.floor(Math.random() * this.choices[name].length)];
  }
}
