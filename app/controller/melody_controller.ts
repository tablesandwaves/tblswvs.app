import { Melody, note } from "tblswvs";
import { MonomeGrid } from "../model/monome_grid";
import { GridConfig, GridKeyPress, ApplicationController, octaveTransposeMapping } from "./application_controller";


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

    gridPage.grid.sequencer.daw.getActiveTrack().algorithm   = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.sequencer.daw.getActiveTrack().inputMelody = gridPage.grid.sequencer.queuedMelody;

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiTrackNotes();
  }


  toggleVectorShifts(gridPage: MelodyController, press: GridKeyPress) {
    const activeTrack = gridPage.grid.sequencer.daw.getActiveTrack();
    activeTrack.vectorShiftsActive = !activeTrack.vectorShiftsActive;
    gridPage.grid.levelSet(press.x, press.y, (activeTrack.vectorShiftsActive ? 10 : 0));
    activeTrack.updateGuiVectorDisplay();
  }


  refresh() {
    const activeTrack = this.grid.sequencer.daw.getActiveTrack();
    this.grid.levelSet(15, 2, (activeTrack.createNewClip      ? 10 : 0));
    this.grid.levelSet(15, 3, (activeTrack.vectorShiftsActive ? 10 : 0));
  }


  getCurrentScaleDegreeMelody(): Melody {
    return new Melody(this.grid.sequencer.queuedMelody, this.grid.sequencer.key);
  }


  toggleMelodyRecording(gridPage: MelodyController, press: GridKeyPress) {
    gridPage.recordingInputMelody = !gridPage.recordingInputMelody;
    gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputMelody ? 10 : 0));
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


  setUiQueuedMelody() {
    this.grid.sequencer.gui.webContents.send(
      "update-melody",
      this.grid.sequencer.queuedMelody.flatMap(n => `${n.note}${n.octave}`).join(" ")
    );
  }
}
