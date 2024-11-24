import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { GlobalController } from "../app/controller/global_controller";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";


const testing = true;


describe("GlobalController", () => {
  describe("when loading the global page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the rhythm page and page over two to the right
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    const controller = sequencer.grid.activePage as GlobalController;

    it("sets the active page to a globals page", () => expect(controller).to.be.instanceOf(GlobalController));
  });


  describe("timing offset patterns", () => {
    describe("humanization", () => {
      const sequencer = new Sequencer(configDirectory, testing);
      const track     = sequencer.daw.getActiveTrack();
      track.rhythm = rhythmStepsForPattern([
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0
      ]);

      // Select the rhythm page and page over two to the right
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});
      const controller = sequencer.grid.activePage as GlobalController;

      // Engage the humanize algorithm
      sequencer.grid.keyPress({y: 6, x: 12, s: 1});

      it("sets huminization in the sequencer", () => expect(sequencer.humanize).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        track.rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
      });

      it("humanizes at the point of generating Ableton notes", () => {
        track.updateCurrentAbletonNotes();
        track.currentAbletonNotes.forEach((note, i) => {
          if (i % 8 != 0) {
            const noOffsetExpectedPosition = i * 0.25 * 2;
            expect(Math.round((Math.abs(note.clipPosition - noOffsetExpectedPosition) + Number.EPSILON) * 1000) / 1000).to.equal(0.025);
          }
        });
      });

      it("does not humanize step rhythm step 0", () => {
        expect(track.currentAbletonNotes[0].clipPosition).to.equal(0);
      });
    });
  });
});
