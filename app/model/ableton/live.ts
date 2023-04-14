import { Melody, Mutation, note } from "tblswvs";
import { AbletonNote, noteLengthMap } from "./note";
import { AbletonTrack, RhythmStep } from "./track";
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
      new AbletonTrack("Kick",  sequencer),
      new AbletonTrack("Snare", sequencer),
      new AbletonTrack("HiHat", sequencer),
      new AbletonTrack("Perc",  sequencer),
      new AbletonTrack("Opsix", sequencer),
      new AbletonTrack("Hydra", sequencer)
    ];
  }


  refresh(newClip: boolean) {
    this.sequencer.setNotes(this.activeTrack, this.abletonNotesForCurrentTrack(), newClip);
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
    // (via abletonNotesForCurrentTrack()) and the currentSoloistMelody so it is mutated for the next
    // soloist when trading voices.
    this.tracks[trackIndex].currentMutation = mutatedMelody;
    this.currentSoloistMelody = mutatedMelody;
    this.sequencer.setNotes(
      trackIndex,
      this.abletonNotesForCurrentTrack(trackIndex),
      false,
      AbletonLive.EVOLUTION_SCENE_INDEX
    );
  }
}
