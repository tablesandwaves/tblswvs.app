import { ApplicationController, GridConfig, GridKeyPress } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { RhythmStep } from "../model/ableton/track";


export class ProbabilitiesController extends ApplicationController {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateProbability", this.updateProbability);
    this.functionMap.set("updateTrackProbability", this.updateTrackProbability);
  }


  updateProbability(gridPage: ProbabilitiesController, press: GridKeyPress) {
    // Only edit probabilities for steps that are active
    if (gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].state == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].probability = gridPage.matrix[press.y][press.x].value;
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridProbabilitiesDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  updateTrackProbability(gridPage: ProbabilitiesController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().defaultProbability = gridPage.matrix[press.y][press.x].value;
    gridPage.setGridProbabilitiesDisplay();
  }


  refresh() {
    this.setGridProbabilitiesDisplay();
  }


  setGridProbabilitiesDisplay(highlightIndex?: number) {
    if (this.grid.shiftKey) {
      for (let y = 0; y < 7; y++) {
        this.grid.levelSet(0, y, this.matrix[y][0].value <= this.grid.sequencer.daw.getActiveTrack().defaultProbability ? 10 : 0);
      }
    } else {
      let row;
      for (let y = 0; y < 7; y++) {
        row = this.grid.sequencer.daw.getActiveTrack().rhythm.map((rhythmStep: RhythmStep, x) => {
          return (rhythmStep.state == 1 && this.matrix[y][x].value <= rhythmStep.probability) ? 10 : 0;
        });
        this.grid.levelRow(0, y, row.slice(0, 8));
        this.grid.levelRow(8, y, row.slice(8, 16));
      }
    }
  }
}