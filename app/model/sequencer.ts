const easymidi = require("easymidi");
import { Key, Scale } from "tblswvs";
import { BrowserWindow } from "electron";
import { MonomeGrid } from "./grid/monome_grid";
import { Track, RhythmStep } from "./track";
import { AbletonLive } from "./ableton/live";
import { AbletonNote, noteLengthMap } from "./ableton/note";
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
  queuedMelody: note[] = new Array();
  queuedChordProgression: note[][] = new Array();
  mutatingTracks: number[] = [0, 0, 0, 0, 0, 0];
  mutations = [
    {name: "trps-2",  function: "transposeDown2",  active: 0},
    {name: "rev",     function: "reverseMelody",   active: 0},
    {name: "rot-3",   function: "rotateLeftThree", active: 0},
    {name: "sort",    function: "sortMelody",      active: 0},
    {name: "-sort",   function: "revSortMelody",   active: 0},
    {name: "inv",     function: "invert",          active: 0},
    {name: "inv-rev", function: "invertReverse",   active: 0},
    {name: "bitflip", function: "bitFlip",         active: 0},
  ];


  constructor(testing: boolean = false) {
    if (!testing) {
      this.grid = new MonomeGrid(this);
      this.daw = new AbletonLive(this);
      this.midiIn = new easymidi.Input("tblswvs in", true);
    }
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
      this.abletonNotesForCurrentTrack(),
      newClip
    );
  }


  abletonNotesForCurrentTrack(): AbletonNote[] {
    let abletonNotes: AbletonNote[] = new Array(), noteIndex = 0, nextNotes: note[];

    const beatLength = this.getActiveTrack().beatLength;
    const size = Math.ceil((this.superMeasure * 16 / beatLength));
    const expandedRhythm = new Array(size)
            .fill(this.getActiveTrack().rhythm.slice(0, beatLength))
            .flat()
            .slice(0, this.superMeasure * 16);

    abletonNotes.push(...expandedRhythm.reduce((abletonNotes: AbletonNote[], rhythmStep: RhythmStep, i) => {
      if (rhythmStep.state == 1) {
        nextNotes = this.tracks[this.activeTrack].outputNotes[noteIndex % this.getActiveTrack().outputNotes.length];
        // An undefined note in the notes array corresponds to a rest in the melody.
        if (nextNotes != undefined) {
          // Track.outputNotes is a 2-d array to accommodate chords. However, the notes passed to Ableton are
          // represented as a 1-dimensional array because they contain explicit timing offsets.
          nextNotes.forEach(nextNote => {
            abletonNotes.push(new AbletonNote(
              nextNote.midi,
              (i * 0.25),
              noteLengthMap[this.getActiveTrack().noteLength].size,
              64,
              rhythmStep.probability
            ));
          });
        }
        noteIndex += 1;
      }
      return abletonNotes;
    }, []));

    return abletonNotes;
  }


  async follow() {
    this.midiIn.on("clock", () => {
      this.ticks++;
      if (this.ticks % 6 != 0) return;

      this.grid.displayRhythmWithTransport(this.step % this.getActiveTrack().beatLength);
      this.step = this.step == this.superMeasure * 16 - 1 ? 0 : this.step + 1;
    });

    this.midiIn.on("start", () => {
    });

    this.midiIn.on("position", (data: any) => {
      if (data.value != 0) return;

      this.ticks = 0;
      this.step  = 0;
      this.grid.displayRhythmWithTransport(this.step);
    });
  }
}
