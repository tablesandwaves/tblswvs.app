import { ACTIVE_BRIGHTNESS, ApplicationController, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


export class DrumPadController extends ApplicationController {
  type = "Rhythm";

  notePlayingActive = false;
  noteRecordingActive = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("triggerDrumPad", this.triggerDrumPad);
    this.functionMap.set("updateRhythm", this.updateRhythm);
    this.functionMap.set("updateStepLength", this.updateStepLength);
    this.functionMap.set("toggleNotePlaying", this.toggleNotePlaying);
    this.functionMap.set("toggleNoteRecording", this.toggleNoteRecording);
  }


  refresh() {
    this.setGridDrumPadDisplay();
  }


  triggerDrumPad(gridPage: DrumPadController, press: GridKeyPress) {
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


  // TODO: DRY this up with the RhythmController version
  updateRhythm(gridPage: DrumPadController, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.getActiveTrack();
    if (track.rhythmAlgorithm == "surround") return;

    const updatedRhythm = track.rhythm.map(step => {return {...step}});
    updatedRhythm[press.x].state       = 1 - track.rhythm[press.x].state;
    updatedRhythm[press.x].probability = track.defaultProbability;
    if (updatedRhythm[press.x].state == 0) updatedRhythm[press.x].fillRepeats = 0;

    track.rhythm = updatedRhythm;

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();

    gridPage.setGridDrumPadDisplay();
    gridPage.updateGuiRhythmDisplay();

    if (gridPage.rhythmIsBlank()) {
      track.fillMeasures = [0, 0, 0, 0, 0, 0, 0, 0];
      track.fillDuration = "8nd";
    }
  }


  updateStepLength(gridPage: DrumPadController, press: GridKeyPress) {
    super.updateStepLength(gridPage, press);
  }


  toggleNotePlaying(gridPage: DrumPadController, press: GridKeyPress) {
    gridPage.notePlayingActive = !gridPage.notePlayingActive;
    gridPage.setGridDrumPadDisplay();
  }


  toggleNoteRecording(gridPage: DrumPadController, press: GridKeyPress) {
    gridPage.noteRecordingActive = !gridPage.noteRecordingActive;
    gridPage.setGridDrumPadDisplay();
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
