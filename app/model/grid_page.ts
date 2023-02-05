import { Track } from "./track";
import { MonomeGrid } from "./monome_grid";


export type GridKeyPress = {
  x: number,
  y: number,
  s: number
}


export type GridConfig = {
  rows: any[],
  modifiers: any[]
}


export type GridMapping = {
  mapping: string
}


export type ButtonFunction = {
  name: string
}


export class GridPage {
  grid: MonomeGrid;
  matrix: GridMapping[][];
  configFunctions: Object;
  currentTrack: Track;


  constructor(grid: MonomeGrid, track: Track) {
    this.matrix = new Array(8);
    this.grid = grid;
    this.currentTrack = track;
  }


  // Should be overridden by any subclasses extending GridPage
  refresh() {}


  // Should be overridden by any subclasses extending GridPage
  keyPress(press: GridKeyPress) {
    console.log(`Grid key press: ${press.x} ${press.y} ${press.s}`);
  }


  // Should be overridden by any subclasses extending GridPage
  setDisplay(...args: any[]) {}
}
