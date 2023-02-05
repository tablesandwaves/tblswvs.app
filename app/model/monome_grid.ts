const serialosc = require("serialosc");
import { Sequencer } from "./sequencer";
import * as utils from "../helpers/utils";


type GridKeyPress = {
  x: number,
  y: number,
  s: number
}


export class MonomeGrid {
  sequencer;
  device: any;
  playing: any;


  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;
  }


  async connect(id: string) {
    return new Promise((resolve, reject) => {
      let addEvent = id ? id + ':add' : 'device:add';

      serialosc.start({ startDevices: false });

      serialosc.on(addEvent, (device: any) => {
        if (this.device)           return;
        if (device.type != 'grid') return;

        this.device = device;
        this.device.on('initialized', () => this.device.on('key', (press: GridKeyPress) => this.keyPress(press.x, press.y, press.s)));
        this.device.start();

        resolve(`Connected to ${this.device.model} ${this.device.id} on ${this.device.deviceHost}:${this.device.devicePort}`);
      });
    });
  }


  keyPress(x: number, y: number, s: number) {
    // Bottom row, first button: play/pause
    if (y == 7 && x == 0 && s == 1) {
      if (this.playing) {
        console.log("stopping");
        clearInterval(this.playing);
        this.playing = undefined;
      } else {
        console.log("starting");
        this.playing = setInterval(this.sequencer.run, 250, this);
      }
      this.levelSet(x, y, this.playing == undefined ? 0 : 15);
    }
    // Bottom row, buttons 2-7: select a track
    else if (y == 7 && x >= 1 && x <= 6 && s == 1) {
      let offsetIndex = x - 1;
      this.sequencer.activeTrack = this.sequencer.activeTrack == offsetIndex ? undefined : offsetIndex;
      this.sequencer.tracks.forEach((_, i) => this.levelSet(i + 1, y, i == this.sequencer.activeTrack ? 10 : 0));
      this.setGridRhythmDisplay();
      this.setGuiRhythmDisplay();
    }
    // Top row: set rhythm
    else if (y == 0 && s == 1) {
      if (this.sequencer.activeTrack != undefined) {
        this.sequencer.tracks[this.sequencer.activeTrack].rhythm[x] = 1 - this.sequencer.tracks[this.sequencer.activeTrack].rhythm[x];
        this.setGridRhythmDisplay();
        this.setGuiRhythmDisplay();
      }
    }
  }


  setGuiRhythmDisplay(row?: number[]) {
    if (row == undefined) {
      row = this.sequencer.activeTrack == undefined ?
            utils.blank16x16Row :
            this.sequencer.tracks[this.sequencer.activeTrack].rhythm;
    }
    let name = this.sequencer.activeTrack == undefined ? undefined : this.sequencer.tracks[this.sequencer.activeTrack].name;
    this.sequencer.gui.webContents.send("track-activate", name, row);
  }


  setGridRhythmDisplay(row?: number[]) {
    if (row == undefined) {
      row = this.sequencer.activeTrack == undefined ?
            utils.blank16x16Row :
            this.sequencer.tracks[this.sequencer.activeTrack].rhythm.map((step: number) => step == 1 ? 10 : 0);
    }
    this.levelRow(0, 0, row.slice(0, 8));
    this.levelRow(8, 0, row.slice(8, 16));
  }


  levelSet(x: number, y: number, s: number) {
    this.device.levelSet(x, y, s);
  }


  levelRow(xOffset: number, y: number, row: number[]) {
    this.device.levelRow(xOffset, y, row);
  }
}
