import { GridConfig, GridKeyPress, ApplicationController } from "./application_controller";
import { MonomeGrid, pageTypeMap } from "../model/monome_grid";


export const algorithmButtonMap: Record<string, number> = {
  "simple":     0,
  "shift_reg":  1,
  "inf_series": 2
}


export class AlgorithmController extends ApplicationController {
  type = "Algorithm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("setAlgorithm", this.setAlgorithm);
    this.functionMap.set("advance", this.advance);
  }


  refresh() {
    this.setGlobalAlgorithmControls();
  }


  setAlgorithm(gridPage: AlgorithmController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().algorithm = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.pageIndex = press.x;
    gridPage.grid.setActiveGridPage(pageTypeMap[gridPage.type][gridPage.grid.pageIndex]);
  }


  // to be overridden by sub-classes
  advance(gridPage: AlgorithmController, press: GridKeyPress) {
    console.log("AlgorithmController.advance()")
  }


  setGlobalAlgorithmControls() {
    this.grid.levelRow(0, 6, this.getGridAlgorithmRow());
  }


  getGridAlgorithmRow() {
    const algorithmRow = new Array(8).fill(0);
    algorithmRow[algorithmButtonMap[this.grid.sequencer.daw.getActiveTrack().algorithm]] = 10;
    return algorithmRow;
  }
}
