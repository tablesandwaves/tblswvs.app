import { noteData } from "tblswvs";
import { ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS, xyCoordinate, ApplicationController, GridConfig, GridKeyPress } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


const drumPadMatrix: Record<number, xyCoordinate> = {
  36: {x: 0, y: 6},
  37: {x: 1, y: 6},
  38: {x: 2, y: 6},
  39: {x: 3, y: 6},
  40: {x: 0, y: 5},
  41: {x: 1, y: 5},
  42: {x: 2, y: 5},
  43: {x: 3, y: 5},
  44: {x: 0, y: 4},
  45: {x: 1, y: 4},
  46: {x: 2, y: 4},
  47: {x: 3, y: 4},
  48: {x: 0, y: 3},
  49: {x: 1, y: 3},
  50: {x: 2, y: 3},
  51: {x: 3, y: 3}
}


export class DrumPadController extends ApplicationController {
  type = "Rhythm";

  notePlayingActive       = false;
  noteRecordingActive     = false;
  keyReleaseFunctionality = true;
  heldGate:     number = undefined;
  heldDrumPads: number = 0;
  disableGate: boolean = false;
  activeDrumPads: GridKeyPress[] = new Array();
  previousCoordinates: xyCoordinate[] = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("selectGate", this.selectGate);
    this.functionMap.set("toggleFillMeasure", this.toggleFillMeasure);
    this.functionMap.set("setFillDuration", this.setFillDuration);
    this.functionMap.set("triggerDrumPad", this.triggerDrumPad);
    this.functionMap.set("updateStepLength", this.updateStepLength);
    this.functionMap.set("toggleNotePlaying", this.toggleNotePlaying);
    this.functionMap.set("toggleNoteRecording", this.toggleNoteRecording);
    this.functionMap.set("updateDefaultProbability", this.updateDefaultProbability);
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
      gridPage.heldDrumPads++;
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
      gridPage.heldDrumPads--;
      if (gridPage.noteRecordingActive && gridPage.heldGate != undefined && gridPage.heldDrumPads == 0) {
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
    const stepIndex = press.x + (16 * press.y);
    if (press.s == 1) {
      gridPage.heldGate = stepIndex;
      // Will stay true while note recording is active unless a drum pad is pressed before the gate is released
      if (gridPage.noteRecordingActive) gridPage.disableGate = true;
    } else {
      gridPage.heldGate = undefined;
      if (gridPage.noteRecordingActive && gridPage.disableGate) {
        gridPage.grid.sequencer.daw.getActiveTrack().setDrumPadStep(stepIndex, undefined);
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
    for (let y = 3; y <= 6; y++)
      for (let x = 0; x < 4; x++)
        this.grid.levelSet(x, y, 1);

    // Drum Pad Controls
    this.grid.levelSet(4, 3, this.notePlayingActive   ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
    this.grid.levelSet(4, 4, this.noteRecordingActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }
}
