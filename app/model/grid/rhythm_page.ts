import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { noteLengthMap } from "../ableton/note";
import { blank8x8Row } from "../../helpers/utils";
import { RhythmStep } from "../ableton/track";


export class RhythmPage extends GridPage {
  type = "Rhythm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.functionMap.set("updateRhythm", this.updateRhythm);
    this.functionMap.set("updateNoteLength", this.updateNoteLength);
    this.functionMap.set("updateBeatLength", this.updateBeatLength);
  }


  refresh() {
    this.grid.clearGridDisplay();
    this.setGridRhythmDisplay();
  }


  updateBeatLength(gridPage: RhythmPage, press: GridKeyPress) {
    gridPage.grid.sequencer.getActiveTrack().beatLength = press.x + 1;
    gridPage.grid.sequencer.refreshAbleton(false);
    gridPage.setGridRhythmDisplay();
    gridPage.updateGuiRhythmDisplay();
  }


  updateRhythm(gridPage: RhythmPage, press: GridKeyPress) {
    gridPage.grid.sequencer.getActiveTrack().rhythm[press.x].state = 1 - gridPage.grid.sequencer.getActiveTrack().rhythm[press.x].state;
    gridPage.grid.sequencer.getActiveTrack().rhythm[press.x].probability = gridPage.grid.sequencer.getActiveTrack().defaultProbability;
    gridPage.setGridRhythmDisplay();
    gridPage.updateGuiRhythmDisplay();

    gridPage.grid.sequencer.refreshAbleton(false);
  }


  updateNoteLength(gridPage: RhythmPage, press: GridKeyPress) {
    gridPage.grid.sequencer.getActiveTrack().noteLength = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.levelRow(0, 6, gridPage.#noteLengthRow());
    gridPage.grid.sequencer.gui.webContents.send("update-note-length", gridPage.grid.sequencer.getActiveTrack().noteLength);
  }


  displayRhythmWithTransport(highlightIndex: number) {
    this.setGridRhythmDisplay(highlightIndex);
    this.updateGuiRhythmTransport(highlightIndex);
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    let row;
    if (this.grid.shiftKey) {
      const beatLength = this.grid.sequencer.getActiveTrack().beatLength;
      row = [...new Array(beatLength).fill(5), ...new Array(16 - beatLength).fill(0)];
    } else {
      row = this.grid.sequencer.getActiveTrack().rhythm.map((rhythmStep: RhythmStep, i) => {
        return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * 15) : 0;
      });
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
