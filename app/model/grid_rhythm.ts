import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { Track } from "./track";


export class GridRhythm extends GridPage {
  currentTrack: Track;
  grid: MonomeGrid;
  functionMap: Map<string, Function> = new Map();


  constructor(config: GridConfig, track: Track, grid: MonomeGrid) {
    super(grid, track);
    this.grid = grid;
    this.functionMap.set("updateRhythm", this.updateRhythm);

    config.rows.forEach((row) => {
      if (this.matrix[row.index] == undefined) this.matrix[row.index] = new Array(16);
      for (let i = row.xStart; i < row.xLength; i++) {
        this.matrix[row.index][i] = {mapping: row.mapping};
      }
    });
  }


  refresh() {
    this.setGridRhythmDisplay();
    this.setGuiRhythmDisplay();
  }


  keyPress(press: GridKeyPress) {
    if (press.s == 1) {
      this.functionMap.get(this.matrix[press.y][press.x].mapping)(this, press);
    }
  }


  updateRhythm(gridPage: GridRhythm, press: GridKeyPress) {
    gridPage.currentTrack.rhythm[press.x] = 1 - gridPage.currentTrack.rhythm[press.x];
    gridPage.setGridRhythmDisplay();
    gridPage.setGuiRhythmDisplay();
  }


  setDisplay(highlightIndex: number) {
    this.setGuiRhythmDisplay(highlightIndex);
    this.setGridRhythmDisplay(highlightIndex);
  }


  setGuiRhythmDisplay(highlightIndex?: number) {
    const row = this.currentTrack.rhythm.map((step: number, i) => i == highlightIndex ? 15 : step == 1 ? 10 : 0);
    this.grid.sequencer.gui.webContents.send("track-activate", this.currentTrack.name, row);
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    const row = this.currentTrack.rhythm.map((step: number, i) => i == highlightIndex ? 15 : step == 1 ? 10 : 0);
    this.grid.levelRow(0, 0, row.slice(0, 8));
    this.grid.levelRow(8, 0, row.slice(8, 16));
  }
}
