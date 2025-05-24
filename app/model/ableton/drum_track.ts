import { note } from "tblswvs";
import { AbletonTrack, TrackConfig } from "./track";
import { AbletonLive } from "./live";


export class DrumTrack extends AbletonTrack {
  #sequence: note[][] = new Array(32);


  constructor(daw: AbletonLive, config: TrackConfig) {
    super(daw, config);

    for (let i = 0; i < this.#sequence.length; i++) {
      this.#sequence[i] = [];
    }
  }


  resetSequence() {
    for (let i = 0; i < this.#sequence.length; i++) {
      this.#sequence[i] = [];
    }
  }


  get sequence() {
    return this.#sequence;
  }


  setSequence(sequence: note[][], clip?: number) {
    this.#sequence = sequence;
    this.generateOutputNotes();
  }


  get rhythmStepLength() {
    return super.rhythmStepLength;
  }


  /**
   * Override the setter for this parent class field because the output notes need to be regenerated for
   * drum tracks when the rhythm step length changes. This also requires that this subclass overrides
   * the getter method for the field.
   */
  set rhythmStepLength(stepLength: number) {
    super.rhythmStepLength = stepLength;
    this.generateOutputNotes();
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

    this.generateOutputNotes();
  }


  generateOutputNotes(clip?: number) {
    if (this.algorithm == "simple") {
      this.setOutputNotes(this.#sequence.slice(0, this.rhythmStepLength).filter(noteArray => noteArray.length > 0), clip);
    } else {
      super.generateOutputNotes(clip);
      this.resetSequence();
    }
  }


  getSequenceCenterNote() {
    const padCount  = this.chains[this.activeChain].pads.length;
    const midiNotes = [...new Array(padCount)].map((_, i) => i + 36);
    return (padCount % 2 == 0) ? midiNotes[padCount / 2] : midiNotes[(padCount + 1) / 2];
  }


  updateGuiPianoRoll(clip?: number) {
    if (this.daw.sequencer.gui == undefined) return;

    this.daw.sequencer.gui.webContents.send(
      "drum-rack-notes",
      this.clips[clip === undefined ? this.currentClip : clip].currentAbletonNotes.map(n => n.toPianoRollNote()),
      this.chains[this.activeChain].pads,
      this.daw.sequencer.superMeasure,
      this.rhythmStepLength,
      this.rhythmStepBreakpoint,
      this.daw.mutating && (this.mutating || this.randomizing || this.soloing) ? "mutation" :
          clip === undefined ? "active" :
          clip === this.currentClip ? "active" : "inactive"
    )
  }


  setGuiInputNotes() {
    if (this.daw.sequencer.testing) return;

    const noteList = this.algorithm === "inf_series" ?
                     "" :
                     this.#sequence.reduce((inputNotes, stepNotes) => {
                        if (stepNotes.length > 0) inputNotes.push(stepNotes.map(n => n.midi - 35).sort((a, b) => a - b));
                        return inputNotes;
                      }, new Array()).join("; ")

    this.daw.sequencer.gui.webContents.send("update-track-notes", this.algorithm, noteList);
  }
}
