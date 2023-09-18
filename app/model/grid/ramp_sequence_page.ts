import { RampSegment, RampRange } from "../ableton/ramp_sequence";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export type RampPressRange = {
  startIndex: number,
  endIndex: number
}


export class RampSequencePage extends GridPage {
  type = "RampSequence";

  inactiveDivisionBrightness = 3;
  activeDivisionBrightness   = 12;
  keyReleaseFunctionality    = true;
  keyPressCount              = 0;
  oneSixteenth               = false;
  activeSegment: RampSegment;
  rampPressRange: RampPressRange;

  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateSegment", this.updateSegment);
    this.functionMap.set("updateSubdivision", this.updateSubdivision);
    this.functionMap.set("updateRange", this.updateRange);

    this.refresh();
  }


  refresh() {
    this.grid.clearGridDisplay();
    this.setGridRampSequenceDisplay();
  }


  setGridRampSequenceDisplay(highlightIndex?: number) {
    this.setGridRampSequenceTransportRowDisplay(highlightIndex);
    this.setGridSubdivisionDisplay();
    this.setGridRangeDisplay();
  }


  setGridRampSequenceTransportRowDisplay(highlightIndex?: number) {
    let row = this.grid.sequencer.daw.getActiveTrack().rampSequence.gridSegmentRow().map((sequenceStep: (0|1), i): number => {
      if (this.activeSegment && i == this.activeSegment.startIndex) return this.activeDivisionBrightness;
      return sequenceStep ? this.inactiveDivisionBrightness : 0;
    });

    if (highlightIndex != undefined) row[highlightIndex] = 15;

    this.grid.levelRow(0, 0, row.slice(0, 8));
    this.grid.levelRow(8, 0, row.slice(8, 16));
  }


  setGridSubdivisionDisplay() {
    let row;

    if (this.activeSegment == undefined) {
      row = new Array(16).fill(0);
    } else {
      const rampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequence;
      row = rampSequence.gridSubdivisionRow().map((sequenceStep: (0|1), i): number => {
        if (sequenceStep &&
          i >= this.activeSegment.startIndex &&
          i <  this.activeSegment.startIndex + this.activeSegment.length) {
            return this.activeDivisionBrightness;
          }

          return sequenceStep ? this.inactiveDivisionBrightness : 0;
      });
    }

    this.grid.levelRow(0, 1, row.slice(0, 8));
    this.grid.levelRow(8, 1, row.slice(8, 16));
  }


  setGridRangeDisplay() {
    // let row;

    // if (this.activeSegment == undefined) {
    //   row = new Array(16).fill(0);
    // } else {
    //   const rampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequence;
    //   row = rampSequence.gridRangeRow(this.activeSegment.startIndex).map((sequenceStep: (0|1)) => {
    //     return sequenceStep ? this.activeDivisionBrightness : 0;
    //   });
    // }
    const row = this.gridRangeRow();

    this.grid.levelRow(0, 2, row.slice(0, 8));
    this.grid.levelRow(8, 2, row.slice(8, 16));
  }


  displayRhythmWithTransport(highlightIndex: number) {
    this.setGridRampSequenceTransportRowDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex);
  }


  updateSegment(gridPage: RampSequencePage, press: GridKeyPress) {
    if (press.s == 1) {
      const rampSequence = gridPage.grid.sequencer.daw.getActiveTrack().rampSequence;
      const selectedSegment = rampSequence.segments.find(s => s.startIndex == press.x);

      // Remove the active segment
      if (selectedSegment && gridPage.activeSegment && selectedSegment.startIndex == gridPage.activeSegment.startIndex) {
        rampSequence.removeSegment(gridPage.activeSegment.startIndex);
        gridPage.activeSegment = undefined;
      }
      // Select an another segment
      else if (selectedSegment) {
        gridPage.activeSegment = selectedSegment;
      }
      // Add a segment
      else {
        gridPage.activeSegment = rampSequence.addSegment(press.x);
      }

      gridPage.refresh();
    }
  }


  updateSubdivision(gridPage: RampSequencePage, press: GridKeyPress) {
    if (press.s == 1) {
      const rampSequence = gridPage.grid.sequencer.daw.getActiveTrack().rampSequence;
      rampSequence.updateSubdivisionLength(gridPage.activeSegment.startIndex, press.x - gridPage.activeSegment.startIndex + 1);
      gridPage.setGridSubdivisionDisplay();
    }
  }


  updateRange(gridPage: RampSequencePage, press: GridKeyPress) {
    // Button Press
    if (press.s == 1) {

      gridPage.keyPressCount++;

      console.log("press", press.x, "keyPressCount", gridPage.keyPressCount);

      if (gridPage.keyPressCount == 1) {
        // gridPage.rampPressRange = { startIndex: press.x == 15 ? 16 : press.x, endIndex: undefined }
        gridPage.rampPressRange = { startIndex: press.x + 1, endIndex: undefined }
      } else {
        gridPage.rampPressRange.endIndex = press.x + 1;
      }

      console.log(gridPage.rampPressRange)
    }
    // Button Release (press.s = 0)
    else {

      gridPage.keyPressCount--;

      console.log("release", press.x, "keyPressCount", gridPage.keyPressCount);

      // If all buttons are released, flush the cached rampPressRange to the active segment.
      if (gridPage.keyPressCount == 0) {

        // Special Case: zeroing out the range
        if (gridPage.rampPressRange.startIndex == 1 &&
            gridPage.rampPressRange.endIndex   == undefined &&
            gridPage.activeSegment.range.start == 0.0625 &&
            gridPage.activeSegment.range.end   == 0.0625) {
          gridPage.rampPressRange.startIndex = 0;
          gridPage.rampPressRange.endIndex   = 0;
        }

        // Special Case: extending down to zero
        if (gridPage.rampPressRange.startIndex == 1 &&
            gridPage.rampPressRange.endIndex != 1 &&
            gridPage.rampPressRange.endIndex != undefined) {
          gridPage.rampPressRange.startIndex = 0;
        }

        gridPage.grid.sequencer.daw.getActiveTrack().rampSequence.updateRange(
          gridPage.activeSegment.startIndex,
          gridPage.rampPressRange.startIndex / 16,
          gridPage.rampPressRange.endIndex == undefined ? gridPage.rampPressRange.startIndex / 16 : gridPage.rampPressRange.endIndex / 16
        );
        // console.log(gridPage.grid.sequencer.daw.getActiveTrack().rampSequence.segments[0])
        // console.log(gridPage.grid.sequencer.daw.getActiveTrack().rampSequence.gridRangeRow(gridPage.activeSegment.startIndex))
        // console.log("Flush to Live")
        gridPage.setGridRangeDisplay();
      }
    }
  }


  gridRangeRow(): number[] {
    if (this.rampPressRange == undefined || (this.rampPressRange.startIndex == 0 && this.rampPressRange.endIndex == 0)) {
      return new Array(16).fill(0);
    }

    const start = this.rampPressRange.startIndex / 16;
    const end   = this.rampPressRange.endIndex ? this.rampPressRange.endIndex / 16 : this.rampPressRange.startIndex / 16;

    let row = new Array(16).fill(0);
    return row.map((elem, i) => {
      if (this.#inRange((i + 1) / 16, start, end)) return this.activeDivisionBrightness;
      return 0;
    });
  }


  #inRange(x: number, start: number, end: number): boolean {
    let [min, max] = [start, end].sort();
    return x >= min && x <= max;
  }
}
