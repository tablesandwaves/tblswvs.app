const easymidi = require("easymidi");
import { Key, Scale } from "tblswvs";
import { BrowserWindow } from "electron";
import { GridPageType, MonomeGrid } from "./grid/monome_grid";
import { Track } from "./track";
import { AbletonLive } from "./ableton/live";
import { AbletonNote } from "./ableton/note";
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
  queuedNotes: note[] = new Array();


  constructor() {
    this.grid = new MonomeGrid(this);
    this.daw = new AbletonLive(this);
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


  refreshAbleton(newClip: boolean) {
    this.daw.setNotes(
      this.activeTrack,
      this.#abletonNotesForCurrentTrack(),
      newClip
    );
  }


  #abletonNotesForCurrentTrack(): AbletonNote[] {
    let abletonNotes: AbletonNote[] = new Array();

    let noteIndex = 0, nextNote;
    for (let measure = 0; measure < this.superMeasure; measure++) {
      abletonNotes.push(...this.tracks[this.activeTrack].rhythm.reduce((abletonNotes: AbletonNote[], step: number, i) => {
        if (step == 1) {
          nextNote = this.tracks[this.activeTrack].outputMelody[noteIndex % this.tracks[this.activeTrack].outputMelody.length];
          // An undefined note in the notes array corresponds to a rest in the melody.
          if (nextNote != undefined)
            abletonNotes.push(new AbletonNote(nextNote.midi, ((measure * 4) + (i * 0.25)), 0.25, 64));
          noteIndex += 1;
        }
        return abletonNotes;
      }, []));
    }

    return abletonNotes;
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
