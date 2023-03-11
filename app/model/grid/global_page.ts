import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class GridGlobal extends GridPage {
  type = "Global";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("updateSuperMeasure", this.updateSuperMeasure);
  }


  updateSuperMeasure(gridPage: GridGlobal, press: GridKeyPress) {
    gridPage.grid.sequencer.superMeasure = press.x + 1;
    gridPage.#setGridSuperMeasureDisplay();
    gridPage.#setGuiSuperMeasureDisplay();
  }


  refresh(): void {
    this.grid.clearGridDisplay();
    this.#setGridSuperMeasureDisplay();
    this.#setGuiSuperMeasureDisplay();
  }


  #setGridSuperMeasureDisplay() {
    const superMeasure    = this.grid.sequencer.superMeasure;
    const superMeasureRow = [...new Array(superMeasure).fill(10), ...new Array(8 - superMeasure).fill(0)];
    this.grid.levelRow(0, 0, superMeasureRow);
  }


  #setGuiSuperMeasureDisplay() {
    this.grid.sequencer.gui.webContents.send("update-super-measure", this.grid.sequencer.superMeasure);
  }
}
