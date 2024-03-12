import { GridConfig, GridKeyPress } from "./application_controller";
import { AlgorithmController } from "./algorithm_controller";
import { MonomeGrid } from "../model/monome_grid";


export class InfinitySeriesController extends AlgorithmController {
  type = "Algorithm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
  }


  refresh() {
    super.setGlobalAlgorithmControls();
  }


  advance(gridPage: InfinitySeriesController, press: GridKeyPress) {

  }
}
