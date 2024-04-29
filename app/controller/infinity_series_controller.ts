import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
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
    super.refresh();
    this.setGridInfinitySeriesDisplay();
  }


  addSeedRange(gridPage: InfinitySeriesController, press: GridKeyPress) {
    if (press.s == 0) return;

    const seedIndex = press.y - 2;
    const seedRange = press.x + 1;

    // Is a seed being removed?
    if (gridPage.activeTrack.infinitySeriesSeeds[seedIndex] == 1 && seedRange == 1) {
      gridPage.activeTrack.infinitySeriesSeeds[seedIndex] = 0;
    } else {
      gridPage.activeTrack.infinitySeriesSeeds[seedIndex] = seedRange;
    }

    gridPage.getSeedRangeRows().forEach((row, i) => gridPage.grid.levelRow(0, i + 2, row));
  }


  advance(gridPage: InfinitySeriesController, press: GridKeyPress) {
    gridPage.activeTrack.generateOutputNotes();
    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.activeTrack.setGuiChordProgression();
  }


  setGridInfinitySeriesDisplay() {
    this.getSeedRangeRows().forEach((row, i) => this.grid.levelRow(0, i + 2, row));
    this.grid.levelRow(8, 2, this.getRhythmRepetitionsRow());
  }


  getSeedRangeRows() {
    return this.activeTrack.infinitySeriesSeeds.map(seed => {
      return blank8x1Row.slice().map((_, i) => seed >= (i + 1) ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
    });
  }
}
