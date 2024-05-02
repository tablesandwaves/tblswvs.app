import { note } from "tblswvs";
import { GridConfig, GridKeyPress, ApplicationController, ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";


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


export const algorithmMapping: Record<string, algorithmMapping> = {
  "simple":          {button: 0, pageType: "InputNotes"},
  "shift_reg":       {button: 1, pageType: "ShiftRegister"},
  "inf_series":      {button: 2, pageType: "InfinitySeries"},
  "self_similarity": {button: 3, pageType: "SelfSimilarity"}
}


export class InputNoteController extends ApplicationController {
  type = "InputNotes";

  recordingInputNotes = false;
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
  }


  refresh() {
    this.grid.levelSet(15, 5, (this.activeTrack.createNewClip      ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    this.grid.levelSet(15, 4, (this.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
  }


  setAlgorithm(gridPage: InputNoteController, press: GridKeyPress) {
    gridPage.activeTrack.algorithm = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.pageIndex = press.x;
    gridPage.grid.setActiveGridPage(algorithmMapping[gridPage.activeTrack.algorithm].pageType)
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
    if (press.s == 1 && gridPage.grid.sequencer.queuedNotes.length > 0) {
      gridPage.activeTrack.setInputNotes(gridPage.grid.sequencer.queuedNotes);
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.activeTrack.setGuiInputNotes();
    }
  }


  toggleNoteRecording(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.recordingInputNotes = !gridPage.recordingInputNotes;
      gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputNotes ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
      if (gridPage.recordingInputNotes) {
        gridPage.grid.sequencer.queuedNotes = new Array();
        gridPage.setUiQueuedInputNotes();
      }
    }
  }


  toggleVectorShifts(gridPage: InputNoteController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.activeTrack.vectorShiftsActive = !gridPage.activeTrack.vectorShiftsActive;
      gridPage.grid.levelSet(press.x, press.y, (gridPage.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
      gridPage.activeTrack.updateGuiVectorDisplay();
    }
  }


  setGlobalAlgorithmControls() {
    this.grid.levelRow(0, 6, this.getGridAlgorithmRow());
  }


  getGridAlgorithmRow() {
    const algorithmRow = new Array(8).fill(INACTIVE_BRIGHTNESS);
    algorithmRow[algorithmMapping[this.activeTrack.algorithm].button] = ACTIVE_BRIGHTNESS;
    return algorithmRow;
  }


  getRhythmRepetitionsRow() {
    return blank8x1Row.map((_, i) => i < this.activeTrack.infinitySeriesRhythmRepetitions ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }
}
