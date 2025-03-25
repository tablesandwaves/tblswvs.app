import { detect } from "@tonaljs/chord-detect";
import { Melody, note } from "tblswvs";
import { AbletonTrack, TrackConfig } from "./track";
import { AbletonLive } from "./live";


export class MelodicTrack extends AbletonTrack {
  #inputNotes:  note[][] = [[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]];


  constructor(daw: AbletonLive, config: TrackConfig) {
    super(daw, config);
  }


  get inputNotes() {
    return this.#inputNotes;
  }


  setInputNotes(inputNotes: note[][]) {
    this.#inputNotes = inputNotes;
    this.generateOutputNotes();
  }


  generateOutputNotes() {

    let notes: note[][];

    // When simple, simply use the input note array; otherwise, generate by algorithm.
    if (this.algorithm == "simple") {
      notes = this.#inputNotes;
    } else if (this.algorithm == "self_similarity") {
      notes = this.#getSelfSimilarMelody();
    } else {
      super.generateOutputNotes();
    }

    if (notes.length > 0) {
      this.outputNotes = notes;
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
}
