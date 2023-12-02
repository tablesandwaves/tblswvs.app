import { noteData } from "tblswvs";
import { ACTIVE_BRIGHTNESS, ApplicationController, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


export class DrumPadController extends ApplicationController {
  type = "Rhythm";

  notePlayingActive       = false;
  noteRecordingActive     = false;
  keyReleaseFunctionality = true;
  heldGate:    number = undefined;
  // heldDrumPad: number = undefined;

  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("selectGate", this.selectGate);
    this.functionMap.set("triggerDrumPad", this.triggerDrumPad);
    this.functionMap.set("updateStepLength", this.updateStepLength);
    this.functionMap.set("toggleNotePlaying", this.toggleNotePlaying);
    this.functionMap.set("toggleNoteRecording", this.toggleNoteRecording);
  }


  refresh() {
    this.setGridDrumPadDisplay();
  }


  triggerDrumPad(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
      if (gridPage.noteRecordingActive && gridPage.heldGate != undefined) {
        const track = gridPage.grid.sequencer.daw.getActiveTrack();
        track.setDrumPadStep(gridPage.heldGate, noteData[gridPage.matrix[press.y][press.x].value]);

        gridPage.grid.sequencer.daw.updateActiveTrackNotes();
        gridPage.setGridDrumPadDisplay();
        gridPage.updateGuiRhythmDisplay();
      }

      if (gridPage.notePlayingActive) {
        gridPage.grid.sequencer.midiOut.send("noteon", {
          note: gridPage.matrix[press.y][press.x].value,
          velocity: 64,
          channel: gridPage.grid.sequencer.daw.getActiveTrack().dawIndex
        });

        setTimeout(() => {
          gridPage.grid.sequencer.midiOut.send("noteoff", {
            note: gridPage.matrix[press.y][press.x].value,
            velocity: 64,
            channel: gridPage.grid.sequencer.daw.getActiveTrack().dawIndex
          });
        }, 100);
      }
    }
  }


  selectGate(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
      // gridPage.keyPressCount++;
      gridPage.heldGate = press.x;
    } else {
      gridPage.heldGate = undefined;
    }
  }


  updateStepLength(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) super.updateStepLength(gridPage, press);
  }


  toggleNotePlaying(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.notePlayingActive = !gridPage.notePlayingActive;
      gridPage.setGridDrumPadDisplay();
    }
  }


  toggleNoteRecording(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.noteRecordingActive = !gridPage.noteRecordingActive;
      gridPage.setGridDrumPadDisplay();
    }
  }


  setGridDrumPadDisplay(highlightIndex?: number) {
    // Transport row
    super.setGridRhythmDisplay(highlightIndex);

    // Drum Pads
    for (let y = 2; y <= 5; y++)
      for (let x = 0; x < 4; x++)
        this.grid.levelSet(x, y, 1);

    // Drum Pad Controls
    this.grid.levelSet(0, 6, this.notePlayingActive   ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
    this.grid.levelSet(1, 6, this.noteRecordingActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }
}
