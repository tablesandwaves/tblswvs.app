import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { AbletonLive } from "../app/model/ableton/live";
import { configDirectory, patternForRhythmSteps } from "./test_helpers";
import { DrumTrack } from "../app/model/ableton/drum_track";


const testing   = true;
const sequencer = new Sequencer(configDirectory, testing);
const daw       = new AbletonLive(sequencer);


describe("DrumTrack", () => {
  describe("a drum pad note sequence", () => {
    describe("setting a single step", () => {
      const track = new DrumTrack(daw, {name: "Perc", type: "MelodicTrack", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}]);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("C");
        expect(track.outputNotes[0][0].midi).to.eq(36);
      });
    });


    describe("setting a single step with polyphony", () => {
      const track = new DrumTrack(daw, {name: "Perc 2", type: "DrumTrack", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}, {octave: 1, note: "D", midi: 38}]);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("C");
        expect(track.outputNotes[0][0].midi).to.eq(36);
        expect(track.outputNotes[0][1].octave).to.eq(1);
        expect(track.outputNotes[0][1].note).to.eq("D");
        expect(track.outputNotes[0][1].midi).to.eq(38);
      });
    });


    describe("setting multiple steps", () => {
      const track = new DrumTrack(daw, {name: "Perc", type: "DrumTrack", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}]);
      track.setDrumPadStep(8, [{octave: 1, note: "Eb", midi: 39}]);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("C");
        expect(track.outputNotes[0][0].midi).to.eq(36);
        expect(track.outputNotes[1][0].octave).to.eq(1);
        expect(track.outputNotes[1][0].note).to.eq("Eb");
        expect(track.outputNotes[1][0].midi).to.eq(39);
      });
    });


    describe("removing a step", () => {
      const track = new DrumTrack(daw, {name: "Perc 2", type: "DrumTrack", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}]);
      track.setDrumPadStep(8, [{octave: 1, note: "Eb", midi: 39}]);
      track.setDrumPadStep(0, undefined);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("Eb");
        expect(track.outputNotes[0][0].midi).to.eq(39);
      });
    });


    describe("removing one note from a step with multiple notes", () => {
      const track = new DrumTrack(daw, {name: "Perc", type: "DrumTrack", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}, {octave: 1, note: "D", midi: 38}]);
      track.setDrumPadStep(0, [{octave: 1, note: "D", midi: 38}]);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("D");
        expect(track.outputNotes[0][0].midi).to.eq(38);
      });
    });
  });
});
