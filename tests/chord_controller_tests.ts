import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { ChordController } from "../app/controller/chord_controller";
import { configDirectory, patternForRhythmSteps, rhythmStepsForPattern } from "./test_helpers";


const testing   = true;


describe("ChordController", () => {
  describe("Selecting the initial chord controller page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the chord page
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});

    const activePage = sequencer.grid.activePage as ChordController;

    it("sets the active page to a chord page", () => expect(activePage).to.be.instanceOf(ChordController));
  });
});
