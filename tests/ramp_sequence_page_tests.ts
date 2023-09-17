import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";


const testing   = true;
const sequencer = new Sequencer(testing);


describe("RampSequencePage", () => {
  describe("after selecting the ramp sequencer and adding outer steps", () => {
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 6, s: 1});

    it("should set the active page to RampSequencerPage", () => {
      expect(sequencer.grid.activePage.type).to.eq("RampSequence");
    });

    it("should have the correct outer sequence", () => {
      expect(sequencer.daw.getActiveTrack().rampSequenceOuter).to.have.ordered.members(
        [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("should have default inner divisions for the steps", () => {
      expect(sequencer.daw.getActiveTrack())
    })
  });
})
