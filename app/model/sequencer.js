const easymidi = require("easymidi");
const { MonomeGrid } = require("./monome_grid");
const { Track } = require("./track");
const util = require("../helpers/util");


class Sequencer {
  grid;
  midiIn;
  midiOut;
  ticks;
  activeTrack = undefined;
  playing = undefined;
  step = 0;
  tracks = [
    new Track("Kick"),
    new Track("Snare"),
    new Track("HiHat"),
    new Track("Perc"),
    new Track("Opsix"),
    new Track("Hydra")
  ];
  gui;


  constructor() {
    this.grid = new MonomeGrid(this);
    this.midiIn = new easymidi.Input("tblswvs in", true);
    this.midiOut = new easymidi.Output("tblswvs out", true);
    this.ticks = 0;
  }


  async connectToGrid(id) {
    const msg = await this.grid.connect(id);
    return msg;
  }


  async follow() {
    this.midiIn.on("clock", () => {
      this.ticks++;
      if (this.ticks % 6 != 0) return;

      let previousStep = this.step == 0 ? 15 : this.step - 1;
      if (this.tracks[0].rhythm[previousStep] == 1) {
        this.midiOut.send("noteoff", { note: 60, velocity: 127, channel: 0 });
      }
      if (this.tracks[1].rhythm[previousStep] == 1) {
        this.midiOut.send("noteoff", { note: 60, velocity: 127, channel: 1 });
      }
      if (this.tracks[2].rhythm[previousStep] == 1) {
        this.midiOut.send("noteoff", { note: 60, velocity: 127, channel: 2 });
      }

      if (this.tracks[0].rhythm[this.step] == 1) {
        this.midiOut.send("noteon", { note: 60, velocity: 127, channel: 0 });
      }
      if (this.tracks[1].rhythm[this.step] == 1) {
        this.midiOut.send("noteon", { note: 60, velocity: 127, channel: 1 });
      }
      if (this.tracks[2].rhythm[this.step] == 1) {
        this.midiOut.send("noteon", { note: 60, velocity: 127, channel: 2 });
      }

      let row = this.activeTrack == undefined ?
      util.blank16x16Row.slice() :
      this.tracks[this.activeTrack].rhythm.slice().map(step => step == 1 ? 10 : 0);
      row[this.step] = 15;
      this.grid.setGridRhythmDisplay(row);
      this.grid.setGuiRhythmDisplay(row);
      this.step = this.step == 15 ? 0 : this.step + 1;
    });

    this.midiIn.on("start", () => {
      if (this.tracks[0].rhythm[this.step] == 1) {
        this.midiOut.send("noteon", { note: 60, velocity: 127, channel: 0 });
      }
      if (this.tracks[1].rhythm[this.step] == 1) {
        this.midiOut.send("noteon", { note: 60, velocity: 127, channel: 1 });
      }
      if (this.tracks[2].rhythm[this.step] == 1) {
        this.midiOut.send("noteon", { note: 60, velocity: 127, channel: 2 });
      }
    });

    this.midiIn.on("position", (data) => {
      if (data.value != 0) return;

      this.ticks = 0;
      this.step = 0;
      this.grid.setGridRhythmDisplay();
      this.grid.setGuiRhythmDisplay();
    });
  }


  run(grid) {
    let row = grid.sequencer.activeTrack == undefined ?
              util.blank16x16Row.slice() :
              grid.sequencer.tracks[grid.sequencer.activeTrack].rhythm.slice().map(step => step == 1 ? 10 : 0);
    row[grid.sequencer.step] = 15;
    grid.setGridRhythmDisplay(row);
    grid.setGuiRhythmDisplay(row);
    grid.sequencer.step = grid.sequencer.step == 15 ? 0 : grid.sequencer.step + 1;
  }
}


module.exports = {
  Sequencer
}
