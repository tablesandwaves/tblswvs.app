import { Melody, note } from "tblswvs";
import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage, octaveTransposeMapping } from "./grid_page";


export class MelodyPage extends GridPage {
  type = "Melody";
  recordingInputMelody: boolean = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("toggleMelodyRecording", this.toggleMelodyRecording);
    this.functionMap.set("addNote", this.addNote);
    this.functionMap.set("removeLastNote", this.removeLastNote);
    this.functionMap.set("generateMelody", this.generateMelody);
    this.functionMap.set("toggleNewClipCreation", this.toggleNewClipCreation);
    this.functionMap.set("toggleVectorShifts", this.toggleVectorShifts);

    this.refresh();
  }


  generateMelody(gridPage: MelodyPage, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().notesAreMelody = true;
    gridPage.grid.sequencer.daw.getActiveTrack().algorithm   = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.sequencer.daw.getActiveTrack().inputMelody = gridPage.grid.sequencer.queuedMelody;

    switch (gridPage.matrix[press.y][press.x].value) {
      case "simple":
        gridPage.grid.sequencer.daw.getActiveTrack().outputNotes = gridPage.grid.sequencer.queuedMelody.map(n => [n]);
        break;
      case "self_replicate":
        gridPage.setCurrentTrackNotes(gridPage.getCurrentScaleDegreeMelody().selfReplicate(63).notes);
        break;
      case "counted":
        gridPage.setCurrentTrackNotes(gridPage.getCurrentScaleDegreeMelody().counted().notes);
        break;
      case "zig_zag":
        gridPage.setCurrentTrackNotes(gridPage.getCurrentScaleDegreeMelody().zigZag().notes);
        break;
    }

    gridPage.grid.sequencer.daw.refresh(gridPage.createNewClip);
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiTrackNotes();
  }


  toggleVectorShifts(gridPage: MelodyPage, press: GridKeyPress) {
    const activeTrack = gridPage.grid.sequencer.daw.getActiveTrack();
    activeTrack.vectorShiftsActive = !activeTrack.vectorShiftsActive;
    gridPage.grid.levelSet(press.x, press.y, (activeTrack.vectorShiftsActive ? 10 : 0));
    activeTrack.updateGuiVectorDisplay();
  }


  refresh() {
    this.grid.clearGridDisplay();
    const activeTrack = this.grid.sequencer.daw.getActiveTrack();
    this.grid.levelSet(15, 3, (activeTrack.vectorShiftsActive ? 10 : 0));
  }


  setCurrentTrackNotes(outputMelody: note[]) {
    this.grid.sequencer.daw.getActiveTrack().outputNotes = outputMelody.map(note => {
      return note.note == "rest" ? [undefined] : [note];
    });
  }


  getCurrentScaleDegreeMelody(): Melody {
    return new Melody(this.grid.sequencer.queuedMelody, this.grid.sequencer.key);
  }


  toggleMelodyRecording(gridPage: MelodyPage, press: GridKeyPress) {
    gridPage.recordingInputMelody = !gridPage.recordingInputMelody;
    gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputMelody ? 10 : 0));
    if (gridPage.recordingInputMelody) {
      gridPage.grid.sequencer.queuedMelody = new Array();
      gridPage.setUiQueuedMelody();
    }
  }


  addNote(gridPage: MelodyPage, press: GridKeyPress) {
    if (gridPage.recordingInputMelody) {
      let octaveTranspose = octaveTransposeMapping[press.y];
      // Spread operator used to clone the object because otherwise calling array element by ref?
      gridPage.grid.sequencer.queuedMelody.push({ ...gridPage.grid.sequencer.key.degree(press.x + 1, octaveTranspose) });
      gridPage.setUiQueuedMelody();
    }
  }


  removeLastNote(gridPage: MelodyPage, press: GridKeyPress) {
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
