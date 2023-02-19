import { Track } from "./track";
import { MonomeGrid } from "./monome_grid";


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
  type: string,
  group?: string,
  value?: any
}


export class GridPage {
  grid: MonomeGrid;
  currentTrack: Track;
  matrix: GridButton[][] = new Array(8);
  functionMap: Map<string, Function> = new Map();


  constructor(config: GridConfig, grid: MonomeGrid, track: Track) {
    this.grid = grid;
    this.currentTrack = track;

    for (let i = 0; i < this.matrix.length; i++)
      this.matrix[i] = new Array(16);

    config.rows.forEach((row) => {
      for (let i = row.xStart; i < row.xStart + row.xLength; i++) {
        let entry: GridButton = { mapping: row.mapping, type: row.type };
        if (row.type == "radio") {
          entry.value = row.values[i - row.xStart];
          entry.group = row.group
        }
        this.matrix[row.index][i] = entry;
      }
    });
  }


  // Should be overridden by any subclasses extending GridPage
  refresh() {}


  // May be overridden by any subclasses extending GridPage
  keyPress(press: GridKeyPress) {
    if (press.s == 1 && this.matrix[press.y][press.x] != undefined)
      this.functionMap.get(this.matrix[press.y][press.x].mapping)(this, press);
  }


  // Should be overridden by any subclasses extending GridPage
  setDisplay(...args: any[]) {}


  // Should be overridden by any subclasses extending GridPage
  shiftDisplay() {}
}
