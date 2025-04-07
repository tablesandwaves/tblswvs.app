import { MonomeGrid } from "../model/monome_grid";
import {
  GridConfig, GridKeyPress, ApplicationController,
  INACTIVE_BRIGHTNESS, ACTIVE_BRIGHTNESS
} from "./application_controller";
import { rhythmAlgorithms } from "../model/ableton/track";


export class RhythmController extends ApplicationController {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateDefaultProbability", this.updateDefaultProbability);
    this.functionMap.set("updateNoteLength",         this.updateNoteLength);
    this.functionMap.set("updatePulse",              this.updatePulse);
    this.functionMap.set("updateRhythmAlgorithm",    this.updateRhythmAlgorithm);
    this.functionMap.set("updateRelatedRhythmTrack", this.updateRelatedRhythmTrack);
    this.functionMap.set("updateRhythmParameters",   this.updateRhythmParameters);
  }


  refresh() {
    super.setGridRhythmGatesDisplay();
    this.setGridRhythmParameterDisplay();
  }


  updateNoteLength(gridPage: RhythmController, press: GridKeyPress): void {
    if (press.s != 1) return;

    if (gridPage.activeGates.length > 0) {

      gridPage.activeGates.forEach(queuedKeyPress => {
        const stepIndex = queuedKeyPress.x + (16 * queuedKeyPress.y);
        gridPage.activeTrack.rhythm[stepIndex].noteLength = gridPage.matrix[press.y][press.x].value;
      });

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.grid.levelRow(8, 5, gridPage.getNoteLengthRow());
      gridPage.activeGates = new Array();

      if (!gridPage.grid.sequencer.testing) gridPage.activeTrack.updateGuiNoteLength();

    } else {
      super.updateNoteLength(gridPage, press);
    }
  }


  updateRhythm(gridPage: RhythmController, press: GridKeyPress) {
    super.updateRhythm(gridPage, press);
    // While holding down the button for a gate update the grid display to show its note length.
    gridPage.grid.levelRow(8, 5, gridPage.getNoteLengthRow());
  }


  updateRhythmAlgorithm(gridPage: RhythmController, press: GridKeyPress) {
    if (press.s == 1) {
      const algorithm = gridPage.matrix[press.y][press.x].value === "undefined" ?
                        "manual" :
                        gridPage.matrix[press.y][press.x].value;
      gridPage.activeTrack.rhythmAlgorithm = algorithm;

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridRhythmGatesDisplay();
      gridPage.setGridRhythmParameterDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  updateRelatedRhythmTrack(gridPage: RhythmController, press: GridKeyPress) {
    if (press.s == 1) {
      const pressedRelatedTrack = gridPage.grid.sequencer.daw.tracks[press.x];

      if (pressedRelatedTrack.relatedRhythmTrackDawIndex == gridPage.activeTrack.dawIndex ||
        pressedRelatedTrack.dawIndex == gridPage.activeTrack.dawIndex) {
        gridPage.activeTrack.relatedRhythmTrackDawIndex = undefined;
      } else {
        gridPage.activeTrack.relatedRhythmTrackDawIndex = pressedRelatedTrack.dawIndex;
      }

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridRhythmGatesDisplay();
      gridPage.setGridRhythmParameterDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    super.setGridRhythmGatesDisplay(highlightIndex);
    this.updateGuiRhythmTransport(pianoRollHighlightIndex);
  }


  setGridRhythmParameterDisplay() {
    super.setGridSharedRhythmParametersDisplay();

    // Parameter rows used by this page/controller, not by drum pad page/controller
    this.grid.levelRow(0, 5, this.getRhythmRelatedTrackRow());
    this.grid.levelRow(0, 6, this.getRhythmAlgorithmRow());
  }


  getRhythmAlgorithmRow() {
    const algorithmRow = new Array(8).fill(INACTIVE_BRIGHTNESS);
    algorithmRow[rhythmAlgorithms[this.activeTrack.rhythmAlgorithm]] = ACTIVE_BRIGHTNESS;
    return algorithmRow;
  }


  getRhythmRelatedTrackRow() {
    const relatedTrackRow = new Array(8).fill(INACTIVE_BRIGHTNESS);

    if (this.activeTrack.relatedRhythmTrackDawIndex != undefined) {
      const trackIndex = this.grid.sequencer.daw.tracks.reduce((trackIndex, t, i) => {
        if (t.dawIndex == this.activeTrack.relatedRhythmTrackDawIndex) trackIndex = i;
        return trackIndex;
      }, -1);

      if (trackIndex != -1) relatedTrackRow[trackIndex] = ACTIVE_BRIGHTNESS;
    }
    return relatedTrackRow;
  }
}
