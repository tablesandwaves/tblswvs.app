import { MonomeGrid } from "../model/monome_grid";
import { blank8x8Row } from "../helpers/utils";


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


  // Overridden on the RhythmPage and RampSequencePage where the grid's transport row also needs to be updated.
  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }


  updateGuiRhythmDisplay() {
    this.grid.sequencer.gui.webContents.send(
      "track-rhythm",
      this.grid.sequencer.daw.getActiveTrack().rhythm,
      this.grid.sequencer.daw.getActiveTrack().beatLength
    );
  }


  updateGuiRhythmTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
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
