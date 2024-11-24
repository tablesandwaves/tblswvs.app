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

      // Select the global page
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


    describe("hihat swing", () => {
      const sequencer = new Sequencer(configDirectory, testing);

      // Set the kick track to a the 4n drum pattern
      sequencer.daw.tracks[0].rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,
        1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0
      ]);

      // Set the hihat track to an 8n drum pattern
      sequencer.grid.keyPress({y: 7, x: 2, s: 1});
      sequencer.daw.tracks[2].rhythm = rhythmStepsForPattern([
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0
      ]);

      // Select the global page
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});

      // Engage the hihat swing algorithm
      sequencer.grid.keyPress({y: 6, x: 13, s: 1});

      it("sets hihat swing in the sequencer", () => expect(sequencer.hihatSwing).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        sequencer.daw.tracks[2].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
      });

      it("swings every second hihat note at the point of generating Ableton notes", () => {
        sequencer.daw.tracks[2].updateCurrentAbletonNotes();
        sequencer.daw.tracks[2].currentAbletonNotes.forEach((note, i) => {
          if (i % 2 != 0) {
            const noOffsetExpectedPosition = i * 0.25 * 2;
            expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000).to.equal(0.1125);
          }
        });
      });

      it("does not swing a non-hihat track", () => {
        sequencer.daw.tracks[0].updateCurrentAbletonNotes();
        sequencer.daw.tracks[0].currentAbletonNotes.forEach((note, noOffsetExpectedPosition) => {
          expect(note.clipPosition).to.equal(noOffsetExpectedPosition);
        });
      });
    });
  });
});
