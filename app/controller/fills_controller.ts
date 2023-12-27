import { ApplicationController, GridConfig, GridKeyPress } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { RhythmStep } from "../model/ableton/track";


export class FillsController extends ApplicationController {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("setFillRepeats", this.setFillRepeats);
    this.functionMap.set("clearFillRepeats", this.clearFillRepeats);
  }


  refresh() {
    this.setGridFillsDisplay();
  }


  setFillRepeats(gridPage: FillsController, press: GridKeyPress) {
    // Only edit fills for steps that are active
    if (gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].state == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].fillRepeats = gridPage.matrix[press.y][press.x].value;
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridFillsDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  clearFillRepeats(gridPage: FillsController, press: GridKeyPress) {
    if (gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].state == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].fillRepeats = 0;
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridFillsDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  setGridFillsDisplay() {
    let row;

    if (this.grid.shiftKey) {

    } else {
      // Display the current rhythm on row 7
      row = this.grid.sequencer.daw.getActiveTrack().rhythm.map((rhythmStep: RhythmStep, i: any) => {
        return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * 10) : 0;
      });
      this.grid.levelRow(0, 6, row.slice(0, 8));
      this.grid.levelRow(8, 6, row.slice(8, 16));
    }

    // Display the repeats as vertical meters for any steps with a non-zero fill-repeat value
    for (let y = 0; y < 6; y++) {
      row = this.grid.sequencer.daw.getActiveTrack().rhythm.map((rhythmStep: RhythmStep, x: number) => {
        return (rhythmStep.state == 1 && this.matrix[y][x].value <= rhythmStep.fillRepeats) ? 10 : 0;
      });
      this.grid.levelRow(0, y, row.slice(0, 8));
      this.grid.levelRow(8, y, row.slice(8, 16));
    }
  }
}
