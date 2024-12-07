import { RampSegment, RAMP_SEQ_RANGE_STEPS } from "../model/ableton/ramp_sequence";
import { GridConfig, GridKeyPress, ApplicationController, ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";


export type RampPressRange = {
  startIndex: number,
  endIndex: number
}


export class RampSequenceController extends ApplicationController {
  type = "RampSequence";

  inactiveDivisionBrightness = 3;
  activeDivisionBrightness   = 12;
  keyPressCount              = 0;

  activeSegment: RampSegment;
  rampPressRange: RampPressRange;

  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateSegment", this.updateSegment);
    this.functionMap.set("updateSubdivision", this.updateSubdivision);
    this.functionMap.set("updateRange", this.updateRange);
    this.functionMap.set("updateActiveRampSequenceIndex", this.updateActiveRampSequenceIndex);
    this.functionMap.set("toggleRampSequence", this.toggleRampSequence);
    this.functionMap.set("generateRandomSteps", this.generateRandomSteps);
  }


  refresh() {
    this.activeSegment = undefined;
    this.setGridRampSequenceDisplay();
  }


  setGridRampSequenceDisplay() {
    this.setGridSegmentDisplay();
    this.setGridSubdivisionDisplay();
    this.setGridRangeDisplay();
    this.setGridRampGlobalsDisplay();
    this.activeTrack.updateGuiRampSequence();
  }


  setGridSegmentDisplay() {
    if (!this.activeTrack.hasRampSequencers) return;

    const row = this.gridSegmentRow();
    this.grid.levelRow(0, 0, row.slice(0, 8));
    this.grid.levelRow(8, 0, row.slice(8, 16));
  }


  setGridSubdivisionDisplay() {
    if (!this.activeTrack.hasRampSequencers) return;

    const row = this.gridSubdivisionRow();
    this.grid.levelRow(0, 1, row.slice(0, 8));
    this.grid.levelRow(8, 1, row.slice(8, 16));
  }


  setGridRangeDisplay() {
    if (!this.activeTrack.hasRampSequencers) return;

    const row = this.gridRangeRow();
    this.grid.levelRow(0, 2, row.slice(0, 8));
    this.grid.levelRow(8, 2, row.slice(8, 16));
  }


  setGridRampGlobalsDisplay() {
    if (!this.activeTrack.hasRampSequencers) return;

    const row = this.gridRampSequenceGlobalsRow();
    this.grid.levelRow(0, 6, row);
  }


  updateActiveRampSequenceIndex(gridPage: RampSequenceController, press: GridKeyPress) {
    if (!gridPage.activeTrack.hasRampSequencers) return;
    if (press.s == 1) {
      gridPage.activeSegment = undefined;
      gridPage.activeTrack.editableRampSequence = press.x == 0 ? 0 : 1;
      gridPage.setGridRampSequenceDisplay();
    }
  }


  toggleRampSequence(gridPage: RampSequenceController, press: GridKeyPress) {
    if (!gridPage.activeTrack.hasRampSequencers) return;
    if (press.s == 1) {
      const rampSequence = gridPage.activeTrack.getEditableRampSequence();
      rampSequence.active = !rampSequence.active;

      if (rampSequence.active) {
        gridPage.grid.sequencer.activateRampSequence(gridPage.activeTrack);
      } else {
        gridPage.grid.sequencer.clearRampSequence(gridPage.activeTrack);
      }
      gridPage.setGridRampGlobalsDisplay();
    }
  }


  generateRandomSteps(gridPage: RampSequenceController, press: GridKeyPress) {
    if (!gridPage.activeTrack.hasRampSequencers) return;
    if (press.s == 1) {
      gridPage.activeTrack.getEditableRampSequence().generateRandomSteps();
      gridPage.grid.sequencer.setRampSequence(gridPage.activeTrack);
      gridPage.refresh();
    }
  }


  updateSegment(gridPage: RampSequenceController, press: GridKeyPress) {
    if (!gridPage.activeTrack.hasRampSequencers) return;
    if (press.s == 1) {

      const rampSequence = gridPage.activeTrack.getEditableRampSequence();
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

      gridPage.grid.sequencer.setRampSequence(gridPage.activeTrack);
      gridPage.setGridRampSequenceDisplay();
      gridPage.activeTrack.updateGuiRampSequence();
    }
  }


  updateSubdivision(gridPage: RampSequenceController, press: GridKeyPress) {
    if (!gridPage.activeTrack.hasRampSequencers) return;
    if (!gridPage.activeSegment || press.s != 1) return;

    const rampSequence = gridPage.activeTrack.getEditableRampSequence();
    rampSequence.updateSubdivisionLength(gridPage.activeSegment.startIndex, press.x - gridPage.activeSegment.startIndex + 1);

    gridPage.grid.sequencer.setRampSequence(gridPage.activeTrack);
    gridPage.setGridSubdivisionDisplay();
    gridPage.activeTrack.updateGuiRampSequence();
  }


  updateRange(gridPage: RampSequenceController, press: GridKeyPress) {
    if (!gridPage.activeTrack.hasRampSequencers) return;
    if (!gridPage.activeSegment) return;

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

        const rampSequence = gridPage.activeTrack.getEditableRampSequence();

        rampSequence.updateRange(
          gridPage.activeSegment.startIndex,
          RAMP_SEQ_RANGE_STEPS[gridPage.rampPressRange.startIndex],
          gridPage.rampPressRange.endIndex == undefined ?
            RAMP_SEQ_RANGE_STEPS[gridPage.rampPressRange.startIndex] :
            RAMP_SEQ_RANGE_STEPS[gridPage.rampPressRange.endIndex]
        );

        gridPage.grid.sequencer.setRampSequence(gridPage.activeTrack);
        gridPage.setGridRangeDisplay();
        gridPage.setGridRampGlobalsDisplay();
        gridPage.activeTrack.updateGuiRampSequence();
      }
    }
  }


  gridRangeRow(): number[] {
    if (this.activeSegment == undefined) return new Array(16).fill(INACTIVE_BRIGHTNESS);

    let min: number, max: number;
    if (this.activeSegment.range.start <= this.activeSegment.range.end) {
      min = this.activeSegment.range.start;
      max = this.activeSegment.range.end;
    } else {
      min = this.activeSegment.range.end;
      max = this.activeSegment.range.start;
    }

    return RAMP_SEQ_RANGE_STEPS.map(step => step < min || step > max ? INACTIVE_BRIGHTNESS : this.activeDivisionBrightness);
  }


  gridSubdivisionRow(): number[] {
    if (!this.activeTrack.hasRampSequencers) return new Array(16).fill(INACTIVE_BRIGHTNESS);

    const segmentRow   = new Array(16).fill(INACTIVE_BRIGHTNESS);
    const rampSequence = this.activeTrack.getEditableRampSequence();

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
    if (!this.activeTrack.hasRampSequencers) return new Array(16).fill(INACTIVE_BRIGHTNESS);

    const segmentRow   = new Array(16).fill(INACTIVE_BRIGHTNESS);
    const rampSequence = this.activeTrack.getEditableRampSequence();

    rampSequence.segments.map(s => s.startIndex).forEach(index => {
      segmentRow[index] = this.activeSegment && this.activeSegment.startIndex == index ?
      this.activeDivisionBrightness :
      this.inactiveDivisionBrightness;
    });

    return segmentRow;
  }


  gridRampSequenceGlobalsRow(): number[] {
    const row = new Array(8).fill(INACTIVE_BRIGHTNESS);

    // Select which of the current track's 2 ramp sequences are being edited.
    row[this.activeTrack.editableRampSequence] = ACTIVE_BRIGHTNESS;

    // Is the active ramp seqeunce active (is the corresponding Live device macro mapped)?
    row[2] = this.activeTrack.getEditableRampSequence().active ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;

    // Is the current segment low-to-high? If yes, light up column 3
    if (this.activeSegment) {
      row[3] = this.activeSegment.range.start > this.activeSegment.range.end ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
    }

    return row;
  }
}
