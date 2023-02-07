import { Key, Scale } from "tblswvs";
import { MonomeGrid } from "./monome_grid";
import { ConfiguredScale, GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { Track } from "./track";


// Hack
const scaleMap: Record<string, Scale> = {
  "Ionian": Scale.Ionian,
  "Dorian": Scale.Dorian,
  "Phrygian": Scale.Phrygian,
  "Lydian": Scale.Lydian,
  "Mixolydian": Scale.Mixolydian,
  "Aeolian": Scale.Aeolian,
  "Locrian": Scale.Locrian,
  "Major": Scale.Major,
  "Minor": Scale.Minor,
  "MajPentatonic": Scale.MajPentatonic,
  "MinPentatonic": Scale.MinPentatonic,
  "WholeTone": Scale.WholeTone,
  "Chromatic": Scale.Chromatic,
  "GS": Scale.GS
}


export class GridMelody extends GridPage {

  constructor(config: GridConfig, track: Track, grid: MonomeGrid) {
    super(config, grid, track);

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
    gridPage.grid.sequencer.key = new Key(60, scaleMap[scale.name]);
  }


  refresh() {}


  // Should be overridden by any subclasses extending GridPage
  setDisplay(...args: any[]) {}

}
