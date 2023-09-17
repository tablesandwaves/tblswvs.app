import { RampSegment } from "../ableton/ramp_sequence";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class RampSequencePage extends GridPage {
  type = "RampSequence";

  inactiveDivisionBrightness = 3;
  activeDivisionBrightness   = 12;
  activeSegment: RampSegment;


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
    this.setGridRampSequenceInnerDivDisplay();
    this.setGridRampSequenceRangeDisplay();
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


  setGridRampSequenceInnerDivDisplay() {
    const rampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequence;
    let row = rampSequence.gridSubdivisionRow().map((sequenceStep: (0|1), i): number => {
      if (sequenceStep &&
        i >= this.activeSegment.startIndex &&
        i <  this.activeSegment.startIndex + this.activeSegment.length) {
          return this.activeDivisionBrightness;
        }

        return sequenceStep ? this.inactiveDivisionBrightness : 0;
    });


    this.grid.levelRow(0, 1, row.slice(0, 8));
    this.grid.levelRow(8, 1, row.slice(8, 16));
  }


  setGridRampSequenceRangeDisplay() {
    let row;

    if (this.activeSegment == undefined) {
      row = new Array(16).fill(0);
    } else {
      const rampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequence;
      row = rampSequence.gridRangeRow(this.activeSegment.startIndex).map((sequenceStep: (0|1)) => {
        return sequenceStep ? this.activeDivisionBrightness : 0;
      });
    }

    this.grid.levelRow(0, 2, row.slice(0, 8));
    this.grid.levelRow(8, 2, row.slice(8, 16));
  }


  displayRhythmWithTransport(highlightIndex: number) {
    this.setGridRampSequenceTransportRowDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex);
  }


  updateSegment(gridPage: RampSequencePage, press: GridKeyPress) {
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


  updateSubdivision() {

  }


  updateRange() {

  }
}
