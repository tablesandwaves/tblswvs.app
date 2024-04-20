import { Melody } from "tblswvs";
import { MonomeGrid } from "../model/monome_grid";
import { GridConfig, GridKeyPress, ApplicationController, octaveTransposeMapping, ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS } from "./application_controller";


export class MelodyController extends ApplicationController {
  type = "Melody";
  recordingInputMelody: boolean = false;
  keyReleaseFunctionality = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("toggleMelodyRecording", this.toggleMelodyRecording);
    this.functionMap.set("addNote", this.addNote);
    this.functionMap.set("removeLastNote", this.removeLastNote);
    this.functionMap.set("generateMelody", this.generateMelody);
    this.functionMap.set("toggleNewClipCreation", this.toggleNewClipCreation);
    this.functionMap.set("toggleVectorShifts", this.toggleVectorShifts);
  }


  generateMelody(gridPage: MelodyController, press: GridKeyPress) {
    // Do nothing if there are no queued notes. Happens by inadvertent button press before
    // input notes are recorded.
    if (gridPage.grid.sequencer.queuedMelody.length == 0) return;

    gridPage.activeTrack.algorithm   = gridPage.matrix[press.y][press.x].value;
    gridPage.activeTrack.inputMelody = gridPage.grid.sequencer.queuedMelody;

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.activeTrack.updateGuiTrackNotes();
  }


  toggleVectorShifts(gridPage: MelodyController, press: GridKeyPress) {
    gridPage.activeTrack.vectorShiftsActive = !gridPage.activeTrack.vectorShiftsActive;
    gridPage.grid.levelSet(press.x, press.y, (gridPage.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    gridPage.activeTrack.updateGuiVectorDisplay();
  }


  refresh() {
    this.grid.levelSet(15, 2, (this.activeTrack.createNewClip      ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    this.grid.levelSet(15, 3, (this.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
  }


  getCurrentScaleDegreeMelody(): Melody {
    return new Melody(this.grid.sequencer.queuedMelody, this.grid.sequencer.key);
  }


  toggleMelodyRecording(gridPage: MelodyController, press: GridKeyPress) {
    gridPage.recordingInputMelody = !gridPage.recordingInputMelody;
    gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputMelody ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    if (gridPage.recordingInputMelody) {
      gridPage.grid.sequencer.queuedMelody = new Array();
      gridPage.setUiQueuedMelody();
    }
  }


  addNote(gridPage: MelodyController, press: GridKeyPress) {
    if (gridPage.recordingInputMelody) {
      let octaveTranspose = octaveTransposeMapping[press.y];
      // Spread operator used to clone the object because otherwise calling array element by ref?
      gridPage.grid.sequencer.queuedMelody.push({ ...gridPage.grid.sequencer.key.degree(press.x + 1, octaveTranspose) });
      gridPage.setUiQueuedMelody();
    }
  }


  removeLastNote(gridPage: MelodyController, press: GridKeyPress) {
    if (gridPage.recordingInputMelody) {
      gridPage.grid.sequencer.queuedMelody.pop();
      gridPage.setUiQueuedMelody();
    }
  }
}
