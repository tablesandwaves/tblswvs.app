import { ACTIVE_BRIGHTNESS, ApplicationController, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { RhythmStep, defaultVelocities } from "../model/ableton/track";
import { debounce }   from "../helpers/utils";


const flush = (gridPage: DynamicsController) => {
  gridPage.grid.sequencer.daw.updateActiveTrackNotes();
  gridPage.setGridDynamicsDisplay();
  gridPage.updateGuiRhythmDisplay();
}


const debouncedFlush = debounce(flush, 500);


export class DynamicsController extends ApplicationController {
  type = "Rhythm";
  keyReleaseFunctionality = false;
  activeDynamic: "probability"|"velocity" = "probability";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateValue", this.updateValue);
  }


  holdShiftKey() {
    // Clear the display and display the editing mode
    this.grid.clearGridDisplay();
    this.grid.levelSet(0, 6, this.activeDynamic == "probability" ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
    this.grid.levelSet(1, 6, this.activeDynamic == "velocity"    ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  releaseShiftKey() {
    this.refresh();
  }


  updateValue(gridPage: DynamicsController, press: GridKeyPress) {
    if (gridPage.grid.shiftKeyHeld) {

      // Update the active dynamics property to be edited (probability vs. velocity)
      if (press.y != 6) return;

      gridPage.grid.shiftKeyHeldPlusOtherKey = true;

      if (press.x == 0)
        gridPage.activeDynamic = "probability";
      else if (press.x == 1)
        gridPage.activeDynamic = "velocity";

    } else {
      // Do not allow edits of steps that are not on the current page
      if (!gridPage.grid.shiftStateActive && press.x >= gridPage.activeTrack.rhythmStepBreakpoint) return;

      let stepIndex;
      if (gridPage.grid.shiftStateActive) {
        stepIndex = gridPage.activeTrack.rhythmStepBreakpoint < 16 ?
                    press.x + gridPage.activeTrack.rhythmStepBreakpoint :
                    press.x + 16;
      } else {
        stepIndex = press.x;
      }

      // Once the step index is known check again: do not allow edits of steps that are not on the current page
      if (stepIndex > gridPage.activeTrack.rhythmStepLength) return;

      // Only edit dynamics for steps that are active
      if (gridPage.activeTrack.rhythm[stepIndex].state == 1) {
        gridPage.activeTrack.rhythm[stepIndex][gridPage.activeDynamic] = gridPage.matrix[press.y][press.x].value;
        debouncedFlush(gridPage);
      }
    }
  }


  refresh() {
    this.setGridDynamicsDisplay();
  }


  setGridDynamicsDisplay() {
    this.getGridDynamicsMatrix().forEach((row, y) => {
      this.grid.levelRow(0, y, row.slice(0, 8));
      this.grid.levelRow(8, y, row.slice(8, 16));
    });
  }


  getGridDynamicsMatrix() {
    const matrix = new Array();

    let rhythmSliceStart, rhythmSliceEnd;
    if (this.grid.shiftStateActive) {
      rhythmSliceStart = this.activeTrack.rhythmStepBreakpoint < 16 ? this.activeTrack.rhythmStepBreakpoint : 16;
      rhythmSliceEnd   = this.activeTrack.rhythmStepBreakpoint < 16 ?
                         this.activeTrack.rhythmStepLength :
                         32;
    } else {
      rhythmSliceStart = 0;
      rhythmSliceEnd   = this.activeTrack.rhythmStepBreakpoint < 16 ? this.activeTrack.rhythmStepBreakpoint : 16;
    }

    for (let y = 0; y < 7; y++) {
      const row = new Array(16).fill(INACTIVE_BRIGHTNESS);
      this.activeTrack.rhythm.slice(rhythmSliceStart, rhythmSliceEnd).forEach((step: RhythmStep, x) => {
        let property;
        if (this.activeDynamic == "probability") {
          property = step.probability;
        } else {
          if (step.velocity) {
            property = step.velocity;
          } else {
            property = defaultVelocities[x];
          }
        }

        if (step.state == 1 && this.matrix[y][x].value <= property)
          row[x] = ACTIVE_BRIGHTNESS;
      });

      matrix.push(row);
    }

    return matrix;
  }
}
