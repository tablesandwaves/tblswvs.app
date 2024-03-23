import { blank8x1Row } from "../helpers/utils";
import { MonomeGrid } from "../model/monome_grid";
import { GridConfig, GridKeyPress, ApplicationController } from "./application_controller";
import { noteLengthMap } from "../model/ableton/note";
import { rhythmAlgorithms } from "../model/ableton/track";


export class RhythmController extends ApplicationController {
  type                        = "Rhythm";
  customNoteLength: "16n"|"8n"|"8nd"|"4n"|"4nd"|"2n"|"2nd"|"1n" = undefined;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateDefaultProbability", this.updateDefaultProbability);
    this.functionMap.set("toggleFillMeasure", this.toggleFillMeasure);
    this.functionMap.set("setFillDuration", this.setFillDuration);
    this.functionMap.set("updateNoteLength", this.updateNoteLength);
    this.functionMap.set("updatePulse", this.updatePulse);
    this.functionMap.set("updateRhythmAlgorithm", this.updateRhythmAlgorithm);
    this.functionMap.set("updateRelatedRhythmTrack", this.updateRelatedRhythmTrack);
    this.functionMap.set("updateRhythmParameter", this.updateRhythmParameter);
    this.functionMap.set("updateAlternateRhythmParameter", this.updateAlternateRhythmParameter);
  }


  refresh() {
    this.setGridRhythmDisplay();
  }


  updateStepLength(gridPage: RhythmController, press: GridKeyPress) {
    if (press.s == 1) {
      super.updateStepLength(gridPage, press);
    }
  }


  updateNoteLength(gridPage: RhythmController, press: GridKeyPress): void {
    if (press.s != 1) return;

    if (gridPage.activeGates.length > 0) {

      const track = gridPage.grid.sequencer.daw.getActiveTrack();
      gridPage.activeGates.forEach(queuedKeyPress => {
        const stepIndex = queuedKeyPress.x + (16 * queuedKeyPress.y);
        track.rhythm[stepIndex].noteLength = gridPage.matrix[press.y][press.x].value;
      });

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.grid.levelRow(8, 5, gridPage.getNoteLengthRow());
      gridPage.activeGates = new Array();

      if (!gridPage.grid.sequencer.testing) track.updateGuiNoteLength();

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
      const algorithm = gridPage.matrix[press.y][press.x].value == "undefined" ? "manual" : gridPage.matrix[press.y][press.x].value;
      gridPage.grid.sequencer.daw.getActiveTrack().rhythmAlgorithm = algorithm;

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridRhythmDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  updateRelatedRhythmTrack(gridPage: RhythmController, press: GridKeyPress) {
    if (press.s == 1) {
      const track = gridPage.grid.sequencer.daw.getActiveTrack();
      const pressedRelatedTrack = gridPage.grid.sequencer.daw.tracks[press.x];

      if (pressedRelatedTrack.relatedRhythmTrackDawIndex ==  track.dawIndex || pressedRelatedTrack.dawIndex == track.dawIndex) {
        track.relatedRhythmTrackDawIndex = undefined;
      } else {
        track.relatedRhythmTrackDawIndex = pressedRelatedTrack.dawIndex;
      }

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridRhythmDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  updateRhythmParameter(gridPage: RhythmController, press: GridKeyPress) {
    if (press.s == 1) {
      const track = gridPage.grid.sequencer.daw.getActiveTrack();

      if (track.rhythmAlgorithm == "accelerating") {
        track.acceleratingGateCount = press.x + 1;
      }

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.grid.levelRow(0, 3, gridPage.getGridParameterRow().slice(0, 8));
      gridPage.grid.levelRow(8, 3, gridPage.getGridParameterRow().slice(8, 16));
    }
  }


  // Placeholder
  updateAlternateRhythmParameter(gridPage: RhythmController, press: GridKeyPress) {

  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    // Transport row
    super.setGridRhythmDisplay(highlightIndex);

    // Parameter rows
    this.grid.levelRow(0, 3, this.getGridParameterRow().slice(0, 8));
    this.grid.levelRow(8, 3, this.getGridParameterRow().slice(8, 16));
    this.grid.levelRow(0, 5, this.getRhythmRelatedTrackRow());
    this.grid.levelRow(0, 6, this.getRhythmAlgorithmRow());
  }


  getRhythmAlgorithmRow() {
    const algorithmRow = new Array(8).fill(0);
    algorithmRow[rhythmAlgorithms[this.grid.sequencer.daw.getActiveTrack().rhythmAlgorithm]] = 10;
    return algorithmRow;
  }


  getRhythmRelatedTrackRow() {
    const relatedTrackRow = new Array(8).fill(0);

    const track = this.grid.sequencer.daw.getActiveTrack();
    if (track.relatedRhythmTrackDawIndex != undefined) {
      const trackIndex = this.grid.sequencer.daw.tracks.reduce((trackIndex, t, i) => {
        if (t.dawIndex == track.relatedRhythmTrackDawIndex) trackIndex = i;
        return trackIndex;
      }, -1);

      if (trackIndex != -1) relatedTrackRow[trackIndex] = 10;
    }
    return relatedTrackRow;
  }

  getGridParameterRow() {
    const track = this.grid.sequencer.daw.getActiveTrack();
    const parameterRow = new Array(16).fill(0);

    if (track.rhythmAlgorithm == "accelerating") {
      for (let i = 0; i < track.acceleratingGateCount; i++) {
        parameterRow[i] = 10;
      }
    }

    return parameterRow;
  }
}
