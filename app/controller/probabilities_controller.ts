import { ACTIVE_BRIGHTNESS, ApplicationController, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { RhythmStep } from "../model/ableton/track";
import { debounce }   from "../helpers/utils";


const flush = (gridPage: ProbabilitiesController) => {
  gridPage.grid.sequencer.daw.updateActiveTrackNotes();
  gridPage.setGridProbabilitiesDisplay();
  gridPage.updateGuiRhythmDisplay();
}


const debouncedFlush = debounce(flush, 500);


export class ProbabilitiesController extends ApplicationController {
  type = "Rhythm";
  keyReleaseFunctionality = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateProbability", this.updateProbability);
  }


  updateProbability(gridPage: ProbabilitiesController, press: GridKeyPress) {
    const stepIndex = press.x + (gridPage.grid.shiftKey ? 16 : 0);

    // Only edit probabilities for steps that are active
    if (gridPage.activeTrack.rhythm[stepIndex].state == 1) {
      gridPage.activeTrack.rhythm[stepIndex].probability = gridPage.matrix[press.y][press.x].value;
      debouncedFlush(gridPage);
    }
  }


  refresh() {
    this.setGridProbabilitiesDisplay();
  }


  setGridProbabilitiesDisplay(highlightIndex?: number) {
    const [rhythmStart, rhythmEnd] = this.grid.shiftKey ? [16, 32] : [0, 16];

    for (let y = 0; y < 7; y++) {
      const row = this.activeTrack.rhythm.slice(rhythmStart, rhythmEnd).map((step: RhythmStep, x) => {
        return (step.state == 1 && this.matrix[y][x].value <= step.probability) ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
      });

      this.grid.levelRow(0, y, row.slice(0, 8));
      this.grid.levelRow(8, y, row.slice(8, 16));
    }
  }
}
