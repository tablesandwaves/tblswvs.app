import { MonomeGrid } from "../model/monome_grid";
import { GridConfig, GridKeyPress, ApplicationController } from "./application_controller";
// import { noteLengthMap, pulseRateMap } from "../model/ableton/note";
import { rhythmAlgorithms } from "../model/ableton/track";


export class RhythmController extends ApplicationController {
  type                        = "Rhythm";
  keyReleaseFunctionality     = true;
  keyPressCount               = 0;
  activeGates: GridKeyPress[] = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateRhythm", this.updateRhythm);
    this.functionMap.set("updateDefaultProbability", this.updateDefaultProbability);
    this.functionMap.set("updateNoteLength", this.updateNoteLength);
    this.functionMap.set("updateStepLength", this.updateStepLength);
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


  updateRhythm(gridPage: RhythmController, press: GridKeyPress) {
    // As they are pressed, add gates to the active gates array for storing until the last key press is released.
    if (press.s == 1) {
      gridPage.keyPressCount++;
      gridPage.activeGates.push(press);
    } else {
      gridPage.keyPressCount--;

      if (gridPage.keyPressCount == 0) {
        const track = gridPage.grid.sequencer.daw.getActiveTrack();
        if (track.rhythmAlgorithm == "surround") return;

        const updatedRhythm = track.rhythm.map(step => {return {...step}});
        gridPage.activeGates.forEach(queuedKeyPress => {
          const stepIndex                      = queuedKeyPress.x + (16 * queuedKeyPress.y);
          const stepState                      = 1 - track.rhythm[stepIndex].state;
          updatedRhythm[stepIndex].state       = stepState;
          updatedRhythm[stepIndex].probability = track.defaultProbability;
          if (stepState == 0) updatedRhythm[stepIndex].fillRepeats = 0;
        });
        track.rhythm = updatedRhythm;
        gridPage.activeGates = new Array();

        gridPage.grid.sequencer.daw.updateActiveTrackNotes();

        gridPage.setGridRhythmDisplay();
        gridPage.updateGuiRhythmDisplay();

        if (gridPage.rhythmIsBlank()) {
          track.fillMeasures = [0, 0, 0, 0, 0, 0, 0, 0];
          track.fillDuration = "8nd";
        }
      }
    }
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
      gridPage.grid.levelRow(0, 4, gridPage.getGridParameterRow().slice(0, 8));
      gridPage.grid.levelRow(8, 4, gridPage.getGridParameterRow().slice(8, 16));
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
    this.grid.levelRow(0, 2, this.getGridParameterRow().slice(0, 8));
    this.grid.levelRow(8, 2, this.getGridParameterRow().slice(8, 16));
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
