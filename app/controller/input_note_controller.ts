import { note } from "tblswvs";
import { GridConfig, GridKeyPress, ApplicationController, ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


export const octaveTransposeMapping: Record<number, number> = {
  0: 3,
  1: 2,
  2: 1,
  3: 0,
  4: -1,
  5: -2,
  6: -3
}


export class InputNoteController extends ApplicationController {
  type = "InputNotes";

  recordingInputNotes = false;
  keyPressCount       = 0;
  inputNotes: note[]  = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("addNotes",              this.addNotes);
    this.functionMap.set("removeLastNotes",       this.removeLastNotes);
    this.functionMap.set("toggleNewClipCreation", this.toggleNewClipCreation);
    this.functionMap.set("setTrackNotes",         this.setTrackNotes);
    this.functionMap.set("toggleNoteRecording",   this.toggleNoteRecording);
    this.functionMap.set("toggleVectorShifts",    this.toggleVectorShifts);
  }


  refresh() {
    this.grid.levelSet(15, 5, (this.activeTrack.createNewClip      ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    this.grid.levelSet(15, 4, (this.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
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


  setTrackNotes(gridPage: InputNoteController, press: GridKeyPress) {
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
}
