import { detect } from "@tonaljs/chord-detect";
import { Melody, note, ShiftRegister } from "tblswvs";
import { AbletonTrack, TrackConfig } from "./track";
import { AbletonLive } from "./live";
import { scaleToRange } from "../../helpers/utils";


const SHIFT_REG_OCTAVE_RANGE_OFFSETS = [-2, -1, 0, 1];


export class MelodicTrack extends AbletonTrack {
  #inputNotes:  note[][] = [[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]];

  shiftRegister: ShiftRegister;
  shiftRegisterOctaveRange: number[] = [0, 1, 1, 0];


  constructor(daw: AbletonLive, config: TrackConfig) {
    super(daw, config);

    this.shiftRegister = new ShiftRegister();
  }


  get inputNotes() {
    return this.#inputNotes;
  }


  setInputNotes(inputNotes: note[][], clip?: number) {
    if (inputNotes.length > 0) this.#inputNotes = inputNotes;
    this.generateOutputNotes(clip);
  }


  generateOutputNotes(clip?: number) {
    if (this.algorithm == "inf_series") {
      super.generateOutputNotes(clip);
    } else {
      let notes: note[][];

      if (this.algorithm == "simple") {
        notes = this.#inputNotes;
      } else if (this.algorithm == "self_similarity") {
        notes = this.#getSelfSimilarMelody();
      } else if (this.algorithm == "shift_reg") {
        notes = this.#getShiftRegisterSequence();
      }

      if (notes.length > 0)
        this.setOutputNotes(notes, clip);
    }
  }


  #getSelfSimilarMelody() {
    let selfSimilarMelody: note[];

    // Create fake notes where the MIDI notes are actually #outputNotes element indices. This is done so that
    // self-similar sequences can be created for chord progressions.
    const offsetMelodyIndices = this.#inputNotes.map((_, i) => {return {octave: 0, note: "", midi: i};});
    const melody = new Melody(offsetMelodyIndices);

    switch (this.selfSimilarityType) {
      case "self_replicate":
        selfSimilarMelody = melody.selfReplicate(63).notes;
        break;
      case "counted":
        selfSimilarMelody = melody.counted().notes;
        break;
      case "zig_zag":
        selfSimilarMelody = melody.zigZag().notes;
        break;
    }

    let indices = selfSimilarMelody.map(note => note.note == "rest" ? undefined : note.midi);
    return indices.map(index => {
      return index == undefined ? [undefined] : this.#inputNotes[index];
    });
  }


  #getShiftRegisterSequence() {
      let stepCount = 0;
      for (let i = 0; i < this.daw.sequencer.superMeasure * 16; i++)
        stepCount += this.rhythm[i % this.rhythmStepLength].state;
      const shiftRegisterSequence = [...new Array(stepCount)].map(_ => this.shiftRegister.step());

      const scaleDegrees     = this.daw.sequencer.key.scaleNotes.map((_, j) => j + 1);
      const scaleDegreeRange = this.shiftRegisterOctaveRange.reduce((accum, octaveRange, i) => {
        if (octaveRange == 1) {
          let offset = SHIFT_REG_OCTAVE_RANGE_OFFSETS[i] * scaleDegrees.length;
          if (offset >= 0) offset++;
          for (let degree = offset; degree < offset + scaleDegrees.length; degree++) {
            accum.push(degree);
          }
        }
        return accum;
      }, new Array());

      // Add three more scale degrees so it is possible to get the next tonic
      scaleDegreeRange.push(scaleDegreeRange.at(-1) + 1);
      scaleDegreeRange.push(scaleDegreeRange.at(-1) + 1);
      scaleDegreeRange.push(scaleDegreeRange.at(-1) + 1);

      return shiftRegisterSequence.map(step => {
        const scaleDegIndex = Math.floor(scaleToRange(step, [0, 1], [0, scaleDegreeRange.length - 1]));
        const scaleDeg      = scaleDegreeRange[scaleDegIndex];
        return [this.daw.sequencer.key.degree(scaleDeg)];
      });
    }


  setGuiInputNotes() {
    if (this.daw.sequencer.testing) return;

    this.daw.sequencer.gui.webContents.send(
      "update-track-notes",
      this.algorithm == "self_similarity" ? this.selfSimilarityType : this.algorithm,
      this.#inputNotes.flatMap(inputNotes => {
        let notes = inputNotes.map(n => n.note + n.octave).join("-");
        let namedChord = detect(inputNotes.map(n => n.note))[0];
        notes += namedChord == undefined ? "" : " (" + namedChord + ")";
        return notes;
      }).join("; ")
    );
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
}
