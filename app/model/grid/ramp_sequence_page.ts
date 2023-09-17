import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class RampSequencePage extends GridPage {
  type = "RampSequence";

  inactiveDivisionBrightness = 5;
  activeDivisionBrightness   = 10;

  // The absolute index of the currently active outer step in the ramp sequence.
  activeOuterAbsoluteIndex:   number = undefined;
  // The sequential index of the currently active outer step in the ramp sequence.
  activeOuterSequentialIndex: number = undefined;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateOuterDivision", this.updateOuterDivision);
    this.functionMap.set("updateInnerDivision", this.updateInnerDivision);
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
    let row = this.grid.sequencer.daw.getActiveTrack().rampSequenceOuter.map((sequenceStep: (0|1), i): number => {
      if (i == this.activeOuterAbsoluteIndex) return this.activeDivisionBrightness;
      return sequenceStep ? this.inactiveDivisionBrightness : 0;
    });
    if (highlightIndex != undefined) row[highlightIndex] = 15;

    this.grid.levelRow(0, 0, row.slice(0, 8));
    this.grid.levelRow(8, 0, row.slice(8, 16));
  }


  setGridRampSequenceInnerDivDisplay() {
    let row = this.grid.sequencer.daw.getActiveTrack().rampSequenceInner.map((sequenceStep: (0|1), i): number => {
      if (sequenceStep == 1 &&
        i >= this.activeOuterAbsoluteIndex &&
        i <= this.#activeOuterDivLength() + this.activeOuterAbsoluteIndex) {
        return this.activeDivisionBrightness;
      }

      return sequenceStep ? this.inactiveDivisionBrightness : 0;
    });

    this.grid.levelRow(0, 1, row.slice(0, 8));
    this.grid.levelRow(8, 1, row.slice(8, 16));
  }


  // Consider this a cached property on the class, so it does not need to be computed so frequently.
  #activeOuterDivLength(): number {
    let length = 1;
    for (let i = this.activeOuterAbsoluteIndex + 1; i < this.grid.sequencer.daw.getActiveTrack().rampSequenceInner.length; i++, length++) {
      if (this.grid.sequencer.daw.getActiveTrack().rampSequenceInner[i] == 1) break;
    }
    return length;
  }


  setGridRampSequenceRangeDisplay() {
    if (this.activeOuterSequentialIndex == undefined) return;

    const range = this.grid.sequencer.daw.getActiveTrack().rampSequenceRanges[this.activeOuterSequentialIndex];
    const row   = [...new Array(16)].map((e, i) => {
      if (i / 16 >= range[0] && i / 16 <= range[1]) return this.activeDivisionBrightness;
      return 0;
    });

    this.grid.levelRow(0, 2, row.slice(0, 8));
    this.grid.levelRow(8, 2, row.slice(8, 16));
  }


  displayRhythmWithTransport(highlightIndex: number) {
    this.setGridRampSequenceTransportRowDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex);
  }


  updateOuterDivision(gridPage: RampSequencePage, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.getActiveTrack();

    // Removing the active division
    if (gridPage.activeOuterAbsoluteIndex != undefined && press.x == gridPage.activeOuterAbsoluteIndex) {
      track.rampSequenceOuter[press.x] = 0;
      track.rampSequenceRanges.splice(gridPage.#absoluteToSequentialOuterIndex(press.x), 1);

      gridPage.activeOuterAbsoluteIndex   = undefined;
      gridPage.activeOuterSequentialIndex = undefined;
    }
    // Selecting an existing division
    else if (track.rampSequenceOuter[press.x] == 1) {
      gridPage.activeOuterAbsoluteIndex   = press.x;
      gridPage.activeOuterSequentialIndex = gridPage.#absoluteToSequentialOuterIndex(press.x);
    }
    // Adding a outer division
    else {
      track.rampSequenceOuter[press.x] = 1;
      const sequentialIndex = gridPage.#absoluteToSequentialOuterIndex(press.x);
      track.rampSequenceRanges.splice(sequentialIndex, 0, [0, 1]);

      gridPage.activeOuterAbsoluteIndex   = press.x;
      gridPage.activeOuterSequentialIndex = sequentialIndex;
    }

    gridPage.refresh();
  }


  #nextOuterStepIndex(absoluteIndex: number): (number|undefined) {
    let nextStepIndex = undefined;

    const outerRampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequenceOuter;
    for (let i = absoluteIndex + 1; i < outerRampSequence.length; i++) {
      if (outerRampSequence[i] == 1) {
        nextStepIndex = i;
        break;
      }
    }

    return nextStepIndex;
  }


  #absoluteToSequentialOuterIndex(absoluteIndex: number): number {
    let sequentialIndex = 0;

    const outerRampSequence = this.grid.sequencer.daw.getActiveTrack().rampSequenceOuter;
    for (let i = 0; i < outerRampSequence.length; i++) {
      if (i == absoluteIndex) break;
      if (outerRampSequence[i] == 1) sequentialIndex++;
    }

    return sequentialIndex;
  }


  updateInnerDivision() {

  }


  updateRange() {

  }
}
