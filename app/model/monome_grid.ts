import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
const serialosc = require("serialosc");

import { Sequencer } from "./sequencer";
import { GridConfig, GridKeyPress, ApplicationController } from "../controller/application_controller";
import { GlobalController } from "../controller/global_controller";
import { RhythmController } from "../controller/rhythm_controller";
import { DynamicsController } from "../controller/dynamics_controller";
import { TimingController } from "../controller/timing_controller";
import { FillsController } from "../controller/fills_controller";
import { InputNoteController, algorithmMappings } from "../controller/input_note_controller";
import { DrumInputNoteController } from "../controller/drum_input_note_controller";
import { MelodyEvolutionController } from "../controller/melody_evolution_controller";
import { NoteVectorController } from "../controller/note_vector_controller";
import { blank16x16Row } from "../helpers/utils";
import { RampSequenceController } from "../controller/ramp_sequence_controller";
import { DrumPadController } from "../controller/drum_pad_controller";
import { ShiftRegisterController } from "../controller/shift_register_controller";
import { InfinitySeriesController } from "../controller/infinity_series_controller";
import { SelfSimilarityController } from "../controller/self_similarity_controller";


export type DeviceConfig = {
  serial: string,
}


const globalKeyPageTypeMap: Record<number, string> = {
  7:  "Rhythm",
  8:  "InputNotes",
  9:  "RampSequence",
  12: "Global"
}


export const pageTypeMap: Record<string, string[]> = {
  "Rhythm":       ["Rhythm", "Dynamics", "Timing", "Fills"],
  "InputNotes":   ["InputNotes", "NoteVector"],
  "RampSequence": ["RampSequence"],
  "Global":       ["Global", "Mutation"]
}


export class MonomeGrid {
  sequencer: Sequencer;
  device: any;
  playing: any;
  activePage: ApplicationController;
  shiftStateActive: boolean = false;
  shiftKeyHeld: boolean = false;
  shiftKeyHeldPlusOtherKey: boolean = false;
  pageIndex: number = 0;
  testing = false;
  testLogging = false;


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
      } else if (press.s == 1 && press.x == 8) {
        if (algorithmMappings[this.sequencer.daw.getActiveTrack().algorithm])
          this.setActiveGridPage(algorithmMappings[this.sequencer.daw.getActiveTrack().algorithm].pageType);
        else
          this.setActiveGridPage("InputNotes");
      } else if (press.s == 1 && press.x >= 7 && press.x <= 12) {
        this.setActiveGridPage(globalKeyPageTypeMap[press.x]);
      } else if (press.x == 13 && press.s == 1) {
        this.shiftKeyHeld = true;
        this.activePage.holdShiftKey();
      } else if (press.x == 13 && press.s == 0) {
        this.activePage.releaseShiftKey();
        // While the shift key was being held down, did another key get pressed? If yes, then do not go into
        // the shift state because the shift key was only held to access a fast/temporary shift menu.
        if (!this.shiftKeyHeldPlusOtherKey) this.setShiftState(press);
        this.shiftKeyHeld = false;
        this.shiftKeyHeldPlusOtherKey = false;
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
      this.setActiveGridPage(pageTypeMap[this.activePage.type][this.pageIndex]);
    }
  }


  incrementPage() {
    if (this.pageIndex < pageTypeMap[this.activePage.type].length - 1) {
      this.pageIndex++;
      this.setActiveGridPage(pageTypeMap[this.activePage.type][this.pageIndex]);
    }
  }


  setShiftState(press: GridKeyPress) {
    this.shiftStateActive = !this.shiftStateActive;
    if (!this.testing) this.device.levelSet(press.x, press.y, (this.shiftStateActive ? 10 : 0));
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

    if (this.activePage && this.activePage instanceof RhythmController ||
        this.activePage && this.activePage instanceof DrumPadController) {
      // When switching to a new track while on a Rhythm type controller (rhythm or drum pad controller)
      // reset the active page to cover the case where the grid needs to display the other rhythm type.
      this.setActiveGridPage(this.activePage.type);
    } else if (this.activePage && this.activePage instanceof InputNoteController ||
               this.activePage && this.activePage instanceof DrumInputNoteController) {
      // Similarly, the new track for the input notes pages may be using a different algorithm, also
      // requiring a new grid display.
      this.setActiveGridPage(algorithmMappings[this.sequencer.daw.getActiveTrack().algorithm].pageType);
    }
    if (this.activePage) this.activePage.refresh();

    this.#selectGlobalGridKey(0, 6, press.x);
    this.sequencer.daw.getActiveTrack().updateGui();
    this.sequencer.selectActiveTrack(this.sequencer.daw.getActiveTrack());
  }


  setActiveGridPage(pageType: string) {
    let updated = false, globalKeyIndex;

    switch(pageType === "InputNotes" ? this.#getInputNotesPageType() : pageType) {
      case "Rhythm":
        if (this.sequencer.daw.getActiveTrack().type == "DrumTrack")
          this.activePage = new DrumPadController(this.#loadConfig(`grid_page_drumpad.yml`) as GridConfig, this);
        else
          this.activePage = new RhythmController(this.#loadConfig(`grid_page_rhythm_0.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 7;
        this.pageIndex = 0;
        break;
      case "Dynamics":
        this.activePage = new DynamicsController(this.#loadConfig(`grid_page_rhythm_1.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 7;
        this.pageIndex = 1;
        break;
      case "Timing":
        this.activePage = new TimingController(this.#loadConfig(`grid_page_rhythm_2.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 7;
        this.pageIndex = 2;
        break;
      case "Fills":
        this.activePage = new FillsController(this.#loadConfig(`grid_page_rhythm_3.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 7;
        this.pageIndex = 3;
        break;
      case "InputNotes":
        if (this.sequencer.daw.getActiveTrack().type == "DrumTrack")
          this.activePage = new DrumInputNoteController(this.#loadConfig(`grid_page_input_notes_0.0-drumtrack.yml`) as GridConfig, this);
        else
          this.activePage = new InputNoteController(this.#loadConfig(`grid_page_input_notes_0.0-melodictrack.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 8;
        this.pageIndex = 0;
        break;
      case "ShiftRegister":
        this.activePage = new ShiftRegisterController(this.#loadConfig(`grid_page_input_notes_0.1.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 8;
        this.pageIndex = 0;
        break;
      case "InfinitySeries":
        this.activePage = new InfinitySeriesController(this.#loadConfig(`grid_page_input_notes_0.2.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 8;
        this.pageIndex = 0;
        break;
      case "SelfSimilarity":
        this.activePage = new SelfSimilarityController(this.#loadConfig(`grid_page_input_notes_0.3.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 8;
        this.pageIndex = 0;
        break;
      case "NoteVector":
        this.activePage = new NoteVectorController(this.#loadConfig(`grid_page_input_notes_1.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 8;
        this.pageIndex = 1;
        break;
      case "RampSequence":
        this.activePage = new RampSequenceController(this.#loadConfig(`grid_page_ramps_0.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 9;
        this.pageIndex = 0;
        break;
      case "Global":
        this.activePage = new GlobalController(this.#loadConfig(`grid_page_global_0.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 12;
        this.pageIndex = 0;
        break;
      case "Mutation":
        this.activePage = new MelodyEvolutionController(this.#loadConfig(`grid_page_global_1.yml`) as GridConfig, this);
        updated = true;
        globalKeyIndex = 12;
        this.pageIndex = 1;
        break;
    }

    if (updated) {
      this.clearGridDisplay();
      this.activePage.refresh();
      this.#selectGlobalGridKey(7, 12, globalKeyIndex);
    }
  }


  #getInputNotesPageType() {
    switch(this.sequencer.daw.getActiveTrack().algorithm) {
      case "simple":
        return "InputNotes";
      case "self_similarity":
        return "SelfSimilarity";
      case "shift_reg":
        return "ShiftRegister";
      case "inf_series":
        return "InfinitySeries";
      default:
        return "InputNotes";
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
