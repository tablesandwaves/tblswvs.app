import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { AlgorithmController } from "./algorithm_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row, scaleToRange } from "../helpers/utils";


const OCTAVE_RANGE_OFFSETS = [-2, -1, 0, 1];


export class ShiftRegisterController extends AlgorithmController {
  type                        = "Algorithm";
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


  advance(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 0) return;

    const track = gridPage.grid.sequencer.daw.getActiveTrack();

    let stepCount = 0;
    for (let i = 0; i < gridPage.grid.sequencer.superMeasure * 16; i++)
      stepCount += track.rhythm[i % track.rhythmStepLength].state;
    const shiftRegisterSequence = [...new Array(stepCount)].map(_ => track.shiftRegister.step());

    const scaleDegrees     = gridPage.grid.sequencer.key.scaleNotes.map((_, j) => j + 1);
    const scaleDegreeRange = track.shiftRegisterOctaveRange.reduce((accum, octaveRange, i) => {
      if (octaveRange == 1) {
        let offset = OCTAVE_RANGE_OFFSETS[i] * scaleDegrees.length;
        if (offset >= 0) offset++;
        for (let degree = offset; degree < offset + scaleDegrees.length; degree++) {
          accum.push(degree);
        }
      }
      return accum;
    }, new Array());

    gridPage.grid.sequencer.daw.getActiveTrack().inputMelody = shiftRegisterSequence.map(step => {
      const scaleDegIndex = Math.floor(scaleToRange(step, [0, 1], [0, scaleDegreeRange.length - 1]));
      const scaleDeg      = scaleDegreeRange[scaleDegIndex];
      return gridPage.grid.sequencer.key.degree(scaleDeg);
    });

    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiTrackNotes();
  }


  setShiftRegisterLength(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 0) return;

    const track = gridPage.grid.sequencer.daw.getActiveTrack();
    track.shiftRegister.length = press.x + 1;
    gridPage.grid.levelRow(0, 2, gridPage.getShiftRegisterLengthRow());
  }


  setShiftRegisterChance(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 0) return;

    const track = gridPage.grid.sequencer.daw.getActiveTrack();
    track.shiftRegister.chance = (press.x + 1) / 8;
    gridPage.grid.levelRow(0, 3, gridPage.getShiftRegisterChanceRow());
  }


  setOctaveRange(gridPage: ShiftRegisterController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.keyPressCount++;
      gridPage.activeGates.push(press);
    } else {
      gridPage.keyPressCount--;

      if (gridPage.keyPressCount == 0) {
        const track = gridPage.grid.sequencer.daw.getActiveTrack();

        const octaveRangeIndices = gridPage.activeGates.map(press => press.x % 8).sort((a, b) => a - b);
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
    this.grid.levelRow(0, 3, this.getShiftRegisterChanceRow());
  }


  getShiftRegisterLengthRow() {
    const track = this.grid.sequencer.daw.getActiveTrack();
    return new Array(track.shiftRegister.length)
                .fill(ACTIVE_BRIGHTNESS)
                .concat(new Array(8 - track.shiftRegister.length).fill(INACTIVE_BRIGHTNESS));
  }


  getShiftRegisterChanceRow() {
    const track = this.grid.sequencer.daw.getActiveTrack();
    return new Array(track.shiftRegister.chance * 8)
                .fill(ACTIVE_BRIGHTNESS)
                .concat(new Array(8 - (track.shiftRegister.chance * 8)).fill(INACTIVE_BRIGHTNESS));
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
