import { detect } from "@tonaljs/chord-detect";
import { Melody, Mutation, note, unique } from "tblswvs";
import { AbletonClip } from "./clip";
import { AbletonNote, fillLengthMap, noteLengthMap, pulseRateMap } from "./note";
import { AbletonLive } from "./live";
import { AbletonChain, ChainConfig } from "./chain";


export type TrackConfig = {
  name: string,
  dawIndex: number,
  chains?: ChainConfig[]
}


export type RhythmStep = {
  state: number;
  probability: number;
  fillRepeats: number;
};


const fillVelocities: Record<number,number[]> = {
  2: [30, 64, 90],
  3: [30, 64, 90, 120],
  4: [30, 64, 90, 120, 64],
  5: [30, 64, 90, 120, 64, 90],
  6: [30, 40, 50, 64,  90, 120, 64],
  8: [30, 40, 50, 64,  90, 120, 110, 120],
}


export class AbletonTrack {
  name: string;
  rhythm: RhythmStep[] = new Array(16);
  defaultProbability: number = 1;
  fillMeasures: (0|1)[] = [0, 0, 0, 0, 0, 0, 0, 0];
  fillDuration: string = "8nd";
  // Are the output notes a melody or chord progression?
  notesAreMelody = true;
  // Notes keyed in on the grid. Will be passed to a melody algorithm, resulting in output melody.
  inputMelody: note[]   = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];
  // Notes resulting from the input melody being processed by a melody algorithm OR a chord progression.
  // Using a 2-dimensional array to accommodate polyphony.
  outputNotes: note[][] = [[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]];
  currentMutation: note[] = new Array();
  vectorShifts: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  vectorShiftsLength: number = 8;
  vectorShiftsActive: boolean = false;
  algorithm: string = "simple";
  weightedRhythm: boolean = false;
  noteLength: string = "16n";
  pulseRate: string = "16n";
  beatLength: number = 16;
  daw: AbletonLive;
  dawIndex: number;

  clips: AbletonClip[];
  currentClip: number = 0;
  createNewClip: boolean = false;
  mutating: boolean = false;
  randomizing: boolean = false;

  chains: AbletonChain[] = new Array();


  constructor(daw: AbletonLive, config: TrackConfig) {
    this.daw      = daw;
    this.name     = config.name;
    this.dawIndex = config.dawIndex;

    if (config.chains) {
      this.chains = config.chains.map(c => new AbletonChain(c.name));
    }

    for (let i = 0; i < this.rhythm.length; i++) {
      this.rhythm[i] = {state: 0, probability: this.defaultProbability, fillRepeats: 0};
    }

    this.clips = [ new AbletonClip(this.daw.sequencer.superMeasure) ];
  }


  abletonNotes(): AbletonNote[] {
    const defaultDuration = noteLengthMap[this.noteLength].size,
          noteMap         = new Map<number,AbletonNote[]>(),
          sourceNotes     = this.daw.mutating && (this.mutating || this.randomizing) ? this.currentMutation.map(n => [n]) : this.outputNotes,
          sourceRhythm    = this.daw.mutating && this.randomizing ? this.#randomRhythm() : this.rhythm,
          beatLength      = this.daw.mutating && this.randomizing ? sourceRhythm.length : this.beatLength;

    let nextNotes: note[];

    for (let step = 0, noteIndex = 0, measure = -1; step < this.daw.sequencer.superMeasure * 16; step += pulseRateMap[this.pulseRate].size) {
      if (step % this.beatLength == 0) measure++;

      const rhythmStep = sourceRhythm[(step / pulseRateMap[this.pulseRate].size) % beatLength];
      if (rhythmStep.state == 0) continue;

      nextNotes = sourceNotes[noteIndex % sourceNotes.length];
      // Track.outputNotes is a 2-d array to accommodate chords. However, the notes passed to Ableton are
      // represented as a 1-dimensional array because they contain explicit timing offsets.
      nextNotes.forEach(nextNote => {
        // An undefined note in the notes array corresponds to a rest in the melody.
        if (nextNote == undefined) return;

        // Process shifts
        nextNote = this.#shiftNote(noteIndex, nextNote);

        if (!noteMap.has(nextNote.midi)) {
          noteMap.set(nextNote.midi, []);
        }

        // Add the current note with or without fills
        if (rhythmStep.fillRepeats > 1 && this.fillMeasures[measure] == 1) {
          const fillBeatDuration = fillLengthMap[this.fillDuration].size / rhythmStep.fillRepeats;
          for (let j = 0; j <= rhythmStep.fillRepeats; j++) {
            noteMap.get(nextNote.midi).push(
              this.#abletonNoteForNote(
                nextNote, rhythmStep, (step * 0.25) + (j * fillBeatDuration), defaultDuration, fillVelocities[rhythmStep.fillRepeats][j]
              )
            );
          }
        } else {
          noteMap.get(nextNote.midi).push(this.#abletonNoteForNote(nextNote, rhythmStep, step * 0.25, defaultDuration));
        }
      });
      noteIndex += 1;
    }

    // Finally, deal with overlapping notes. Depending on the order in which Live processes notes, overlapping notes may result in
    // dropped notes in the clips.
    for (const notes of noteMap.values()) {
      notes.sort((a, b) => a.clipPosition - b.clipPosition);
      notes.forEach((note, i, notes) => {
        if (notes[i - 1] && notes[i - 1].clipPosition + notes[i - 1].duration > note.clipPosition) {
          notes[i - 1].duration = note.clipPosition - notes[i - 1].clipPosition;
        }
      });
    }

    return [...noteMap.values()].flat();
  }


  #abletonNoteForNote(note: note, rhythmStep: RhythmStep, clipPosition: number, duration: number, velocity?: number): AbletonNote {
    return new AbletonNote(
      note.midi,
      clipPosition,
      duration,
      velocity ? velocity : 64,
      rhythmStep.probability
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
    } else if (this.mutating) {
      this.evolveMelody(tradingVoices);
    }
  }


  evolveMelody(tradingVoices = false) {
    let   mutatedMelody   = new Array();
    const activeMutations = this.daw.mutations.filter(m => m.active == 1).map(m => m.function);
    const gatesPerMeasure = this.rhythm.reduce((a, b) => a + b.state, 0);

    let mutationSource = tradingVoices ? this.daw.currentSoloistMelody : this.currentMutation;

    for (let i = 0; i < this.daw.sequencer.superMeasure; i++) {
      const melody = new Array();
      for (let j = 0; j < gatesPerMeasure; j++) {
        melody.push(
          mutationSource[(i * gatesPerMeasure + j) % mutationSource.length]
        );
      }

      mutatedMelody = mutatedMelody.concat(Mutation.random(new Melody(melody, this.daw.sequencer.key), activeMutations).notes);
    }

    // Update both current mutation melodies: the track so it is picked up when setting MIDI notes
    // (via abletonNotesForCurrentTrack()) and the currentSoloistMelody so it is mutated for the next
    // soloist when trading voices.
    this.currentMutation = mutatedMelody;
    this.daw.currentSoloistMelody = mutatedMelody;
    this.daw.sequencer.setNotes(this);
  }


  randomizeMelody() {
    let randomizedMelody = new Array();

    for (let i = 0; i < this.daw.sequencer.superMeasure; i++) {
      // let sortedNotes = this.inputMelody.slice().sort((a, b) => a.midi - b.midi);
      let sortedNotes = this.outputNotes.flat().slice().filter(unique).sort((a, b) => a.midi - b.midi);
      let tunedRandomNoteIndices = new Array();

      // Choose a note (by index) at random
      tunedRandomNoteIndices.push(Math.floor(Math.random() * sortedNotes.length));

      // Choose the next note as 1 note higher in the sorted sequence 75% of the time, one note lower
      // 25% of the time as the next note.
      tunedRandomNoteIndices.push((tunedRandomNoteIndices[0] + (Math.random() > 0.25) ? 1 : -1) % sortedNotes.length);

      // Finally choose another random note
      tunedRandomNoteIndices.push(Math.floor(Math.random() * sortedNotes.length));

      randomizedMelody.push(...tunedRandomNoteIndices.map(i => sortedNotes.at(i)));
    }

    // Update both current mutation melodies: the track so it is picked up when setting MIDI notes
    // (via abletonNotesForCurrentTrack()) and the currentSoloistMelody so it is mutated for the next
    // soloist when trading voices.
    this.currentMutation = randomizedMelody;
    this.daw.sequencer.setNotes(this);
  }


  #randomRhythm(): RhythmStep[] {
    let rhythm: RhythmStep[] = new Array();

    for (let i = 0; i < 16 * this.daw.sequencer.superMeasure; i++) {
      rhythm[i] = {state: 0, probability: this.defaultProbability, fillRepeats: 0};
    }

    for (let measure = 0; measure < this.daw.sequencer.superMeasure; measure++) {
      const randomIndices = new Array();
      let indices = [...new Array(16).keys()];
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
    this.updateGuiTrackNav();
    this.updateGuiVectorDisplay();
    this.updateGuiTrackRhythm();
    this.updateGuiPulseRate();
    this.updateGuiNoteLength();
    this.updateGuiTrackNotes();
    this.updateGuiFillsDuration();
    this.updateGuiFillMeasures();
    this.updateGuiCreateNewClip();
    this.updateGuiRandomizeMelody();
    this.updateGuiCurrentClip();
    this.updateGuiChains();
  }


  updateGuiChains() {
    this.daw.sequencer.gui.webContents.send("update-track-chains", this.chains);
  }


  updateGuiVectorDisplay() {
    this.daw.sequencer.gui.webContents.send("update-melody-vector", this.vectorShifts, this.vectorShiftsLength, this.vectorShiftsActive);
  }


  updateGuiTrackNav() {
    this.daw.sequencer.gui.webContents.send("track-nav", this.name);
  }


  updateGuiTrackRhythm() {
    this.daw.sequencer.gui.webContents.send("track-rhythm", this.rhythm, this.beatLength);
  }


  updateGuiPulseRate() {
    this.daw.sequencer.gui.webContents.send("update-pulse-rate", this.pulseRate);
  }


  updateGuiNoteLength() {
    this.daw.sequencer.gui.webContents.send("update-note-length", this.noteLength);
  }


  updateGuiFillsDuration() {
    this.daw.sequencer.gui.webContents.send("update-fills-duration", this.fillDuration);
  }


  updateGuiCreateNewClip() {
    this.daw.sequencer.gui.webContents.send("toggle-create-clip", this.createNewClip);
  }


  updateGuiRandomizeMelody() {
    this.daw.sequencer.gui.webContents.send("toggle-melody-randomizer", this.randomizing);
  }


  updateGuiCurrentClip() {
    this.daw.sequencer.gui.webContents.send("update-active-clip", this.currentClip + 1);
  }


  updateGuiFillMeasures() {
    this.daw.sequencer.gui.webContents.send(
      "update-fill-measures",
      this.fillMeasures.reduce((fillMeasures, measure, i) => {
        if (measure == 1) fillMeasures.push(i + 1);
        return fillMeasures;
      }, []).join(" ")
    );
  }


  updateGuiTrackNotes() {
    this.notesAreMelody ? this.setGuiMelody() : this.setGuiChordProgression();
  }


  setGuiMelody() {
    this.daw.sequencer.gui.webContents.send(
      "update-track-notes",
      this.algorithm + " melody",
      this.inputMelody.flatMap(n => `${n.note}${n.octave}`).join(" ")
    );
  }


  setGuiChordProgression() {
    this.daw.sequencer.gui.webContents.send(
      "update-track-notes",
      "chords",
      this.daw.sequencer.queuedChordProgression.flatMap(chordNotes => {
        let chord = chordNotes.map(n => n.note + n.octave).join("-");
        let namedChord = detect(chordNotes.map(n => n.note))[0];
        chord += namedChord == undefined ? "" : " (" + namedChord + ")";
        return chord;
      }).join("; ")
    );
  }
}
