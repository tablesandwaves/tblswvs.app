export class RandomStateMachine {
  choices: any[];


  constructor(choices: any[]) {
    this.choices = choices;
  }


  next(choices: any[] = undefined): any {
    const _choices = choices == undefined ? this.choices : choices;
    const choice = _choices[Math.floor(Math.random() * _choices.length)];
    if (Array.isArray(choice))
      return this.next(choice);
    else
      return choice;
  }
}
