import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";


export class GridRhythm extends GridPage {

  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateRhythm", this.updateRhythm);
  }


  refresh() {
    this.grid.clearGridDisplay();
    this.setGridRhythmDisplay();
    this.setGuiRhythmDisplay();
  }


  updateRhythm(gridPage: GridRhythm, press: GridKeyPress) {
    gridPage.grid.sequencer.getActiveTrack().rhythm[press.x] = 1 - gridPage.grid.sequencer.getActiveTrack().rhythm[press.x];
    gridPage.setGridRhythmDisplay();
    gridPage.setGuiRhythmDisplay();

    gridPage.grid.sequencer.refreshAbleton(false);
  }


  setDisplay(highlightIndex: number) {
    this.setGuiRhythmDisplay(highlightIndex);
    this.setGridRhythmDisplay(highlightIndex);
  }


  setGuiRhythmDisplay(highlightIndex?: number) {
    const row = this.grid.sequencer.getActiveTrack().rhythm.map((step: number, i) => i == highlightIndex ? 15 : step == 1 ? 10 : 0);
    this.grid.sequencer.gui.webContents.send("transport", row);
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    const row = this.grid.sequencer.getActiveTrack().rhythm.map((step: number, i) => i == highlightIndex ? 15 : step == 1 ? 10 : 0);
    this.grid.levelRow(0, 0, row.slice(0, 8));
    this.grid.levelRow(8, 0, row.slice(8, 16));
  }
}
