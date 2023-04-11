const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");
import { note } from "tblswvs";

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
          if (!this.sequencer.soloists.includes(trackIndex)) {
            // The track may be set to mutating before the evolutionary/mutation cycle has been queued.
            let currentClip = (this.sequencer.mutating && track.mutating) ?
                              AbletonLive.EVOLUTION_SCENE_INDEX :
                              track.currentClip;
            this.emitter.emit(`/tracks/${trackIndex}/clips/${currentClip}/fire`);

            // If the sequencer is in mutation and the current track, but not while trading solos,
            // evolve the curent track.
            if (this.sequencer.mutating && track.mutating) {
              this.sequencer.evolve(trackIndex);
            }
          }
        });

        // If the sequencer is mutating and there are soloists, setup the next soloists melody.
        if (this.sequencer.mutating && this.sequencer.soloists.length > 0) {
          this.sequencer.soloistIndex++;
          const soloingTrackIndex = this.sequencer.soloists[this.sequencer.soloistIndex % this.sequencer.soloists.length];
          this.sequencer.evolve(soloingTrackIndex, true);
          this.sequencer.soloists.forEach(trackIndex => {
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
