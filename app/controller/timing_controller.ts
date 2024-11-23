import { ApplicationController, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS, ACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { RhythmStep } from "../model/ableton/track";

export class TimingController extends ApplicationController {
  type = "Rhythm";
  keyReleaseFunctionality = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateValue", this.updateValue);
  }


  releaseShiftKey() {
    this.refresh();
  }


  updateValue() {

  }
}
