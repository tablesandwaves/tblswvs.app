import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";
import { RhythmStep } from "../ableton/track";


export class FillsPage extends GridPage {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("setFillRepeats", this.setFillRepeats);
    this.functionMap.set("toggleFillMeasure", this.toggleFillMeasure);
    this.functionMap.set("setFillDuration", this.setFillDuration);
  }


  refresh() {
    this.grid.clearGridDisplay();
    this.setGridFillssDisplay();
  }


  setFillRepeats(gridPage: FillsPage, press: GridKeyPress) {
    // Only edit probabilities for steps that are active
    if (gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].state == 1) {

    }
  }


  toggleFillMeasure(gridPage: FillsPage, press: GridKeyPress) {
  }


  setFillDuration(gridPage: FillsPage, press: GridKeyPress) {

  }

  setGridFillssDisplay() {
  }
}
