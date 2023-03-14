import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class ChordPage extends GridPage {
  type = "Chord";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("addChordNote", this.addChordNote);

    this.grid.clearGridDisplay();
    this.setUiTrackChordProgression();
  }


  addChordNote(gridPage: ChordPage, press: GridKeyPress) {

  }


  setUiTrackChordProgression() {

  }
}
