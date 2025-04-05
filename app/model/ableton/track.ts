import { Melody, Mutation, note, noteData, unique } from "tblswvs";
import { AbletonClip } from "./clip";
import { AbletonNote, fillLengthMap, noteLengthMap, pulseRateMap } from "./note";
import { AbletonLive } from "./live";
import { AbletonChain, ChainConfig } from "./chain";
import { RampSequence } from "./ramp_sequence";
import { surroundRhythm, acceleratingBeatPositions, ghostNotesFor } from "../../helpers/rhythm_algorithms";


export type TrackConfig = {
  name: string,
  type: ("MelodicTrack"|"DrumTrack"),
  dawIndex: number,
  rampSequencer: boolean,
  chains?: ChainConfig[]
}


export type RhythmStep = {
  state: number;
  probability: number;
  fillRepeats: number;
  velocity?: number;
  timingOffset: number;
  noteLength?: "16n"|"8n"|"8nd"|"4n"|"4nd"|"2n"|"2nd"|"1n";
};


const fillVelocities: Record<number,number[]> = {
  2: [30, 64, 90],
  3: [30, 64, 90, 120],
  4: [30, 64, 90, 120, 64],
  5: [30, 64, 90, 120, 64, 90],
  6: [30, 40, 50, 64,  90, 120, 64],
  8: [30, 40, 50, 64,  90, 120, 110, 120],
}

export const defaultVelocities: number[] = [
  1,     0.5,   0.75,  0.5,
  0.875, 0.5,   0.625, 0.5,
  0.875, 0.5,   0.75,  0.5,
  0.875, 0.5,   0.625, 0.5,
  1,     0.5,   0.75,  0.5,
  0.875, 0.5,   0.625, 0.5,
  0.875, 0.5,   0.75,  0.5,
  0.875, 0.5,   0.625, 0.5,
];

const MAX_VELOCITY = 120;


export const rhythmAlgorithms: Record<string, number> = {
  "manual":   0,
  "surround": 1,
  "accelerating": 2,
  "undefined": -1
}


export const CLIP_16N_COUNT = 128;


export class AbletonTrack {
  name: string;
  type: ("MelodicTrack"|"DrumTrack");

  #rhythm: RhythmStep[] = new Array(32);
  defaultProbability: number = 1;
  fillMeasures: (0|1)[] = [0, 0, 0, 0, 0, 0, 0, 0];
  fillDuration: string = "8nd";
  noteLength: string = "16n";
  #pulseRate: string = "16n";
  #rhythmStepLength: number = 32;
  #rhythmStepBreakpoint: number = 32;
  #rhythmAlgorithm: string = "manual";
  #relatedRhythmTrackDawIndex: (number|undefined) = undefined;
  acceleratingGateCount = 10;

  algorithm: string = "simple";
  #algorithmRhythmRepetitions: number = 1;
  infinitySeriesSeeds: number[] = [0, 0, 0, 0];
  selfSimilarityType: ("self_replicate"|"counted"|"zig_zag") = "self_replicate";

  // Using a 2-dimensional array to accommodate polyphony.
  currentMutation: note[] = new Array();

  vectorShifts: number[] = [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0];
  vectorShiftsLength: number = 8;
  vectorShiftsActive: boolean = false;

  hasRampSequencers: boolean = false;
  rampSequence0: RampSequence;
  rampSequence1: RampSequence;
  editableRampSequence: (0|1) = 0;
  daw: AbletonLive;
  dawIndex: number;

  clips: AbletonClip[];
  currentClip: number = 0;

  #randomizing:   boolean = false;
  #mutating:      boolean = false;
  #soloing:       boolean = false;
  #accompaniment: boolean = false;

  chains: AbletonChain[] = new Array();
  #activeChain: number = 0;


  constructor(daw: AbletonLive, config: TrackConfig) {
    this.daw      = daw;
    this.name     = config.name;
    this.type     = config.type;
    this.dawIndex = config.dawIndex;

    if (config.chains) {
      this.chains = config.chains.map(c => new AbletonChain(c));
    }

    for (let i = 0; i < this.rhythm.length; i++) {
      this.rhythm[i] = {state: 0, probability: this.defaultProbability, fillRepeats: 0, timingOffset: 0};
    }

    this.clips = [ new AbletonClip(), new AbletonClip(), new AbletonClip(), new AbletonClip() ];

    this.hasRampSequencers = config.rampSequencer;
    this.rampSequence0 = new RampSequence();
    this.rampSequence1 = new RampSequence();
  }


  get activeChain() {
    return this.#activeChain;
  }


  set activeChain(chainIndex: number) {
    this.#activeChain = chainIndex;
    this.daw.sequencer.setTrackChain(this);
  }


  get rhythm() {
    return this.#rhythm;
  }


  set rhythm(rhythmSteps: RhythmStep[]) {
    if (this.#relatedRhythmTrackDawIndex == undefined) {
      this.#rhythm = rhythmSteps;
      this.daw.tracks.forEach(track => track.notify(this.dawIndex, "rhythm"));
    }
  }


  get outputNotes() {
    return this.clips[this.currentClip].outputNotes;
  }


  setOutputNotes(notes: note[][], clip?: number) {
    this.clips[clip ? clip : this.currentClip].outputNotes = notes;
  }


  get currentAbletonNotes() {
    return this.clips[this.currentClip].currentAbletonNotes;
  }


  get algorithmRhythmRepetitions() {
    return this.#algorithmRhythmRepetitions;
  }


  set algorithmRhythmRepetitions(algorithmRhythmRepetitions: number) {
    if (algorithmRhythmRepetitions < 1)
      this.#algorithmRhythmRepetitions = 1;
    else if (algorithmRhythmRepetitions > 6)
      this.#algorithmRhythmRepetitions = 6;
    else
      this.#algorithmRhythmRepetitions = algorithmRhythmRepetitions;
  }


  /**
   * The infinity series algorithm is shared by DrumTracks and MelodicTracks.
   */
  generateOutputNotes(clip?: number) {
    if (this.algorithm == "inf_series") {
      const notes = this.#getInfinitySeries();
      if (notes.length > 0)
        this.setOutputNotes(notes, clip);
    }
  }


  #getInfinitySeries() {
    const notes: note[][] = new Array();
    const sequenceCenter = this.getSequenceCenterNote();

    this.infinitySeriesSeeds.forEach(seed => {
      if (seed == 0) return;

      const stepCount = this.#rhythm.slice(0, this.rhythmStepLength)
                                    .filter(step => step.state == 1)
                                    .length * this.algorithmRhythmRepetitions;
      notes.push(
        ...Melody.infinitySeries([0, seed], stepCount).map(step => {
          return [noteData[step + sequenceCenter]];
        })
      );
    });

    return notes;
  }


  getSequenceCenterNote() {
    return this.daw.sequencer.key.midiTonic + 60;
  }


  get pulseRate() {
    return this.#pulseRate;
  }


  set pulseRate(pulseRate: string) {
    if (this.#relatedRhythmTrackDawIndex == undefined) {
      this.#pulseRate = pulseRate;
      this.daw.tracks.forEach(track => track.notify(this.dawIndex, "rhythm"));
    }
  }


  get rhythmStepLength() {
    return this.#rhythmStepLength;
  }


  set rhythmStepLength(stepLength: number) {
    if (this.#relatedRhythmTrackDawIndex == undefined) {
      this.#rhythmStepLength = stepLength;
      this.daw.tracks.forEach(track => track.notify(this.dawIndex, "rhythm"));
    }
  }


  get rhythmStepBreakpoint() {
    return this.#rhythmStepBreakpoint;
  }


  set rhythmStepBreakpoint(breakpoint: number) {
    if (this.#relatedRhythmTrackDawIndex == undefined) {
      this.#rhythmStepBreakpoint = breakpoint;
    }
  }


  notify(dawIndex: number, notification: string) {
    if (dawIndex == this.#relatedRhythmTrackDawIndex && notification == "rhythm" && this.#rhythmAlgorithm == "surround") {
      this.#generateSurroundRhythm();
      this.daw.sequencer.setNotesInLive(this);
    }
  }


  get randomizing() {
    return this.#randomizing;
  }


  set randomizing(state: boolean) {
    this.#randomizing = state;

    if (this.#randomizing) {
      this.#mutating      = false;
      this.#soloing       = false;
      this.#accompaniment = false;

      const index = this.daw.soloists.indexOf(this.dawIndex);
      if (index !== -1) this.daw.soloists.splice(index, 1);
    }
  }


  get accompaniment() {
    return this.#accompaniment;
  }


  set accompaniment(state: boolean) {
    this.#accompaniment = state;

    if (this.#accompaniment) {
      this.#randomizing = false;
      this.#mutating    = false;
      this.#soloing     = false;

      const index = this.daw.soloists.indexOf(this.dawIndex);
      if (index !== -1) this.daw.soloists.splice(index, 1);
    }
  }


  get mutating() {
    return this.#mutating;
  }


  set mutating(state: boolean) {
    this.#mutating    = state;

    if (this.#mutating) {
      this.#randomizing   = false;
      this.#soloing       = false;
      this.#accompaniment = false;

      const index = this.daw.soloists.indexOf(this.dawIndex);
      if (index !== -1) this.daw.soloists.splice(index, 1);
    }
  }


  /**
   * Using the cached boolean property rather than computing everytime so extra array lookups
   * are not incurred.
   */
  get soloing() {
    return this.#soloing;
  }


  set soloing(state: boolean) {
    if (state) {
      if (!this.daw.soloists.includes(this.dawIndex)) this.daw.soloists.push(this.dawIndex);
      this.#soloing       = true;
      this.#randomizing   = false;
      this.#mutating      = false;
      this.#accompaniment = false;
    } else {
      this.#soloing = false;
      const index = this.daw.soloists.indexOf(this.dawIndex);
      if (index !== -1) this.daw.soloists.splice(index, 1);
    }
  }


  get relatedRhythmTrackDawIndex() {
    return this.#relatedRhythmTrackDawIndex;
  }


  set relatedRhythmTrackDawIndex(relatedTrackDawIndex: number|undefined) {
    this.#relatedRhythmTrackDawIndex = relatedTrackDawIndex;

    if (this.#relatedRhythmTrackDawIndex != undefined) {
      if (this.rhythmAlgorithm == "surround") this.#generateSurroundRhythm();
    }
  }


  get rhythmAlgorithm() {
    return this.#rhythmAlgorithm;
  }


  set rhythmAlgorithm(algorithm: string) {
    this.#rhythmAlgorithm = algorithm;

    if (this.#rhythmAlgorithm == "manual" || this.#rhythmAlgorithm == "accelerating") {
      this.#relatedRhythmTrackDawIndex = undefined;
    }

    if (this.#relatedRhythmTrackDawIndex != undefined) {
      if (this.rhythmAlgorithm == "surround") this.#generateSurroundRhythm();
    }
  }


  #generateSurroundRhythm() {
    const trackIndex = this.daw.dawIndices.indexOf(this.#relatedRhythmTrackDawIndex);
    const relatedRhythmTrack = this.daw.tracks[trackIndex];

    this.#rhythmStepLength = relatedRhythmTrack.rhythmStepLength;
    this.#pulseRate        = relatedRhythmTrack.pulseRate;

    this.#rhythm.splice( 0,
      relatedRhythmTrack.rhythmStepLength,
      ...surroundRhythm(relatedRhythmTrack.rhythm.slice(0, relatedRhythmTrack.rhythmStepLength))
    );

    if (this.#rhythmStepLength < 32) {
      this.#rhythm.splice(
        32 - this.#rhythmStepLength,
        32 - this.#rhythmStepLength,
        ...[...new Array(32 - this.#rhythmStepLength)].map(() => {
          return {state: 0, probability: 1, fillRepeats: 0, timingOffset: 0};
        })
      );
    }
  }


  updateCurrentAbletonNotes(clip?: number) {
    const sourceNotes = this.#getSourceNotes(clip);

    // If there notes yet?
    if (sourceNotes.length == 0) {
      this.clips[clip ? clip : this.currentClip].currentAbletonNotes = new Array();
      return;
    }

    const defaultDuration = noteLengthMap[this.noteLength].size * pulseRateMap[this.pulseRate].size,
          noteMap         = new Map<number,AbletonNote[]>(),
          sourceRhythm    = this.daw.mutating && this.randomizing ? this.#randomRhythm() : this.rhythm,
          stepLength      = this.daw.mutating && this.randomizing ? sourceRhythm.length : this.rhythmStepLength;

    let nextNotes: note[];

    const rhythmIndicesAndOffsets = this.#rhythmIndicesAndOffsets();

    for (let step = 0, noteIndex = 0, measure = -1; step < CLIP_16N_COUNT; step += pulseRateMap[this.pulseRate].size) {
      if (step % this.rhythmStepLength == 0) measure++;

      const rhythmIndex = (step / pulseRateMap[this.pulseRate].size) % stepLength;
      const rhythmStep  = sourceRhythm[rhythmIndex];
      if (rhythmStep.state == 0) continue;

      nextNotes = sourceNotes[noteIndex % sourceNotes.length];
      // Track.outputNotes is a 2-d array to accommodate chords. However, the notes passed to Ableton are
      // represented as a 1-dimensional array because they contain explicit timing offsets.
      nextNotes.forEach(nextNote => {
        // An undefined note in the notes array corresponds to a rest in the melody.
        if (nextNote == undefined) return;

        // Process shifts
        nextNote = this.#shiftNote(noteIndex, nextNote);

        if (!noteMap.has(nextNote.midi)) noteMap.set(nextNote.midi, []);

        if (this.rhythmAlgorithm == "accelerating") {

          // Generate acceleration note repeats
          const acceleratingRhythmStep = { state: 1, probability: 1, fillRepeats: 0, timingOffset: 0 };
          const spreadAmount           = (rhythmIndicesAndOffsets[step % stepLength] * 0.25);
          const offset                 = (step % stepLength) * 0.25;

          acceleratingBeatPositions(this.acceleratingGateCount, spreadAmount, offset).forEach(gatePosition => {
            const clipPosition = gatePosition + (step * 0.25);
            noteMap.get(nextNote.midi)
                   .push(this.#abletonNoteForNote(nextNote, acceleratingRhythmStep, clipPosition, defaultDuration));
          });

        } else if (rhythmStep.fillRepeats > 1 && this.fillMeasures[measure] == 1) {
          // Add the current note with fills
          const fillBeatDuration = fillLengthMap[this.fillDuration].size / rhythmStep.fillRepeats;
          for (let j = 0; j <= rhythmStep.fillRepeats; j++) {
            noteMap.get(nextNote.midi).push(
              this.#abletonNoteForNote(nextNote, rhythmStep, (step * 0.25) + (j * fillBeatDuration),
                defaultDuration, fillVelocities[rhythmStep.fillRepeats][j])
            );
          }
        } else {
          // Add the current note with no acceleration or fills
          const duration = rhythmStep.noteLength ? noteLengthMap[rhythmStep.noteLength].size : defaultDuration;
          // Velocities are associated with the step's row 1 or 2 index on the grid, not the absolute step index
          const velocityIndex = this.rhythmStepBreakpoint < 16 && rhythmIndex >= this.rhythmStepBreakpoint ?
                                rhythmIndex + (16 - this.rhythmStepBreakpoint) :
                                rhythmIndex;

          let velocity;
          if (rhythmStep.velocity) {
            velocity = Math.floor(rhythmStep.velocity * MAX_VELOCITY);
          } else {
            const upOrDown  = Math.random() < 0.5 ? -1 : 1;
            const deviation = Math.floor(Math.random() * 5 + 1) * upOrDown;
            velocity = defaultVelocities[velocityIndex] * MAX_VELOCITY + deviation;
          }
          const clipPosition = (step * 0.25) + (this.#timingOffset(rhythmStep, rhythmIndex) * 0.25);
          noteMap.get(nextNote.midi).push(this.#abletonNoteForNote(nextNote, rhythmStep, clipPosition, duration, velocity));
        }
      });
      noteIndex += 1;
    }

    if (this.daw.sequencer.ghostNotes && (this.name == "Kick" || this.name == "Snare")) {
      ghostNotesFor(this.#rhythm.slice(0, this.#rhythmStepLength)).forEach(abletonNote => {
        if (!noteMap.has(abletonNote.midi)) noteMap.set(abletonNote.midi, []);
        noteMap.get(abletonNote.midi).push(abletonNote);
      });
    }

    // Finally, deal with overlapping notes. Depending on the order in which Live processes notes,
    // overlapping notes may result in dropped notes in the clips.
    for (const notes of noteMap.values()) {
      notes.sort((a, b) => a.clipPosition - b.clipPosition);
      notes.forEach((note, i, notes) => {
        if (notes[i - 1] && notes[i - 1].clipPosition + notes[i - 1].duration > note.clipPosition) {
          notes[i - 1].duration = note.clipPosition - notes[i - 1].clipPosition;
        }
      });
    }

    this.clips[clip ? clip : this.currentClip].currentAbletonNotes = [...noteMap.values()].flat();
  }


  #timingOffset(rhythmStep: RhythmStep, i: number): number {
    if (this.name == "Kick" && i == 0) return 0;

    if (this.name == "Snare" && this.daw.sequencer.drunk && i % 4 == 0) {
      return Math.random() > 0.5 ? -0.45 : -0.25;
    } else if (this.name == "Perc 1" && this.daw.sequencer.drunk) {
      // Coin flips for both small to medium offset and early or late offset
      return Math.random() > 0.5 ?
             (i == 0 ? 0.1 : Math.random() > 0.5 ? 0.1  : -0.1) :
             (i == 0 ? 0.1 : Math.random() > 0.5 ? 0.25 : -0.25);
    } else if (this.name == "Perc 1" && this.daw.sequencer.hihatSwing && i % 2 == 0) {
      return 0.45;
    } else if (this.daw.sequencer.humanize) {
      return i == 0 ? 0.1 : Math.random() > 0.5 ? 0.1 : -0.1;
    } else {
      return i == 0 ? Math.abs(rhythmStep.timingOffset) : rhythmStep.timingOffset;
    }
  }


  #rhythmIndicesAndOffsets() {
    return this.rhythm.slice(0, this.#rhythmStepLength).reduce((beatDivisions, step, i) => {
      if (step.state == 1) beatDivisions.push(i);
      return beatDivisions;
    }, new Array()).map((index, i, arr) => {
      const nextStep = i + 1 == arr.length ? this.#rhythmStepLength : arr[i + 1];
      return [index, nextStep - index];
    }).reduce((beatIndexLengthMap: Record<number,number>, [index, length]) => {
      beatIndexLengthMap[index] = length;
      return beatIndexLengthMap;
    }, {});
  }


  /**
   * Select the note source from which to generate notes for Live. Sources include:
   *
   * 1. The note list added to the track in the form of a melody or chord progression
   * 2. The current track's evolving/mutating note list
   * 3. The soloing tracks' shared evolving/mutating note list
   */
  #getSourceNotes(clip?: number): note[][] {
    if (this.daw.mutating && (this.mutating || this.randomizing)) {
      return this.currentMutation.map(n => [n]);
    }

    if (this.daw.mutating && this.daw.soloists.includes(this.dawIndex)) {
      return this.daw.currentSoloistMelody.map(n => [n]);
    }

    return this.clips[clip ? clip : this.currentClip].outputNotes;
  }


  #abletonNoteForNote(note: note, rhythmStep: RhythmStep, clipPosition: number, duration: number, velocity?: number): AbletonNote {
    return new AbletonNote(
      note.midi,
      clipPosition,
      duration,
      velocity ? velocity : (rhythmStep.velocity ? rhythmStep.velocity : 64),
      (this.randomizing && this.daw.mutating ? 1 : rhythmStep.probability)
    )
  }


  #shiftNote(noteIndex: number, nextNote: note) {
    if (!this.vectorShiftsActive) return nextNote;

    let shift = this.vectorShifts[noteIndex % this.vectorShiftsLength];
    if (shift == 0) return nextNote;

    let octaveShift   = nextNote.octave - 3;
    let shiftedDegree = nextNote.scaleDegree + shift;
    if (shiftedDegree == 0) {
      shiftedDegree = shift > 0 ? shiftedDegree + 1 : shiftedDegree - 1;
    }
    return this.daw.sequencer.key.degree(shiftedDegree, octaveShift);
  }


  evolve(tradingVoices = false) {
    if (this.randomizing) {
      this.randomizeMelody();
    } else if (this.mutating || this.soloing) {
      this.evolveMelody(tradingVoices);
    }
  }


  evolveMelody(tradingVoices = false) {
    let   mutatedMelody   = new Array();
    const activeMutations = this.daw.mutations.filter(m => m.active == 1).map(m => m.function);
    let   gatesPerMeasure = this.rhythm.reduce((a, b) => a + b.state, 0);
          gatesPerMeasure = gatesPerMeasure == 0 ? 1 : gatesPerMeasure;

    let mutationSource = tradingVoices ? this.daw.currentSoloistMelody : this.currentMutation;

    for (let i = 0; i < this.daw.sequencer.superMeasure; i++) {
      const melody = new Array();
      for (let j = 0; j < gatesPerMeasure; j++) {
        melody.push(
          mutationSource[(i * gatesPerMeasure + j) % mutationSource.length]
        );
      }
      mutatedMelody = mutatedMelody.concat(
        Mutation.random(new Melody(melody, this.daw.sequencer.key), activeMutations).notes
      );
    }

    // Update both current mutation melodies: the track so it is picked up when setting MIDI notes
    // (via abletonNotesForCurrentTrack()) and the currentSoloistMelody so it is mutated for the next
    // soloist when trading voices.
    this.currentMutation = mutatedMelody;
    this.daw.currentSoloistMelody = mutatedMelody;
    this.daw.sequencer.setNotesInLive(this);

    if (this.daw.getActiveTrack().dawIndex == this.dawIndex) {
      this.updateGuiPianoRoll();
    }
  }


  randomizeMelody() {
    let randomizedMelody = new Array();

    for (let i = 0; i < this.daw.sequencer.superMeasure; i++) {
      // Start with a unique list of sorted notes
      let sortedNotes = this.outputNotes.flat().filter(unique).sort((a, b) => a.midi - b.midi);
      let tunedRandomNoteIndices = new Array();

      // Choose a note (by index) at random
      tunedRandomNoteIndices.push(Math.floor(Math.random() * sortedNotes.length));

      // Choose the next note as 1 note higher in the sorted sequence 75% of the time, one note lower
      // 25% of the time as the next note.
      tunedRandomNoteIndices.push((tunedRandomNoteIndices[0] + ((Math.random() > 0.25) ? 1 : -1)) % sortedNotes.length);

      // Finally choose another random note
      tunedRandomNoteIndices.push(Math.floor(Math.random() * sortedNotes.length));

      randomizedMelody.push(...tunedRandomNoteIndices.map(i => sortedNotes.at(i)));
    }

    // Update both current mutation melodies: the track so it is picked up when setting MIDI notes
    // (via abletonNotesForCurrentTrack()) and the currentSoloistMelody so it is mutated for the next
    // soloist when trading voices.
    this.currentMutation = randomizedMelody;
    this.daw.sequencer.setNotesInLive(this);

    if (this.daw.getActiveTrack().dawIndex == this.dawIndex) {
      this.updateGuiPianoRoll();
    }
  }


  #randomRhythm(): RhythmStep[] {
    let rhythm: RhythmStep[] = new Array();

    for (let i = 0; i < 16 * this.daw.sequencer.superMeasure; i++) {
      rhythm[i] = {state: 0, probability: this.defaultProbability, fillRepeats: 0, timingOffset: 0};
    }

    for (let measure = 0; measure < this.daw.sequencer.superMeasure; measure++) {
      const randomIndices = new Array();
      // Selecting only the even indices restricts the randomized rhythm to 8th notes
      let indices = [...new Array(16).keys()].filter(i => i % 2 == 0);;
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * indices.length);
        randomIndices.push(indices[randomIndex]);
        indices.splice(randomIndex, 1);
      }

      for (let i = 0; i < randomIndices.length; i++) {
        rhythm[randomIndices[i] + (measure * 16)].state = 1;
      }
    }

    return rhythm;
  }


  updateGui() {
    if (this.daw.sequencer.gui == undefined) return;

    this.updateGuiTrackNav();
    this.updateGuiVectorDisplay();
    this.updateGuiTrackRhythm();
    this.updateGuiPulseRate();
    this.updateGuiNoteLength();
    this.setGuiInputNotes();
    this.updateGuiFillsDuration();
    this.updateGuiFillMeasures();
    this.updateGuiRandomizeMelody();
    this.updateGuiCurrentClip();
    this.updateGuiChains();
    this.updateGuiRampSequence();
    this.updateGuiPianoRoll();
    this.updateGlobalTimingAlgorithms();
  }


  updateGuiPianoRoll(clip?: number) {
    if (this.daw.sequencer.gui == undefined) return;

    this.daw.sequencer.gui.webContents.send(
      "piano-roll-notes",
      this.clips[clip === undefined ? this.currentClip : clip].currentAbletonNotes.map(n => n.toPianoRollNote()),
      this.daw.sequencer.key.midiTonic,
      this.daw.sequencer.superMeasure,
      this.rhythmStepLength,
      this.rhythmStepBreakpoint,
      clip === undefined ? true : clip === this.currentClip ? true : false
    );
  }


  updateGlobalTimingAlgorithms() {
    if (this.daw.sequencer.gui == undefined) return;
    this.daw.sequencer.gui.webContents.send(
      "timing-algorithms",
      [
        this.daw.sequencer.humanize,
        this.daw.sequencer.hihatSwing,
        this.daw.sequencer.drunk,
        this.daw.sequencer.ghostNotes
      ]
    );
  }


  updateGuiRampSequence() {
    if (this.daw.sequencer.gui == undefined) return;

    this.daw.sequencer.gui.webContents.send(
      "update-ramp-sequence",
      this.editableRampSequence == 0 ? this.rampSequence0.deviceData() : this.rampSequence1.deviceData(),
      this.daw.sequencer.superMeasure
    );
  }


  getEditableRampSequence(): RampSequence {
    return this.editableRampSequence == 0 ? this.rampSequence0 : this.rampSequence1;
  }


  updateGuiChains() {
    if (this.daw.sequencer.testing) return;
    this.daw.sequencer.gui.webContents.send("update-track-chains", this.chains, this.activeChain);
  }


  updateGuiVectorDisplay() {
    if (this.daw.sequencer.gui == undefined) return;

    this.daw.sequencer.gui.webContents.send(
      "update-note-vector",
      this.vectorShifts,
      this.vectorShiftsLength,
      this.vectorShiftsActive
    );
  }


  updateGuiTrackNav() {
    this.daw.sequencer.gui.webContents.send("track-nav", this.name);
  }


  updateGuiTrackRhythm() {
    const relatedTrackName = this.#relatedRhythmTrackDawIndex == undefined ?
                             undefined :
                             this.daw.tracks[this.daw.dawIndices.indexOf(this.#relatedRhythmTrackDawIndex)].name;

    this.daw.sequencer.gui.webContents.send(
      "track-rhythm",
      this.#rhythm,
      this.#rhythmStepLength,
      this.#rhythmStepBreakpoint,
      this.#rhythmAlgorithm,
      relatedTrackName,
      this.daw.rhythmSectionRhythm(),
      this.daw.harmonicSectionRhythm()
    );

    if (this.daw.sequencer.activeBeatPattern)
      this.daw.sequencer.gui.webContents.send("set-beat", this.daw.sequencer.activeBeatPattern.name);
  }


  updateGuiPulseRate() {
    if (this.daw.sequencer.gui == undefined) return;
    this.daw.sequencer.gui.webContents.send("update-pulse-rate", this.pulseRate);
  }


  updateGuiNoteLength() {
    if (this.daw.sequencer.gui == undefined) return;
    this.daw.sequencer.gui.webContents.send("update-note-length", this.noteLength);
  }


  updateGuiFillsDuration() {
    if (this.daw.sequencer.gui == undefined) return;
    this.daw.sequencer.gui.webContents.send("update-fills-duration", this.fillDuration);
  }


  updateGuiRandomizeMelody() {
    this.daw.sequencer.gui.webContents.send("toggle-melody-randomizer", this.randomizing);
  }


  updateGuiCurrentClip() {
    this.daw.sequencer.gui.webContents.send("update-active-clip", this.currentClip + 1);
  }


  updateGuiFillMeasures() {
    if (this.daw.sequencer.gui == undefined) return;

    this.daw.sequencer.gui.webContents.send(
      "update-fill-measures",
      this.fillMeasures.reduce((fillMeasures, measure, i) => {
        if (measure == 1) fillMeasures.push(i + 1);
        return fillMeasures;
      }, []).join(" ")
    );
  }


  setGuiInputNotes() {
    if (this.daw.sequencer.testing) return;

    // Do nothing: MelodicTrack overrides this method. This is here for now to catch the case for a DrumTrack.
  }
}
