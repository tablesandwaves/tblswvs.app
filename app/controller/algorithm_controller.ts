import { GridConfig, GridKeyPress, ApplicationController, INACTIVE_BRIGHTNESS, ACTIVE_BRIGHTNESS, HIGHLIGHT_BRIGHTNESS } from "./application_controller";
import { algorithmMapping } from "./input_note_controller";
import { MonomeGrid, pageTypeMap } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";


// export const algorithmButtonMap: Record<string, number> = {
//   "simple":          0,
//   "shift_reg":       1,
//   "inf_series":      2,
//   "self_similarity": 3
// }


// export class AlgorithmController extends ApplicationController {
//   type = "Algorithm";


//   constructor(config: GridConfig, grid: MonomeGrid) {
//     super(config, grid);
//     this.functionMap.set("setAlgorithm", this.setAlgorithm);
//     this.functionMap.set("advance", this.advance);
//     this.functionMap.set("setRhythmRepetitions", this.setRhythmRepetitions);
//   }


//   refresh() {
//     this.setGlobalAlgorithmControls();
//     this.setGridRhythmDisplay();
//   }


//   displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
//     this.setGridRhythmDisplay(highlightIndex);
//     this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
//   }


//   setGridRhythmDisplay(highlightIndex?: number) {
//     // Transport rows 1 (steps 1-16) and 2 (steps 17-32)
//     const transportRow = this.grid.shiftKey ? this.getRhythmStepLengthRow() : this.getRhythmGatesRow();
//     if (highlightIndex != undefined) transportRow[highlightIndex] = HIGHLIGHT_BRIGHTNESS;
//     this.grid.levelRow(0, 0, transportRow.slice(0, 8));
//     this.grid.levelRow(8, 0, transportRow.slice(8, 16));
//     this.grid.levelRow(0, 1, transportRow.slice(16, 24));
//     this.grid.levelRow(8, 1, transportRow.slice(24, 32));
//   }


//   setAlgorithm(gridPage: AlgorithmController, press: GridKeyPress) {
//     gridPage.activeTrack.algorithm = gridPage.matrix[press.y][press.x].value;
//     gridPage.grid.pageIndex = press.x;
//     gridPage.grid.setActiveGridPage(pageTypeMap[gridPage.type][gridPage.grid.pageIndex]);
//   }


//   setRhythmRepetitions(gridPage: AlgorithmController, press: GridKeyPress) {
//     gridPage.activeTrack.infinitySeriesRhythmRepetitions = press.x - 7;
//     gridPage.grid.levelRow(8, 2, gridPage.getRhythmRepetitionsRow());
//   }


//   // to be overridden by sub-classes
//   advance(gridPage: AlgorithmController, press: GridKeyPress) {
//     // console.log("AlgorithmController.advance()")
//   }


//   setGlobalAlgorithmControls() {
//     this.grid.levelRow(0, 6, this.getGridAlgorithmRow());
//   }


//   getGridAlgorithmRow() {
//     const algorithmRow = new Array(8).fill(INACTIVE_BRIGHTNESS);
//     algorithmRow[algorithmMapping[this.activeTrack.algorithm].button] = ACTIVE_BRIGHTNESS;
//     return algorithmRow;
//   }


//   getRhythmRepetitionsRow() {
//     return blank8x1Row.map((_, i) => i < this.activeTrack.infinitySeriesRhythmRepetitions ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
//   }
// }
