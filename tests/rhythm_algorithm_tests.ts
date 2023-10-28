import { expect } from "chai";
import { RhythmStep } from "../app/model/ableton/track";
import { surroundRhythm } from "../app/helpers/rhythm_algorithms";


describe("the Surround algorithm", () => {
  describe("produces rhythm steps a simple, 1 gate source rhythm", () => {
    const sourceRhythm: RhythmStep[] = [
      {state: 0, probability: 1, fillRepeats: 0},
      {state: 1, probability: 1, fillRepeats: 0},
      {state: 0, probability: 1, fillRepeats: 0}
    ];
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
    const sourceRhythm: RhythmStep[] = [
      {state: 1, probability: 1, fillRepeats: 0},
      {state: 0, probability: 1, fillRepeats: 0},
      {state: 0, probability: 1, fillRepeats: 0}
    ];
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has no overlapping gate at position 0", () => expect(surroundingRhythm[0].state).to.eq(0));
    it("has a gate at 1 for the 'after' gate", () => expect(surroundingRhythm[1].state).to.eq(1));
    it("has a gate at the end for the wrapped 'before' gate", () => expect(surroundingRhythm[2].state).to.eq(1));
  });


  describe("a source rhythm with a gate at position step length - 1", () => {
    const sourceRhythm: RhythmStep[] = [
      {state: 0, probability: 1, fillRepeats: 0},
      {state: 0, probability: 1, fillRepeats: 0},
      {state: 1, probability: 1, fillRepeats: 0}
    ];
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a gate at the start for the wrapped 'after' gate", () => expect(surroundingRhythm[0].state).to.eq(1));
    it("has a gate at step length - 2 for the 'before' gate", () => expect(surroundingRhythm[1].state).to.eq(1));
    it("has no overlapping gate at position step length - 1", () => expect(surroundingRhythm[2].state).to.eq(0));
  });


  describe("a source rhythm with with no on gates", () => {
    const sourceRhythm: RhythmStep[] = [
      {state: 0, probability: 1, fillRepeats: 0},
      {state: 0, probability: 1, fillRepeats: 0},
      {state: 0, probability: 1, fillRepeats: 0}
    ];
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a surround rhythm with no surrounding gates", () => {
      expect(surroundingRhythm.map(step => step.state)).to.have.ordered.members([0, 0, 0]);
    });
  });


  describe("a source rhythm with with only on gates", () => {
    const sourceRhythm: RhythmStep[] = [
      {state: 1, probability: 1, fillRepeats: 0},
      {state: 1, probability: 1, fillRepeats: 0},
      {state: 1, probability: 1, fillRepeats: 0}
    ];
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a surround rhythm with no surrounding gates", () => {
      expect(surroundingRhythm.map(step => step.state)).to.have.ordered.members([0, 0, 0]);
    });
  });


  describe("a 1 step source rhythm with with no off gates", () => {
    const sourceRhythm: RhythmStep[] = [
      {state: 0, probability: 1, fillRepeats: 0}
    ];
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a surround rhythm with no surrounding gates", () => expect(surroundingRhythm[0].state).to.eq(0));
  });


  describe("a 1 step source rhythm with with an on gates", () => {
    const sourceRhythm: RhythmStep[] = [
      {state: 1, probability: 1, fillRepeats: 0}
    ];
    const surroundingRhythm = surroundRhythm(sourceRhythm);

    it("has a surround rhythm with no surrounding gates", () => expect(surroundingRhythm[0].state).to.eq(0));
  });
});
