import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { InputNoteController } from "./input_note_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";


export class InfinitySeriesController extends InputNoteController {
  type = "InputNotes";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("addSeedRange",       this.addSeedRange);
    this.functionMap.set("setEditableClip",    this.setEditableClip);
    this.functionMap.set("queueClipForLaunch", this.queueClipForLaunch);
  }


  refresh() {
    super.refresh();
    this.setGridInfinitySeriesDisplay();
    super.setCurrentClipGridDisplay();
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


  setGridInfinitySeriesDisplay() {
    this.getSeedRangeRows().forEach((row, i) => this.grid.levelRow(0, i + 2, row));
    super.setGridAlgorithmRepetitionRow();
  }


  getSeedRangeRows() {
    return this.activeTrack.infinitySeriesSeeds.map(seed => {
      return blank8x1Row.slice().map((_, i) => seed >= (i + 1) ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
    });
  }
}
