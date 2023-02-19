import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { Track } from "./track";


export class GridRhythm extends GridPage {

  constructor(config: GridConfig, track: Track, grid: MonomeGrid) {
    super(config, grid, track);
    this.functionMap.set("updateRhythm", this.updateRhythm);
  }


  refresh() {
    this.setGridRhythmDisplay();
    this.setGuiRhythmDisplay();
  }


  updateRhythm(gridPage: GridRhythm, press: GridKeyPress) {
    gridPage.currentTrack.rhythm[press.x] = 1 - gridPage.currentTrack.rhythm[press.x];
    gridPage.setGridRhythmDisplay();
    gridPage.setGuiRhythmDisplay();

    gridPage.grid.sequencer.refreshAbleton();
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
