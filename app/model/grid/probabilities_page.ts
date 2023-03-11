import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class ProbabilitiesPage extends GridPage {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateProbability", this.updateProbability);
    this.functionMap.set("updateTrackProbability", this.updateTrackProbability);
  }


  updateProbability(gridPage: ProbabilitiesPage, press: GridKeyPress) {

  }


  updateTrackProbability(gridPage: ProbabilitiesPage, press: GridKeyPress) {

  }


  refresh() {
    this.grid.clearGridDisplay();
  }
}
