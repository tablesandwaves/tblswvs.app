const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");
const easymidi    = require("easymidi");
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";


import { Key, Scale } from "tblswvs";
import { BrowserWindow } from "electron";
import { MonomeGrid } from "./monome_grid";
import { AbletonLive, EVOLUTION_SCENE_INDEX } from "./ableton/live";
import { AbletonTrack } from "./ableton/track";
import { pulseRateMap } from "./ableton/note";
import { HarmonicAutomaton } from "./automata/harmonic_automaton";
import { InputNoteController } from "../controller/input_note_controller";
import { DrumInputNoteController } from "../controller/drum_input_note_controller";


export type BeatVoice = {
  track: string,
  hits: number[],
  velocities: number[]
}


export type Beat = {
  group: string,
  name: string,
  length: number,
  voices: BeatVoice[],
  button_xy: number[]
}


export type BeatGroup = {
  name: string,
  beats: Record<string, Beat>
}


export type BeatSet = {
  groups: Record<string, BeatGroup>
}


export type StagedClipChange = {
  dawIndex: number,
  clipIndex: number
}


export class Sequencer {
  configDirectory: string;
  emitter: any;
  receiver: any;
  midiOut: any;
  midiIn: any;
  grid: MonomeGrid;
  daw: AbletonLive;
  ticks: number = 0;
  superMeasure: number = 4;
  gui: BrowserWindow;
  #key: Key;
  automaton: HarmonicAutomaton;
  markovy: boolean = false;
  testing: boolean;
  beatPatterns: BeatSet;
  activeBeatPattern: Beat = undefined;
  humanize: boolean = false;
  hihatSwing: boolean = false;
  drunk: boolean = false;
  ghostNotes: boolean = false;
  stagedClipChangeTracks: StagedClipChange[] = new Array();


  constructor(configDirectory: string, testing: boolean = false) {
    this.testing = testing;

    this.configDirectory = configDirectory;
    this.grid = new MonomeGrid(this, testing);
    this.daw  = new AbletonLive(this);
    this.#key = new Key(60, Scale.Minor);

    this.automaton = new HarmonicAutomaton(
      yaml.load(fs.readFileSync(path.resolve(configDirectory, "automata_harmonic_standard.yml"), "utf8")),
      this.#key
    );
    // Debug automata output to terminal console
    // this.automaton.logging = true;

    if (!this.testing) {

      // To Live
      this.emitter = new OscEmitter();
      this.emitter.add("localhost", 33333);

      // From Live
      this.receiver = new OscReceiver();
      this.receiver.bind(33334, "localhost");
      this.receiver.on("/live/clips", (tIdx: number, cIdx: number) => this.#syncLiveTrackClip(tIdx, cIdx));
      this.receiver.on("/live/transport", (step: number) => this.transport(step));

      // Receive Markovy requests for sending notes to Live
      this.receiver.on("/next", () => {
        this.automaton.next().forEach(noteData => this.emitter.emit("/note", ...noteData));
      });

      // For debugging: all messages are logged.
      // this.receiver.on("message", this.#processLiveMessages);

      this.midiOut = new easymidi.Output("tblswvs.app", true);
      this.midiIn  = new easymidi.Input("tblswvs.app in", true);
    }
  }


  get key() {
    return this.#key;
  }


  set key(key: Key) {
    this.#key = key;
    this.automaton.key = key;
  }


  setBeatPatterns(beatPatterns: BeatSet) {
    this.beatPatterns = beatPatterns;
  }


  async connectToGrid() {
    const msg = await this.grid.connect();
    return msg;
  }


  transport(step: number) {
    // If the current track is set to an 8n pulse, for example, don't advance on fractions of a step.
    const trackStep = Math.floor(step / pulseRateMap[this.daw.getActiveTrack().pulseRate].size);
    // Next find the step within the measure by modulo division against the rhythm step length
    const measureStep = trackStep % this.daw.getActiveTrack().rhythmStepLength;
    // Finally, account for whether the track has a breakpoint less than the rhythm step length
    if (this.daw.getActiveTrack().rhythmStepBreakpoint < this.daw.getActiveTrack().rhythmStepLength) {
      if (measureStep < this.daw.getActiveTrack().rhythmStepBreakpoint) {
        this.grid.displayRhythmWithTransport(measureStep, step)
      } else {
        // Second row: skip the last portion of the first 16 steps.
        const adjustedStep = measureStep + 16 - this.daw.getActiveTrack().rhythmStepBreakpoint;
        this.grid.displayRhythmWithTransport(adjustedStep, step)
      }
    } else {
      this.grid.displayRhythmWithTransport(measureStep, step);
    }

    // If on the first beat of the last measure, fire any mutating clips
    if (step == (this.superMeasure * 16) - 16) {
      this.#fireEvolvingTrackClips();
    }

    // If on the last beat of the last measure of a super measure, update mutations that may be active.
    if (step == (this.superMeasure * 16) - 4) {
      // Update randomizing and mutating tracks.
      this.#syncTracksToSuperMeasure();

      // Update soloing tracks.
      if (this.daw.mutating && this.daw.soloists.length > 0) {
        this.#queueNextSoloist();
      }
    }
  }


  async follow() {
    this.midiIn.on("clock", () => {
      this.ticks++;
      if (this.ticks % 12 != 0) return;

      this.daw.tracks.forEach(track => {
        if (track.accompaniment) {
          const midiNoteNumber = this.key.degree(
            Math.round(Math.random() * 15 + 1) * (Math.random() > 0.5 ? 1 : -1)
          ).midi;
          this.midiOut.send("noteon", {
            note: midiNoteNumber,
            velocity: 64,
            channel: track.dawIndex
          });

          setTimeout(() => {
            this.grid.sequencer.midiOut.send("noteoff", {
              note: midiNoteNumber,
              velocity: 64,
              channel: track.dawIndex
            });
          }, 100);
        }
      });
    });

    this.midiIn.on("start", () => {
      // console.log("start");
    });

    this.midiIn.on("position", (data: any) => {
      if (data.value != 0) return;
      this.ticks = 0;
    });
  }


  startMarkovy() {
    this.emitter.emit("/markovy_start");
  }


  stopMarkovy() {
    this.emitter.emit("/markovy_stop");
  }


  setNotesInLive(track: AbletonTrack, clip?: number) {
    const clipIndex = this.daw.mutating && (track.mutating || track.randomizing || track.soloing) ?
                      EVOLUTION_SCENE_INDEX :
                      clip ? clip : track.currentClip;

    track.updateCurrentAbletonNotes(clipIndex);

    if (this.testing) return;

    try {
      this.emitter.emit(
        `/tracks/${track.dawIndex}/clips/${clipIndex}/notes`,
        ...track.clips[clipIndex].currentAbletonNotes.flatMap(note => note.toOscAddedNote())
      );
    } catch (e) {
      console.error(e.name, e.message, `while sending ${track.name} notes to Live:`);
      console.error("algorithm:", track.algorithm);
      console.error("input notes:", track.clips[clipIndex].currentAbletonNotes);
      console.error("OSC mapped notes", ...track.clips[clipIndex].currentAbletonNotes.flatMap(note => note.toOscAddedNote()));
      console.error("trackIndex", track.dawIndex, "mutating", track.mutating, "randomizing", track.randomizing);
      console.error("Current track mutation", track.currentMutation);
    }
  }


  setRampSequence(track: AbletonTrack) {
    if (this.testing) return;
    try {
      this.emitter.emit(
        `/tracks/${track.dawIndex}/ramp_seq/${track.editableRampSequence}`,
        ...track.getEditableRampSequence().deviceData()
      );
    } catch (e) {
      console.error(e.name, e.message, "while sending ramp sequence data to Live:");
      console.error("ramp sequence data:", track.getEditableRampSequence().deviceData());
      console.error("trackIndex", track.dawIndex);
    }
  }


  clearRampSequence(track: AbletonTrack) {
    if (this.testing) return;
    try {
      this.emitter.emit(`/tracks/${track.dawIndex}/ramp_seq/${track.editableRampSequence}`, "clear_macro");
    } catch (e) {
      console.error(e.name, e.message, "while clearing ramp sequence in Live:");
      console.error("ramp sequence data:", track.getEditableRampSequence().deviceData());
      console.error("trackIndex", track.dawIndex);
    }
  }


  activateRampSequence(track: AbletonTrack) {
    if (this.testing) return;
    try {
      this.emitter.emit(`/tracks/${track.dawIndex}/ramp_seq/${track.editableRampSequence}`, "map_macro");
    } catch (e) {
      console.error(e.name, e.message, "while activating ramp sequence in Live:");
      console.error("ramp sequence data:", track.getEditableRampSequence().deviceData());
      console.error("trackIndex", track.dawIndex);
    }
  }


  selectActiveTrack(track: AbletonTrack) {
    if (this.testing) return;
    try {
      this.emitter.emit(`/tracks/${track.dawIndex}`);
    } catch (e) {
      console.error(e.name, e.message, "while selecting the active track in Live:");
      console.error("trackIndex", track.dawIndex);
    }
  }


  setTrackChain(track: AbletonTrack) {
    if (this.testing) return;

    try {
      this.emitter.emit(`/tracks/${track.dawIndex}/chains/${track.activeChain}`);
    } catch (e) {
      console.error(e.name, e.message, "while updating the active chain in Live:");
      console.error("trackIndex", track.dawIndex);
    }
  }


  updateSuperMeasure() {
    if (this.testing) return;

    try {
      this.emitter.emit(`/set/super_measure`, this.superMeasure);
    } catch (e) {
      console.error(e.name, e.message, "while updating the super measure in Live:");
    }
  }


  clearClipEnvelopes() {
    if (this.testing) return;

    const track = this.daw.getActiveTrack();
    try {
      this.emitter.emit(`/tracks/${track.dawIndex}/clips/${track.currentClip}/envelopes/clear`);
    } catch (e) {
      console.error(e.name, e.message, "while clearing the clip envelopes in Live:");
      console.error("trackIndex", track.dawIndex, "clipIndex", track.currentClip);
    }
  }


  /**
   * Sync tblswvs.app to clip changes that were triggered in Live itself.
   *
   * Live has clip/scene observers (including stop all clips) and will send a message over OSC
   * so that this app can know which clips are active.
   */
  #syncLiveTrackClip(trackIndex: number, clipIndex: number) {
    // Only sync track indices that were loaded by tracks.yml and clip scenes 1-4 (index 0-3).
    // Clip scene 5 is for melodic mutations.
    if (this.daw.dawIndices.includes(trackIndex) && clipIndex < 4) {
      const track = this.daw.tracks.find(t => t.dawIndex == trackIndex);

      if (track.mutating || track.randomizing || track.soloing) return;

      track.currentClip = clipIndex == -2 ? -1 : clipIndex;
      if (this.daw.getActiveTrack().dawIndex == trackIndex) {
        track.updateGuiCurrentClip();
      }
    }
  }


  #syncTracksToSuperMeasure() {
    // If the DAW is not mutating AND the DAW stopMutationFlag is set
    // * Get all tracks back to their current clip (which may be -1 for stopped)
    // * reset the DAW's stopMutationFlag
    if (!this.daw.mutating && this.daw.stopMutationQueued) {

      this.daw.tracks.forEach(track => {
        if (track.currentClip >= 0) {
          this.emitter.emit(`/tracks/${track.dawIndex}/clips/${track.currentClip}/fire`);
        } else {
          this.emitter.emit(`/tracks/${track.dawIndex}/clips/stop`);
        }
        track.updateCurrentAbletonNotes();
        if (track.dawIndex == this.daw.getActiveTrack().dawIndex) {
          track.updateGuiPianoRoll();
        }
      });
      this.daw.stopMutationQueued = false;

    } else if (this.daw.mutating) {

      // Otherwise, evolve all mutating and randomizing tracks
      this.daw.tracks.forEach(track => {
        if (track.randomizing || track.mutating) {
          track.evolve();
        }
      });
    }

    // Look for any tracks that have added new clips in the current super measure
    this.stagedClipChangeTracks.forEach(stagedClipChange => {
      this.emitter.emit(`/tracks/${stagedClipChange.dawIndex}/clips/${stagedClipChange.clipIndex}/fire`);

      const track = this.daw.tracks.find(t => t.dawIndex == stagedClipChange.dawIndex);

      track.currentClip = stagedClipChange.clipIndex;

      if (this.daw.getActiveTrack().dawIndex == track.dawIndex)
        track.updateGuiPianoRoll();

      if (this.grid.activePage instanceof InputNoteController || this.grid.activePage instanceof DrumInputNoteController)
        (this.grid.activePage as InputNoteController).setCurrentClipGridDisplay();

    });
    this.stagedClipChangeTracks = new Array();
  }


  #fireEvolvingTrackClips() {
    if (!this.daw.mutating) return;

    this.daw.tracks.forEach(track => {
      if ((track.randomizing || track.mutating) && track.evolvingQueued) {
        this.emitter.emit(`/tracks/${track.dawIndex}/clips/${EVOLUTION_SCENE_INDEX}/fire`);
        track.evolvingQueued = false;
      }
    });
  }


  #queueNextSoloist() {
    // If the sequencer is mutating and there are soloists, setup the next soloists melody.
    if (this.daw.mutating && this.daw.soloists.length > 0) {
      this.daw.soloistIndex++;
      const soloingTrackDawIndex = this.daw.soloists[this.daw.soloistIndex % this.daw.soloists.length];

      this.daw.tracks.find(t => t.dawIndex == soloingTrackDawIndex).evolve(true);
      this.daw.soloists.forEach(dawIndex => {
        if (dawIndex == soloingTrackDawIndex) {
          this.emitter.emit(`/tracks/${dawIndex}/clips/${EVOLUTION_SCENE_INDEX}/fire`);
        } else {
          this.emitter.emit(`/tracks/${dawIndex}/clips/stop`);
        }
      });
    }
  }


  /**
   * For debugging.
   *
   * @param response OSC response array
   */
  #processLiveMessages(...response: any[]) {
    console.log(response[0], response.slice(1).join(", "));
  }
}
