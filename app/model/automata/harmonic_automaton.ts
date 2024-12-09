import { NamedRandomStateMachine } from "./named_random_state_machine";
import { PatternStateMachine } from "./pattern_state_machine";
import { RandomStateMachine } from "./random_state_machine";
import { RangeStateMachine } from "./range_state_machine";


export class HarmonicAutomaton {
  name: string;
  attack: RandomStateMachine;
  duration: NamedRandomStateMachine;
  velocity: PatternStateMachine;
  filterFrequency: RangeStateMachine;


  constructor(automatonSpec: any) {
    this.name = automatonSpec.name;
    this.attack = new RandomStateMachine(automatonSpec.parameters.attack.choices);
    this.duration = new NamedRandomStateMachine(automatonSpec.parameters.duration.choices);
    this.velocity = new PatternStateMachine(automatonSpec.parameters.velocity.choices);
    this.filterFrequency = new RangeStateMachine(
      automatonSpec.parameters.filterFrequency.min,
      automatonSpec.parameters.filterFrequency.max
    );
  }
}
