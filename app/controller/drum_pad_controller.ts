import { note, noteData } from "tblswvs";
import { ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS, xyCoordinate, ApplicationController, GridConfig, GridKeyPress } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


const drumPadMatrix: Record<number, {coordinates: xyCoordinate, note: note}> = {
  36: {coordinates: {x: 0, y: 6}, note: {midi: 36, note: "C",  octave: 1}},
  37: {coordinates: {x: 1, y: 6}, note: {midi: 37, note: "C#", octave: 1}},
  38: {coordinates: {x: 2, y: 6}, note: {midi: 38, note: "D",  octave: 1}},
  39: {coordinates: {x: 3, y: 6}, note: {midi: 39, note: "D#", octave: 1}},
  40: {coordinates: {x: 0, y: 5}, note: {midi: 40, note: "E",  octave: 1}},
  41: {coordinates: {x: 1, y: 5}, note: {midi: 41, note: "F",  octave: 1}},
  42: {coordinates: {x: 2, y: 5}, note: {midi: 42, note: "F#", octave: 1}},
  43: {coordinates: {x: 3, y: 5}, note: {midi: 43, note: "G",  octave: 1}},
  44: {coordinates: {x: 0, y: 4}, note: {midi: 44, note: "G#", octave: 1}},
  45: {coordinates: {x: 1, y: 4}, note: {midi: 45, note: "A",  octave: 1}},
  46: {coordinates: {x: 2, y: 4}, note: {midi: 46, note: "A#", octave: 1}},
  47: {coordinates: {x: 3, y: 4}, note: {midi: 47, note: "B",  octave: 1}},
  48: {coordinates: {x: 0, y: 3}, note: {midi: 48, note: "C",  octave: 2}},
  49: {coordinates: {x: 1, y: 3}, note: {midi: 49, note: "C#", octave: 2}},
  50: {coordinates: {x: 2, y: 3}, note: {midi: 50, note: "D",  octave: 2}},
  51: {coordinates: {x: 3, y: 3}, note: {midi: 51, note: "D#", octave: 2}}
}


export class DrumPadController extends ApplicationController {
  type = "Rhythm";

  notePlayingActive    = false;
  noteRecordingActive  = false;
  noteEditingActive    = false;
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
    this.functionMap.set("toggleNoteEditing", this.toggleNoteEditing);
    this.functionMap.set("updateDefaultProbability", this.updateDefaultProbability);
    this.functionMap.set("updateNoteLength", this.updateNoteLength);
    this.functionMap.set("updatePulse", this.updatePulse);
  }


  setGridRhythmDisplay(highlightIndex?: number, pianoRollHighlightIndex?: number) {
    // Display the transport row
    super.setGridRhythmDisplay(highlightIndex);

    // Reset any drum pads brightened from the previous sequencer step
    this.previousCoordinates.forEach(coordinate => {
      this.grid.levelSet(coordinate.x, coordinate.y, 1);
    });
    this.previousCoordinates = new Array();

    if (pianoRollHighlightIndex == undefined) return;

    // Brighten any drum pads that have hits for the current step
    const step = this.activeTrack.sequence[pianoRollHighlightIndex];
    step.forEach(note => {
      if (note && drumPadMatrix[note.midi]) {
        this.grid.levelSet(drumPadMatrix[note.midi].coordinates.x, drumPadMatrix[note.midi].coordinates.y, ACTIVE_BRIGHTNESS);
        this.previousCoordinates.push(drumPadMatrix[note.midi].coordinates);
      }
    });
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
          channel: gridPage.activeTrack.dawIndex
        });

        setTimeout(() => {
          gridPage.grid.sequencer.midiOut.send("noteoff", {
            note: gridPage.matrix[press.y][press.x].value,
            velocity: 64,
            channel: gridPage.activeTrack.dawIndex
          });
        }, 100);
      }

      if (gridPage.noteRecordingActive) {
        gridPage.activeDrumPads.push(press);
      }

      if (gridPage.noteEditingActive) {
        const note = Object.values(drumPadMatrix).find(obj => obj.coordinates.x == press.x && obj.coordinates.y == press.y).note;
        gridPage.grid.sequencer.queuedMelody.push(note);
      }
    } else {
      gridPage.heldDrumPads--;
      if (gridPage.noteRecordingActive && gridPage.heldGate != undefined && gridPage.heldDrumPads == 0) {
        gridPage.activeDrumPads.forEach(press => {
          gridPage.activeTrack.setDrumPadStep(gridPage.heldGate, gridPage.activeDrumPads.map(press => noteData[gridPage.matrix[press.y][press.x].value]));

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
        gridPage.activeTrack.setDrumPadStep(stepIndex, undefined);
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
      gridPage.noteEditingActive = false;
      gridPage.noteRecordingActive = !gridPage.noteRecordingActive;
      gridPage.setGridDrumPadDisplay();
    }
  }


  toggleNoteEditing(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.noteRecordingActive = false;
      gridPage.noteEditingActive = !gridPage.noteEditingActive;
      gridPage.setGridDrumPadDisplay();

      if (gridPage.noteEditingActive) {
        // When note editing is still active, queue up notes
        gridPage.grid.sequencer.queuedMelody = new Array();
        gridPage.setUiQueuedMelody();
      } else {
        // When note editing is turned off, flush the notes from the queued melody to the track
        // unless there are no queued notes (due to inadvertent button press).
        if (gridPage.grid.sequencer.queuedMelody.length > 0) {
          gridPage.activeTrack.inputMelody = gridPage.grid.sequencer.queuedMelody;
          gridPage.grid.sequencer.daw.updateActiveTrackNotes();
          gridPage.activeTrack.updateGuiTrackNotes();
        }
      }
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
    this.grid.levelSet(4, 5, this.noteEditingActive   ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmDisplay(highlightIndex, pianoRollHighlightIndex);
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }
}
