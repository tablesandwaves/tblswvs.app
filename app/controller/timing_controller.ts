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


  refresh() {
    this.setGridTimingDisplay();
  }


  setGridTimingDisplay() {
    this.gridRowMatrix().forEach((row, y) => {
      this.grid.levelRow(0, y, row.slice(0, 8));
      this.grid.levelRow(8, y, row.slice(8, 16));
    });
  }


  updateValue() {

  }


  gridRowMatrix() {
    const rowMatrix = new Array(7);
    const [rhythmStart, rhythmEnd] = this.grid.shiftStateActive ? [16, 32] : [0, 16];
    const rowOffsets = [0.3, 0.15, 0.05, 0, -0.05, -0.15, -0.3];
    const rhythmRow = this.activeTrack.rhythm.slice(rhythmStart, rhythmEnd);

    for (let y = 0; y < 7; y++) {
      const matrixRow = new Array(16).fill(INACTIVE_BRIGHTNESS);

      rhythmRow.forEach((rhythmStep: RhythmStep, x) => {
        // Late timings
        if (y < 3 && rhythmStep.state == 1 && rhythmStep.timingOffset >= rowOffsets[y])
          matrixRow[x] = ACTIVE_BRIGHTNESS;
        // No offsets
        else if (y == 3)
          matrixRow[x] = rhythmStep.state == 1 ? ACTIVE_BRIGHTNESS : 1;
        // Early timings
        else if (y > 3 && rhythmStep.state == 1 && rhythmStep.timingOffset <= rowOffsets[y])
          matrixRow[x] = ACTIVE_BRIGHTNESS;
      });

      rowMatrix[y] = matrixRow;
    }

    return rowMatrix;
  }
}
