import { Key, Scale } from "tblswvs";
import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { Track } from "./track";
import { notes } from "../helpers/utils";


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
    this.functionMap.set("setScale", this.setScaleOrTonic);

    this.setGridScaleOrTonicDisplay();
  }


  keyPress(press: GridKeyPress) {
    if (press.s == 1) {
      this.functionMap.get(this.matrix[press.y][press.x].mapping)(this, press);
    }
  }


  addNote(gridPage: GridMelody, press: GridKeyPress) {
  }


  setScaleOrTonic(gridPage: GridMelody, press: GridKeyPress) {
    let tonic: number, scale: ConfiguredScale;
    if (gridPage.grid.shiftKey) {
      tonic = gridPage.matrix[press.y][press.x].value + 60;
      scale = {name: gridPage.grid.sequencer.key.scaleName} as ConfiguredScale;
    } else {
      tonic = gridPage.grid.sequencer.key.midiTonic;
      scale = gridPage.scales[gridPage.matrix[press.y][press.x].value];
    }
    gridPage.grid.sequencer.key = new Key(tonic, Scale[scale.name]);
    gridPage.setGridScaleOrTonicDisplay()
    gridPage.grid.sequencer.gui.webContents.send("set-scale", `${notes[tonic % 12]} ${scale.name}`);
  }


  setGridScaleOrTonicDisplay() {
    const index = this.grid.shiftKey ? this.getCurrentTonicIndex() : this.getCurrentScaleIndex();

    for (let i = 0, y = 0; y < 3; y++)
      for (let x = 0; x < 4; x++, i++)
        this.grid.levelSet(x + 12, y, (i == index ? 10 : 0));
  }


  getCurrentTonicIndex(): number {
    return this.grid.sequencer.key.midiTonic % 12;
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


  shiftDisplay() {
    this.setGridScaleOrTonicDisplay();
  }

}
