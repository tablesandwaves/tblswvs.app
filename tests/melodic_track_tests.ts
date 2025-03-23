import { expect } from "chai";
import { AbletonTrack } from "../app/model/ableton/track";
import { Sequencer } from "../app/model/sequencer";
import { AbletonLive } from "../app/model/ableton/live";
import { configDirectory, patternForRhythmSteps, rhythmStepsForPattern, velocityWithinRange } from "./test_helpers";
import { MelodicTrack } from "../app/model/ableton/melodic_track";


const testing   = true;
const sequencer = new Sequencer(configDirectory, testing);
const daw       = new AbletonLive(sequencer);
// const track     = daw.tracks[6] as MelodicTrack;


describe("AbletonTrack", () => {
  describe("generating output notes", () => {
    const track = daw.tracks[6] as MelodicTrack;

    it("should convert a melodic array to a two dimentional array (for polyphony)", () => {
      track.setInputNotes([
        [{octave: 3, note: "C", midi: 60}],
        [{octave: 3, note: "D", midi: 62}]
      ]);

      const expected = [
        [{octave: 3, note: "C", midi: 60}],
        [{octave: 3, note: "D", midi: 62}]
      ];
      expect(track.outputNotes).to.deep.eq(expected);
    });

    it("should set chord progression notes as is in their 2D form", () => {
      track.setInputNotes([
        [{octave: 3, note: "C", midi: 60},  {octave: 3, note: "G", midi: 67}],
        [{octave: 3, note: "C", midi: 60},  {octave: 3, note: "Eb", midi: 63}],
      ]);

      const expected = [
        [{octave: 3, note: "C", midi: 60},  {octave: 3, note: "G", midi: 67}],
        [{octave: 3, note: "C", midi: 60},  {octave: 3, note: "Eb", midi: 63}],
      ];
      expect(track.outputNotes).to.deep.eq(expected);
    });
  });


  describe("generating Ableton notes for a track", () => {
    describe("with a beat length of 12 16th notes", () => {

      const track = daw.tracks[6] as MelodicTrack;
      track.rhythmStepLength = 12;
      track.rhythm = rhythmStepsForPattern([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      track.rhythm[0] = {state: 1, probability: 1, fillRepeats: 0, timingOffset: 0};
      track.setInputNotes([
        [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
        [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }],
        [{ octave: 3, note: 'G', midi: 67, scaleDegree: 5 }]
      ]);
      track.updateCurrentAbletonNotes();
      let abletonNotes = track.currentAbletonNotes.sort((a, b) => {
        if (a.clipPosition > b.clipPosition) return 1;
        if (a.clipPosition < b.clipPosition) return -1;
        return 0;
      });

      it("should the have correct number of notes for the maximum super measure of 8", () => {
        expect(abletonNotes.length).to.eq(11);
      });

      it("should have the right notes in order", () => {
        expect(abletonNotes[0].midiNote).to.eq(60);
        expect(abletonNotes[1].midiNote).to.eq(63);
        expect(abletonNotes[2].midiNote).to.eq(67);
      });

      it("should place the notes at the correct positions", () => {
        expect(abletonNotes[0].clipPosition).to.eq(0);
        expect(abletonNotes[1].clipPosition).to.eq(3);
        expect(abletonNotes[2].clipPosition).to.eq(6);
      });
    });
  });


  describe("when generating rhythmic fills", () => {
    const track = daw.tracks[6] as MelodicTrack;
    track.rhythmStepLength = 16;
    track.setInputNotes([[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]]);
    track.rhythm = rhythmStepsForPattern([
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    track.rhythm[0]       = {state: 1, probability: 1, fillRepeats: 3, timingOffset: 0};
    track.fillMeasures[1] = 1;
    track.updateCurrentAbletonNotes();
    const abletonNotes = track.currentAbletonNotes.sort((a, b) => {
      if (a.clipPosition > b.clipPosition) return 1;
      if (a.clipPosition < b.clipPosition) return -1;
      return 0;
    });

    it("should the have correct number of notes for the maximum super measure of 8", () => {
      expect(abletonNotes.length).to.eq(11);
    });

    it("should have the right notes in order", () => {
      expect(abletonNotes[0].midiNote).to.eq(60);
      expect(abletonNotes[1].midiNote).to.eq(60);
      expect(abletonNotes[2].midiNote).to.eq(60);
      expect(abletonNotes[3].midiNote).to.eq(60);
      expect(abletonNotes[4].midiNote).to.eq(60);
    });

    it("should place the notes at the correct positions", () => {
      expect(abletonNotes[0].clipPosition).to.eq(0);
      expect(abletonNotes[1].clipPosition).to.eq(4);
      expect(abletonNotes[2].clipPosition).to.eq(4.25);
      expect(abletonNotes[3].clipPosition).to.eq(4.5);
      expect(abletonNotes[4].clipPosition).to.eq(4.75);
    });
  });


  describe("truncating note durations for overlapping notes", () => {
    // const track = new AbletonTrack(daw, {name: "Kick", type: "MelodicTrack", dawIndex: 1, rampSequencer: false});
    const track = daw.tracks[6] as MelodicTrack;
    track.rhythmStepLength = 16;
    track.noteLength       = "8n";
    track.rhythm = rhythmStepsForPattern([
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    track.rhythm[0] = {state: 1, probability: 1, fillRepeats: 0, timingOffset: 0};
    track.rhythm[1] = {state: 1, probability: 1, fillRepeats: 0, timingOffset: 0};
    track.rhythm[4] = {state: 1, probability: 1, fillRepeats: 0, timingOffset: 0};

    describe("when successive overlapping notes share the same pitch", () => {
      track.setInputNotes([[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]]);
      track.updateCurrentAbletonNotes();

      const abletonNotes = track.currentAbletonNotes.sort((a, b) => {
        if (a.clipPosition > b.clipPosition) return 1;
        if (a.clipPosition < b.clipPosition) return -1;
        return 0;
      });

      it("truncates earlier notes that share the same pitch", () => {
        // Measure 1
        expect(abletonNotes[0].duration).to.eq(0.25);
        // Measure 2
        expect(abletonNotes[3].duration).to.eq(0.25);
      });

      it("does not truncate notes that do not overlap", () => {
        // Measure 1
        expect(abletonNotes[1].duration).to.eq(0.5);
        expect(abletonNotes[2].duration).to.eq(0.5);
        // Measure 2
        expect(abletonNotes[4].duration).to.eq(0.5);
        expect(abletonNotes[5].duration).to.eq(0.5);
      });
    });

    describe("when successive overlapping notes do not share the same pitch", () => {
      track.setInputNotes([
        [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
        [{ octave: 3, note: 'D', midi: 62, scaleDegree: 1 }],
        [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]
      ]);
      track.updateCurrentAbletonNotes();

      it("does not truncate earlier notes", () => {
        // Measure 1
        expect(track.currentAbletonNotes[0].duration).to.eq(0.5);
        // Measure 2
        expect(track.currentAbletonNotes[3].duration).to.eq(0.5);
      });
    });
  });
});
