import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { DynamicsController } from "../app/controller/dynamics_controller";
import {
  configDirectory, patternForRhythmSteps, velocityWithinRange,
  getRhythmControllerMocks, rhythmStepsForPattern
} from "./test_helpers";


const testing = true;


describe("DynamicsController", () => {
  describe("when setting probabilities", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    const track     = sequencer.daw.getActiveTrack();

    // Select the rhythm page and set a step
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});
    sequencer.grid.keyPress({y: 4, x: 4, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});
    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Go to the dynamics page by paging to the right
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const controller = sequencer.grid.activePage as DynamicsController;

    it("has a default active dynamic property", () => {
      expect(controller.activeDynamic).to.equal("probability");
    });

    it("can change a step probability on the active track", () => {
      sequencer.grid.keyPress({y: 1, x: 0, s: 1});
      expect(track.rhythm[0].probability).to.equal(0.875);
    });
  });


  describe("holding down the shift key and selecting velocity as the active dynamic property", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    const track     = sequencer.daw.getActiveTrack();

    // Select the rhythm page and set a step
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});
    sequencer.grid.keyPress({y: 4, x: 4, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});
    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Go to the dynamics page by paging to the right
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const controller = sequencer.grid.activePage as DynamicsController;

    // Hold down the shift key, without releasing it
    sequencer.grid.keyPress({y: 7, x: 13, s: 1});
    // Press the button for velocity (release not necessary, but for completeness)
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 6, x: 1, s: 0});
    // Release the shift key
    sequencer.grid.keyPress({y: 7, x: 13, s: 0});

    it("updates the active dynamic property", () => {
      expect(controller.activeDynamic).to.equal("velocity");
    });

    it("and subsequent changes to state update step velocity on the active track", () => {
      sequencer.grid.keyPress({y: 1, x: 0, s: 1});
      expect(track.rhythm[0].velocity).to.equal(0.875);
      track.updateCurrentAbletonNotes();
      expect(velocityWithinRange(track.currentAbletonNotes[0].velocity, 105)).to.be.true;
    });
  });


  describe("dynamics properties for rhythms with breakpoints", () => {
    const [sequencer, track, controller] = getRhythmControllerMocks();
    // Note this rhythm corresponds to index 0 for both rows 1 and 2 after the step length modifications
    track.rhythm = rhythmStepsForPattern([
      1, 0, 0, 0,  1, 1, 0, 0,  0, 1, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Flush the track notes
    track.updateCurrentAbletonNotes();
    expect(track.currentAbletonNotes.length).to.eq(16);

    // Press the shift key to edit the rhythm step length,
    // then set the length for row 1 to 5, the length of row 2 to 7
    // finally release the shift functionality
    sequencer.grid.keyPress({y: 7, x: 13, s: 1});
    sequencer.grid.keyPress({y: 7, x: 13, s: 0});
    sequencer.grid.keyPress({y: 0, x: 4, s: 1});
    sequencer.grid.keyPress({y: 1, x: 6, s: 1});
    // Release must happen after both presses
    sequencer.grid.keyPress({y: 0, x: 4, s: 0});
    sequencer.grid.keyPress({y: 1, x: 6, s: 0});
    sequencer.grid.keyPress({y: 7, x: 13, s: 1});
    sequencer.grid.keyPress({y: 7, x: 13, s: 0});

    // Page over to the dynamics controller
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const dController = sequencer.grid.activePage as DynamicsController;


    describe("displaying the patterns on the grid", () => {
      it("should only display the first active step on shift page 1", () => {
        dController.getGridDynamicsMatrix().forEach(row => {
          expect(row).to.have.ordered.members([10, 0, 0, 0,  10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
        });
      });

      it("should display the second active step on shift page 2", () => {
        // Select and release the shift key to display the second half
        sequencer.grid.keyPress({y: 7, x: 13, s: 1});
        sequencer.grid.keyPress({y: 7, x: 13, s: 0});
        dController.getGridDynamicsMatrix().forEach(row => {
          expect(row).to.have.ordered.members([10, 0, 0, 0,  10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
        });
      });
    });


    describe("editing the patterns", () => {
      it("can edit a step on the first page", () => {
        // Ensure the shift state is inactive and edit the second step: set probability down one level
        sequencer.grid.shiftStateActive = false;
        sequencer.grid.keyPress({y: 1, x: 4, s: 1});
        expect(sequencer.daw.getActiveTrack().rhythm[4].probability).to.eq(0.875);
      });

      it("does not allow edits of steps that are not on the current page", () => {
        // Ensure the shift state is inactive and attempt to edit the third step
        sequencer.grid.shiftStateActive = false;
        sequencer.grid.keyPress({y: 1, x: 5, s: 1});
        expect(sequencer.daw.getActiveTrack().rhythm[5].probability).to.eq(1);
      });

      it("can edit a step on the second/shift page", () => {
        // Ensure the shift state is active and edit the third step: set probability down one level
        sequencer.grid.shiftStateActive = true;
        sequencer.grid.keyPress({y: 1, x: 4, s: 1});
        expect(sequencer.daw.getActiveTrack().rhythm[9].probability).to.eq(0.875);
      });
    });
  });
});
