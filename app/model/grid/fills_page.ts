import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";
import { RhythmStep } from "../ableton/track";
import { fillLengthMap } from "../ableton/note";


export class FillsPage extends GridPage {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("setFillRepeats", this.setFillRepeats);
    this.functionMap.set("toggleFillMeasure", this.toggleFillMeasure);
    this.functionMap.set("setFillDuration", this.setFillDuration);
    this.functionMap.set("clearFillRepeats", this.clearFillRepeats);
  }


  refresh() {
    this.grid.clearGridDisplay();
    this.setGridFillsDisplay();
  }


  setFillRepeats(gridPage: FillsPage, press: GridKeyPress) {
    // Only edit fills for steps that are active
    if (gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].state == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].fillRepeats = gridPage.matrix[press.y][press.x].value;
      gridPage.setGridFillsDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  clearFillRepeats(gridPage: FillsPage, press: GridKeyPress) {
    if (gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].state == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().rhythm[press.x].fillRepeats = 0;
      gridPage.setGridFillsDisplay();
      gridPage.updateGuiRhythmDisplay();
    }
  }


  toggleFillMeasure(gridPage: FillsPage, press: GridKeyPress) {
    const currentState = gridPage.grid.sequencer.daw.getActiveTrack().fillMeasures[press.x];
    gridPage.grid.sequencer.daw.getActiveTrack().fillMeasures[press.x] = currentState == 0 ? 1 : 0;
    gridPage.setGridFillsDisplay();
    gridPage.updateGuiRhythmDisplay();
  }


  setFillDuration(gridPage: FillsPage, press: GridKeyPress) {

  }

  setGridFillsDisplay() {
    let row;

    if (this.grid.shiftKey) {
      // Set the measures on which the fills should play
      row = this.grid.sequencer.daw.getActiveTrack().fillMeasures.map(m => m == 1 ? 10 : 0);
      this.grid.levelRow(0, 6, row);

      // Set the fill duration meter buttons
      row = new Array(8).fill(0);
      for (let x = 0; x < 8; x++) {
        if (x <= fillLengthMap[this.grid.sequencer.daw.getActiveTrack().fillDuration].index) {
          row[x] = 10;
        }
      }
      this.grid.levelRow(8, 6, row);
    } else {
      // Display the current rhythm on row 7
      row = this.grid.sequencer.daw.getActiveTrack().rhythm.map((rhythmStep: RhythmStep, i) => {
        return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * 10) : 0;
      });
      this.grid.levelRow(0, 6, row.slice(0, 8));
      this.grid.levelRow(8, 6, row.slice(8, 16));
    }

    // Display the repeats as vertical meters for any steps with a non-zero fill-repeat value
    for (let y = 0; y < 6; y++) {
      row = this.grid.sequencer.daw.getActiveTrack().rhythm.map((rhythmStep: RhythmStep, x) => {
        return (rhythmStep.state == 1 && this.matrix[y][x].value <= rhythmStep.fillRepeats) ? 10 : 0;
      });
      this.grid.levelRow(0, y, row.slice(0, 8));
      this.grid.levelRow(8, y, row.slice(8, 16));
    }
  }
}
