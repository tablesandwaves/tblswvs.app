import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { note } from "tblswvs";
import { AbletonNote } from "./note";
import { AbletonTrack } from "./track";
import { Sequencer } from "../sequencer";


export class AbletonLive {
  static EVOLUTION_SCENE_INDEX = 4;

  fetchedNotes: AbletonNote[] = new Array();
  tracks: AbletonTrack[] = new Array();
  dawIndices: number[] = new Array();
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

    this.#loadConfig().live_tracks.forEach((track: any) => {
      this.dawIndices.push(track.dawIndex);
      this.tracks.push(new AbletonTrack(track.name, this, track.dawIndex));
    });
  }


  updateActiveTrackNotes() {
    this.sequencer.setNotes(this.getActiveTrack());
  }


  getActiveTrack(): AbletonTrack {
    return this.tracks[this.activeTrack];
  }


  #loadConfig(): any {
    return yaml.load(
      fs.readFileSync(
        path.resolve(Sequencer.CONFIG_DIRECTORY, "tracks.yml"),
        "utf8"
      )
    );
  }
}
