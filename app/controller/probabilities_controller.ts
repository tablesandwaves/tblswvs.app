import { ApplicationController, GridConfig, GridKeyPress } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { RhythmStep } from "../model/ableton/track";


export class ProbabilitiesController extends ApplicationController {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateProbability", this.updateProbability);
  }


  updateProbability(gridPage: ProbabilitiesController, press: GridKeyPress) {
    const stepIndex = press.x + (gridPage.grid.shiftKey ? 16 : 0);

    // Only edit probabilities for steps that are active
    if (gridPage.grid.sequencer.daw.getActiveTrack().rhythm[stepIndex].state == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().rhythm[stepIndex].probability = gridPage.matrix[press.y][press.x].value;
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridProbabilitiesDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  refresh() {
    this.setGridProbabilitiesDisplay();
  }


  setGridProbabilitiesDisplay(highlightIndex?: number) {
    const [rhythmStart, rhythmEnd] = this.grid.shiftKey ? [16, 32] : [0, 16];

    for (let y = 0; y < 7; y++) {
      const row = this.grid.sequencer.daw.getActiveTrack().rhythm.slice(rhythmStart, rhythmEnd).map((step: RhythmStep, x) => {
        return (step.state == 1 && this.matrix[y][x].value <= step.probability) ? 10 : 0;
      });

      this.grid.levelRow(0, y, row.slice(0, 8));
      this.grid.levelRow(8, y, row.slice(8, 16));
    }
  }
}
