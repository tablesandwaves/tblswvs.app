import { ApplicationController, GridConfig, GridKeyPress } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


export class MelodyVectorController extends ApplicationController {
  type = "Melody";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setStepShift", this.setStepShift);
    this.functionMap.set("setShiftSequenceLength", this.setShiftSequenceLength);

    this.grid.clearGridDisplay();
  }


  refresh() {
    this.setGridShiftsDisplay();
    this.setGridShiftLengthDisplay();
  }


  setStepShift(gridPage: MelodyVectorController, press: GridKeyPress) {
    if (gridPage.grid.shiftKey && press.y == 0 && gridPage.grid.sequencer.daw.getActiveTrack().vectorShifts[press.x] == -1) {
      gridPage.grid.sequencer.daw.getActiveTrack().vectorShifts[press.x] = 0;
    } else if (!gridPage.grid.shiftKey && press.y == 6 && gridPage.grid.sequencer.daw.getActiveTrack().vectorShifts[press.x] == 1) {
      gridPage.grid.sequencer.daw.getActiveTrack().vectorShifts[press.x] = 0;
    } else {
      gridPage.grid.sequencer.daw.getActiveTrack().vectorShifts[press.x] =
          gridPage.grid.shiftKey ?
          gridPage.matrix[press.y][press.x].shiftValue :
          gridPage.matrix[press.y][press.x].value;
    }

    gridPage.setGridShiftsDisplay();
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiVectorDisplay();
  }


  setShiftSequenceLength(gridPage: MelodyVectorController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.getActiveTrack().vectorShiftsLength = gridPage.matrix[press.y][press.x].value;
    gridPage.setGridShiftLengthDisplay();
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiVectorDisplay();
  }


  setGridShiftLengthDisplay() {
    for (let y = 0; y < 3; y++)
      for (let x = 12; x < 16; x++)
        this.grid.levelSet(x, y, this.matrix[y][x].value <= this.grid.sequencer.daw.getActiveTrack().vectorShiftsLength ? 10 : 0);
  }


  setGridShiftsDisplay() {
    this.grid.sequencer.daw.getActiveTrack().vectorShifts.forEach((shift, x) => {
      if (shift == 0) {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, 0);
      } else if (shift < 0) {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, (-1 - y >= shift ? 10 : 0));
      } else {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, (y >= 7 - shift ? 10 : 0));
      }
    });
  }
}
