import { expect } from "chai";
import { rhythmStepsForPattern, patternForRhythmSteps } from "./test_helpers";
import { RhythmStep } from "../app/model/ableton/track";
import { surroundRhythm } from "../app/helpers/rhythm_algorithms";


describe("the Surround algorithm", () => {
  describe("produces rhythm steps a simple, 1 gate source rhythm", () => {
    const sourceRhythm = rhythmStepsForPattern([0, 1, 0]);
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("produces rhythm steps", () => expect(surroundingRhythm).to.be.instanceOf(Array<RhythmStep>));
    it("has the same length as the source rhythm", () => expect(surroundingRhythm.length).to.eq(sourceRhythm.length));

    it("has gates surrounding the step", () => {
      expect(surroundingRhythm[0].state).to.eq(1);
      expect(surroundingRhythm[1].state).to.eq(0);
      expect(surroundingRhythm[2].state).to.eq(1);
    });
  });


  describe("a source rhythm with a gate at position 0", () => {
    const sourceRhythm = rhythmStepsForPattern([1, 0, 0]);
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has no overlapping gate at position 0", () => expect(surroundingRhythm[0].state).to.eq(0));
    it("has a gate at 1 for the 'after' gate", () => expect(surroundingRhythm[1].state).to.eq(1));
    it("has a gate at the end for the wrapped 'before' gate", () => expect(surroundingRhythm[2].state).to.eq(1));
  });


  describe("a source rhythm with a gate at position step length - 1", () => {
    const sourceRhythm = rhythmStepsForPattern([0, 0, 1]);
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a gate at the start for the wrapped 'after' gate", () => expect(surroundingRhythm[0].state).to.eq(1));
    it("has a gate at step length - 2 for the 'before' gate", () => expect(surroundingRhythm[1].state).to.eq(1));
    it("has no overlapping gate at position step length - 1", () => expect(surroundingRhythm[2].state).to.eq(0));
  });


  describe("a source rhythm with with no on gates", () => {
    const sourceRhythm = rhythmStepsForPattern([0, 0, 0]);
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a surround rhythm with no surrounding gates", () => {
      expect(surroundingRhythm.map(step => step.state)).to.have.ordered.members([0, 0, 0]);
    });
  });


  describe("a source rhythm with with only on gates", () => {
    const sourceRhythm = rhythmStepsForPattern([1, 1, 1]);
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a surround rhythm with no surrounding gates", () => {
      expect(surroundingRhythm.map(step => step.state)).to.have.ordered.members([0, 0, 0]);
    });
  });


  describe("a 1 step source rhythm with with no on gates", () => {
    const sourceRhythm = rhythmStepsForPattern([0]);
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a surround rhythm with no surrounding gates", () => expect(surroundingRhythm[0].state).to.eq(0));
  });


  describe("a 1 step source rhythm with with an on gates", () => {
    const sourceRhythm = rhythmStepsForPattern([1]);
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a surround rhythm with no surrounding gates", () => expect(surroundingRhythm[0].state).to.eq(0));
  });


  describe("a source rhythms with with contiguous on gates", () => {
    it("have surrounding gates on either side of contiguous source gates", () => {
      const sourceRhythm = rhythmStepsForPattern([0, 1, 1, 0]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);
      expect(surroundingRhythm.map(step => step.state)).to.have.ordered.members([1, 0, 0, 1]);
    });

    it("have surrounding gates on either side of contiguous source gates that wrap around the beginning", () => {
      const sourceRhythm = rhythmStepsForPattern([1, 1, 0, 0]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);
      expect(surroundingRhythm.map(step => step.state)).to.have.ordered.members([0, 0, 1, 1]);
    });

    it("have surrounding gates on either side of contiguous source gates that wrap around the end", () => {
      const sourceRhythm = rhythmStepsForPattern([0, 0, 1, 1]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);
      expect(surroundingRhythm.map(step => step.state)).to.have.ordered.members([1, 1, 0, 0]);
    });
  });


  describe("surrounding complex source rhythms", () => {
    it("Shiko", () => {
      const sourceRhythm = rhythmStepsForPattern([1, 0, 0, 0,  1, 0, 1, 0,  0, 0, 1, 0,  1, 0, 0, 0]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);

      expect(patternForRhythmSteps(surroundingRhythm)).to.have.ordered.members([
        0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1
      ]);
    });

    it("Son Clave", () => {
      const sourceRhythm = rhythmStepsForPattern([1, 0, 0,  1, 0, 0,  1, 0, 0, 0,  1, 0,  1, 0, 0, 0]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);

      // console.log(patternForRhythmSteps(surroundingRhythm).join(" "))
      expect(patternForRhythmSteps(surroundingRhythm)).to.have.ordered.members([
        0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1
      ]);
    });

    it("Rumba", () => {
      const sourceRhythm = rhythmStepsForPattern([1, 0, 0,  1, 0, 0, 0,  1, 0, 0,  1, 0,  1, 0, 0, 0]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);

      expect(patternForRhythmSteps(surroundingRhythm)).to.have.ordered.members([
        0, 1, 1, 0,  1, 0, 1, 0,  1, 1, 0, 1,  0, 1, 0, 1
      ]);
    });

    it("Soukous", () => {
      const sourceRhythm = rhythmStepsForPattern([1, 0, 0,  1, 0, 0,  1, 0, 0, 0,  1, 1,  0, 0, 0, 0]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);

      expect(patternForRhythmSteps(surroundingRhythm)).to.have.ordered.members([
        0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1
      ]);
    });

    it("Gahu", () => {
      const sourceRhythm = rhythmStepsForPattern([1, 0, 0,  1, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);

      expect(patternForRhythmSteps(surroundingRhythm)).to.have.ordered.members([
        0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1
      ]);
    });

    it("Bossa Nova", () => {
      const sourceRhythm = rhythmStepsForPattern([1, 0, 0,  1, 0, 0,  1, 0, 0, 0,  1, 0, 0,  1, 0, 0]);
      const surroundingRhythm = surroundRhythm(sourceRhythm);

      expect(patternForRhythmSteps(surroundingRhythm)).to.have.ordered.members([
        0, 1, 1, 0,  1, 1, 0, 1,  0, 1, 0, 1,  1, 0, 1, 1
      ]);
    });
  });
});
