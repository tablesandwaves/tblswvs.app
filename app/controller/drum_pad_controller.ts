import { noteData } from "tblswvs";
import { ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS, xyCoordinate, ApplicationController, GridConfig, GridKeyPress } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


const drumPadMatrix: Record<number, xyCoordinate> = {
  36: {x: 0, y: 5},
  37: {x: 1, y: 5},
  38: {x: 2, y: 5},
  39: {x: 3, y: 5},
  40: {x: 0, y: 4},
  41: {x: 1, y: 4},
  42: {x: 2, y: 4},
  43: {x: 3, y: 4},
  44: {x: 0, y: 3},
  45: {x: 1, y: 3},
  46: {x: 2, y: 3},
  47: {x: 3, y: 3},
  48: {x: 0, y: 2},
  49: {x: 1, y: 2},
  50: {x: 2, y: 2},
  51: {x: 3, y: 2}
}


export class DrumPadController extends ApplicationController {
  type = "Rhythm";

  notePlayingActive       = false;
  noteRecordingActive     = false;
  keyReleaseFunctionality = true;
  heldGate:    number = undefined;
  disableGate: boolean = false;
  activeDrumPads: GridKeyPress[] = new Array();
  previousCoordinates: xyCoordinate[] = new Array();
  // heldDrumPad: number = undefined;

  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("selectGate", this.selectGate);
    this.functionMap.set("triggerDrumPad", this.triggerDrumPad);
    this.functionMap.set("updateStepLength", this.updateStepLength);
    this.functionMap.set("toggleNotePlaying", this.toggleNotePlaying);
    this.functionMap.set("toggleNoteRecording", this.toggleNoteRecording);
    this.functionMap.set("updateNoteLength", this.updateNoteLength);
    this.functionMap.set("updatePulse", this.updatePulse);
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    // Display the transport row
    super.setGridRhythmDisplay(highlightIndex);

    // Reset any drum pads brightened from the previous sequencer step
    this.previousCoordinates.forEach(coordinate => {
      this.grid.levelSet(coordinate.x, coordinate.y, 1);
    });
    this.previousCoordinates = new Array();

    // Brighten any drum pads that have hits for the current step
    const step = this.grid.sequencer.daw.getActiveTrack().drumRackSequence[highlightIndex % this.grid.sequencer.daw.getActiveTrack().rhythmStepLength];
    if (step) {
      step.forEach(note => {
        const coordinate = drumPadMatrix[note.midi];
        this.grid.levelSet(coordinate.x, coordinate.y, 10);
        this.previousCoordinates.push(coordinate);
      });
    }
  }


  refresh() {
    this.setGridDrumPadDisplay();
  }


  triggerDrumPad(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
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

      if (gridPage.noteRecordingActive) {
        gridPage.activeDrumPads.push(press);
      }
    } else {
      if (gridPage.noteRecordingActive && gridPage.heldGate != undefined) {
        const track = gridPage.grid.sequencer.daw.getActiveTrack();

        gridPage.activeDrumPads.forEach(press => {
          track.setDrumPadStep(gridPage.heldGate, gridPage.activeDrumPads.map(press => noteData[gridPage.matrix[press.y][press.x].value]));

          gridPage.grid.sequencer.daw.updateActiveTrackNotes();
          gridPage.disableGate = false;
          gridPage.setGridDrumPadDisplay();
          gridPage.updateGuiRhythmDisplay();
        });

        gridPage.activeDrumPads = new Array();
      }
    }
  }


  selectGate(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.heldGate = press.x;
      // Will stay true while note recording is active unless a drum pad is pressed before the gate is released
      if (gridPage.noteRecordingActive) gridPage.disableGate = true;
    } else {
      gridPage.heldGate = undefined;
      if (gridPage.noteRecordingActive && gridPage.disableGate) {
        gridPage.grid.sequencer.daw.getActiveTrack().setDrumPadStep(press.x, undefined);
        gridPage.grid.sequencer.daw.updateActiveTrackNotes();
        gridPage.setGridDrumPadDisplay();
        gridPage.updateGuiRhythmDisplay();
      }
      gridPage.disableGate = false;
    }
  }


  updateStepLength(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
      super.updateStepLength(gridPage, press, true);
    }
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
