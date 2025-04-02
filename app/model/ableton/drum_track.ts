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


  get sequence() {
    return this.#sequence;
  }


  set sequence(sequence: note[][]) {
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


  generateOutputNotes() {
    if (this.algorithm == "simple")
      this.outputNotes = this.#sequence.slice(0, this.rhythmStepLength).filter(noteArray => noteArray.length > 0);
    else
      super.generateOutputNotes();
  }


  getSequenceCenterNote() {
    const padCount  = this.chains[this.activeChain].pads.length;
    const midiNotes = [...new Array(padCount)].map((_, i) => i + 36);
    return (padCount % 2 == 0) ? midiNotes[padCount / 2] : midiNotes[(padCount + 1) / 2];
  }


  updateGuiPianoRoll() {
    if (this.daw.sequencer.gui == undefined) return;

    this.daw.sequencer.gui.webContents.send(
      "drum-rack-notes",
      this.clips[this.currentClip].currentAbletonNotes.map(n => n.toPianoRollNote()),
      this.chains[this.activeChain].pads,
      this.daw.sequencer.superMeasure,
      this.rhythmStepLength,
      this.rhythmStepBreakpoint
    )
  }
}
