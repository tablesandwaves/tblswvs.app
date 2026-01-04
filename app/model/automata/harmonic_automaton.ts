import { NamedRandomStateMachine } from "./named_random_state_machine";
import { PatternStateMachine } from "./pattern_state_machine";
import { RandomStateMachine } from "./random_state_machine";
import { RangeStateMachine } from "./range_state_machine";
import { Key } from "tblswvs";


export type chordType = {
  type: "triad"|"dyad",
  interval?: number,
  root?: number,
  degreeOffset?: number
}

export type parameter = {
  type: string,
  value: string|number
}

export type musicalEventData = parameter[][];


export class HarmonicAutomaton {
  name: string;
  logging: boolean = false;

  // Configuration
  initialState: "chords"|"melody";
  minMelodyIterations: number;
  minChordIterations: number;
  attacks: RandomStateMachine;
  noteDistances: NamedRandomStateMachine;
  durations: NamedRandomStateMachine;
  velocities: PatternStateMachine;
  filterFrequencies: RangeStateMachine;
  melodyDurationSizes: RandomStateMachine;
  chordDurationSizes: RandomStateMachine;
  melodyStartDegrees: RandomStateMachine;
  chordStartRoots: RandomStateMachine;
  chordStartQualities: RandomStateMachine;
  melodyNotes: NamedRandomStateMachine;
  chords: NamedRandomStateMachine;

  // Current State
  #key: Key;
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
    this.#key = key;
    this.name = automatonSpec.name;
    this.initialState = automatonSpec.initialState;
    this.minMelodyIterations = automatonSpec.parameters.minMelodyIterations;
    this.minChordIterations = automatonSpec.parameters.minChordIterations;
    this.attacks = new RandomStateMachine(automatonSpec.parameters.attacks.choices);
    this.durations = new NamedRandomStateMachine(automatonSpec.parameters.durations.choices);
    this.velocities = new PatternStateMachine(automatonSpec.parameters.velocities.choices);
    this.filterFrequencies = new RangeStateMachine(
      automatonSpec.parameters.filterFrequencies.min,
      automatonSpec.parameters.filterFrequencies.max
    );
    this.melodyDurationSizes = new RandomStateMachine(automatonSpec.parameters.melodyDurationSizes.choices);
    this.chordDurationSizes = new RandomStateMachine(automatonSpec.parameters.chordDurationSizes.choices);
    this.melodyStartDegrees = new RandomStateMachine(automatonSpec.parameters.melodyStartDegrees.choices);
    this.chordStartRoots = new RandomStateMachine(automatonSpec.parameters.chordStartRoots.choices);
    this.chordStartQualities = new RandomStateMachine(automatonSpec.parameters.chordStartQualities.choices);
    this.melodyNotes = new NamedRandomStateMachine(automatonSpec.parameters.melodyNotes.choices);
    this.chords = new NamedRandomStateMachine(automatonSpec.parameters.chords.choices);

    this.#generateNoteDistances();
  }


  get key() {
    return this.#key;
  }


  set key(key: Key) {
    this.#key = key;
    this.#generateNoteDistances();
  }


  next(): musicalEventData {
    const previousDegree = this.degree;

    if (this.noteType === undefined) {
      this.initialState === "chords" ? this.#startChord() : this.#startMelody();
    } else if (this.noteType === "chords") {
      this.#advanceChordState();
    } else if (this.noteType === "melody") {
      this.#advanceMelodyState();
    }

    this.degreeDistance  = this.iteration === 0 ? 0 : this.degree - previousDegree;
    this.duration        = this.noteType === "chords" ?
                           this.durations.next(this.chordDurationSizes.next()) :
                           this.durations.next(this.melodyDurationSizes.next());
    this.velocity        = this.velocities.next();
    this.attack          = this.attacks.next();
    this.filterFrequency = this.filterFrequencies.next();

    this.#updateMidi();
    this.iteration++;

    if (this.logging) console.log(this.toString());

    return this.midiNotes.map((noteNumber, i, arr) => {
      return [
        {type: "string",  value: `${this.degree}/${this.noteType == "melody" ? "note" : this.chordType.type}`},
        {type: "integer", value: noteNumber},
        {type: "integer", value: this.velocity},
        {type: "float",   value: this.filterFrequency},
        {type: "float",   value: this.attack},
        {type: "string",  value: this.duration},
        {type: "string",  value: i == arr.length - 1 ? "done" : "continue"},
      ];
    });
  }


  #startChord() {
    this.noteType = "chords";
    this.iteration = 0;

    this.degree = this.chordStartRoots.next();
    this.chordType = this.chordStartQualities.next();
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
    this.degree   += this.chordType.degreeOffset ? this.chordType.degreeOffset : 0;

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

    if (noteDistances.length === 2 && noteDistances[0] === 4 && noteDistances[1] === 3) return "M";
    if (noteDistances.length === 2 && noteDistances[0] === 3 && noteDistances[1] === 4) return "m";
    if (noteDistances.length === 2 && noteDistances[0] === 3 && noteDistances[1] === 3) return "dim";

    return "default";
  }


  #startMelody() {
    this.noteType = "melody";
    this.iteration = 0;
    this.degree = this.melodyStartDegrees.next();
  }


  #advanceMelodyState() {
    if (this.iteration < this.minMelodyIterations) {
      this.#generateNextMelodicNote();
      return;
    }

    if (Math.random() < 0.5) {
      this.#generateNextMelodicNote();
    } else {
      this.#startChord();
    }
  }


  #generateNextMelodicNote() {
    const upOrDownRandom = Math.random() > 0.5 ? 1 : -1;
    const nextDegreeDistance = this.melodyNotes.next(this.#melodicDistanceSize());
    this.degree = this.noteDistances.next(nextDegreeDistance) * upOrDownRandom;

    // tblswvs.js scale degrees may not be 0
    if (this.degree == 0)
      this.degree = 1;
    // Clamping: scale degrees should not be too far from the tonic
    else if (this.degree < this.scaleNoteCount * -2 || this.degree > this.scaleNoteCount * 2)
      this.degree = 1;
  }


  #melodicDistanceSize() {
    const distance = Math.abs(this.degreeDistance);

    if (distance <= this.scaleNoteCount / 2)
      return "small";
    else if (distance <= this.scaleNoteCount)
      return "medium";
    else
      return "large";
  }


  #updateMidi() {
    if (this.noteType == "melody") {

      // MIDI data should always be an array for the potential for polyphany
      this.midiNotes = [this.#key.degree(this.degree).midi];

    } else if (this.chordType.type === "dyad") {

      let intervalNote = this.degree + this.chordType.interval == 0 ? 1 : this.degree + this.chordType.interval;
      this.midiNotes = [
        this.#key.degree(this.degree).midi,
        this.#key.degree(intervalNote).midi
      ];

    } else {
      this.midiNotes = this.#key.chord(this.degree, "T").midi;
    }
  }


  /**
   * After the key has been set, generate note small, medium, large note distances
   */
  #generateNoteDistances() {
    this.scaleNoteCount    = this.#key.scaleNotes.length;
    this.scaleHalfwayPoint = Math.floor(this.scaleNoteCount / 2);

    this.noteDistances = new NamedRandomStateMachine({
      small:  [...new Array(this.scaleHalfwayPoint)].map((_, i) => i + 1),
      medium: [...new Array(this.scaleNoteCount - this.scaleHalfwayPoint)].map((_, i) => i + this.scaleHalfwayPoint + 1),
      large:  [...new Array(5)].map((_, i) => i + this.scaleNoteCount + 1)
    });
  }


  // For logging debugging
  toString() {
    return `MarkovState type: ${this.noteType}, ` +
           `note type: ${this.degree}/${this.noteType == "melody" ? "note" : this.chordType.type}, ` +
           `velocity: ${this.velocity} ` +
           `prev dist: ${this.degreeDistance}, ` +
           `iteration: ${this.iteration} ` +
           `MIDI: ${this.midiNotes}`;
  }
}
