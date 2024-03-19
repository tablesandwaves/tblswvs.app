import { GridConfig, GridKeyPress } from "./application_controller";
import { AlgorithmController } from "./algorithm_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";


export class InfinitySeriesController extends AlgorithmController {
  type = "Algorithm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("addSeedRange", this.addSeedRange);
  }


  refresh() {
    super.setGlobalAlgorithmControls();
    this.setGridInfinitySeriesDisplay();
  }


  addSeedRange(gridPage: InfinitySeriesController, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.getActiveTrack();
    const seedIndex = press.y - 2;
    const seedRange = press.x + 1;

    // Is a seed being removed?
    if (track.infinitySeriesSeeds[seedIndex] == 1 && seedRange == 1) {
      track.infinitySeriesSeeds[seedIndex] = 0;
    } else {
      track.infinitySeriesSeeds[seedIndex] = seedRange;
    }

    gridPage.getSeedRangeRows().forEach((row, i) => gridPage.grid.levelRow(0, i + 2, row));
  }


  advance(gridPage: InfinitySeriesController, press: GridKeyPress) {

  }


  setGridInfinitySeriesDisplay() {
    this.getSeedRangeRows().forEach((row, i) => this.grid.levelRow(0, i, row));
  }


  getSeedRangeRows() {
    const track = this.grid.sequencer.daw.getActiveTrack();
    return track.infinitySeriesSeeds.map(seed => {
      return blank8x1Row.slice().map((_, i) => seed >= (i + 1) ? 10 : 0);
    });
  }
}
