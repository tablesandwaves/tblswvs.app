import { NamedRandomStateMachine } from "./named_random_state_machine";
import { PatternStateMachine } from "./pattern_state_machine";
import { RandomStateMachine } from "./random_state_machine";
import { RangeStateMachine } from "./range_state_machine";


export type chordType = {
  type: "triad"|"dyad",
  interval?: number,
  root?: number,
  offset?: number
}


export class HarmonicAutomaton {
  name: string;
  attack: RandomStateMachine;
  duration: NamedRandomStateMachine;
  velocity: PatternStateMachine;
  filterFrequency: RangeStateMachine;
  minMelodyIterations: number;
  minChordIterations: number;
  melodyDurationSize: RandomStateMachine;
  chordDurationSize: RandomStateMachine;
  melodyStartDegree: RandomStateMachine;
  chordStartRoot: RandomStateMachine;
  chordStartQuality: RandomStateMachine;
  melodyNoteDistance: NamedRandomStateMachine;
  chord: NamedRandomStateMachine;


  constructor(automatonSpec: any) {
    this.name = automatonSpec.name;
    this.minMelodyIterations = automatonSpec.parameters.minMelodyIterations;
    this.minChordIterations = automatonSpec.parameters.minChordIterations;
    this.attack = new RandomStateMachine(automatonSpec.parameters.attack.choices);
    this.duration = new NamedRandomStateMachine(automatonSpec.parameters.duration.choices);
    this.velocity = new PatternStateMachine(automatonSpec.parameters.velocity.choices);
    this.filterFrequency = new RangeStateMachine(
      automatonSpec.parameters.filterFrequency.min,
      automatonSpec.parameters.filterFrequency.max
    );
    this.melodyDurationSize = new RandomStateMachine(automatonSpec.parameters.melodyDurationSize.choices);
    this.chordDurationSize = new RandomStateMachine(automatonSpec.parameters.chordDurationSize.choices);
    this.melodyStartDegree = new RandomStateMachine(automatonSpec.parameters.melodyStartDegree.choices);
    this.chordStartRoot = new RandomStateMachine(automatonSpec.parameters.chordStartRoot.choices);
    this.chordStartQuality = new RandomStateMachine(automatonSpec.parameters.chordStartQuality.choices);
    this.melodyNoteDistance = new NamedRandomStateMachine(automatonSpec.parameters.melodyNoteDistance.choices);
    this.chord = new NamedRandomStateMachine(automatonSpec.parameters.chord.choices);
  }
}
