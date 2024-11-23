import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { TimingController } from "../app/controller/timing_controller";
import { configDirectory, patternForRhythmSteps, velocityWithinRange } from "./test_helpers";


const testing = true;


describe("TimingController", () => {
  describe("when loading the timings page", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    const track     = sequencer.daw.getActiveTrack();

    // Select the rhythm page and page over two to the right
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const controller = sequencer.grid.activePage as TimingController;

    it("sets the active page to a timing page",() => expect(controller).to.be.instanceOf(TimingController));
  });
});
