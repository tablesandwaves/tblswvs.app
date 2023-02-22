import { Key, Scale, Melody, MelodyType } from "tblswvs";
import { MonomeGrid } from "./monome_grid";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
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


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);
    this.scales = config.scales;

    this.functionMap.set("setScale", this.setScaleOrTonic);
    this.functionMap.set("toggleMelodyRecording", this.toggleMelodyRecording);
    this.functionMap.set("addNote", this.addNote);
    this.functionMap.set("removeLastNote", this.removeLastNote);
    this.functionMap.set("generateMelody", this.generateMelody);

    this.grid.clearGridDisplay();
    this.setGridScaleOrTonicDisplay();
    this.setUiTrackMelody();
  }


  generateMelody(gridPage: GridMelody, press: GridKeyPress) {
    gridPage.grid.sequencer.getActiveTrack().algorithm = gridPage.matrix[press.y][press.x].value;
    gridPage.grid.sequencer.getActiveTrack().inputMelody = gridPage.grid.sequencer.queuedNotes;

    switch (gridPage.matrix[press.y][press.x].value) {
      case "simple":
        gridPage.grid.sequencer.getActiveTrack().notes = gridPage.grid.sequencer.queuedNotes;
        break;
      case "self_replicate":
        gridPage.setCurrentTrackNotes(gridPage.getCurrentScaleDegreeMelody().selfReplicate(63).steps);
        break;
      case "counted":
        gridPage.setCurrentTrackNotes(gridPage.getCurrentScaleDegreeMelody().counted().steps);
        break;
      case "zig_zag":
        gridPage.setCurrentTrackNotes(gridPage.getCurrentScaleDegreeMelody().zigZag().steps);
        break;
    }
  }


  setCurrentTrackNotes(outputMelody: (string | number)[]) {
    this.grid.sequencer.getActiveTrack().notes = outputMelody.map(scaleDegree => {
      return scaleDegree == 0 ? undefined : this.grid.sequencer.key.degree(Number(scaleDegree));
    });
  }


  getCurrentScaleDegreeMelody(): Melody {
    return new Melody(this.grid.sequencer.queuedNotes.map(n => n.scaleDegree), 0, MelodyType.Degrees);
  }


  toggleMelodyRecording(gridPage: GridMelody, press: GridKeyPress) {
    gridPage.recordingInputMelody = !gridPage.recordingInputMelody;
    gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputMelody ? 10 : 0));
    if (gridPage.recordingInputMelody) {
      gridPage.grid.sequencer.queuedNotes = new Array();
      gridPage.setUiQueuedMelody();
    }
  }


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
      tonic = gridPage.grid.sequencer.key.midiTonic + 60;
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


  setUiTrackMelody() {
    if (this.grid.sequencer.getActiveTrack().algorithm != undefined) {
      this.grid.sequencer.gui.webContents.send(
        "update-track-melody",
        this.grid.sequencer.getActiveTrack().algorithm + " " + this.grid.sequencer.queuedNotes.map(n => `${n.note}${n.octave}`).join(" ")
      );
    }
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


  refresh() {
    this.grid.sequencer.refreshAbleton();
    this.setUiTrackMelody();
  }


  // Should be overridden by any subclasses extending GridPage
  setDisplay(...args: any[]) {}


  shiftDisplay() {
    this.setGridScaleOrTonicDisplay();
  }

}
