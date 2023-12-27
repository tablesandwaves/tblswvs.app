import { MonomeGrid } from "../model/monome_grid";
import { blank8x8Row } from "../helpers/utils";
import { RhythmStep } from "../model/ableton/track";
import { noteLengthMap, pulseRateMap, fillLengthMap } from "../model/ableton/note";


export type xyCoordinate = {
  x: number,
  y: number,
}


export type GridKeyPress = {
  x: number,
  y: number,
  s: number
}


export type GridConfig = {
  name: string,
  rows: any[],
  matrices?: any[]
}


export type GridButton = {
  mapping: string,
  shiftMapping?: string,
  // type: string,
  // group?: string,
  value?: any,
  shiftValue?: any
}


// Used by chord page and melody page.
export const octaveTransposeMapping: Record<number, number> = {
  0: 3,
  1: 2,
  2: 1,
  3: 0,
  4: -1,
  5: -2,
  6: -3
}


export const ACTIVE_BRIGHTNESS   = 10;
export const INACTIVE_BRIGHTNESS = 0;


export class ApplicationController {
  type = "Generic";
  grid: MonomeGrid;
  matrix: GridButton[][] = new Array(8);
  functionMap: Map<string, Function> = new Map();
  // Overridden on ChordPage where events happen when released.
  keyReleaseFunctionality: boolean = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    this.grid = grid;

    for (let i = 0; i < this.matrix.length; i++)
      this.matrix[i] = new Array(16);

    if (config.rows) {
      config.rows.forEach((row) => {
        for (let i = row.xStart; i < row.xStart + row.xLength; i++) {
          let entry: GridButton = this.matrix[row.index][i] ? this.matrix[row.index][i] : {mapping: undefined, shiftMapping: undefined};

          entry.mapping      = row.mapping      ? row.mapping      : entry.mapping;
          entry.shiftMapping = row.shiftMapping ? row.shiftMapping : entry.shiftMapping;
          entry.value        = row.value        ? row.value        : entry.value;
          entry.shiftValue   = row.shiftValue   ? row.shiftValue   : entry.shiftValue;

          if (row.values)      entry.value      = row.values[i - row.xStart];
          if (row.value)       entry.value      = row.value;
          if (row.shiftValues) entry.shiftValue = row.shiftValues[i - row.xStart];
          if (row.shiftValue)  entry.shiftValue = row.shiftValue;

          this.matrix[row.index][i] = entry;
        }
      });
    }

    if (config.matrices) {
      config.matrices.forEach((matrix) => {
        for (let y = matrix.rowStart; y <= matrix.rowEnd; y++) {
          for (let x = matrix.columnStart; x <= matrix.columnEnd; x++) {
            let entry: GridButton = this.matrix[y][x] ? this.matrix[y][x] : {mapping: undefined, shiftMapping: undefined};

            entry.mapping      = matrix.mapping      ? matrix.mapping      : entry.mapping;
            entry.shiftMapping = matrix.shiftMapping ? matrix.shiftMapping : entry.shiftMapping;
            entry.value        = matrix.value        ? matrix.value        : entry.value;
            entry.shiftValue   = matrix.shiftValue   ? matrix.shiftValue   : entry.shiftValue;

            if (matrix.columnValues)      entry.value      = matrix.columnValues[y - matrix.rowStart];
            if (matrix.shiftColumnValues) entry.shiftValue = matrix.shiftColumnValues[y - matrix.rowStart];
            if (matrix.rowValues)         entry.value      = matrix.rowValues[y - matrix.rowStart][x - matrix.columnStart];
            if (matrix.rowShiftValues)    entry.shiftValue = matrix.rowShiftValues[y - matrix.rowStart][x - matrix.columnStart];

            this.matrix[y][x] = entry;
          }
        }
      });
    }
  }


  // Should be overridden by any subclasses extending GridPage
  refresh(): void {}


  // Blank method to catch buttons that light up but provide no user interaction
  ignoredIndicator(): void {}


  // May be overridden by any subclasses extending GridPage
  keyPress(press: GridKeyPress) {
    if ((press.s == 0 && !this.keyReleaseFunctionality) || this.matrix[press.y][press.x] == undefined)
      return;

    if (this.grid.shiftKey && this.matrix[press.y][press.x].shiftMapping != undefined) {
      this.functionMap.get(this.matrix[press.y][press.x].shiftMapping)(this, press);
    } else {
      this.functionMap.get(this.matrix[press.y][press.x].mapping)(this, press);
    }
  }


  toggleNewClipCreation(gridPage: ApplicationController, press: GridKeyPress) {
    // Necessary to check for press=1 for the chord page.
    if (press.s == 1) {
      const track = gridPage.grid.sequencer.daw.getActiveTrack();
      track.createNewClip = !track.createNewClip;
      gridPage.grid.levelSet(press.x, press.y, (track.createNewClip ? 10 : 0));
      track.updateGuiCreateNewClip();
    }
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    // Transport rows 1 (steps 1-16) and 2 (steps 17-32)
    const transportRow = this.grid.shiftKey ? this.getRhythmStepLengthRow() : this.getRhythmGatesRow();
    if (highlightIndex != undefined) transportRow[highlightIndex] = 15;
    this.grid.levelRow(0, 0, transportRow.slice(0, 8));
    this.grid.levelRow(8, 0, transportRow.slice(8, 16));
    this.grid.levelRow(0, 1, transportRow.slice(16, 24));
    this.grid.levelRow(8, 1, transportRow.slice(24, 32));

    // Shared parameter rows
    this.setGridFillParametersDisplay();
    this.toggleRadioButton(8, 4, pulseRateMap[this.grid.sequencer.daw.getActiveTrack().pulseRate].index);
    this.updateGridRowMeter(8, 5, noteLengthMap[this.grid.sequencer.daw.getActiveTrack().noteLength].index);
    this.updateGridRowMeter(8, 6, (this.grid.sequencer.daw.getActiveTrack().defaultProbability / 0.125) - 1);
  }


  getRhythmStepLengthRow() {
    const stepLength = this.grid.sequencer.daw.getActiveTrack().rhythmStepLength;
    return [...new Array(stepLength).fill(5), ...new Array(32 - stepLength).fill(0)];
  }


  getRhythmGatesRow() {
    return this.grid.sequencer.daw.getActiveTrack().rhythm.map((rhythmStep: RhythmStep) => {
      return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * 10) : 0;
    });
  }


  updateStepLength(gridPage: ApplicationController, press: GridKeyPress, updateDrumPadMelody = false) {
    gridPage.grid.sequencer.daw.getActiveTrack().rhythmStepLength = press.x + (16 * press.y) + 1;
    if (updateDrumPadMelody) gridPage.grid.sequencer.daw.getActiveTrack().updateDrumPadInputMelody();
    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.setGridRhythmDisplay();
    gridPage.updateGuiRhythmDisplay();
  }


  toggleFillMeasure(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      const currentState = gridPage.grid.sequencer.daw.getActiveTrack().fillMeasures[press.x];
      gridPage.grid.sequencer.daw.getActiveTrack().fillMeasures[press.x] = currentState == 0 ? 1 : 0;
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridFillParametersDisplay();
      gridPage.grid.sequencer.daw.getActiveTrack().updateGuiFillMeasures();
    }
  }


  setFillDuration(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().fillDuration = gridPage.matrix[press.y][press.x].value;
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridFillParametersDisplay();
      gridPage.grid.sequencer.daw.getActiveTrack().updateGuiFillsDuration();
    }
  }


  setGridFillParametersDisplay() {
    // Set the measures on which the fills should play
    const row = this.grid.sequencer.daw.getActiveTrack().fillMeasures.map((m: number) => m == 1 ? 10 : 0);
    this.grid.levelRow(0, 2, row);

    // Set the fill duration meter buttons
    this.updateGridRowMeter(8, 2, fillLengthMap[this.grid.sequencer.daw.getActiveTrack().fillDuration].index);
  }


  updateDefaultProbability(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().defaultProbability = gridPage.matrix[press.y][press.x].value;
      gridPage.updateGridRowMeter(8, 6, (gridPage.grid.sequencer.daw.getActiveTrack().defaultProbability / 0.125) - 1);
    }
  }


  updateNoteLength(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().noteLength = gridPage.matrix[press.y][press.x].value;
      gridPage.updateGridRowMeter(8, 5, noteLengthMap[gridPage.grid.sequencer.daw.getActiveTrack().noteLength].index);
      gridPage.grid.sequencer.daw.getActiveTrack().updateGuiNoteLength();

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    }
  }


  updatePulse(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().pulseRate = gridPage.matrix[press.y][press.x].value;
      gridPage.toggleRadioButton(8, 4, pulseRateMap[gridPage.grid.sequencer.daw.getActiveTrack().pulseRate].index);
      gridPage.grid.sequencer.daw.getActiveTrack().updateGuiPulseRate();

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    }
  }


  rhythmIsBlank() {
    return this.grid.sequencer.daw.getActiveTrack().rhythm.reduce((total, step) => {
      return total + step.state;
    }, 0) == 0;
  }


  // Overridden on the RhythmPage and RampSequencePage where the grid's transport row also needs to be updated.
  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }


  updateGuiRhythmDisplay() {
    if (this.grid.sequencer.testing) return;
    this.grid.sequencer.daw.getActiveTrack().updateGuiTrackRhythm();
  }


  updateGuiRhythmTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    if (this.grid.sequencer.testing) return;

    this.grid.sequencer.gui.webContents.send("transport", highlightIndex, pianoRollHighlightIndex);
  }


  toggleRadioButton(startIndex: number, rowIndex: number, selectedIndex: number) {
    let row = blank8x8Row.slice();
    row[selectedIndex] = 10;
    this.grid.levelRow(startIndex, rowIndex, row);
  }


  updateGridRowMeter(startIndex: number, rowIndex: number, selectedIndex: number) {
    let row = blank8x8Row.slice();
    for (let i = 0; i <= selectedIndex; i++) row[i] = 10;
    this.grid.levelRow(startIndex, rowIndex, row);
  }


  // Call the sub-class's refresh function to update the grid's button matrix.
  toggleShiftState() {
    this.refresh();
  }
}
