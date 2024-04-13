import { ACTIVE_BRIGHTNESS, ApplicationController, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


export class MelodyVectorController extends ApplicationController {
  type = "Melody";
  keyReleaseFunctionality = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setStepShift", this.setStepShift);
    this.functionMap.set("setShiftSequenceLength", this.setShiftSequenceLength);
  }


  refresh() {
    this.setGridShiftsDisplay();
    this.setGridShiftLengthDisplay();
  }


  setStepShift(gridPage: MelodyVectorController, press: GridKeyPress) {
    if (gridPage.grid.shiftKey && press.y == 0 && gridPage.activeTrack.vectorShifts[press.x] == -1) {
      gridPage.activeTrack.vectorShifts[press.x] = 0;
    } else if (!gridPage.grid.shiftKey && press.y == 6 && gridPage.activeTrack.vectorShifts[press.x] == 1) {
      gridPage.activeTrack.vectorShifts[press.x] = 0;
    } else {
      gridPage.activeTrack.vectorShifts[press.x] =
          gridPage.grid.shiftKey ?
          gridPage.matrix[press.y][press.x].shiftValue :
          gridPage.matrix[press.y][press.x].value;
    }

    gridPage.setGridShiftsDisplay();
    gridPage.activeTrack.updateGuiVectorDisplay();
  }


  setShiftSequenceLength(gridPage: MelodyVectorController, press: GridKeyPress) {
    gridPage.activeTrack.vectorShiftsLength = gridPage.matrix[press.y][press.x].value;
    gridPage.setGridShiftLengthDisplay();
    gridPage.activeTrack.updateGuiVectorDisplay();
  }


  setGridShiftLengthDisplay() {
    for (let y = 0; y < 3; y++)
      for (let x = 12; x < 16; x++)
        this.grid.levelSet(x, y, this.matrix[y][x].value <= this.activeTrack.vectorShiftsLength ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  setGridShiftsDisplay() {
    this.activeTrack.vectorShifts.forEach((shift, x) => {
      if (shift == 0) {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, INACTIVE_BRIGHTNESS);
      } else if (shift < 0) {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, (-1 - y >= shift ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
      } else {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, (y >= 7 - shift ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
      }
    });
  }
}
