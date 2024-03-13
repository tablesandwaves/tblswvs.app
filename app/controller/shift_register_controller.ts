import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { AlgorithmController } from "./algorithm_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row, scaleToRange } from "../helpers/utils";


export class ShiftRegisterController extends AlgorithmController {
  type                        = "Algorithm";
  keyReleaseFunctionality     = true;
  keyPressCount               = 0;
  activeGates: GridKeyPress[] = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setShiftRegisterLength", this.setShiftRegisterLength);
    this.functionMap.set("setOctaveRange", this.setOctaveRange);
  }


  refresh() {
    super.setGlobalAlgorithmControls();
    this.setGridShiftRegisterDisplay();
  }


  advance(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 0) return;

    const track = gridPage.grid.sequencer.daw.getActiveTrack();
    const stepCount = track.rhythm.reduce((count, step) => count + step.state, 0);
    const shiftRegisterSequence = [...new Array(stepCount)].map(_ => track.shiftRegister.step());
  }


  setShiftRegisterLength(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 0) return;

    const track = gridPage.grid.sequencer.daw.getActiveTrack();
    track.shiftRegister.length = press.x + 1;
    gridPage.grid.levelRow(0, 2, gridPage.getShiftRegisterLengthRow());
  }


  setOctaveRange(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.keyPressCount++;
      gridPage.activeGates.push(press);
    } else {
      gridPage.keyPressCount--;

      if (gridPage.keyPressCount == 0) {
        const track = gridPage.grid.sequencer.daw.getActiveTrack();

        const octaveRangeIndices = gridPage.activeGates.map(press => press.x % 8).sort();
        [0, 1, 2, 3].forEach(i => {
          if (i >= octaveRangeIndices.at(0) && i <= octaveRangeIndices.at(-1)) {
            track.shiftRegisterOctaveRange[i] = 1;
          } else {
            track.shiftRegisterOctaveRange[i] = 0;
          }
        });

        gridPage.activeGates = new Array();
        gridPage.grid.levelRow(8, 2, gridPage.getShiftRegisterRangeRow());
      }
    }
  }


  setGridShiftRegisterDisplay() {
    this.grid.levelRow(0, 2, this.getShiftRegisterLengthRow());
    this.grid.levelRow(8, 2, this.getShiftRegisterRangeRow());
  }


  getShiftRegisterLengthRow() {
    const track = this.grid.sequencer.daw.getActiveTrack();
    return new Array(track.shiftRegister.length)
                .fill(ACTIVE_BRIGHTNESS)
                .concat(new Array(8 - track.shiftRegister.length).fill(INACTIVE_BRIGHTNESS));
  }


  getShiftRegisterRangeRow() {
    const row   = blank8x1Row.slice();
    const track = this.grid.sequencer.daw.getActiveTrack();

    row.splice(0, 4, ...track.shiftRegisterOctaveRange.map(octave => {
      return octave == 1 ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
    }));

    return row;
  }
}
