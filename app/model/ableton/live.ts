import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { note } from "tblswvs";
import { AbletonNote, pulseRateMap } from "./note";
import { AbletonTrack, TrackConfig } from "./track";
import { Sequencer } from "../sequencer";
import { gcd, lcm } from "../../helpers/utils";


export class AbletonLive {
  static EVOLUTION_SCENE_INDEX = 4;

  fetchedNotes: AbletonNote[] = new Array();
  tracks: AbletonTrack[] = new Array();
  dawIndices: number[] = new Array();
  sequencer: Sequencer;
  activeTrack: number = 0;
  stagedClipChangeTracks: number[] = new Array();

  // Melodic Evolution
  mutating: boolean = false;
  stopMutationQueued: boolean = false;
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

    this.#loadConfig().live_tracks.forEach((trackConfig: TrackConfig) => {
      this.dawIndices.push(trackConfig.dawIndex);
      this.tracks.push(new AbletonTrack(this, trackConfig));
    });
  }


  updateActiveTrackNotes() {
    this.sequencer.setNotesInLive(this.getActiveTrack());
    this.getActiveTrack().updateGuiPianoRoll();
  }


  getActiveTrack(): AbletonTrack {
    return this.tracks[this.activeTrack];
  }


  rhythmSectionRhythm() {
    return this.combinedRhythm([0, 1, 2, 3]);
  }


  harmonicSectionRhythm() {
    return this.combinedRhythm([4, 5, 6]);
  }


  combinedRhythm(trackIndices: number[]) {
    const trackStepCounts = trackIndices.map(trackIndex => {
      return this.tracks[trackIndex].rhythmStepLength * pulseRateMap[this.tracks[trackIndex].pulseRate].size
    });
    let combinedTracksStepCount = trackStepCounts[0];
    trackStepCounts.slice(1).forEach(num => combinedTracksStepCount = lcm(combinedTracksStepCount, num));

    const superMeasureSteps    = this.sequencer.superMeasure * 16;
    const combinedRhythmLength = gcd(combinedTracksStepCount, superMeasureSteps) == combinedTracksStepCount ?
                                 combinedTracksStepCount :
                                 lcm(combinedTracksStepCount, superMeasureSteps) == superMeasureSteps ?
                                   combinedTracksStepCount :
                                   superMeasureSteps;

    let rhythm = new Array(combinedRhythmLength).fill(0);

    // For each rhythm track...
    for (let i = 0; i < trackIndices.length; i++) {
      const track     = this.tracks[trackIndices[i]];
      const pulseSize = pulseRateMap[track.pulseRate].size;

      // For each step in the combined rhythm, stepping at the current track's pulse rate
      for (let step = 0; step < combinedRhythmLength; step += pulseSize) {
        // If the current track step is on, turn on the combined rhythm step (may already be on, that's OK)
        if (track.rhythm[(step / pulseSize) % track.rhythmStepLength].state == 1) {
          rhythm[step] = 1;
        }
      }
    }

    return rhythm;
  }


  #loadConfig(): any {
    return yaml.load(
      fs.readFileSync(
        path.resolve(this.sequencer.configDirectory, "tracks_2024.4.yml"),
        "utf8"
      )
    ) as TrackConfig;
  }
}
