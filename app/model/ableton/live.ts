import { note } from "tblswvs";
import { AbletonNote } from "./note";
import { AbletonTrack } from "./track";
import { Sequencer } from "../sequencer";


export class AbletonLive {
  static EVOLUTION_SCENE_INDEX = 4;

  fetchedNotes: AbletonNote[] = new Array();
  tracks: AbletonTrack[];
  sequencer: Sequencer;
  activeTrack: number = 0;

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


  constructor(sequencer: Sequencer) {
    this.sequencer = sequencer;

    this.tracks = [
      new AbletonTrack("Kick",  this, 0),
      new AbletonTrack("Snare", this, 1),
      new AbletonTrack("HiHat", this, 2),
      new AbletonTrack("Perc",  this, 3),
      new AbletonTrack("Opsix", this, 4),
      new AbletonTrack("Hydra", this, 5)
    ];
  }


  updateActiveTrackNotes() {
    this.sequencer.setNotes(this.activeTrack, this.getActiveTrack().abletonNotes());
  }


  getActiveTrack(): AbletonTrack {
    return this.tracks[this.activeTrack];
  }
}
