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

  recordingInputNotes = false;
  newSequenceQueued   = false;
  keyPressCount       = 0;
  inputNotes: note[]  = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setAlgorithm",          this.setAlgorithm);
    this.functionMap.set("addNotes",              this.addNotes);
    this.functionMap.set("removeLastNotes",       this.removeLastNotes);
    this.functionMap.set("toggleNewClipCreation", this.toggleNewClipCreation);
    this.functionMap.set("advance",               this.advance);
    this.functionMap.set("toggleNoteRecording",   this.toggleNoteRecording);
    this.functionMap.set("toggleVectorShifts",    this.toggleVectorShifts);
    this.functionMap.set("setRhythmRepetitions",  this.setRhythmRepetitions);
  }


  refresh() {
    this.setGridRhythmGatesDisplay();
    this.grid.levelSet(15, 5, (this.activeTrack.createNewClip      ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    this.grid.levelSet(15, 4, (this.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
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
    if (gridPage.recordingInputNotes) {
      if (press.s == 0) {
        gridPage.keyPressCount--;

        let octaveTranspose = octaveTransposeMapping[press.y];
        gridPage.inputNotes.push({ ...gridPage.grid.sequencer.key.degree(press.x + 1, octaveTranspose) });

        if (gridPage.keyPressCount == 0) {
          gridPage.grid.sequencer.queuedNotes.push(gridPage.inputNotes.sort((a,b) => a.midi - b.midi));
          gridPage.inputNotes = new Array();
          gridPage.setUiQueuedInputNotes();
        }
      } else {
        gridPage.keyPressCount++;
      }
    }
  }


  removeLastNotes(gridPage: InputNoteController, press: GridKeyPress) {
    if (gridPage.recordingInputNotes && press.s == 1) {
      gridPage.grid.sequencer.queuedNotes.pop();
      gridPage.setUiQueuedInputNotes();
    }
  }


  advance(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 0) return;

    if (gridPage.newSequenceQueued && gridPage.grid.sequencer.queuedNotes.length > 0) {
      // When notes are queued, they need to be flushed via AbletonTrack.setInputNotes(),
      // which will also make a call to AbletonTrack.generateOutputNotes().
      if (gridPage.activeTrack instanceof MelodicTrack)
        (gridPage.activeTrack as MelodicTrack).setInputNotes(gridPage.grid.sequencer.queuedNotes);

      if (!gridPage.recordingInputNotes) gridPage.newSequenceQueued = false;
    } else {
      // Otherwise, only call AbletonTrack.generateOutputNotes() for cases like the infinity series
      // algorithm, which will create a note sequence not based on the track's input notes.
      gridPage.activeTrack.generateOutputNotes();
    }

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.activeTrack.setGuiInputNotes();
  }


  toggleNoteRecording(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 0) return;

    gridPage.recordingInputNotes = !gridPage.recordingInputNotes;
    gridPage.newSequenceQueued   = gridPage.recordingInputNotes && !gridPage.newSequenceQueued ? true : gridPage.newSequenceQueued;

    if (gridPage.recordingInputNotes) {
      gridPage.grid.sequencer.queuedNotes = new Array();
      gridPage.setUiQueuedInputNotes();
    }

    gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputNotes ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
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


  setRhythmRepetitions(gridPage: InputNoteController, press: GridKeyPress) {
    gridPage.activeTrack.algorithmRhythmRepetitions = press.x - 7;
    gridPage.grid.levelRow(8, 2, gridPage.getRhythmRepetitionsRow());
  }


  setGlobalAlgorithmControls() {
    this.grid.levelRow(0, 6, this.getGridAlgorithmRow());
  }


  getGridAlgorithmRow() {
    const algorithmRow = new Array(8).fill(INACTIVE_BRIGHTNESS);
    algorithmRow[algorithmMappings[this.activeTrack.algorithm].button] = ACTIVE_BRIGHTNESS;
    return algorithmRow;
  }


  getRhythmRepetitionsRow() {
    return blank8x1Row.map((_, i) => i < this.activeTrack.algorithmRhythmRepetitions ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }
}
