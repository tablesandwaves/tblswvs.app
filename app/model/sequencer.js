const { MonomeGrid } = require("./monome_grid");
const { Track } = require("./track");
const util = require("../helpers/util");


class Sequencer {
  grid;
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
  }


  async connectToGrid(id) {
    const msg = await this.grid.connect(id);
    return msg;
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
