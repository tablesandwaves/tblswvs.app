import { NamedRandomStateMachine } from "./named_random_state_machine";
import { RandomStateMachine } from "./random_state_machine";

export class HarmonicAutomaton {
  name: string;
  attack: RandomStateMachine;
  duration: NamedRandomStateMachine;

  constructor(automatonSpec: any) {
    this.name = automatonSpec.name;
    this.attack = new RandomStateMachine(automatonSpec.parameters.attack.choices);
    this.duration = new NamedRandomStateMachine(automatonSpec.parameters.duration.choices);
  }
}
