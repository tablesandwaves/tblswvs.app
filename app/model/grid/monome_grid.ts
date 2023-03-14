import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
const serialosc = require("serialosc");
import { Sequencer } from "../sequencer";
import { GridConfig, GridKeyPress, GridPage } from "./grid_page";
import { GridGlobal } from "./global_page";
import { GridRhythm } from "./rhythm_page";
import { GridMelody } from "./melody_page";
import { blank16x16Row } from "../../helpers/utils";
import { ProbabilitiesPage } from "./probabilities_page";
import { ChordPage } from "./chord_page";


export type DeviceConfig = {
  serial: string,
}


const globalKeyPageTypeMap: Record<number, string> = {
  6:  "Rhythm",
  8:  "Melody",
  12: "Global"
}


const pageTypeMap: Record<string, string[]> = {
  "Rhythm": ["Rhythm", "Probabilities"],
  "Melody": ["Melody"],
  "Global": ["Global"]
}


export class MonomeGrid {
  sequencer: Sequencer;
  device: any;
  playing: any;
  activePage: GridPage;
  configDirectory: string = path.resolve(__dirname, "../../../config");
  shiftKey: boolean = false;
  pageIndex: number = 0;


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
    this.activePage.displayRhythmWithTransport(highlightIndex);
  }


  keyPress(press: GridKeyPress) {
    // Bottom row: global controls
    if (press.y == 7) {

      if (press.x <= 5 && press.s == 1) {
        this.#setActiveTrack(press);
      } else if (press.s == 1 && press.x >= 6 && press.x <= 12) {
        this.#setActiveGridPage(globalKeyPageTypeMap[press.x]);
      } else if (press.x == 13 && press.s == 1) {
        this.setShiftState(press);
      } else if (press.x == 14 && press.s == 1) {
        this.decrementPage();
      } else if (press.x == 15 && press.s == 1) {
        this.incrementPage();
      }

    // Other rows, forward to the key press to the currently active page
    } else {
      this.activePage.keyPress(press);
    }
  }


  decrementPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.#setActiveGridPage(pageTypeMap[this.activePage.type][this.pageIndex]);
    }
  }


  incrementPage() {
    if (this.pageIndex < pageTypeMap[this.activePage.type].length - 1) {
      this.pageIndex++;
      this.#setActiveGridPage(pageTypeMap[this.activePage.type][this.pageIndex]);
    }
  }


  setShiftState(press: GridKeyPress) {
    this.shiftKey = !this.shiftKey;
    this.device.levelSet(press.x, press.y, (this.shiftKey ? 10 : 0));
    this.activePage.toggleShiftState();
  }


  levelSet(x: number, y: number, s: number) {
    this.device.levelSet(x, y, s);
  }


  levelRow(xOffset: number, y: number, row: number[]) {
    this.device.levelRow(xOffset, y, row);
  }


  clearGridDisplay(rowCount: number = 7) {
    for (let y = 0; y < rowCount; y++) {
      this.levelRow(0, y, blank16x16Row.slice(0, 8));
      this.levelRow(8, y, blank16x16Row.slice(8, 16));
    }
  }


  #setActiveTrack(press: GridKeyPress) {
    this.sequencer.activeTrack = press.x;

    if (this.activePage) this.activePage.refresh();

    this.#selectGlobalGridKey(0, 5, press.x);
    this.sequencer.gui.webContents.send("track-activate", this.sequencer.getActiveTrack());
  }


  #setActiveGridPage(pageType: string) {
    let updated = false, globalKeyIndex;
    switch(pageType) {
      case "Rhythm":
        this.pageIndex = 0;
        this.activePage = new GridRhythm(this.#loadConfig(`grid_page_rhythm_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 6;
        break;
      case "Chords":
        this.pageIndex = 0;
        this.activePage = new ChordPage(this.#loadConfig(`grid_page_chord_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 7;
        break;
      case "Probabilities":
        this.activePage = new ProbabilitiesPage(this.#loadConfig(`grid_page_rhythm_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 6;
        break;
      case "Melody":
        this.pageIndex = 0;
        this.activePage = new GridMelody(this.#loadConfig(`grid_page_melody_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 8;
        break;
      case "Global":
        this.pageIndex = 0;
        this.activePage = new GridGlobal(this.#loadConfig(`grid_page_global_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 12;
        break;
    }

    if (updated) {
      this.activePage.refresh();
      this.#selectGlobalGridKey(6, 12, globalKeyIndex);
    }
  }


  #selectGlobalGridKey(rangeStart: number, rangeEnd: number, selectedKey: number) {
    for (let i = rangeStart; i <= rangeEnd; i++) {
      this.levelSet(i, 7, i == selectedKey ? 10 : 0);
    }
  }


  #loadConfig(filename: string): any {
    return yaml.load(fs.readFileSync( path.resolve(this.configDirectory, filename), "utf8" ));
  }
}
