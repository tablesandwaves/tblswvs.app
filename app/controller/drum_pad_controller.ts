import { note, noteData } from "tblswvs";
import {
  ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS, xyCoordinate,
  ApplicationController, GridConfig, GridKeyPress
} from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { DrumTrack } from "../model/ableton/drum_track";


export class DrumPadController extends ApplicationController {
  type = "Rhythm";

  notePlayingActive    = false;
  noteRecordingActive  = false;
  heldGate:     number = undefined;
  heldDrumPads: number = 0;
  disableGate: boolean = false;
  activeDrumPads: GridKeyPress[] = new Array();
  previousCoordinates: xyCoordinate[] = new Array();
  padNotes: note[] = new Array();


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


  get activeTrack() {
    return this.grid.sequencer.daw.getActiveTrack() as DrumTrack;
  }


  refresh() {
    this.setGridDrumPadDisplay();
    super.setGridSharedRhythmParametersDisplay();
  }


  triggerDrumPad(gridPage: DrumPadController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.heldDrumPads++;

      if (gridPage.notePlayingActive) gridPage.#playNote(press);
      if (gridPage.noteRecordingActive) gridPage.activeDrumPads.push(press);

    } else {
      gridPage.heldDrumPads--;

      if (gridPage.noteRecordingActive && gridPage.heldGate != undefined && gridPage.heldDrumPads == 0)
        gridPage.#flushRecordedNotes();
    }
  }


  #flushRecordedNotes() {
    this.activeDrumPads.forEach(press => {
      this.activeTrack.setDrumPadStep(
        this.heldGate,
        this.activeDrumPads.map(press => noteData[this.matrix[press.y][press.x].value])
      );

      this.grid.sequencer.daw.updateActiveTrackNotes();
      this.disableGate = false;
      this.setGridDrumPadDisplay();
      this.updateGuiRhythmDisplay();
    });

    this.activeDrumPads = new Array();
  }


  #playNote(press: GridKeyPress) {
    this.grid.sequencer.midiOut.send("noteon", {
      note: this.matrix[press.y][press.x].value,
      velocity: 64,
      channel: this.activeTrack.dawIndex
    });

    setTimeout(() => {
      this.grid.sequencer.midiOut.send("noteoff", {
        note: this.matrix[press.y][press.x].value,
        velocity: 64,
        channel: this.activeTrack.dawIndex
      });
    }, 100);
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
    super.setGridRhythmGatesDisplay(highlightIndex);

    // Drum Pads
    for (let y = 3; y <= 6; y++)
      for (let x = 0; x < 4; x++)
        this.grid.levelSet(x, y, 1);

    // Drum Pad Controls
    this.grid.levelSet(4, 3, this.notePlayingActive   ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
    this.grid.levelSet(4, 4, this.noteRecordingActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmGatesDisplay(highlightIndex);
    this.updateGuiRhythmTransport(pianoRollHighlightIndex);
  }
}
