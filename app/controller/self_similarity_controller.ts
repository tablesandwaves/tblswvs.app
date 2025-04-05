import { ACTIVE_BRIGHTNESS, GridConfig, GridKeyPress } from "./application_controller";
import { InputNoteController } from "./input_note_controller";
import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";


export class SelfSimilarityController extends InputNoteController {
  type = "InputNotes";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setSelfSimilaryType", this.setSelfSimilaryType);
    this.functionMap.set("setEditableClip",     this.setEditableClip);
    this.functionMap.set("queueClipForLaunch",  this.queueClipForLaunch);
  }


  refresh() {
    super.refresh();
    this.grid.levelRow(8, 6, this.getGridSelfSimilarityTypeRow());
    super.setCurrentClipGridDisplay();
  }


  setSelfSimilaryType(gridPage: SelfSimilarityController, press: GridKeyPress) {
    gridPage.activeTrack.selfSimilarityType = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.levelRow(8, 6, gridPage.getGridSelfSimilarityTypeRow());
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
