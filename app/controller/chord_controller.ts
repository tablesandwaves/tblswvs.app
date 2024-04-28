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


export class ChordController extends ApplicationController {
  type = "Chords";

  recordingInputChord = false;
  keyPressCount       = 0;
  chordNotes: note[]  = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("addChordNote",             this.addChordNote);
    this.functionMap.set("removeLastChord",          this.removeLastChord);
    this.functionMap.set("toggleNewClipCreation",    this.toggleNewClipCreation);
    this.functionMap.set("setTrackChordProgression", this.setTrackChordProgression);
    this.functionMap.set("toggleChordRecording",     this.toggleChordRecording);
    this.functionMap.set("toggleVectorShifts",       this.toggleVectorShifts);
  }


  refresh() {
    this.grid.levelSet(15, 5, (this.activeTrack.createNewClip      ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
    this.grid.levelSet(15, 4, (this.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
  }


  addChordNote(gridPage: ChordController, press: GridKeyPress) {
    if (gridPage.recordingInputChord) {
      if (press.s == 0) {
        gridPage.keyPressCount--;

        let octaveTranspose = octaveTransposeMapping[press.y];
        gridPage.chordNotes.push({ ...gridPage.grid.sequencer.key.degree(press.x + 1, octaveTranspose) });

        if (gridPage.keyPressCount == 0) {
          gridPage.grid.sequencer.queuedChordProgression.push(gridPage.chordNotes.sort((a,b) => a.midi - b.midi));
          gridPage.chordNotes = new Array();
          gridPage.setUiQueuedChordProgression();
        }
      } else {
        gridPage.keyPressCount++;
      }
    }
  }


  removeLastChord(gridPage: ChordController, press: GridKeyPress) {
    if (gridPage.recordingInputChord && press.s == 1) {
      gridPage.grid.sequencer.queuedChordProgression.pop();
      gridPage.setUiQueuedChordProgression();
    }
  }


  setTrackChordProgression(gridPage: ChordController, press: GridKeyPress) {
    if (press.s == 1 && gridPage.grid.sequencer.queuedChordProgression.length > 0) {
      gridPage.activeTrack.setChordProgression(gridPage.grid.sequencer.queuedChordProgression);
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.activeTrack.setGuiChordProgression();
    }
  }


  toggleChordRecording(gridPage: ChordController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.recordingInputChord = !gridPage.recordingInputChord;
      gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputChord ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
      if (gridPage.recordingInputChord) {
        gridPage.grid.sequencer.queuedChordProgression = new Array();
        gridPage.setUiQueuedChordProgression();
      }
    }
  }


  toggleVectorShifts(gridPage: ChordController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.activeTrack.vectorShiftsActive = !gridPage.activeTrack.vectorShiftsActive;
      gridPage.grid.levelSet(press.x, press.y, (gridPage.activeTrack.vectorShiftsActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
      gridPage.activeTrack.updateGuiVectorDisplay();
    }
  }
}
