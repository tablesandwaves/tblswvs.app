import { MonomeGrid } from "../model/monome_grid";
import { GridConfig, GridKeyPress, ApplicationController } from "./application_controller";
import { noteLengthMap, pulseRateMap } from "../model/ableton/note";
import { RhythmStep, rhythmAlgorithms } from "../model/ableton/track";


export class RhythmController extends ApplicationController {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateRhythm", this.updateRhythm);
    this.functionMap.set("updateNoteLength", this.updateNoteLength);
    this.functionMap.set("updateStepLength", this.updateStepLength);
    this.functionMap.set("updatePulse", this.updatePulse);
    this.functionMap.set("updateRhythmAlgorithm", this.updateRhythmAlgorithm);
    this.functionMap.set("updateRelatedRhythmTrack", this.updateRelatedRhythmTrack);
  }


  refresh() {
    this.setGridRhythmDisplay();
  }


  updateStepLength(gridPage: RhythmController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().rhythmStepLength = press.x + 1;
    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.setGridRhythmDisplay();
    gridPage.updateGuiRhythmDisplay();
  }


  updateRhythm(gridPage: RhythmController, press: GridKeyPress) {
    const stepState = 1 - gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].state;
    const track     = gridPage.grid.sequencer.daw.getActiveTrack();

    track.rhythm[press.x].state       = stepState;
    track.rhythm[press.x].probability = gridPage.grid.sequencer.daw.getActiveTrack().defaultProbability;
    if (stepState == 0) track.rhythm[press.x].fillRepeats = 0;

    gridPage.setGridRhythmDisplay();
    gridPage.updateGuiRhythmDisplay();

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();

    if (gridPage.#rhythmIsBlank()) {
      track.fillMeasures = [0, 0, 0, 0, 0, 0, 0, 0];
      track.fillDuration = "8nd";
    }
  }


  updateRhythmAlgorithm(gridPage: RhythmController, press: GridKeyPress) {
    const algorithm = gridPage.matrix[press.y][press.x].value == "undefined" ? "manual" : gridPage.matrix[press.y][press.x].value;
    gridPage.grid.sequencer.daw.getActiveTrack().rhythmAlgorithm = algorithm;

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.grid.levelRow(0, 6, gridPage.getRhythmAlgorithmRow());
  }


  updateRelatedRhythmTrack(gridPage: RhythmController, press: GridKeyPress) {
    const currentTrackIndex   = gridPage.grid.sequencer.daw.activeTrack;
    const currentRelatedTrack = gridPage.grid.sequencer.daw.getActiveTrack().relatedRhythmTrackIndex;
    if (press.x == currentRelatedTrack || press.x == currentTrackIndex) {
      gridPage.grid.sequencer.daw.getActiveTrack().relatedRhythmTrackIndex = undefined;
    } else {
      gridPage.grid.sequencer.daw.getActiveTrack().relatedRhythmTrackIndex = press.x;
    }

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.grid.levelRow(0, 5, gridPage.getRhythmRelatedTrackRow());
  }


  updateNoteLength(gridPage: RhythmController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().noteLength = gridPage.matrix[press.y][press.x].value;
    gridPage.updateGridRowMeter(8, 6, noteLengthMap[gridPage.grid.sequencer.daw.getActiveTrack().noteLength].index);
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiNoteLength();

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
  }


  updatePulse(gridPage: RhythmController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().pulseRate = gridPage.matrix[press.y][press.x].value;
    gridPage.toggleRadioButton(8, 5, pulseRateMap[gridPage.grid.sequencer.daw.getActiveTrack().pulseRate].index);
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiPulseRate();

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    // Transport row
    const transportRow = this.grid.shiftKey ? this.getRhythmStepLengthRow() : this.getRhythmGatesRow();
    if (highlightIndex != undefined) transportRow[highlightIndex] = 15;
    this.grid.levelRow(0, 0, transportRow.slice(0, 8));
    this.grid.levelRow(8, 0, transportRow.slice(8, 16));

    // Parameter rows
    this.grid.levelRow(0, 5, this.getRhythmRelatedTrackRow());
    this.grid.levelRow(0, 6, this.getRhythmAlgorithmRow());
    this.toggleRadioButton(8, 5, pulseRateMap[this.grid.sequencer.daw.getActiveTrack().pulseRate].index);
    this.updateGridRowMeter(8, 6, noteLengthMap[this.grid.sequencer.daw.getActiveTrack().noteLength].index);
  }


  #rhythmIsBlank() {
    return this.grid.sequencer.daw.getActiveTrack().rhythm.reduce((total, step) => {
      return total + step.state;
    }, 0) == 0;
  }


  getRhythmStepLengthRow() {
    const stepLength = this.grid.sequencer.daw.getActiveTrack().rhythmStepLength;
    return [...new Array(stepLength).fill(5), ...new Array(16 - stepLength).fill(0)];
  }


  getRhythmGatesRow() {
    return this.grid.sequencer.daw.getActiveTrack().rhythm.map((rhythmStep: RhythmStep) => {
      return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * 10) : 0;
    });
  }


  getRhythmAlgorithmRow() {
    const algorithmRow = new Array(8).fill(0);
    algorithmRow[rhythmAlgorithms[this.grid.sequencer.daw.getActiveTrack().rhythmAlgorithm]] = 10;
    return algorithmRow;
  }


  getRhythmRelatedTrackRow() {
    const relatedTrackRow = new Array(8).fill(0);
    if (this.grid.sequencer.daw.getActiveTrack().relatedRhythmTrackIndex != undefined)
      relatedTrackRow[this.grid.sequencer.daw.getActiveTrack().relatedRhythmTrackIndex] = 10;
    return relatedTrackRow;
  }
}
