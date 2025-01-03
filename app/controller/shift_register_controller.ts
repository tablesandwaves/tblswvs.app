import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { InputNoteController } from "./input_note_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row, scaleToRange } from "../helpers/utils";


export class ShiftRegisterController extends InputNoteController {
  type                        = "InputNotes";
  keyPressCount               = 0;
  activeGates: GridKeyPress[] = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setShiftRegisterLength", this.setShiftRegisterLength);
    this.functionMap.set("setShiftRegisterChance", this.setShiftRegisterChance);
    this.functionMap.set("setOctaveRange", this.setOctaveRange);
  }


  refresh() {
    super.refresh();
    this.setGridShiftRegisterDisplay();
  }


  setShiftRegisterLength(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 0) return;

    gridPage.activeTrack.shiftRegister.length = press.x + 1;
    gridPage.grid.levelRow(0, 2, gridPage.getShiftRegisterLengthRow());
  }


  setShiftRegisterChance(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 0) return;

    gridPage.activeTrack.shiftRegister.chance = (press.x + 1) / 8;
    gridPage.grid.levelRow(0, 3, gridPage.getShiftRegisterChanceRow());
  }


  setOctaveRange(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.keyPressCount++;
      gridPage.activeGates.push(press);
    } else {
      gridPage.keyPressCount--;

      if (gridPage.keyPressCount == 0) {
        const octaveRangeIndices = gridPage.activeGates.map(press => press.x % 8).sort((a, b) => a - b);
        [0, 1, 2, 3].forEach(i => {
          if (i >= octaveRangeIndices.at(0) && i <= octaveRangeIndices.at(-1)) {
            gridPage.activeTrack.shiftRegisterOctaveRange[i] = 1;
          } else {
            gridPage.activeTrack.shiftRegisterOctaveRange[i] = 0;
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
    this.grid.levelRow(0, 3, this.getShiftRegisterChanceRow());
  }


  getShiftRegisterLengthRow() {
    return new Array(this.activeTrack.shiftRegister.length)
                .fill(ACTIVE_BRIGHTNESS)
                .concat(new Array(8 - this.activeTrack.shiftRegister.length).fill(INACTIVE_BRIGHTNESS));
  }


  getShiftRegisterChanceRow() {
    return new Array(this.activeTrack.shiftRegister.chance * 8)
                .fill(ACTIVE_BRIGHTNESS)
                .concat(new Array(8 - (this.activeTrack.shiftRegister.chance * 8)).fill(INACTIVE_BRIGHTNESS));
  }


  getShiftRegisterRangeRow() {
    const row   = blank8x1Row.slice();

    row.splice(0, 4, ...this.activeTrack.shiftRegisterOctaveRange.map(octave => {
      return octave == 1 ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
    }));

    return row;
  }
}
