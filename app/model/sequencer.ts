const easymidi = require("easymidi");
import { Key, Melody, Mutation, Scale } from "tblswvs";
import { BrowserWindow } from "electron";
import { MonomeGrid } from "./grid/monome_grid";
import { AbletonLive } from "./ableton/live";
import { AbletonTrack } from "./ableton/track";
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
  gui: BrowserWindow;
  key: Key;
  queuedMelody: note[] = new Array();
  queuedChordProgression: note[][] = new Array();

  // Melodic Evolution
  mutating: boolean = false;
  mutations = [
    {name: "trps-2",  function: "transposeDown2",  active: 0},
    {name: "rev",     function: "reverse",         active: 0},
    {name: "rot-3",   function: "rotateLeftThree", active: 0},
    {name: "sort",    function: "sort",            active: 0},
    {name: "-sort",   function: "reverseSort",     active: 0},
    {name: "inv",     function: "invert",          active: 0},
    {name: "inv-rev", function: "invertReverse",   active: 0},
    {name: "bitflip", function: "bitFlip",         active: 0},
  ];
  soloists: number[] = new Array();
  soloistIndex = -1;
  currentSoloistMelody: note[] = new Array();


  constructor(testing: boolean = false) {
    if (!testing) {
      this.grid   = new MonomeGrid(this);
      this.daw    = new AbletonLive(this);
      this.midiIn = new easymidi.Input("tblswvs in", true);
    }
    this.key = new Key(60, Scale.Minor);
  }


  async connectToGrid() {
    const msg = await this.grid.connect();
    return msg;
  }


  getActiveTrack(): AbletonTrack {
    return this.daw.tracks[this.activeTrack];
  }


  refreshAbleton(newClip: boolean) {
    this.daw.setNotes(
      this.activeTrack,
      this.daw.abletonNotesForCurrentTrack(),
      newClip
    );
  }


  evolve(trackIndex: number, tradingVoices?: boolean) {
    let   mutatedMelody   = new Array();
    const activeMutations = this.mutations.filter(m => m.active == 1).map(m => m.function);
    const gatesPerMeasure = this.daw.tracks[trackIndex].rhythm.reduce((a, b) => a + b.state, 0);

    let mutationSource = tradingVoices ? this.currentSoloistMelody : this.daw.tracks[trackIndex].currentMutation;

    for (let i = 0; i < this.superMeasure; i++) {
      const melody = new Array();
      for (let j = 0; j < gatesPerMeasure; j++) {
        melody.push(
          mutationSource[(i * gatesPerMeasure + j) % mutationSource.length]
        );
      }

      mutatedMelody = mutatedMelody.concat(Mutation.random(new Melody(melody, this.key), activeMutations).notes);
    }

    // Update both current mutation melodies: the track so it is picked up when setting MIDI notes
    // (via abletonNotesForCurrentTrack()) and the sequencer so it is mutated for the next soloist
    // when trading voices.
    this.daw.tracks[trackIndex].currentMutation = mutatedMelody;
    this.currentSoloistMelody = mutatedMelody;
    this.daw.setNotes(
      trackIndex,
      this.daw.abletonNotesForCurrentTrack(trackIndex),
      false,
      AbletonLive.EVOLUTION_SCENE_INDEX
    );
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
