import { Key, Scale } from "tblswvs";
import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { Track } from "./track";


export type ConfiguredScale = {
  name: keyof typeof Scale,
  mode?: string
}


export class GridMelody extends GridPage {
  scales: ConfiguredScale[];


  constructor(config: GridConfig, track: Track, grid: MonomeGrid) {
    super(config, grid, track);
    this.scales = config.scales;

    this.functionMap.set("addNote", this.addNote);
    this.functionMap.set("setScale", this.setScale);
  }


  keyPress(press: GridKeyPress) {
    if (press.s == 1) {
      this.functionMap.get(this.matrix[press.y][press.x].mapping)(this, press);
    }
  }


  addNote(gridPage: GridMelody, press: GridKeyPress) {
  }


  setScale(gridPage: GridMelody, press: GridKeyPress) {
    let scale: ConfiguredScale = gridPage.scales[gridPage.matrix[press.y][press.x].value];
    gridPage.grid.sequencer.key = new Key(60, Scale[scale.name]);
  }


  refresh() {}


  // Should be overridden by any subclasses extending GridPage
  setDisplay(...args: any[]) {}

}
