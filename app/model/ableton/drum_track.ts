import { detect } from "@tonaljs/chord-detect";
import { Melody, Mutation, ShiftRegister, note, noteData, unique } from "tblswvs";
import { AbletonTrack, TrackConfig } from "./track";
import { AbletonLive } from "./live";


export class DrumTrack extends AbletonTrack {
  #sequence: note[][] = new Array(128);


  constructor(daw: AbletonLive, config: TrackConfig) {
    super(daw, config);

    this.setInputNotes([[{ octave: 1, note: 'C', midi: 36 }]]);

    for (let i = 0; i < this.#sequence.length; i++) {
      this.#sequence[i] = [];
    }
  }


  get sequence() {
    return this.#sequence;
  }


  setDrumPadStep(rhythmStepIndex: number, inputNotes: note[]|undefined) {
    if (inputNotes == undefined) {
      this.#sequence[rhythmStepIndex] = [];
      this.rhythm[rhythmStepIndex].state = 0;
    } else {
      this.#sequence[rhythmStepIndex] = inputNotes;
      this.rhythm[rhythmStepIndex].state = 1;
      this.rhythm[rhythmStepIndex].probability = this.defaultProbability;
    }

    this.updateDrumPadInputMelody();
  }


  updateDrumPadInputMelody() {
    // Output notes is a compacted version of the drum rack sequence.
    this.outputNotes = this.#sequence.slice(0, this.rhythmStepLength).filter(noteArray => noteArray.length > 0);
  }


  generateOutputNotes() {
    super.generateOutputNotes();
    this.generateSequence();
  }


  generateSequence() {
    for (let seqIndex = 0, noteIndex = -1; seqIndex < this.#sequence.length; seqIndex++) {
      const rhythmStep = this.rhythm[seqIndex % this.rhythmStepLength];
      if (rhythmStep.state == 1) {
        noteIndex++;
        const noteArray = this.outputNotes[noteIndex % this.outputNotes.length];
        this.#sequence[seqIndex] = noteArray;
      } else {
        this.#sequence[seqIndex] = [];
      }
    }
  }
}
