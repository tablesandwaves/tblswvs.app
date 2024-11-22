import { ACTIVE_BRIGHTNESS, ApplicationController, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { RhythmStep } from "../model/ableton/track";
import { debounce }   from "../helpers/utils";


const flush = (gridPage: DynamicsController) => {
  gridPage.grid.sequencer.daw.updateActiveTrackNotes();
  gridPage.setGridDynamicsDisplay();
  gridPage.updateGuiRhythmDisplay();
}


const debouncedFlush = debounce(flush, 500);


const MAX_VELOCITY = 120;


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

      // Update the actual dynamics property itself
      const stepIndex = press.x + (gridPage.grid.shiftStateActive ? 16 : 0);

      // Only edit dynamics for steps that are active
      if (gridPage.activeTrack.rhythm[stepIndex].state == 1) {
        gridPage.activeTrack.rhythm[stepIndex][gridPage.activeDynamic] = gridPage.activeDynamic == "probability" ?
                                                gridPage.matrix[press.y][press.x].value :
                                                Math.floor(gridPage.matrix[press.y][press.x].value * MAX_VELOCITY);
        debouncedFlush(gridPage);
      }
    }
  }


  refresh() {
    this.setGridDynamicsDisplay();
  }


  setGridDynamicsDisplay() {
    const [rhythmStart, rhythmEnd] = this.grid.shiftStateActive ? [16, 32] : [0, 16];

    for (let y = 0; y < 7; y++) {
      const row = this.activeTrack.rhythm.slice(rhythmStart, rhythmEnd).map((step: RhythmStep, x) => {
        return (step.state == 1 && this.matrix[y][x].value <= step.probability) ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
      });

      this.grid.levelRow(0, y, row.slice(0, 8));
      this.grid.levelRow(8, y, row.slice(8, 16));
    }
  }
}
