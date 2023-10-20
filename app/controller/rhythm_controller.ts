import { MonomeGrid } from "../model/grid/monome_grid";
import { GridConfig, GridKeyPress, ApplicationController } from "./application_controller";
import { noteLengthMap, pulseRateMap } from "../model/ableton/note";
import { RhythmStep } from "../model/ableton/track";


export class RhythmController extends ApplicationController {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateRhythm", this.updateRhythm);
    this.functionMap.set("updateNoteLength", this.updateNoteLength);
    this.functionMap.set("updateBeatLength", this.updateBeatLength);
    this.functionMap.set("updatePulse", this.updatePulse);
  }


  refresh() {
    this.grid.clearGridDisplay();
    this.setGridRhythmDisplay();
  }


  updateBeatLength(gridPage: RhythmController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().beatLength = press.x + 1;
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


  updateNoteLength(gridPage: RhythmController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().noteLength = gridPage.matrix[press.y][press.x].value;
    gridPage.toggleRadioButton(0, 6, noteLengthMap[gridPage.grid.sequencer.daw.getActiveTrack().noteLength].index);
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiNoteLength();

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
  }


  updatePulse(gridPage: RhythmController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().pulseRate = gridPage.matrix[press.y][press.x].value;
    gridPage.toggleRadioButton(0, 5, pulseRateMap[gridPage.grid.sequencer.daw.getActiveTrack().pulseRate].index);
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiPulseRate();

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
  }


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.setGridRhythmDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    let row;
    if (this.grid.shiftKey) {
      const beatLength = this.grid.sequencer.daw.getActiveTrack().beatLength;
      row = [...new Array(beatLength).fill(5), ...new Array(16 - beatLength).fill(0)];
    } else {
      row = this.grid.sequencer.daw.getActiveTrack().rhythm.map((rhythmStep: RhythmStep, i) => {
        return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * 10) : 0;
      });
    }
    if (highlightIndex != undefined) row[highlightIndex] = 15;

    this.grid.levelRow(0, 0, row.slice(0, 8));
    this.grid.levelRow(8, 0, row.slice(8, 16));
    this.toggleRadioButton(0, 5, pulseRateMap[this.grid.sequencer.daw.getActiveTrack().pulseRate].index);
    this.toggleRadioButton(0, 6, noteLengthMap[this.grid.sequencer.daw.getActiveTrack().noteLength].index);
  }


  #rhythmIsBlank() {
    return this.grid.sequencer.daw.getActiveTrack().rhythm.reduce((total, step) => {
      return total + step.state;
    }, 0) == 0;
  }
}
