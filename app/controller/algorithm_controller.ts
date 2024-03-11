import { GridConfig, GridKeyPress, ApplicationController } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


const algorithmButtonMap: Record<string, number> = {
  "simple":     0,
  "shift_reg":  1,
  "inf_series": 2
}


export class AlgorithmController extends ApplicationController {
  type = "Algorithm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("setAlgorithm", this.setAlgorithm);
  }


  refresh() {
    this.setGlobalAlgorithmControls();
  }


  setAlgorithm(gridPage: AlgorithmController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().algorithm = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.levelRow(0, 6, gridPage.getGridAlgorithmRow());
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
