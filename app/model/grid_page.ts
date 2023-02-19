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

    config.rows.forEach((row) => {
      if (this.matrix[row.index] == undefined) { this.matrix[row.index] = new Array(16); }

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


  // Should be overridden by any subclasses extending GridPage
  keyPress(press: GridKeyPress) {
    console.log(`Grid key press: ${press.x} ${press.y} ${press.s}`);
  }


  // Should be overridden by any subclasses extending GridPage
  setDisplay(...args: any[]) {}


  // Should be overridden by any subclasses extending GridPage
  shiftDisplay() {}
}
