import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
const serialosc = require("serialosc");

import { Sequencer } from "./sequencer";
import { GridConfig, GridKeyPress, ApplicationController } from "../controller/application_controller";
import { GlobalController } from "../controller/global_controller";
import { RhythmController } from "../controller/rhythm_controller";
import { ProbabilitiesController } from "../controller/probabilities_controller";
import { FillsController } from "../controller/fills_controller";
import { ChordController } from "../controller/chord_controller";
import { MelodyController } from "../controller/melody_controller";
import { MelodyEvolutionController } from "../controller/melody_evolution_controller";
import { MelodyVectorController } from "../controller/melody_vector_controller";
import { blank16x16Row } from "../helpers/utils";
import { RampSequenceController } from "../controller/ramp_sequence_controller";
import { DrumPadController } from "../controller/drum_pad_controller";
import { AlgorithmController } from "../controller/algorithm_controller";


export type DeviceConfig = {
  serial: string,
}


const globalKeyPageTypeMap: Record<number, string> = {
  7:  "Rhythm",
  8:  "Chords",
  9:  "Melody",
  10: "RampSequence",
  11: "Algorithm",
  12: "Global"
}


const pageTypeMap: Record<string, string[]> = {
  "Rhythm":       ["Rhythm", "Probabilities", "Fills"],
  "Chords":       ["Chords"],
  "Melody":       ["Melody", "Mutation", "MelodyVector"],
  "RampSequence": ["RampSequence"],
  "Algorithm":    ["Algorithm"],
  "Global":       ["Global"]
}


export class MonomeGrid {
  sequencer: Sequencer;
  device: any;
  playing: any;
  activePage: ApplicationController;
  shiftKey: boolean = false;
  pageIndex: number = 0;
  testing = false;


  constructor(sequencer: Sequencer, testing = false) {
    this.sequencer = sequencer;

    if (testing != undefined) {
      this.testing = testing;
    }
  }


  async connect() {
    const config: DeviceConfig = yaml.load(
      fs.readFileSync(
        path.resolve(this.sequencer.configDirectory, "grid.yml"),
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


  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    if (this.activePage) {
      this.activePage.displayRhythmWithTransport(highlightIndex, pianoRollHighlightIndex);
    }
  }


  keyPress(press: GridKeyPress) {
    // Bottom row: global controls
    if (press.y == 7) {

      if (press.x <= 6 && press.s == 1) {
        this.#setActiveTrack(press);
      } else if (press.s == 1 && press.x >= 7 && press.x <= 12) {
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
    if (!this.testing) this.device.levelSet(press.x, press.y, (this.shiftKey ? 10 : 0));
    this.activePage.toggleShiftState();
  }


  levelSet(x: number, y: number, s: number) {
    if (!this.testing)
      this.device.levelSet(x, y, s);
  }


  levelRow(xOffset: number, y: number, row: number[]) {
    if (!this.testing)
      this.device.levelRow(xOffset, y, row);
  }


  clearGridDisplay(rowCount: number = 7) {
    for (let y = 0; y < rowCount; y++) {
      this.levelRow(0, y, blank16x16Row.slice(0, 8));
      this.levelRow(8, y, blank16x16Row.slice(8, 16));
    }
  }


  #setActiveTrack(press: GridKeyPress) {
    this.sequencer.daw.activeTrack = press.x;

    const activeChainType = this.sequencer.daw.getActiveTrack().chains[this.sequencer.daw.getActiveTrack().activeChain].type;
    if ((this.activePage && this.activePage instanceof RhythmController  && activeChainType == "drum rack") ||
        (this.activePage && this.activePage instanceof DrumPadController && activeChainType != "drum rack")) {
      this.#setActiveGridPage(this.activePage.type);
    }
    if (this.activePage) this.activePage.refresh();

    this.#selectGlobalGridKey(0, 6, press.x);
    this.sequencer.daw.getActiveTrack().updateGui();
    this.sequencer.selectActiveTrack(this.sequencer.daw.getActiveTrack());
  }


  #setActiveGridPage(pageType: string) {
    let updated = false, globalKeyIndex;
    switch(pageType) {
      case "Rhythm":
        this.pageIndex = 0;
        if (this.sequencer.daw.getActiveTrack().chains[this.sequencer.daw.getActiveTrack().activeChain].type == "drum rack")
          this.activePage = new DrumPadController(this.#loadConfig(`grid_page_drumpad.yml`) as GridConfig, this);
        else
          this.activePage = new RhythmController(this.#loadConfig(`grid_page_rhythm_0.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 7;
        break;
      case "Probabilities":
        // Do not reset page index to 0, this is page 2/index 1 of the Rhythm page group.
        this.activePage = new ProbabilitiesController(this.#loadConfig(`grid_page_rhythm_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 7;
        break;
      case "Fills":
        // Do not reset page index to 0, this is page 3/index 2 of the Rhythm page group.
        this.activePage = new FillsController(this.#loadConfig(`grid_page_rhythm_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 7;
        break;
      case "Chords":
        this.pageIndex = 0;
        this.activePage = new ChordController(this.#loadConfig(`grid_page_chord_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 8;
        break;
      case "Melody":
        this.pageIndex = 0;
        this.activePage = new MelodyController(this.#loadConfig(`grid_page_melody_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 9;
        break;
      case "Mutation":
        // Do not reset page index to 0, this is page 2/index 1 of the Melody page group.
        this.activePage = new MelodyEvolutionController(this.#loadConfig(`grid_page_melody_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 9;
        break;
      case "MelodyVector":
        // Do not reset page index to 0, this is page 3/index 2 of the Melody page group.
        this.activePage = new MelodyVectorController(this.#loadConfig(`grid_page_melody_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 9;
        break;
      case "RampSequence":
        this.pageIndex = 0;
        this.activePage = new RampSequenceController(this.#loadConfig(`grid_page_ramps_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 10;
        break;
      case "Algorithm":
        this.pageIndex = 0;
        this.activePage = new AlgorithmController(this.#loadConfig(`grid_page_algorithms_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 11;
        break;
      case "Global":
        this.pageIndex = 0;
        this.activePage = new GlobalController(this.#loadConfig(`grid_page_global_${this.pageIndex}.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 12;
        break;
    }

    if (updated) {
      this.clearGridDisplay();
      this.activePage.refresh();
      this.#selectGlobalGridKey(7, 12, globalKeyIndex);
    }
  }


  #selectGlobalGridKey(rangeStart: number, rangeEnd: number, selectedKey: number) {
    for (let i = rangeStart; i <= rangeEnd; i++) {
      this.levelSet(i, 7, i == selectedKey ? 10 : 0);
    }
  }


  #loadConfig(filename: string): any {
    return yaml.load(fs.readFileSync( path.resolve(this.sequencer.configDirectory, filename), "utf8" ));
  }
}
