import { blank16x16Row } from "../helpers/utils";
import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class GridGlobal extends GridPage {



  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("updateSuperMeasure", this.updateSuperMeasure);
  }


  updateSuperMeasure(gridPage: GridGlobal, press: GridKeyPress) {
    gridPage.grid.sequencer.superMeasure = press.x + 1;
    // const superMeasureRow = [...new Array(press.x + 1).fill(10), ...new Array(8 - press.x + 1).fill(0)];
    // gridPage.grid.levelRow(0, 0, superMeasureRow);
    gridPage.#setGridSuperMeasureDisplay();
  }


  refresh(): void {
    this.grid.clearGridDisplay();
    this.#setGridSuperMeasureDisplay();
  }


  #setGridSuperMeasureDisplay() {
    const superMeasure    = this.grid.sequencer.superMeasure;
    const superMeasureRow = [...new Array(superMeasure).fill(10), ...new Array(8 - superMeasure).fill(0)];
    this.grid.levelRow(0, 0, superMeasureRow);
  }
}
