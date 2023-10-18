import { Key, Scale } from "tblswvs";
import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";
import { notes } from "../../helpers/utils";


const configuredScales: Record<string, {scale: Scale, index: number}> = {
  "Major":         {scale: Scale.Major,         index: 0},
  "Minor":         {scale: Scale.Minor,         index: 1},
  "Dorian":        {scale: Scale.Dorian,        index: 2},
  "Phrygian":      {scale: Scale.Phrygian,      index: 3},
  "Lydian":        {scale: Scale.Lydian,        index: 4},
  "Mixolydian":    {scale: Scale.Mixolydian,    index: 5},
  "Locrian":       {scale: Scale.Locrian,       index: 6},
  "MajPentatonic": {scale: Scale.MajPentatonic, index: 7},
  "MinPentatonic": {scale: Scale.MinPentatonic, index: 8},
  "WholeTone":     {scale: Scale.WholeTone,     index: 9},
  "GS":            {scale: Scale.GS,            index: 10},
  "Chromatic":     {scale: Scale.Chromatic,     index: 11},
}


export class GlobalPage extends GridPage {
  type = "Global";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("updateSuperMeasure", this.updateSuperMeasure);
    this.functionMap.set("setScaleOrTonic", this.setScaleOrTonic);
  }


  updateSuperMeasure(gridPage: GlobalPage, press: GridKeyPress) {
    gridPage.grid.sequencer.superMeasure = press.x + 1;
    gridPage.grid.sequencer.setSuperMeasure();

    gridPage.#setGridSuperMeasureDisplay();
    gridPage.#setGuiSuperMeasureDisplay();
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiPianoRoll();
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiRampSequence();
  }


  refresh(): void {
    this.grid.clearGridDisplay();
    this.#setGridSuperMeasureDisplay();
    this.#setGridScaleOrTonicDisplay();
  }


  #setGridSuperMeasureDisplay() {
    const superMeasure    = this.grid.sequencer.superMeasure;
    const superMeasureRow = [...new Array(superMeasure).fill(10), ...new Array(8 - superMeasure).fill(0)];
    this.grid.levelRow(0, 0, superMeasureRow);
  }


  #setGuiSuperMeasureDisplay() {
    this.grid.sequencer.gui.webContents.send("update-super-measure", this.grid.sequencer.superMeasure);
  }


  setScaleOrTonic(gridPage: GlobalPage, press: GridKeyPress) {
    let tonic: number, scale: Scale;
    if (gridPage.grid.shiftKey) {
      tonic = gridPage.matrix[press.y][press.x].shiftValue + 60;
      scale = configuredScales[gridPage.grid.sequencer.key.scaleName].scale;
    } else {
      tonic = gridPage.grid.sequencer.key.midiTonic + 60;
      scale = configuredScales[gridPage.matrix[press.y][press.x].value].scale;
    }
    gridPage.grid.sequencer.key = new Key(tonic, scale);
    gridPage.#setGridScaleOrTonicDisplay()
    gridPage.grid.sequencer.gui.webContents.send("set-scale", `${notes[tonic % 12]} ${gridPage.grid.sequencer.key.scaleName}`);
  }


  #setGridScaleOrTonicDisplay() {
    let position: number;
    if (this.grid.shiftKey) {
      position = this.grid.sequencer.key.midiTonic % 12;
    } else {
      position = configuredScales[this.grid.sequencer.key.scaleName].index;
    }

    const yPos = Math.floor(position / 4);
    const xPos = position % 4;

    for (let i = 0, y = 0; y < 3; y++)
      for (let x = 0; x < 4; x++, i++)
        this.grid.levelSet(x + 12, y, (x == xPos && y == yPos ? 10 : 0));
  }
}
