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
  chords: NamedRandomStateMachine;

  // Current State
  key: Key;
  scaleNoteCount: number;
  fiveGreaterThanOctave: number;
  scaleHalfwayPoint: number;
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
    this.chords = new NamedRandomStateMachine(automatonSpec.parameters.chord.choices);

    this.scaleNoteCount        = this.key.scaleNotes.length;
    this.fiveGreaterThanOctave = 5 + this.scaleNoteCount;
    this.scaleHalfwayPoint     = Math.floor(this.scaleNoteCount / 2);
  }


  next(): musicalEventData {
    const previousDegree = this.degree;

    if (this.noteType === undefined) {
      this.initialState === "chords" ? this.#startChord() : this.#startMelody();
    } else if (this.noteType == "chords") {
      this.#advanceChordState();
    } else if (this.noteType == "melody") {
      // this.#advanceMelodyState();
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


  #advanceChordState() {
    if (this.iteration < this.minChordIterations) {
      this.#generateNextChord();
      return;
    }

    if (Math.random() < 0.5) {
      this.#generateNextChord();
    } else {
      this.#startMelody();
    }
  }


  #generateNextChord() {
    const chordQuality = this.#currentChordQuality();

    this.chordType = this.chords.next(chordQuality);
    this.degree   += this.chordType.offset ? this.chordType.offset : 0;

    if (chordQuality === "default") {
      const degreeDistances = [-4, -3, -1, 0, 1, 2, 3, 4];
      const degreeDistance  = degreeDistances[Math.floor(Math.random() * degreeDistances.length)];

      this.degree = (this.degree + degreeDistance < 1) ?
                    (this.degree + degreeDistance - 1) :
                     this.degree + degreeDistance;
    }

    // tblswvs.js scale degrees may not be 0
    if (this.degree == 0)
      this.degree = 1;
    // Clamping: scale degrees should not be too far from the tonic
    else if (this.degree < this.scaleNoteCount * -2 || this.degree > this.scaleNoteCount * 2)
      this.degree = 1;
  }


  #currentChordQuality() {
    const noteDistances = this.midiNotes.sort((a,b) => a - b).reduce((accum, noteNum, i, arr) => {
      if (i < arr.length - 1) accum.push(arr[i+1] - noteNum);
      return accum;
    }, []);

    switch(noteDistances) {
      case [4, 3]:
        return "M";
      case [3, 4]:
        return "m";
      case [3, 3]:
        return "dim";
      default:
        return "default";
    }
  }


  #startMelody() {
    this.noteType = "melody";
    this.iteration = 0;
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
