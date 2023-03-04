import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { noteLengthMap } from "../ableton/note";
import { blank8x8Row } from "../../helpers/utils";


export class GridRhythm extends GridPage {

  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateRhythm", this.updateRhythm);
    this.functionMap.set("updateNoteLength", this.updateNoteLength);
    this.functionMap.set("updateBeatLength", this.updateBeatLength);
  }


  refresh() {
    this.grid.clearGridDisplay();
    this.setGridRhythmDisplay();
    this.setGuiRhythmDisplay();
  }


  toggleShiftState() {
    this.setGridRhythmDisplay();
  }


  updateBeatLength(gridPage: GridRhythm, press: GridKeyPress) {
    gridPage.grid.sequencer.getActiveTrack().beatLength = press.x + 1;
    gridPage.grid.sequencer.refreshAbleton(false);
    gridPage.setGridRhythmDisplay();
    gridPage.setGuiRhythmDisplay();
  }


  updateRhythm(gridPage: GridRhythm, press: GridKeyPress) {
    gridPage.grid.sequencer.getActiveTrack().rhythm[press.x] = 1 - gridPage.grid.sequencer.getActiveTrack().rhythm[press.x];
    gridPage.setGridRhythmDisplay();
    gridPage.setGuiRhythmDisplay();

    gridPage.grid.sequencer.refreshAbleton(false);
  }


  updateNoteLength(gridPage: GridRhythm, press: GridKeyPress) {
    gridPage.grid.sequencer.getActiveTrack().noteLength = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.levelRow(0, 6, gridPage.#noteLengthRow());
    gridPage.grid.sequencer.gui.webContents.send("update-note-length", gridPage.grid.sequencer.getActiveTrack().noteLength);
  }


  displayRhythmWithTransport(highlightIndex: number) {
    this.setGuiRhythmDisplay(highlightIndex);
    this.setGridRhythmDisplay(highlightIndex);
  }


  setGuiRhythmDisplay(highlightIndex?: number) {
    const beatLength = this.grid.sequencer.getActiveTrack().beatLength;
    const row = this.grid.sequencer.getActiveTrack().rhythm.map((step: number, i) => {
      if (i >= beatLength)
        return null;
      else if (i == highlightIndex)
        return 15;
      else if (step == 1)
        return 10;
      else
        return 0;
    });
    this.grid.sequencer.gui.webContents.send("transport", row);
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    let row;
    if (this.grid.shiftKey) {
      const beatLength = this.grid.sequencer.getActiveTrack().beatLength;
      row = [...new Array(beatLength).fill(5), ...new Array(16 - beatLength).fill(0)];
    } else {
      row = this.grid.sequencer.getActiveTrack().rhythm.map((step: number, i) => step == 1 ? 10 : 0);
    }
    if (highlightIndex != undefined) row[highlightIndex] = 15;

    this.grid.levelRow(0, 0, row.slice(0, 8));
    this.grid.levelRow(8, 0, row.slice(8, 16));
    this.grid.levelRow(0, 6, this.#noteLengthRow());
  }


  #noteLengthRow(): number[] {
    let row = blank8x8Row.slice();
    row[noteLengthMap[this.grid.sequencer.getActiveTrack().noteLength].index] = 10;
    return row;
  }
}
