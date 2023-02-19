import { Key, Scale } from "tblswvs";
import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { Track } from "./track";
import { notes } from "../helpers/utils";


export type ConfiguredScale = {
  name: keyof typeof Scale,
  mode?: string
}


const octaveTransposeMapping: Record<number, number> = {
  0: 3,
  1: 2,
  2: 1,
  3: 0,
  4: -1,
  5: -2,
  6: -3
}


export class GridMelody extends GridPage {
  scales: ConfiguredScale[];
  recordingInputMelody: boolean = false;


  constructor(config: GridConfig, track: Track, grid: MonomeGrid) {
    super(config, grid, track);
    this.scales = config.scales;

    this.functionMap.set("addNote", this.addNote);
    this.functionMap.set("setScale", this.setScaleOrTonic);
    this.functionMap.set("toggleMelodyRecording", this.toggleMelodyRecording)
    this.functionMap.set("removeLastNote", this.removeLastNote)

    this.grid.clearGridDisplay();
    this.setGridScaleOrTonicDisplay();
  }


  toggleMelodyRecording(gridPage: GridMelody, press: GridKeyPress) {
    gridPage.recordingInputMelody = !gridPage.recordingInputMelody;
    gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputMelody ? 10 : 0));
    if (gridPage.recordingInputMelody) {
      gridPage.grid.sequencer.queuedNotes = new Array();
      gridPage.setUiQueuedMelody();
    }
  }


  // TODO: set a button for appending notes like the Max version, if active/true, add notes to the active track.
  addNote(gridPage: GridMelody, press: GridKeyPress) {
    if (gridPage.recordingInputMelody) {
      let octaveTranspose = octaveTransposeMapping[press.y];
      // Spread operator used to clone the object because otherwise calling array element by ref?
      gridPage.grid.sequencer.queuedNotes.push({ ...gridPage.grid.sequencer.key.degree(press.x + 1, octaveTranspose) });
      gridPage.setUiQueuedMelody();
    }
  }


  removeLastNote(gridPage: GridMelody, press: GridKeyPress) {
    if (gridPage.recordingInputMelody) {
      gridPage.grid.sequencer.queuedNotes.pop();
      gridPage.setUiQueuedMelody();
    }
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


  setUiQueuedMelody() {
    this.grid.sequencer.gui.webContents.send(
      "update-melody",
      this.grid.sequencer.queuedNotes.map(n => `${n.note}${n.octave}`).join(" ")
    );
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
