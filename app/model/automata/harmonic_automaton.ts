import { NamedRandomStateMachine } from "./named_random_state_machine";
import { PatternStateMachine } from "./pattern_state_machine";
import { RandomStateMachine } from "./random_state_machine";
import { RangeStateMachine } from "./range_state_machine";
import { Key } from "tblswvs";


export type chordType = {
  type: "triad"|"dyad",
  interval?: number,
  root?: number,
  offset?: number
}

export type parameter = {
  type: string,
  value: string|number
}

export type musicalEventData = parameter[][];


export class HarmonicAutomaton {
  name: string;

  // Configuration
  initialState: "chords"|"melody";
  minMelodyIterations: number;
  minChordIterations: number;
  attacks: RandomStateMachine;
  durations: NamedRandomStateMachine;
  velocities: PatternStateMachine;
  filterFrequencies: RangeStateMachine;
  melodyDurationSize: RandomStateMachine;
  chordDurationSize: RandomStateMachine;
  melodyStartDegree: RandomStateMachine;
  chordStartRoot: RandomStateMachine;
  chordStartQuality: RandomStateMachine;
  melodyNoteDistance: NamedRandomStateMachine;
  chord: NamedRandomStateMachine;

  // Current State
  key: Key;
  degree: number;
  degreeDistance: number;
  duration: string;
  velocity: number;
  attack: number;
  filterFrequency: number;
  midiNotes: number[];
  chordType: chordType;
  noteType: undefined|"chords"|"melody";
  iteration: number = 0;


  constructor(automatonSpec: any, key: Key) {
    this.key = key;
    this.name = automatonSpec.name;
    this.initialState = automatonSpec.initialState;
    this.minMelodyIterations = automatonSpec.parameters.minMelodyIterations;
    this.minChordIterations = automatonSpec.parameters.minChordIterations;
    this.attacks = new RandomStateMachine(automatonSpec.parameters.attack.choices);
    this.durations = new NamedRandomStateMachine(automatonSpec.parameters.duration.choices);
    this.velocities = new PatternStateMachine(automatonSpec.parameters.velocity.choices);
    this.filterFrequencies = new RangeStateMachine(
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


  next(): musicalEventData {
    const previousDegree = this.degree;

    if (this.noteType === undefined && this.initialState === "chords") {
      this.#startChord();
    } else if (this.noteType == "chords") {
      // this.#advanceChordState();
    }
    this.degreeDistance = this.iteration == 0 ? 0 : this.degree - previousDegree;

    this.duration        = this.noteType === "chords" ?
                           this.durations.next(this.chordDurationSize.next()) :
                           this.durations.next(this.melodyDurationSize.next());
    this.velocity        = this.velocities.next();
    this.attack          = this.attacks.next();
    this.filterFrequency = this.filterFrequencies.next();

    this.#updateMidi();
    this.iteration++;

    return this.midiNotes.map(noteNumber => {
      return [
        {type: "string",  value: `${this.degree}/${this.noteType == "melody" ? "note" : this.chordType}`},
        {type: "integer", value: noteNumber},
        {type: "integer", value: this.velocity},
        {type: "float",   value: this.filterFrequency},
        {type: "float",   value: this.attack},
        {type: "string",  value: this.duration}
      ];
    });
  }


  #startChord() {
    this.noteType = "chords";
    this.iteration = 0;

    this.degree = this.chordStartRoot.next();
    this.chordType = this.chordStartQuality.next();
  }


  #updateMidi() {
    if (this.noteType == "melody") {

      // MIDI data should always be an array for the potential for polyphany
      this.midiNotes = [this.key.degree(this.degree).midi];

    } else if (this.chordType.type === "dyad") {

      let intervalNote = this.degree + this.chordType.interval == 0 ? 1 : this.degree + this.chordType.interval;
      this.midiNotes = [
        this.key.degree(this.degree).midi,
        this.key.degree(intervalNote).midi
      ];

    } else {
      this.midiNotes = this.key.chord(this.degree, "T").midi;
    }
  }
}
