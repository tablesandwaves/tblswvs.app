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
    const row = this.gridSubdivisionRow();
    this.grid.levelRow(0, 1, row.slice(0, 8));
    this.grid.levelRow(8, 1, row.slice(8, 16));
  }


  setGridRangeDisplay() {
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

      if (gridPage.keyPressCount == 1) {
        // gridPage.rampPressRange = { startIndex: press.x == 15 ? 16 : press.x, endIndex: undefined }
        gridPage.rampPressRange = { startIndex: press.x + 1, endIndex: undefined }
      } else {
        gridPage.rampPressRange.endIndex = press.x + 1;
      }
    }
    // Button Release (press.s = 0)
    else {

      gridPage.keyPressCount--;

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

        gridPage.setGridRangeDisplay();
      }
    }
  }


  gridRangeRow(): number[] {
    if (this.activeSegment == undefined || (this.activeSegment.range.start == 0 && this.activeSegment.range.end == 0)) {
      return new Array(16).fill(0);
    }

    let row = new Array(16).fill(0);
    return row.map((elem, i) => {
      if (this.#inRange((i + 1) / 16, this.activeSegment.range.start, this.activeSegment.range.end)) return this.activeDivisionBrightness;
      return 0;
    });
  }


  gridSubdivisionRow(): number[] {
    if (this.activeSegment == undefined || (this.activeSegment.range.start == 0 && this.activeSegment.range.end == 0)) {
      return new Array(16).fill(0);
    }

    const rampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequence;

    return rampSequence.segments.reduce((row, segment) => {
      return row.concat(
        this.activeSegment.startIndex == segment.startIndex ?
        new Array(segment.subdivisionLength).fill(this.activeDivisionBrightness) :
        new Array(segment.subdivisionLength).fill(this.inactiveDivisionBrightness)
      ).concat(
        new Array(segment.length - segment.subdivisionLength).fill(0)
      );
    }, new Array());
  }


  #inRange(x: number, start: number, end: number): boolean {
    let [min, max] = [start, end].sort();
    return x >= min && x <= max;
  }
}
