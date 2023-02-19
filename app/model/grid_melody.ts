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

    this.setGridScaleDisplay();
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

    gridPage.setGridScaleDisplay()
    gridPage.grid.sequencer.gui.webContents.send("set-scale", scale.name);
  }


  setGridScaleDisplay() {
    const scaleIndex = this.getCurrentScaleIndex();

    for (let i = 0, y = 0; y < 3; y++)
      for (let x = 0; x < 4; x++, i++)
        this.grid.levelSet(x + 12, y, (i == scaleIndex ? 10 : 0));
  }


  getCurrentScaleIndex(): number {
    return this.scales.reduce((idx, s, i) => {
      if (s.name == this.grid.sequencer.key.scaleName) idx = i;
      return idx;
    }, -1);
  }


  refresh() {}


  // Should be overridden by any subclasses extending GridPage
  setDisplay(...args: any[]) {}

}
