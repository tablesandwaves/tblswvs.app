import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { AlgorithmController } from "./algorithm_controller";
import { MonomeGrid } from "../model/monome_grid";


export class ShiftRegisterController extends AlgorithmController {
  type = "Algorithm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setShiftRegisterLength", this.setShiftRegisterLength);
  }


  refresh() {
    super.setGlobalAlgorithmControls();
    this.setGridShiftRegisterDisplay();
  }


  setShiftRegisterLength(gridPage: ShiftRegisterController, press: GridKeyPress) {

  }


  setGridShiftRegisterDisplay() {
    this.grid.levelRow(0, 3, this.shiftRegisterLengthRow());
  }


  shiftRegisterLengthRow() {
    const track = this.grid.sequencer.daw.getActiveTrack();
    return new Array(track.shiftRegister.length)
                .fill(ACTIVE_BRIGHTNESS)
                .concat(new Array(8 - track.shiftRegister.length).fill(INACTIVE_BRIGHTNESS));
  }
}
