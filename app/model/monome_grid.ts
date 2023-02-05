import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
const serialosc = require("serialosc");
import { Sequencer } from "./sequencer";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { GridRhythm } from "./grid_rhythm";


export enum GridPageType {
    Rhythm = "Rhythm",
    Melody = "Melody"
}


export class MonomeGrid {
  sequencer;
  device: any;
  playing: any;
  activePage: GridPage;
  activePageType: GridPageType;
  configDirectory: string;


  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;
    this.configDirectory = path.resolve(__dirname, "../../config");
  }


  async connect(id: string) {
    return new Promise((resolve, reject) => {
      let addEvent = id ? id + ':add' : 'device:add';

      serialosc.start({ startDevices: false });

      serialosc.on(addEvent, (device: any) => {
        if (this.device)           return;
        if (device.type != 'grid') return;

        this.device = device;
        this.device.on('initialized', () => this.device.on('key', (press: GridKeyPress) => this.keyPress(press)));
        this.device.start();

        resolve(`Connected to ${this.device.model} ${this.device.id} on ${this.device.deviceHost}:${this.device.devicePort}`);
      });
    });
  }


  displayRhythmWithTransport(highlightIndex: number) {
    this.activePage.setDisplay(highlightIndex);
  }


  keyPress(press: GridKeyPress) {
    // Bottom row: global controls
    if (press.y == 7) {
      // Keys 1-6, select active track
      if (press.x <= 5 && press.s == 1) {
        this.sequencer.activeTrack = press.x;
        this.sequencer.tracks.forEach((_, i) => this.levelSet(i, press.y, i == this.sequencer.activeTrack ? 10 : 0));

        if (this.activePage) {
          this.activePage.currentTrack = this.sequencer.tracks[this.sequencer.activeTrack];
          this.activePage.refresh();
        }
      }
      // Load the rhythm grid page
      else if (press.x == 6 && press.s == 1) {
        const configFilePath = path.resolve(this.configDirectory, "grid_page_rhythm.yml");
        const config = yaml.load(fs.readFileSync(configFilePath, "utf8"));
        this.activePage = new GridRhythm(config as GridConfig, this.sequencer.tracks[this.sequencer.activeTrack], this);
        this.activePageType = GridPageType.Rhythm;

        for (let i = 6; i <= 13; i++) {
          this.levelSet(i, press.y, i == press.x ? 10 : 0);
        }
      }
    }
    // Other rows, forward to the key press to the currently active page
    else {
      this.activePage.keyPress(press);
    }
  }


  levelSet(x: number, y: number, s: number) {
    this.device.levelSet(x, y, s);
  }


  levelRow(xOffset: number, y: number, row: number[]) {
    this.device.levelRow(xOffset, y, row);
  }
}
