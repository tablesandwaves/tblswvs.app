const easymidi = require("easymidi");
import { Key, Scale } from "tblswvs";
import { BrowserWindow } from "electron";
import { GridPageType, MonomeGrid } from "./monome_grid";
import { Track } from "./track";
import { AbletonLive } from "./ableton_live";
import { note } from "tblswvs";


export class Sequencer {
  grid: MonomeGrid;
  daw: AbletonLive;
  midiIn: any;
  // midiOut: any;
  ticks: number = 0;
  superMeasure: number = 4;
  activeTrack: number = 0;
  step: number = 0;
  tracks: Track[] = [
    new Track("Kick"),
    new Track("Snare"),
    new Track("HiHat"),
    new Track("Perc"),
    new Track("Opsix"),
    new Track("Hydra")
  ];
  gui: BrowserWindow;
  key: Key;
  queuedNotes: note[] = [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }];


  constructor() {
    this.grid = new MonomeGrid(this);
    this.daw = new AbletonLive();
    this.midiIn = new easymidi.Input("tblswvs in", true);
    this.key = new Key(60, Scale.Minor);
  }


  async connectToGrid() {
    const msg = await this.grid.connect();
    return msg;
  }


  getActiveTrack(): Track {
    return this.tracks[this.activeTrack];
  }


  refreshAbleton() {
    this.daw.syncAbletonClip(this.activeTrack, 0, this.tracks[this.activeTrack], this.superMeasure);
  }


  async follow() {
    this.midiIn.on("clock", () => {
      this.ticks++;
      if (this.ticks % 6 != 0) return;

      if (this.grid.activePageType == GridPageType.Rhythm)
        this.grid.displayRhythmWithTransport(this.step);

      this.step = this.step == 15 ? 0 : this.step + 1;
    });

    this.midiIn.on("start", () => {
    });

    this.midiIn.on("position", (data: any) => {
      if (data.value != 0) return;

      this.ticks = 0;
      this.step = 0;
      if (this.grid.activePageType == GridPageType.Rhythm)
        this.grid.displayRhythmWithTransport(this.step);
    });
  }
}
