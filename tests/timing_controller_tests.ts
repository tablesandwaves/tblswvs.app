import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { TimingController } from "../app/controller/timing_controller";
import { configDirectory, patternForRhythmSteps, rhythmStepsForPattern, velocityWithinRange } from "./test_helpers";


const testing = true;


describe("TimingController", () => {
  describe("when loading the timings page with no offsets", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    const track     = sequencer.daw.getActiveTrack();
    track.rhythm = rhythmStepsForPattern([1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0]);

    // Select the rhythm page and page over two to the right
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const controller = sequencer.grid.activePage as TimingController;

    it("sets the active page to a timing page",() => expect(controller).to.be.instanceOf(TimingController));

    describe("the grid row matrix", () => {
      const rowMatrix = controller.gridRowMatrix();

      it("is blank for rows 1-3 and 5-7", () => {
        [0, 1, 2, 4, 5, 6].forEach(rowIndex => {
          expect(rowMatrix[rowIndex]).to.have.ordered.members([
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });
      });

      it("displays active gates for rhythm steps and a faint level for inactive gates", () => {
        expect(rowMatrix[3]).to.have.ordered.members([
          10, 1, 10, 1,  10, 1, 10, 1,  10, 1, 10, 1,  10, 1, 10, 1
        ]);
      });
    });
  });


  describe("when editing timings page", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    const track     = sequencer.daw.getActiveTrack();
    track.rhythm = rhythmStepsForPattern([
      1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,
      1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0
    ]);

    // Select the rhythm page and page over two to the right
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const controller = sequencer.grid.activePage as TimingController;

    // Set the downbeat late by 0.15, the backbeat early by 0.15
    sequencer.grid.keyPress({y: 5, x: 4, s: 1});
    const rowMatrix = controller.gridRowMatrix();

    it("updates the display matrix", () => {
      [3, 4, 5].forEach(y => expect(rowMatrix[y][4]).to.eq(10));
    });

    it("updates the active track rhythm steps", () => {
      expect(track.rhythm[4].timingOffset).to.equal(-0.25);
    });

    it("updates the active track's Ableton notes", () => {
      track.updateCurrentAbletonNotes();
      expect(track.currentAbletonNotes[2].clipPosition).to.equal(0.9375);
    });
  });
});
