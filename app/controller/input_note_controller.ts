import { detect } from "@tonaljs/chord-detect";
import { note } from "tblswvs";
import {
  GridConfig, GridKeyPress, ApplicationController,
  ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS
} from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";
import { MelodicTrack } from "../model/ableton/melodic_track";


export const octaveTransposeMapping: Record<number, number> = {
  0: 3,
  1: 2,
  2: 1,
  3: 0,
  4: -1,
  5: -2,
  6: -3
}


export type algorithmMapping = {
  button: number,
  pageType: string,
}


export const algorithmMappings: Record<string, algorithmMapping> = {
  "simple":          {button: 0, pageType: "InputNotes"},
  "inf_series":      {button: 1, pageType: "InfinitySeries"},
  "shift_reg":       {button: 2, pageType: "ShiftRegister"},
  "self_similarity": {button: 3, pageType: "SelfSimilarity"}
}


export class InputNoteController extends ApplicationController {
  type = "InputNotes";

  notePlayingActive   = false;
  recordingInputNotes = false;
  keyPressCount       = 0;
  // The current button press notes for a single step. An array to accommodate chords/polyphony.
  stepNotes: note[]  = new Array();
  // The currently accumulated sequence of notes for multiple steps. 2D array to accommmodate per step chords/polyphony.
  queuedNotes: note[][] = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setAlgorithm",         this.setAlgorithm);
    this.functionMap.set("addNotes",             this.addNotes);
    this.functionMap.set("removeLastNotes",      this.removeLastNotes);
    this.functionMap.set("advance",              this.advance);
    this.functionMap.set("toggleNoteRecording",  this.toggleNoteRecording);
    this.functionMap.set("toggleNotePlaying",    this.toggleNotePlaying);
    this.functionMap.set("toggleVectorShifts",   this.toggleVectorShifts);
    this.functionMap.set("setRhythmRepetitions", this.setRhythmRepetitions);
    this.functionMap.set("setEditableClip",      this.setEditableClip);
    this.functionMap.set("queueClipForLaunch",   this.queueClipForLaunch);
  }


  refresh() {
    this.setGridRhythmGatesDisplay();
    this.grid.levelSet(15, 4, (this.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    this.setCurrentClipGridDisplay();
    this.setGlobalAlgorithmControls();
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmGatesDisplay(highlightIndex);
    this.updateGuiRhythmTransport(pianoRollHighlightIndex);
  }


  setAlgorithm(gridPage: InputNoteController, press: GridKeyPress) {
    gridPage.activeTrack.algorithm = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.setActiveGridPage(algorithmMappings[gridPage.activeTrack.algorithm].pageType);
  }


  addNotes(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 1 && gridPage.notePlayingActive) gridPage.#playNote(press);

    if (gridPage.recordingInputNotes) {
      if (press.s == 0) {
        gridPage.keyPressCount--;

        let octaveTranspose = octaveTransposeMapping[press.y];
        gridPage.stepNotes.push({ ...gridPage.grid.sequencer.key.degree(press.x + 1, octaveTranspose) });

        if (gridPage.keyPressCount == 0) {
          gridPage.queuedNotes.push(gridPage.stepNotes.sort((a,b) => a.midi - b.midi));
          gridPage.stepNotes = new Array();
          gridPage.setUiQueuedInputNotes();
        }
      } else {
        gridPage.keyPressCount++;
      }
    }
  }


  #playNote(press: GridKeyPress) {
    let octaveTranspose = octaveTransposeMapping[press.y];
    const note = this.grid.sequencer.key.degree(press.x + 1, octaveTranspose);

    this.grid.sequencer.midiOut.send("noteon", {note: note.midi, velocity: 64, channel: this.activeTrack.dawIndex});

    setTimeout(() => {
      this.grid.sequencer.midiOut.send("noteoff", {note: note.midi, velocity: 64, channel: this.activeTrack.dawIndex});
    }, 100);
  }


  removeLastNotes(gridPage: InputNoteController, press: GridKeyPress) {
    if (gridPage.recordingInputNotes && press.s == 1) {
      gridPage.queuedNotes.pop();
      gridPage.setUiQueuedInputNotes();
    }
  }


  advance(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 0) return;

    if (gridPage.activeTrack instanceof MelodicTrack) {
      // When notes are queued, they need to be flushed via AbletonTrack.setInputNotes(),
      // which will also make a call to AbletonTrack.generateOutputNotes().
      (gridPage.activeTrack as MelodicTrack).setInputNotes(gridPage.queuedNotes, gridPage.editableClip);
    } else {
      // Otherwise, only call AbletonTrack.generateOutputNotes() for cases like the infinity series
      // algorithm, which will create a note sequence not based on the track's input notes. Note that
      // a drum track can load the InfinitySeriesController, which is a sub-class.
      gridPage.activeTrack.generateOutputNotes(gridPage.editableClip);
    }

    gridPage.grid.sequencer.daw.updateActiveTrackNotes(gridPage.editableClip);
    gridPage.activeTrack.setGuiInputNotes();
  }


  toggleNoteRecording(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 0) return;

    gridPage.recordingInputNotes = !gridPage.recordingInputNotes;

    if (gridPage.recordingInputNotes) {
      gridPage.queuedNotes = new Array();
      gridPage.setUiQueuedInputNotes();
    } else {
      gridPage.setCurrentClipGridDisplay();
    }

    gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputNotes ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
  }


  toggleNotePlaying(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 0) return;

    gridPage.notePlayingActive = !gridPage.notePlayingActive;
    gridPage.grid.levelSet(press.x, press.y, (gridPage.notePlayingActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
  }


  toggleVectorShifts(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.activeTrack.vectorShiftsActive = !gridPage.activeTrack.vectorShiftsActive;
      gridPage.grid.levelSet(
        press.x,
        press.y,
        (gridPage.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS)
      );
      gridPage.activeTrack.updateGuiVectorDisplay();
    }
  }


  setUiQueuedInputNotes() {
    if (this.grid.sequencer.testing) return;

    this.grid.sequencer.gui.webContents.send(
      "update-queued-notes",
      this.queuedNotes.flatMap((queuedNotes: note[]) => {
        let notes = queuedNotes.map(n => n.note + n.octave).join("-");
        let namedChord = detect(queuedNotes.map(n => n.note))[0];
        notes += namedChord == undefined ? "" : " (" + namedChord + ")";
        return notes;
      }).join("; ")
    );
  }


  setRhythmRepetitions(gridPage: InputNoteController, press: GridKeyPress) {
    gridPage.activeTrack.algorithmRhythmRepetitions = press.x - 7;
    gridPage.setGridAlgorithmRepetitionRow();
  }


  setGlobalAlgorithmControls() {
    this.grid.levelRow(0, 6, this.getGridAlgorithmRow());
  }


  getGridAlgorithmRow() {
    const algorithmRow = new Array(8).fill(INACTIVE_BRIGHTNESS);
    algorithmRow[algorithmMappings[this.activeTrack.algorithm].button] = ACTIVE_BRIGHTNESS;
    return algorithmRow;
  }


  setGridAlgorithmRepetitionRow() {
    this.getGridAlgorithmRepetitionRow().forEach((button, i) => {
      this.grid.levelSet(8 + i, 2, button);
    });
  }


  getGridAlgorithmRepetitionRow() {
    const row = blank8x1Row.slice(0, 6);

    for (let i = 0; i < 6; i++)
      row[i] = i < this.activeTrack.algorithmRhythmRepetitions ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;

    return row;
  }
}
