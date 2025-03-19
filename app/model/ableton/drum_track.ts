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
    this.outputNotes = this.#sequence.slice(0, this.rhythmStepLength).filter(noteArray => noteArray.length > 0);
  }
}
