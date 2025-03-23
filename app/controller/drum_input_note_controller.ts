import { note, noteData } from "tblswvs";
import {
  GridConfig, GridKeyPress, ApplicationController,
  ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS, HIGHLIGHT_BRIGHTNESS
} from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { algorithmMapping } from "./input_note_controller";
import { DrumTrack } from "../model/ableton/drum_track";


export class DrumInputNoteController extends ApplicationController {
  type = "InputNotes";

  recordingInputNotes  = false;
  keyPressCount        = 0;
  inputNoteStepIndex   = 0
  inputNotes: note[][] = new Array();


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


  get activeTrack() {
    return this.grid.sequencer.daw.getActiveTrack() as DrumTrack;
  }


  refresh() {
    this.setGridRhythmGatesDisplay();
    this.setGridDrumPadDisplay();
    this.grid.levelSet(15, 5, (this.activeTrack.createNewClip      ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    this.grid.levelSet(15, 4, (this.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    this.setGlobalAlgorithmControls();
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmGatesDisplay(highlightIndex);
    this.updateGuiRhythmTransport(pianoRollHighlightIndex);
  }


  setAlgorithm(gridPage: DrumInputNoteController, press: GridKeyPress) {
    gridPage.activeTrack.algorithm = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.setActiveGridPage(algorithmMapping[gridPage.activeTrack.algorithm].pageType);
  }


  addNotes(gridPage: DrumInputNoteController, press: GridKeyPress) {
    if (gridPage.recordingInputNotes) {
      if (press.s == 0) {
        gridPage.keyPressCount--;
        if (gridPage.inputNotes[gridPage.inputNoteStepIndex] === undefined)
          gridPage.inputNotes[gridPage.inputNoteStepIndex] = new Array();
        gridPage.inputNotes[gridPage.inputNoteStepIndex].push(noteData[gridPage.matrix[press.y][press.x].value]);

        if (gridPage.keyPressCount == 0) {
          gridPage.inputNoteStepIndex++;
          gridPage.setUiQueuedInputNotes();
        }
      } else {
        gridPage.keyPressCount++;
      }
    }
  }


  removeLastNotes(gridPage: DrumInputNoteController, press: GridKeyPress) {
    if (gridPage.recordingInputNotes && press.s == 1) {
      gridPage.grid.sequencer.queuedNotes.pop();
      gridPage.setUiQueuedInputNotes();
    }
  }


  advance(gridPage: DrumInputNoteController, press: GridKeyPress) {
    if (press.s == 0) return;

    if (gridPage.inputNotes.length > 0) {
      let inputNoteIndex = 0;
      gridPage.activeTrack.rhythm.slice(0, gridPage.activeTrack.rhythmStepLength).forEach((step, i) => {
        if (step.state == 1) {
          gridPage.activeTrack.sequence[i] = gridPage.inputNotes[inputNoteIndex % gridPage.inputNotes.length];
          inputNoteIndex++;
        } else
          gridPage.activeTrack.sequence[i] = [];
      });
    }
    gridPage.activeTrack.generateOutputNotes();
    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.activeTrack.setGuiInputNotes();
  }


  toggleNoteRecording(gridPage: DrumInputNoteController, press: GridKeyPress) {
    if (press.s == 0) return;

    gridPage.recordingInputNotes = !gridPage.recordingInputNotes;

    if (gridPage.recordingInputNotes) {
      gridPage.inputNoteStepIndex = 0;
      gridPage.inputNotes = new Array();
      gridPage.grid.sequencer.queuedNotes = new Array();
      gridPage.setUiQueuedInputNotes();
    }

    gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputNotes ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
  }


  toggleVectorShifts(gridPage: DrumInputNoteController, press: GridKeyPress) {
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


  setGlobalAlgorithmControls() {
    this.grid.levelRow(0, 6, this.getGridAlgorithmRow());
  }


  getGridAlgorithmRow() {
    const algorithmRow = new Array(8).fill(INACTIVE_BRIGHTNESS);
    algorithmRow[algorithmMapping[this.activeTrack.algorithm].button] = ACTIVE_BRIGHTNESS;
    return algorithmRow;
  }


  setGridDrumPadDisplay() {
    this.getGridDrumPadRows().forEach((row, i) => {
      this.grid.levelRow(0, i + 2, row);
    });
  }


  getGridDrumPadRows() {
    const rows = [...new Array(4)].fill([...new Array(8)].fill(0));

    for (let y = 0; y <= 3; y++)
      for (let x = 0; x < 4; x++)
        rows[y][x] = 1;

    return rows;
  }
}
