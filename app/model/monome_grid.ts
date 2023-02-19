import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
const serialosc = require("serialosc");
import { Sequencer } from "./sequencer";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { GridRhythm } from "./grid_rhythm";
import { GridMelody } from "./grid_melody";


export enum GridPageType {
    Rhythm = "Rhythm",
    Melody = "Melody"
}


export type DeviceConfig = {
  serial: string,
}


export class MonomeGrid {
  sequencer: Sequencer;
  device: any;
  playing: any;
  activePage: GridPage;
  activePageType: GridPageType;
  configDirectory: string = path.resolve(__dirname, "../../config");;
  shiftKey: boolean = false;


  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;
  }


  async connect() {
    const config: DeviceConfig = yaml.load(
      fs.readFileSync(
        path.resolve(this.configDirectory, "grid.yml"),
        "utf8"
      )
    ) as DeviceConfig;

    return new Promise((resolve, reject) => {
      let addEvent = config.serial + ":add";

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
      if (press.x <= 5 && press.s == 1) {
        this.#setActiveTrack(press); // Keys 1-6, select active track
      } else if (press.x == 6 && press.s == 1) {
        this.#setGridPageToRhythm(); // Load the rhythm grid page
      } else if (press.x == 8 && press.s == 1) {
        this.#setGridPageToMelody(); // Load the rhythm grid page
      } else if (press.x == 13 && press.s == 1) {
        this.shiftKey = true;
        this.levelSet(press.x, press.y, 10);
        this.activePage.shiftDisplay();
      } else if (press.x == 13 && press.s == 0) {
        this.shiftKey = false;
        this.levelSet(press.x, press.y, 0);
        this.activePage.shiftDisplay();
      }

    // Other rows, forward to the key press to the currently active page
    } else {
      this.activePage.keyPress(press);
    }
  }


  levelSet(x: number, y: number, s: number) {
    this.device.levelSet(x, y, s);
  }


  levelRow(xOffset: number, y: number, row: number[]) {
    this.device.levelRow(xOffset, y, row);
  }


  #setActiveTrack(press: GridKeyPress) {
    this.sequencer.activeTrack = press.x;

    if (this.activePage) {
      this.activePage.currentTrack = this.sequencer.tracks[this.sequencer.activeTrack];
      this.activePage.refresh();
    }

    this.#selectGlobalGridKey(0, 5, press.x);
  }


  #setGridPageToRhythm() {
    const configFilePath = path.resolve(this.configDirectory, "grid_page_rhythm.yml");
    const config = yaml.load(fs.readFileSync(configFilePath, "utf8"));
    this.activePage = new GridRhythm(config as GridConfig, this.sequencer.tracks[this.sequencer.activeTrack], this);
    this.activePage.refresh();
    this.activePageType = GridPageType.Rhythm;
    this.#selectGlobalGridKey(6, 12, 6);
  }


  #setGridPageToMelody() {
    const configFilePath = path.resolve(this.configDirectory, "grid_page_melody.yml");
    const config = yaml.load(fs.readFileSync(configFilePath, "utf8"));
    this.activePage = new GridMelody(config as GridConfig, this.sequencer.tracks[this.sequencer.activeTrack], this);
    this.activePage.refresh();
    this.activePageType = GridPageType.Melody;
    this.#selectGlobalGridKey(6, 12, 8);
  }


  #selectGlobalGridKey(rangeStart: number, rangeEnd: number, selectedKey: number) {
    for (let i = rangeStart; i <= rangeEnd; i++) {
      this.levelSet(i, 7, i == selectedKey ? 10 : 0);
    }
  }
}
