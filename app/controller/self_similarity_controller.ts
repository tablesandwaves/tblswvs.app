import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { AlgorithmController } from "./algorithm_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";


export class SelfSimilarityController extends AlgorithmController {
  type = "Algorithm";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setSelfSimilaryType", this.setSelfSimilaryType);
  }


  refresh() {
    this.setGridSelfSimilarityDisplay();
  }


  setSelfSimilaryType(gridPage: SelfSimilarityController, press: GridKeyPress) {
    gridPage.activeTrack.selfSimilarityType = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.levelRow(0, 2, gridPage.getGridSelfSimilarityTypeRow());
  }


  advance(gridPage: SelfSimilarityController, press: GridKeyPress) {
    gridPage.activeTrack.inputMelody = gridPage.grid.sequencer.queuedMelody;
    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.activeTrack.updateGuiTrackNotes();
  }


  setGridSelfSimilarityDisplay() {
    super.setGlobalAlgorithmControls();
    super.getRhythmRepetitionsRow();
    this.grid.levelRow(0, 2, this.getGridSelfSimilarityTypeRow());
  }


  getGridSelfSimilarityTypeRow() {
    const row = blank8x1Row.slice();

    switch (this.activeTrack.selfSimilarityType) {
      case "self_replicate":
        row[0] = ACTIVE_BRIGHTNESS;
        break;
      case "counted":
        row[1] = ACTIVE_BRIGHTNESS;
        break;
      case "zig_zag":
        row[2] = ACTIVE_BRIGHTNESS;
        break;
    }

    return row;
  }
}
