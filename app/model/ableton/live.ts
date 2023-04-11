const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");
import { Melody, Mutation, note } from "tblswvs";

import { AbletonNote, noteLengthMap } from "./note";
import { AbletonTrack, RhythmStep } from "./track";
import { Sequencer } from "../sequencer";


export class AbletonLive {
  static EVOLUTION_SCENE_INDEX = 4;

  emitter: any;
  receiver: any;
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
      new AbletonTrack("Kick",  sequencer),
      new AbletonTrack("Snare", sequencer),
      new AbletonTrack("HiHat", sequencer),
      new AbletonTrack("Perc",  sequencer),
      new AbletonTrack("Opsix", sequencer),
      new AbletonTrack("Hydra", sequencer)
    ];

    // To Live
    this.emitter = new OscEmitter();
    this.emitter.add("localhost", 33333);

    // From Live
    this.receiver = new OscReceiver();
    this.receiver.bind(33334, "localhost");
    this.receiver.on("/live/song/beat", (beatNumber: number) => this.#syncSuperMeasure(beatNumber));

    // For debugging: all messages are logged.
    // this.receiver.on("message", this.#processLiveMessages);
  }


  getActiveTrack(): AbletonTrack {
    return this.tracks[this.activeTrack];
  }


  abletonNotesForCurrentTrack(mutationTrackIndex?: number): AbletonNote[] {
    let abletonNotes: AbletonNote[] = new Array(), noteIndex = 0, nextNotes: note[];

    const track          = this.tracks[mutationTrackIndex ? mutationTrackIndex : this.activeTrack];
    const beatLength     = track.beatLength;
    const size           = Math.ceil((this.sequencer.superMeasure * 16 / beatLength));
    const expandedRhythm = new Array(size)
            .fill(track.rhythm.slice(0, beatLength))
            .flat()
            .slice(0, this.sequencer.superMeasure * 16);

    const sourceNotes = mutationTrackIndex ? track.currentMutation.map(n => [n]) : track.outputNotes;

    abletonNotes.push(...expandedRhythm.reduce((abletonNotes: AbletonNote[], rhythmStep: RhythmStep, i) => {
      if (rhythmStep.state == 1) {
        nextNotes = sourceNotes[noteIndex % sourceNotes.length];
        // Track.outputNotes is a 2-d array to accommodate chords. However, the notes passed to Ableton are
        // represented as a 1-dimensional array because they contain explicit timing offsets.
        nextNotes.forEach(nextNote => {
          // An undefined note in the notes array corresponds to a rest in the melody.
          if (nextNote != undefined) {
            nextNote = this.#shiftNote(track, noteIndex, nextNote);

            abletonNotes.push(new AbletonNote(
              nextNote.midi, (i * 0.25),
              noteLengthMap[track.noteLength].size,
              64, rhythmStep.probability
            ));
          }
        });
        noteIndex += 1;
      }
      return abletonNotes;
    }, []));

    return abletonNotes;
  }


  #shiftNote(track: AbletonTrack, noteIndex: number, nextNote: note) {
    if (!track.vectorShiftsActive) return nextNote;

    let shift = track.vectorShifts[noteIndex % track.vectorShiftsLength];
    if (shift == 0) return nextNote;

    let octaveShift   = nextNote.octave - 3;
    let shiftedDegree = nextNote.scaleDegree + shift;
    if (shiftedDegree == 0) {
      shiftedDegree = shift > 0 ? shiftedDegree + 1 : shiftedDegree - 1;
    }
    return this.sequencer.key.degree(shiftedDegree, octaveShift);
  }


  evolve(trackIndex: number, tradingVoices?: boolean) {
    let   mutatedMelody   = new Array();
    const activeMutations = this.mutations.filter(m => m.active == 1).map(m => m.function);
    const gatesPerMeasure = this.tracks[trackIndex].rhythm.reduce((a, b) => a + b.state, 0);

    let mutationSource = tradingVoices ? this.currentSoloistMelody : this.tracks[trackIndex].currentMutation;

    for (let i = 0; i < this.sequencer.superMeasure; i++) {
      const melody = new Array();
      for (let j = 0; j < gatesPerMeasure; j++) {
        melody.push(
          mutationSource[(i * gatesPerMeasure + j) % mutationSource.length]
        );
      }

      mutatedMelody = mutatedMelody.concat(Mutation.random(new Melody(melody, this.sequencer.key), activeMutations).notes);
    }

    // Update both current mutation melodies: the track so it is picked up when setting MIDI notes
    // (via abletonNotesForCurrentTrack()) and the sequencer so it is mutated for the next soloist
    // when trading voices.
    this.tracks[trackIndex].currentMutation = mutatedMelody;
    this.currentSoloistMelody = mutatedMelody;
    this.setNotes(
      trackIndex,
      this.abletonNotesForCurrentTrack(trackIndex),
      false,
      AbletonLive.EVOLUTION_SCENE_INDEX
    );
  }


  setNotes(trackIndex: number, notes: AbletonNote[], newClip: boolean, clipIndex?: number) {
    // let timeout = 0;

    if (newClip) {
      this.tracks[trackIndex].currentClip = (this.tracks[trackIndex].currentClip + 1) % 8;
      this.emitter.emit(
        `/tracks/${trackIndex}/clips/${this.tracks[trackIndex].currentClip}/create`,
        this.sequencer.superMeasure * 4
      );
    }

    clipIndex = clipIndex == undefined ? this.tracks[trackIndex].currentClip : clipIndex;
    try {
      this.emitter.emit(
        `/tracks/${trackIndex}/clips/${clipIndex}/notes`,
        ...notes.flatMap(note => note.toOscAddedNote())
      );
    } catch (e) {
      console.error(e.name, e.message, "while sending notes to Live:");
      console.error("input notes:", notes);
      console.error("OSC mapped notes", ...notes.flatMap(note => note.toOscAddedNote()));
      console.error("trackIndex", trackIndex, "mutating", this.sequencer.daw.tracks[trackIndex].mutating);
      console.error("Current track mutation", this.tracks[trackIndex].currentMutation);
    }

    // setTimeout(() => {
    //   this.emitter.emit(
    //     `/tracks/${trackIndex}/clips/${clipIndex}/notes`,
    //     ...notes.flatMap(note => note.toOscAddedNote())
    //   );
    // }, timeout);
  }


  #syncSuperMeasure(beat: number) {
    if (beat % 4 == 0) {
      const measure = ((beat / 4) % this.sequencer.superMeasure) + 1;
      if (measure == this.sequencer.superMeasure) {
        this.tracks.forEach((track, trackIndex) => {
          // If the current track is in the soloists group, skip this step as it will sync via soloing rules below.
          if (!this.soloists.includes(trackIndex)) {
            // The track may be set to mutating before the evolutionary/mutation cycle has been queued.
            let currentClip = (this.mutating && track.mutating) ?
                              AbletonLive.EVOLUTION_SCENE_INDEX :
                              track.currentClip;
            this.emitter.emit(`/tracks/${trackIndex}/clips/${currentClip}/fire`);

            // If the sequencer is in mutation and the current track, but not while trading solos,
            // evolve the curent track.
            if (this.mutating && track.mutating) {
              this.evolve(trackIndex);
            }
          }
        });

        // If the sequencer is mutating and there are soloists, setup the next soloists melody.
        if (this.mutating && this.soloists.length > 0) {
          this.soloistIndex++;
          const soloingTrackIndex = this.soloists[this.soloistIndex % this.soloists.length];
          this.evolve(soloingTrackIndex, true);
          this.soloists.forEach(trackIndex => {
            if (trackIndex == soloingTrackIndex) {
              this.emitter.emit(`/tracks/${trackIndex}/clips/${AbletonLive.EVOLUTION_SCENE_INDEX}/fire`);
            } else {
              this.emitter.emit(`/tracks/${trackIndex}/clips/stop`);
            }
          })
        }
      }

      this.sequencer.grid.sequencer.gui.webContents.send("transport-beat", measure);
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
