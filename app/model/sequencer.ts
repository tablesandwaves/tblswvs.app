const easymidi = require("easymidi");
import { BrowserWindow } from "electron";
import { GridPageType, MonomeGrid } from "./monome_grid";
import { Track } from "./track";
import { AbletonLive } from "./ableton_live";


export class Sequencer {
  grid: MonomeGrid;
  daw: AbletonLive;
  midiIn: any;
  // midiOut: any;
  ticks: number = 0;
  superMeasure: number = 4;
  activeTrack: number | undefined = undefined;
  playing: any = undefined;
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


  constructor() {
    this.grid = new MonomeGrid(this);
    this.daw = new AbletonLive();
    this.midiIn = new easymidi.Input("tblswvs in", true);
    // this.midiOut = new easymidi.Output("tblswvs out", true);
  }


  async connectToGrid(id: string) {
    const msg = await this.grid.connect(id);
    return msg;
  }


  refreshAbleton() {
    this.daw.syncAbletonClip(this.activeTrack, 0, this.tracks[this.activeTrack]);
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
