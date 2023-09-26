import { RampSegment } from "../ableton/ramp_sequence";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export type RampPressRange = {
  startIndex: number,
  endIndex: number
}


// Scale the grid row integers 0-15 to 0-1
export const RAMP_SEQ_RANGE_STEPS = [...new Array(16)].map((_, i) => i).map((step) => {
  return Math.round((((step - 0) / 15) * 1000)) / 1000;
});


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
    this.activeSegment = undefined;
    this.grid.clearGridDisplay();
    this.setGridRampSequenceDisplay();
  }


  setGridRampSequenceDisplay() {
    this.setGridSegmentDisplay();
    this.setGridSubdivisionDisplay();
    this.setGridRangeDisplay();
    this.grid.sequencer.daw.getActiveTrack().updateGuiRampSequence();
  }


  setGridSegmentDisplay() {
    const row = this.gridSegmentRow();
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

      gridPage.grid.sequencer.setRampSequence(gridPage.grid.sequencer.daw.getActiveTrack());
      gridPage.setGridRampSequenceDisplay();
      gridPage.grid.sequencer.daw.getActiveTrack().updateGuiRampSequence();
    }
  }


  updateSubdivision(gridPage: RampSequencePage, press: GridKeyPress) {
    if (press.s == 1) {
      const rampSequence = gridPage.grid.sequencer.daw.getActiveTrack().rampSequence;
      rampSequence.updateSubdivisionLength(gridPage.activeSegment.startIndex, press.x - gridPage.activeSegment.startIndex + 1);

      gridPage.grid.sequencer.setRampSequence(gridPage.grid.sequencer.daw.getActiveTrack());
      gridPage.setGridSubdivisionDisplay();
      gridPage.grid.sequencer.daw.getActiveTrack().updateGuiRampSequence();
    }
  }


  updateRange(gridPage: RampSequencePage, press: GridKeyPress) {
    // Button press
    if (press.s == 1) {

      gridPage.keyPressCount++;

      if (gridPage.keyPressCount == 1) {
        gridPage.rampPressRange = { startIndex: press.x, endIndex: undefined };
      } else {
        gridPage.rampPressRange.endIndex = press.x;
      }
    }
    // Button release (press.s = 0)
    else {

      gridPage.keyPressCount--;

      if (gridPage.keyPressCount == 0) {

        gridPage.grid.sequencer.daw.getActiveTrack().rampSequence.updateRange(
          gridPage.activeSegment.startIndex,
          RAMP_SEQ_RANGE_STEPS[gridPage.rampPressRange.startIndex],
          gridPage.rampPressRange.endIndex == undefined ?
          RAMP_SEQ_RANGE_STEPS[gridPage.rampPressRange.startIndex] :
          RAMP_SEQ_RANGE_STEPS[gridPage.rampPressRange.endIndex]
        );

        gridPage.grid.sequencer.setRampSequence(gridPage.grid.sequencer.daw.getActiveTrack());
        gridPage.setGridRangeDisplay();
        gridPage.grid.sequencer.daw.getActiveTrack().updateGuiRampSequence();
      }
    }
  }


  gridRangeRow(): number[] {
    if (this.activeSegment == undefined) return new Array(16).fill(0);

    let min: number, max: number;
    if (this.activeSegment.range.start <= this.activeSegment.range.end) {
      min = this.activeSegment.range.start;
      max = this.activeSegment.range.end;
    } else {
      min = this.activeSegment.range.end;
      max = this.activeSegment.range.start;
    }

    return RAMP_SEQ_RANGE_STEPS.map(step => step < min || step > max ? 0 : this.activeDivisionBrightness);
  }


  gridSubdivisionRow(): number[] {
    const segmentRow   = new Array(16).fill(0);
    const rampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequence;

    rampSequence.segments.forEach(segment => {
      for (let i = segment.startIndex; i < segment.startIndex + segment.subdivisionLength; i++) {
        segmentRow[i] = this.activeSegment && this.activeSegment.startIndex == segment.startIndex ?
        this.activeDivisionBrightness :
        this.inactiveDivisionBrightness
      }
    });

    return segmentRow;
  }


  gridSegmentRow(): number[] {
    const segmentRow   = new Array(16).fill(0);
    const rampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequence;

    rampSequence.segments.map(s => s.startIndex).forEach(index => {
      segmentRow[index] = this.activeSegment && this.activeSegment.startIndex == index ?
      this.activeDivisionBrightness :
      this.inactiveDivisionBrightness;
    });

    return segmentRow;
  }


  #inRange(x: number, start: number, end: number): boolean {
    let [min, max] = [start, end].sort((a, b) => a - b);
    return x >= min && x <= max;
  }
}
