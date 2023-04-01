import { MonomeGrid } from "./monome_grid";
import { RhythmStep } from "../track";


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
  type: string,
  group?: string,
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


export class GridPage {
  type = "Generic";
  grid: MonomeGrid;
  matrix: GridButton[][] = new Array(8);
  functionMap: Map<string, Function> = new Map();
  // Overridden on ChordPage where events happen when released.
  keyReleaseFunctionality: boolean = false;
  createNewClip: boolean = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    this.grid = grid;

    for (let i = 0; i < this.matrix.length; i++)
      this.matrix[i] = new Array(16);

    if (config.rows) {
      config.rows.forEach((row) => {
        for (let i = row.xStart; i < row.xStart + row.xLength; i++) {
          let entry: GridButton = { mapping: row.mapping, shiftMapping: row.shiftMapping, type: row.type };
          if (row.values) entry.value = row.values[i - row.xStart];
          if (row.value) entry.value = row.value;
          if (row.shiftValues) entry.shiftValue = row.shiftValues[i - row.xStart];
          if (row.shiftValue) entry.shiftValue = row.shiftValue;

          this.matrix[row.index][i] = entry;
        }
      });
    }

    if (config.matrices) {
      config.matrices.forEach((matrix) => {
        for (let y = matrix.rowStart; y <= matrix.rowEnd; y++) {
          for (let x = matrix.columnStart; x <= matrix.columnEnd; x++) {
            let entry: GridButton = { mapping: matrix.mapping, shiftMapping: matrix.shiftMapping, type: matrix.type };
            entry.value = matrix.columnValues[y - matrix.rowStart];
            entry.shiftValue = matrix.shiftColumnValues[y - matrix.rowStart];

            this.matrix[y][x] = entry;
          }
        }
      });
    }
  }


  // Should be overridden by any subclasses extending GridPage
  refresh(): void {}


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


  toggleNewClipCreation(gridPage: GridPage, press: GridKeyPress) {
    // Necessary to check for press=1 for the chord page.
    if (press.s == 1) {
      gridPage.createNewClip = !gridPage.createNewClip;
      gridPage.grid.levelSet(press.x, press.y, (gridPage.createNewClip ? 10 : 0));
      gridPage.grid.sequencer.gui.webContents.send("toggle-create-clip", gridPage.createNewClip);
    }
  }


  // Overridden on the GridRhythm page where the grid's transport row also needs to be updated.
  displayRhythmWithTransport(highlightIndex: number) {
    this.updateGuiRhythmTransport(highlightIndex);
  }


  updateGuiRhythmDisplay() {
    this.grid.sequencer.gui.webContents.send("update-track-rhythm", this.grid.sequencer.getActiveTrack());
  }


  updateGuiRhythmTransport(highlightIndex: number) {
    this.grid.sequencer.gui.webContents.send("transport", highlightIndex);
  }


  // Call the sub-class's refresh function to update the grid's button matrix.
  toggleShiftState() {
    this.refresh();
  }
}
