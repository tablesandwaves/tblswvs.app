import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress, INACTIVE_BRIGHTNESS } from "./application_controller";
import { InputNoteController } from "./input_note_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";


export class SelfSimilarityController extends InputNoteController {
  type = "InputNotes";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setSelfSimilaryType", this.setSelfSimilaryType);
  }


  refresh() {
    super.setGridRhythmGatesDisplay();
    super.setGlobalAlgorithmControls();
    this.grid.levelRow(8, 6, this.getGridSelfSimilarityTypeRow());
  }


  setSelfSimilaryType(gridPage: SelfSimilarityController, press: GridKeyPress) {
    gridPage.activeTrack.selfSimilarityType = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.levelRow(8, 6, gridPage.getGridSelfSimilarityTypeRow());
  }


  advance(gridPage: SelfSimilarityController, press: GridKeyPress) {
    // TODO: this should operate on the track's current notes, not the sequencer's queued progression
    gridPage.activeTrack.setInputNotes(gridPage.grid.sequencer.queuedNotes);
    gridPage.activeTrack.generateOutputNotes();
    gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    gridPage.activeTrack.setGuiInputNotes();
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
