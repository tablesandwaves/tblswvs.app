import { Key, Scale } from "tblswvs";
import { ApplicationController, GridConfig, GridKeyPress } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { notes } from "../helpers/utils";


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


export class GlobalController extends ApplicationController {
  type = "Global";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("updateSuperMeasure", this.updateSuperMeasure);
    this.functionMap.set("setTrackChain", this.setTrackChain);
    this.functionMap.set("setScale", this.setScale);
    this.functionMap.set("setTonic", this.setTonic);
    this.functionMap.set("setBeat", this.setBeat);
  }


  updateSuperMeasure(gridPage: GlobalController, press: GridKeyPress) {
    gridPage.grid.sequencer.superMeasure = press.x + 1 - 8;
    gridPage.grid.sequencer.updateSuperMeasure();

    gridPage.#setGridSuperMeasureDisplay();
    gridPage.#setGuiSuperMeasureDisplay();
    gridPage.updateGuiRhythmDisplay();
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiPianoRoll();
    gridPage.grid.sequencer.daw.getActiveTrack().updateGuiRampSequence();
  }


  refresh(): void {
    this.#setGridSuperMeasureDisplay();
    this.setGridScaleDisplay();
    this.setGridTonicDisplay();

    for (let i = 0; i < 6; i++)
      this.setGridChainRow(i);
  }


  #setGridSuperMeasureDisplay() {
    const superMeasure    = this.grid.sequencer.superMeasure;
    const superMeasureRow = [...new Array(superMeasure).fill(10), ...new Array(8 - superMeasure).fill(0)];
    this.grid.levelRow(8, 0, superMeasureRow);
  }


  #setGuiSuperMeasureDisplay() {
    this.grid.sequencer.gui.webContents.send("update-super-measure", this.grid.sequencer.superMeasure);
  }


  setTrackChain(gridPage: GlobalController, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.y];
    if (track.chains.length > press.x) {
      track.activeChain = press.x;
      if (press.y == gridPage.grid.sequencer.daw.activeTrack) {
        track.updateGuiChains();
        track.updateGuiPianoRoll();
      }
      gridPage.setGridChainRow(track.dawIndex - 1);
    }
  }


  setScale(gridPage: GlobalController, press: GridKeyPress) {
    const tonic = gridPage.grid.sequencer.key.midiTonic + 60;
    const scale = configuredScales[gridPage.matrix[press.y][press.x].value].scale;
    gridPage.grid.sequencer.key = new Key(tonic, scale);
    gridPage.setGridScaleDisplay();
    gridPage.grid.sequencer.gui.webContents.send("set-scale", `${notes[tonic % 12]} ${gridPage.grid.sequencer.key.scaleName}`);
  }


  setTonic(gridPage: GlobalController, press: GridKeyPress) {
    const tonic = gridPage.matrix[press.y][press.x].value + 60;
    const scale = configuredScales[gridPage.grid.sequencer.key.scaleName].scale;
    gridPage.grid.sequencer.key = new Key(tonic, scale);
    gridPage.setGridTonicDisplay();
    gridPage.grid.sequencer.gui.webContents.send("set-scale", `${notes[tonic % 12]} ${gridPage.grid.sequencer.key.scaleName}`);
  }


  setBeat(gridPage: GlobalController, press: GridKeyPress) {
    const [groupCode, beatCode] = gridPage.matrix[press.y][press.x].value.split("/");
    const beat = gridPage.grid.sequencer.beatPatterns.groups[groupCode].beats[beatCode];

    beat.voices.forEach(voice => {
      const track = gridPage.grid.sequencer.daw.tracks.find(t => t.name == voice.track);
      track.rhythmStepLength = beat.length;

      const rhythmSteps = new Array(beat.length).fill(undefined).map(_ => ({state: 0, probability: 1, fillRepeats: 0, velocity: undefined}));
      voice.hits.forEach((hit, i) => {
        rhythmSteps[hit].state = 1;
        rhythmSteps[hit].velocity = voice.velocities[i];
      });
      track.rhythm = rhythmSteps;
      gridPage.grid.sequencer.daw.updateTrackNotes(track);
    });

    gridPage.updateGuiRhythmDisplay();
  }


  setGridTonicDisplay() {
    const position = this.grid.sequencer.key.midiTonic % 12;
    const yPos = Math.floor(position / 4) + 1;
    const xPos = position % 4;

    for (let i = 1, y = 1; y < 4; y++)
      for (let x = 0; x < 4; x++, i++)
        this.grid.levelSet(x + 8, y, (x == xPos && y == yPos ? 10 : 1));
  }


  setGridScaleDisplay() {
    const position = configuredScales[this.grid.sequencer.key.scaleName].index;
    const yPos = Math.floor(position / 4) + 1;
    const xPos = position % 4;

    for (let i = 1, y = 1; y < 4; y++)
      for (let x = 0; x < 4; x++, i++)
        this.grid.levelSet(x + 12, y, (x == xPos && y == yPos ? 10 : 1));
  }


  setGridChainRow(trackIndex: number) {
    const track = this.grid.sequencer.daw.tracks[trackIndex];
    const row = new Array(8).fill(0);
    row[track.activeChain] = 10;
    this.grid.levelRow(0, trackIndex, row);
  }
}
