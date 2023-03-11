import { MonomeGrid } from "./monome_grid";
import { RhythmStep } from "../track";


export type GridKeyPress = {
  x: number,
  y: number,
  s: number
}


export type GridConfig = {
  rows: any[],
  modifiers: any[],
  scales?: any[]
}


export type GridButton = {
  mapping: string,
  shiftMapping?: string,
  type: string,
  group?: string,
  value?: any
}


export class GridPage {
  type = "Generic";
  grid: MonomeGrid;
  matrix: GridButton[][] = new Array(8);
  functionMap: Map<string, Function> = new Map();


  constructor(config: GridConfig, grid: MonomeGrid) {
    this.grid = grid;

    for (let i = 0; i < this.matrix.length; i++)
      this.matrix[i] = new Array(16);

    config.rows.forEach((row) => {
      for (let i = row.xStart; i < row.xStart + row.xLength; i++) {
        let entry: GridButton = { mapping: row.mapping, shiftMapping: row.shiftMapping, type: row.type };
        if (row.type == "radio") {
          entry.value = row.values[i - row.xStart];
          entry.group = row.group
        }
        this.matrix[row.index][i] = entry;
      }
    });
  }


  // Should be overridden by any subclasses extending GridPage
  refresh(): void {}


  // May be overridden by any subclasses extending GridPage
  keyPress(press: GridKeyPress) {
    if (press.s == 0 || this.matrix[press.y][press.x] == undefined)
      return;

    if (this.grid.shiftKey && this.matrix[press.y][press.x].shiftMapping != undefined) {
      this.functionMap.get(this.matrix[press.y][press.x].shiftMapping)(this, press);
    } else {
      this.functionMap.get(this.matrix[press.y][press.x].mapping)(this, press);
    }
  }


  // Overridden on the GridRhythm page where the grid's transport row also needs to be updated.
  displayRhythmWithTransport(highlightIndex: number) {
    this.setGuiRhythmDisplay(highlightIndex);
  }


  setGuiRhythmDisplay(highlightIndex?: number) {
    const beatLength = this.grid.sequencer.getActiveTrack().beatLength;
    const row = this.grid.sequencer.getActiveTrack().rhythm.map((rhythmStep: RhythmStep, i) => {
      if (i >= beatLength)
        return null;
      else if (i == highlightIndex)
        return 15;
      else if (rhythmStep.state == 1)
        return 10;
      else
        return 0;
    });
    this.grid.sequencer.gui.webContents.send("transport", row);
  }


  // Should be overridden by any subclasses extending GridPage
  shiftDisplay() {}


  // Should be overridden by any subclasses extending GridPage
  toggleShiftState() {}
}
