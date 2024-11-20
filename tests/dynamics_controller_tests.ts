import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { DynamicsController } from "../app/controller/dynamics_controller";
import { configDirectory, patternForRhythmSteps } from "./test_helpers";


const testing = true;


describe("DynamicsController", () => {
  describe("when setting probabilities", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    const track     = sequencer.daw.getActiveTrack();

    // Select the rhythm page and set a step
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});
    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Go to the dynamics page by paging to the right
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const controller = sequencer.grid.activePage as DynamicsController;

    it("can change a step probability on the active track", () => {
      sequencer.grid.keyPress({y: 1, x: 0, s: 1});
      expect(track.rhythm[0].probability).to.equal(0.875);
    });
  });
});
