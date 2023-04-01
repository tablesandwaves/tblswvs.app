import { note } from "tblswvs";
import { Sequencer } from "./sequencer";
import { detect } from "@tonaljs/chord-detect";


export type RhythmStep = {
  state: number;
  probability: number;
};


export class Track {
  name: string;
  rhythm: RhythmStep[] = new Array(16);
  defaultProbability: number = 1;
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
  beatLength: number = 16;
  sequencer: Sequencer;


  constructor(name: string, sequencer: Sequencer) {
    this.name = name;
    this.sequencer = sequencer;
    for (let i = 0; i < this.rhythm.length; i++)
      this.rhythm[i] = {state: 0, probability: this.defaultProbability};
  }


  updateGui() {
    this.updateGuiTrackNav();
    this.updateGuiVectorDisplay();
    this.updateGuiTrackRhythm();
    this.updateGuiNoteLength();
    this.updateGuiTrackNotes();
  }


  updateGuiVectorDisplay() {
    this.sequencer.gui.webContents.send("update-melody-vector", this.vectorShifts, this.vectorShiftsLength, this.vectorShiftsActive);
  }


  updateGuiTrackNav() {
    this.sequencer.gui.webContents.send("track-nav", this.name);
  }


  updateGuiTrackRhythm() {
    this.sequencer.gui.webContents.send("track-rhythm", this.rhythm, this.beatLength);
  }


  updateGuiNoteLength() {
    this.sequencer.gui.webContents.send("update-note-length", this.noteLength);
  }


  updateGuiTrackNotes() {
    this.notesAreMelody ? this.setGuiMelody() : this.setGuiChordProgression();
  }


  setGuiMelody() {
    this.sequencer.gui.webContents.send(
      "update-track-notes",
      this.algorithm + " " +
      this.inputMelody.flatMap(n => `${n.note}${n.octave}`).join(" ")
    );
  }


  setGuiChordProgression() {
    this.sequencer.gui.webContents.send(
      "update-track-notes",
      this.sequencer.queuedChordProgression.flatMap(chordNotes => {
        let chord = chordNotes.map(n => n.note + n.octave).join("-");
        let namedChord = detect(chordNotes.map(n => n.note))[0];
        chord += namedChord == undefined ? "" : " (" + namedChord + ")";
        return chord;
      }).join("; ")
    );
  }
}
