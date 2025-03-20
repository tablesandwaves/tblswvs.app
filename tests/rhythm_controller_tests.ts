import { expect } from "chai";
import { before } from "mocha";
import { Sequencer } from "../app/model/sequencer";
import { RhythmController } from "../app/controller/rhythm_controller";
import {
  configDirectory, patternForRhythmSteps, rhythmStepsForPattern, getRhythmControllerMocks, velocityWithinRange
} from "./test_helpers";


const testing = true;


describe("RhythmController", () => {
  describe("setting a basic rhythm", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    const track = sequencer.daw.getActiveTrack();

    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 4, s: 1});
    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    it("sets the rhythm on the last key up", () => {
      sequencer.grid.keyPress({y: 0, x: 0, s: 0});
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      sequencer.grid.keyPress({y: 0, x: 4, s: 0});
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("adding notes to an existing rhythm", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    const track = sequencer.daw.getActiveTrack();

    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});
    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    it("does not delete the existing notes", () => {
      sequencer.grid.keyPress({y: 0, x: 4, s: 1});
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      sequencer.grid.keyPress({y: 0, x: 4, s: 0});
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("when adjusting the rhythm step length", () => {
    describe("a maximum rhythm step length", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();

      before(() => {
        track.rhythm = rhythmStepsForPattern([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);

        // Flush the track notes
        track.updateCurrentAbletonNotes();
        expect(track.currentAbletonNotes.length).to.eq(4);
      });

      describe("adding steps within the second row", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Add another step
          sequencer.grid.keyPress({y: 1, x: 0, s: 1});
          sequencer.grid.keyPress({y: 1, x: 0, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("alters the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("alters the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("updates the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([0, 4, 8, 12, 16, 20, 24, 28]);
        });
      });
    });


    describe("setting the step length to a single row", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();
      track.rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      // Flush the track notes
      track.updateCurrentAbletonNotes();
      expect(track.currentAbletonNotes.length).to.eq(4);

      // Press the shift key to edit the rhythm step length, then set the length to 16
      sequencer.grid.keyPress({y: 7, x: 13, s: 1});
      sequencer.grid.keyPress({y: 7, x: 13, s: 0});
      sequencer.grid.keyPress({y: 0, x: 15, s: 1});
      sequencer.grid.keyPress({y: 0, x: 15, s: 0});

      // Flush the track notes
      track.updateCurrentAbletonNotes();

      it("updates the active track rhythm step length", () => {
        expect(track.rhythmStepLength).to.eq(16);
      });

      it("updates the active track rhythm break point", () => {
        expect(track.rhythmStepBreakpoint).to.eq(16);
      });

      it("updates the rhythm step length grid row", () => {
        expect(controller.getRhythmStepLengthRow()).to.have.ordered.members([
          5, 5, 5, 5,  5, 5, 5, 5,  5, 5, 5, 5,  5, 5, 5, 5,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("does not alter the rhythm gates grid row", () => {
        expect(controller.getRhythmGatesRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
           0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("updates the active track Ableton notes", () => {
        const actual = track.currentAbletonNotes.map(note => note.clipPosition);
        expect(actual).to.have.ordered.members([0, 4, 8, 12, 16, 20, 24, 28]);
      });


      describe("adding steps within the first row", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Add another step
          sequencer.grid.keyPress({y: 0, x: 8, s: 1});
          sequencer.grid.keyPress({y: 0, x: 8, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("alters the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("alters the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 0, 0,  0, 0, 0, 0,  10, 0, 0, 0,  0, 0, 0, 0,
             0, 0, 0, 0,  0, 0, 0, 0,   0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("updates the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]);
        });
      });


      describe("attempting to add steps within the second row", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Add another step
          sequencer.grid.keyPress({y: 1, x: 8, s: 1});
          sequencer.grid.keyPress({y: 1, x: 8, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("does not alter the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not alter the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 0, 0,  0, 0, 0, 0,  10, 0, 0, 0,  0, 0, 0, 0,
             0, 0, 0, 0,  0, 0, 0, 0,   0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not update the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]);
        });
      });
    });


    describe("setting the step length to less than a single row", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();
      track.rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      // Flush the track notes
      track.updateCurrentAbletonNotes();
      expect(track.currentAbletonNotes.length).to.eq(4);

      // Press the shift key to edit the rhythm step length,
      // then set the length to 12
      sequencer.grid.keyPress({y: 7, x: 13, s: 1});
      sequencer.grid.keyPress({y: 7, x: 13, s: 0});
      sequencer.grid.keyPress({y: 0, x: 11, s: 1});
      sequencer.grid.keyPress({y: 0, x: 11, s: 0});

      // Flush the track notes
      track.updateCurrentAbletonNotes();

      it("updates the active track rhythm step length", () => {
        expect(track.rhythmStepLength).to.eq(12);
      });

      it("updates the active track rhythm break point", () => {
        expect(track.rhythmStepBreakpoint).to.eq(12);
      });

      it("updates the rhythm step length grid row", () => {
        expect(controller.getRhythmStepLengthRow()).to.have.ordered.members([
          5, 5, 5, 5,  5, 5, 5, 5,  5, 5, 5, 5,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("does not alter the rhythm gates grid row", () => {
        expect(controller.getRhythmGatesRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
           0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("updates the active track Ableton notes", () => {
        const actual = track.currentAbletonNotes.map(note => note.clipPosition);
        expect(actual).to.have.ordered.members([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]);
      });


      describe("adding steps within the first row and within the step length", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Add another step
          sequencer.grid.keyPress({y: 0, x: 8, s: 1});
          sequencer.grid.keyPress({y: 0, x: 8, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("alters the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("alters the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 0, 0,  0, 0, 0, 0,  10, 0, 0, 0,  0, 0, 0, 0,
             0, 0, 0, 0,  0, 0, 0, 0,   0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("updates the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30]);
        });
      });


      describe("attempting to add steps within the first row but outside the step length", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Add another step
          sequencer.grid.keyPress({y: 0, x: 12, s: 1});
          sequencer.grid.keyPress({y: 0, x: 12, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("does not alter the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not alter the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 0, 0,  0, 0, 0, 0,  10, 0, 0, 0,  0, 0, 0, 0,
             0, 0, 0, 0,  0, 0, 0, 0,   0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not update the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30]);
        });
      });
    });


    describe("setting the step length to greater than a single row, less than the max length", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();

      before(() => {
        track.rhythm = rhythmStepsForPattern([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);

        // Flush the track notes
        track.updateCurrentAbletonNotes();
        expect(track.currentAbletonNotes.length).to.eq(4);

        // Press the shift key to edit the rhythm step length,
        // then set the length to 24
        sequencer.grid.keyPress({y: 7, x: 13, s: 1});
        sequencer.grid.keyPress({y: 7, x: 13, s: 0});
        sequencer.grid.keyPress({y: 1, x: 7, s: 1});
        sequencer.grid.keyPress({y: 1, x: 7, s: 0});

        // Flush the track notes
        track.updateCurrentAbletonNotes();
      });

      it("updates the active track rhythm step length", () => {
        expect(track.rhythmStepLength).to.eq(24);
      });

      it("updates the active track rhythm break point", () => {
        expect(track.rhythmStepBreakpoint).to.eq(24);
      });

      it("updates the rhythm step length grid row", () => {
        expect(controller.getRhythmStepLengthRow()).to.have.ordered.members([
          5, 5, 5, 5,  5, 5, 5, 5,  5, 5, 5, 5,  5, 5, 5, 5,
          5, 5, 5, 5,  5, 5, 5, 5,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("does not alter the rhythm gates grid row", () => {
        expect(controller.getRhythmGatesRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
           0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("updates the active track Ableton notes", () => {
        const actual = track.currentAbletonNotes.map(note => note.clipPosition);
        expect(actual).to.have.ordered.members([0, 6, 12, 18, 24, 30]);
      });


      describe("adding steps within the second row and within the step length", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;
          sequencer.grid.testLogging = true;

          // Add another step
          sequencer.grid.keyPress({y: 1, x: 0, s: 1});
          sequencer.grid.keyPress({y: 1, x: 0, s: 0});

          sequencer.grid.testLogging = false;

          track.updateCurrentAbletonNotes();
        });

        it("alters the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("alters the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("updates the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([0, 4, 6, 10, 12, 16, 18, 22, 24, 28, 30]);
        });
      });


      describe("attempting to add steps within the second row but outside the step length", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Add another step
          sequencer.grid.keyPress({y: 1, x: 12, s: 1});
          sequencer.grid.keyPress({y: 1, x: 12, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("does not alter the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not alter the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not update the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([0, 4, 6, 10, 12, 16, 18, 22, 24, 28, 30]);
        });
      });
    });


    describe("setting independent step lengths for each row", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();
      // Note this rhythm corresponds to index 0 for both rows 1 and 2 after the step length modifications
      track.rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      // Flush the track notes
      track.updateCurrentAbletonNotes();
      expect(track.currentAbletonNotes.length).to.eq(8);

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

      // Flush the track notes
      track.updateCurrentAbletonNotes();

      sequencer.grid.testLogging = true;

      it("updates the active track rhythm step length", () => {
        expect(track.rhythmStepLength).to.eq(12);
      });

      it("updates the active track rhythm break point", () => {
        expect(track.rhythmStepBreakpoint).to.eq(5);
      });

      it("updates the rhythm step length grid row", () => {
        expect(controller.getRhythmStepLengthRow()).to.have.ordered.members([
          5, 5, 5, 5,  5, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          5, 5, 5, 5,  5, 5, 5, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("alters the rhythm gates grid row", () => {
        expect(controller.getRhythmGatesRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("updates the active track Ableton notes", () => {
        const actual = track.currentAbletonNotes.map(note => note.clipPosition);
        expect(actual).to.have.ordered.members([
          0,   1.25,  3,  4.25,  6,  7.25,  9, 10.25,
          12, 13.25, 15, 16.25, 18, 19.25, 21, 22.25,
          24, 25.25, 27, 28.25, 30, 31.25
        ]);
      });


      describe("adding steps within the first and before the break point", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Add another step
          sequencer.grid.keyPress({y: 0, x: 2, s: 1});
          sequencer.grid.keyPress({y: 0, x: 2, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("alters the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 1, 0,  0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("alters the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            10, 0,  0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("updates the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([
            0, 0.5, 1.25, 3, 3.5, 4.25, 6, 6.5, 7.25, 9, 9.5, 10.25,
            12, 12.5, 13.25, 15, 15.5, 16.25, 18, 18.5, 19.25, 21, 21.5, 22.25,
            24, 24.5, 25.25, 27, 27.5, 28.25, 30, 30.5, 31.25
          ]);
        });
      });


      describe("adding steps within the second row and before the cummulative step length", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Add another step
          sequencer.grid.keyPress({y: 1, x: 2, s: 1});
          sequencer.grid.keyPress({y: 1, x: 2, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("alters the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 1, 0,  0, 1, 0, 1,  0, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("alters the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("updates the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([
            0, 0.5, 1.25, 1.75, 3, 3.5, 4.25, 4.75, 6, 6.5, 7.25, 7.75, 9, 9.5, 10.25, 10.75,
            12, 12.5, 13.25, 13.75, 15, 15.5, 16.25, 16.75, 18, 18.5, 19.25, 19.75, 21, 21.5, 22.25, 22.75,
            24, 24.5, 25.25, 25.75, 27, 27.5, 28.25, 28.75, 30, 30.5, 31.25, 31.75
          ]);
        });

        it("generates the velocities based on the grid step index (not the 'absolute' rhythm index)", () => {
          // First measure, pre-breakpoint
          expect(velocityWithinRange(track.currentAbletonNotes[0].velocity, 120)).to.be.true;
          expect(velocityWithinRange(track.currentAbletonNotes[1].velocity, 90)).to.be.true;
          // First measure, post-breakpoint
          expect(velocityWithinRange(track.currentAbletonNotes[2].velocity, 120)).to.be.true;
          expect(velocityWithinRange(track.currentAbletonNotes[3].velocity, 90)).to.be.true;
        });
      });


      describe("attempting to add steps within the first row but after the break point", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Attempt to add another step in a non-editable range
          sequencer.grid.keyPress({y: 0, x: 5, s: 1});
          sequencer.grid.keyPress({y: 0, x: 5, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("does not alter the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 1, 0,  0, 1, 0, 1,  0, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not alter the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not update the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([
            0, 0.5, 1.25, 1.75, 3, 3.5, 4.25, 4.75, 6, 6.5, 7.25, 7.75, 9, 9.5, 10.25, 10.75,
            12, 12.5, 13.25, 13.75, 15, 15.5, 16.25, 16.75, 18, 18.5, 19.25, 19.75, 21, 21.5, 22.25, 22.75,
            24, 24.5, 25.25, 25.75, 27, 27.5, 28.25, 28.75, 30, 30.5, 31.25, 31.75
          ]);
        });
      });


      describe("attempting to add steps within the second row but outside the step length", () => {
        before(() => {
          // Get out of shift-state-active mode
          sequencer.grid.shiftStateActive = false;

          // Attempt to add another step in a non-editable range
          sequencer.grid.keyPress({y: 1, x: 12, s: 1});
          sequencer.grid.keyPress({y: 1, x: 12, s: 0});

          track.updateCurrentAbletonNotes();
        });

        it("does not alter the active track rhythm", () => {
          expect(track.rhythm.map(s => s.state)).to.have.ordered.members([
            1, 0, 1, 0,  0, 1, 0, 1,  0, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not alter the rhythm gates grid row", () => {
          expect(controller.getRhythmGatesRow()).to.have.ordered.members([
            10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
          ]);
        });

        it("does not update the active track Ableton notes", () => {
          const actual = track.currentAbletonNotes.map(note => note.clipPosition);
          expect(actual).to.have.ordered.members([
            0, 0.5, 1.25, 1.75, 3, 3.5, 4.25, 4.75, 6, 6.5, 7.25, 7.75, 9, 9.5, 10.25, 10.75,
            12, 12.5, 13.25, 13.75, 15, 15.5, 16.25, 16.75, 18, 18.5, 19.25, 19.75, 21, 21.5, 22.25, 22.75,
            24, 24.5, 25.25, 25.75, 27, 27.5, 28.25, 28.75, 30, 30.5, 31.25, 31.75
          ]);
        });
      });
    });
  });


  describe("setting the rhythm algorithm", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    const controller = sequencer.grid.activePage as RhythmController;
    const track = sequencer.daw.getActiveTrack();
    expect(track.rhythmAlgorithm).to.eq("manual");

    // Select the surround algorithm
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    it("updates the track's rhythm algorithm", () => expect(track.rhythmAlgorithm).to.eq("surround"));

    it("updates the grid algorithm row", () => {
      expect(controller.getRhythmAlgorithmRow()).to.have.ordered.members([0, 10, 0, 0,  0, 0, 0, 0]);
    });
  });


  describe("setting the accelerating algorithm", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the rhythm page,
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    // then add a step,
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});
    // then set the algorithm to accelerating,
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});
    // then set the accelerating gate count to 8.
    sequencer.grid.keyPress({y: 3, x: 7, s: 1});

    const controller = sequencer.grid.activePage as RhythmController;
    const track = sequencer.daw.getActiveTrack();
    track.updateCurrentAbletonNotes();

    it("sets the active track's algorithm", () => expect(track.rhythmAlgorithm).to.eq("accelerating"));
    it("has a default accelerating gate count", () => expect(track.acceleratingGateCount).to.eq(8));

    it("leaves the track's rhythm pattern in place", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("generates an array of Ableton notes equal to the accelerating gate count times the max super measure", () => {
      expect(track.currentAbletonNotes.length).to.eq(32);
    });

    it("updates the grid algorithm row", () => {
      expect(controller.getRhythmAlgorithmRow()).to.have.ordered.members([0, 0, 10, 0,  0, 0, 0, 0]);
    });

    it("has a grid rhythm row that corresponds to the rhythm steps", () => {
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,   0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("has a grid parameter row equal to the accelerating gate count", () => {
      expect(controller.getGridParameterRow()).to.have.ordered.members([
        10, 10, 10, 10,  10, 10, 10, 10,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("setting the related rhythm track", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    const controller = sequencer.grid.activePage as RhythmController;
    const track = sequencer.daw.getActiveTrack();
    expect(track.rhythmAlgorithm).to.eq("manual");

    // Select the related track index
    sequencer.grid.keyPress({y: 5, x: 2, s: 1});

    it("updates the track's related rhythm track", () => expect(track.relatedRhythmTrackDawIndex).to.eq(track.daw.tracks[2].dawIndex));

    it("updates the grid related track row", () => {
      expect(controller.getRhythmRelatedTrackRow()).to.have.ordered.members([0, 0, 10, 0,  0, 0, 0, 0]);
    });
  });


  describe("setting the surround rhythm and then a related rhythm track", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    const sourceTrack   = sequencer.daw.tracks[1];
    const surroundTrack = sequencer.daw.getActiveTrack();
    const controller    = sequencer.grid.activePage as RhythmController;

    // Set the percussion track rhythm
    sourceTrack.rhythm[1].state = 1;

    // Select the surround algorithm and the related track
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 5, x: 1, s: 1});
    expect(surroundTrack.rhythmAlgorithm).to.eq("surround");

    it("updates the surround track's rhythm", () => {
      const pattern = patternForRhythmSteps(surroundTrack.rhythm);
      expect(pattern).to.have.ordered.members([
        1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the grid transport row", () => {
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("a surround rhythm for a track with a shortened length", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    const surroundTrack = sequencer.daw.getActiveTrack();
    const sourceTrack   = sequencer.daw.tracks[1];
    sourceTrack.rhythmStepLength = 16;

    // Set the source track rhythm, then add gate/step to the surround track to confirm it is removed
    sourceTrack.rhythm[0].state = 1;
    surroundTrack.rhythm[16].state = 1;

    // Select the surround algorithm and the related track
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 5, x: 1, s: 1});
    expect(surroundTrack.rhythmAlgorithm).to.eq("surround");

    it("has a surrounding track that wraps correctly (according to the source track length)", () => {
      const pattern = patternForRhythmSteps(surroundTrack.rhythm);
      expect(pattern).to.have.ordered.members([
        0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 1,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("changing a surround rhythm's source track's length", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    const surroundTrack = sequencer.daw.getActiveTrack();
    const sourceTrack   = sequencer.daw.tracks[1];

    // Set the source track rhythm, then add gate/step to the surround track to confirm it is removed
    sourceTrack.rhythm[0].state = 1;

    // Select the surround algorithm and the related track
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 5, x: 1, s: 1});
    expect( patternForRhythmSteps(surroundTrack.rhythm) ).to.have.ordered.members([
      0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 1
    ]);

    // After the surround rhythm has already been set, update the source track's step length
    sourceTrack.rhythmStepLength = 16;

    it("the surrounding track updates so it wraps to match the source track length", () => {
      const pattern = patternForRhythmSteps(surroundTrack.rhythm);
      expect(pattern).to.have.ordered.members([
        0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 1,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("setting a related rhythm track and then the surround rhythm", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    const sourceTrack   = sequencer.daw.tracks[1];
    const surroundTrack = sequencer.daw.getActiveTrack();
    const controller    = sequencer.grid.activePage as RhythmController;

    // Set the percussion track rhythm
    sourceTrack.rhythm[1].state = 1;

    // Select the surround algorithm and the related track
    sequencer.grid.keyPress({y: 5, x: 1, s: 1});
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    expect(surroundTrack.rhythmAlgorithm).to.eq("surround");

    it("updates the surround track's rhythm", () => {
      const pattern = patternForRhythmSteps(surroundTrack.rhythm);
      expect(pattern).to.have.ordered.members([
        1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the grid transport row", () => {
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("updating a subject track that has a dependent track", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    const sourceTrack   = sequencer.daw.tracks[1];
    const surroundTrack = sequencer.daw.getActiveTrack();
    const controller    = sequencer.grid.activePage as RhythmController;

    // Set the source/subject track rhythm
    sourceTrack.rhythm = rhythmStepsForPattern([
      0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Select the surround algorithm and the related track
    sequencer.grid.keyPress({y: 5, x: 1, s: 1});
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    expect(surroundTrack.rhythmAlgorithm).to.eq("surround");
    expect(patternForRhythmSteps(surroundTrack.rhythm)).to.have.ordered.members([
      1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Update the source/subject track rhythm
    sourceTrack.rhythm = rhythmStepsForPattern([
      0, 1, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    it("updates the dependent track's rhythm", () => {
      const pattern = patternForRhythmSteps(surroundTrack.rhythm);
      expect(pattern).to.have.ordered.members([
        1, 0, 0, 1,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the grid transport row", () => {
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        10, 0, 0, 10,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
         0, 0, 0,  0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("the pulse rate property", () => {
    describe("editing the pulse rate", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();

      // Add a gate, with the change queuing on the press and applying on the release
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 0, x: 0, s: 0});

      // Update the track's pulse rate
      sequencer.grid.keyPress({y: 4, x: 9, s: 1});
      track.updateCurrentAbletonNotes();

      it("updates the active track's pulse rate", () => {
        expect(track.pulseRate).to.eq("8n");
      });

      it("does not update the active track's rhythm step note lengths", () => {
        expect(track.rhythm[0].noteLength).to.be.undefined;
      });

      it("scales the note length of the resulting Ableton notes", () => {
        expect(track.currentAbletonNotes[0].duration).to.eq(0.5);
      });
    });


    describe("editing the pulse rate when a rhythm step has set a note length", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();

      // Add a gate, with the change queuing on the press and applying on the release
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 0, x: 0, s: 0});

      // Update the track's pulse rate to 8n
      sequencer.grid.keyPress({y: 4, x: 9, s: 1});

      // Set an explicit note length for the rhythm step: hold down step, press note length of 16n
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 5, x: 8, s: 1});
      sequencer.grid.keyPress({y: 5, x: 8, s: 0});
      sequencer.grid.keyPress({y: 0, x: 0, s: 0});

      track.updateCurrentAbletonNotes();

      it("updates the active track's pulse rate", () => {
        expect(track.pulseRate).to.eq("8n");
      });

      it("updates the active track's rhythm step note length", () => {
        expect(track.rhythm[0].noteLength).to.eq("16n");
      });

      it("does not scale the note length of the resulting Ableton notes because the step has a note length", () => {
        expect(track.currentAbletonNotes[0].duration).to.eq(0.25);
      });
    });
  });


  describe("editing steps in the transport row", () => {
    describe("when the manual algorithm is selected and gate buttons are pressed", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();

      // Then add a gate, with the change queuing on the press and applying on the release
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 0, x: 0, s: 0});

      it("updates the track's rhythm", () => {
        const pattern = patternForRhythmSteps(track.rhythm);
        expect(pattern).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("updates the grid transport row", () => {
        expect(controller.getRhythmGatesRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });


    describe("editing the note length for a single step", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();

      // Then add two gates, one of which will be changed
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 0, x: 0, s: 0});
      sequencer.grid.keyPress({y: 0, x: 4, s: 1});
      sequencer.grid.keyPress({y: 0, x: 4, s: 0});

      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      // Then update the second gate to have a custom note length
      sequencer.grid.keyPress({y: 0, x: 4, s: 1});
      sequencer.grid.keyPress({y: 5, x: 9, s: 1});
      sequencer.grid.keyPress({y: 5, x: 9, s: 0});
      sequencer.grid.keyPress({y: 0, x: 4, s: 0});

      track.updateCurrentAbletonNotes();

      it("leaves the track's gate rhythm unchanged", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("leaves the first gate's note length unchanged (undefined - will use track default)", () => {
        expect(track.rhythm[0].noteLength).to.be.undefined;
      });

      it("updates the second gate's note length", () => {
        expect(track.rhythm[4].noteLength).to.be.eq("8n");
      });

      it("leave the first gate's note length unchanged in the track's Ableton notes", () => {
        expect(track.currentAbletonNotes[0].duration).to.eq(0.25);
      });

      it("updates the second gate's note length in the track's Ableton notes", () => {
        expect(track.currentAbletonNotes[1].duration).to.eq(0.5);
      });

      it("displays the active gate's note length in the grid note length row while pressed, then resets", () => {
        expect(controller.getNoteLengthRow()).to.have.ordered.members([10, 0, 0, 0,  0, 0, 0, 0]);
        sequencer.grid.keyPress({y: 0, x: 4, s: 1});
        expect(controller.getNoteLengthRow()).to.have.ordered.members([10, 10, 0, 0,  0, 0, 0, 0]);
        sequencer.grid.keyPress({y: 0, x: 4, s: 0});
        expect(controller.getNoteLengthRow()).to.have.ordered.members([10, 0, 0, 0,  0, 0, 0, 0]);
      });
    });


    describe("removing a gate with a custom note length", () => {
      const [sequencer, track, controller] = getRhythmControllerMocks();

      // Then add two gates, one of which will be changed
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 0, x: 0, s: 0});
      sequencer.grid.keyPress({y: 0, x: 4, s: 1});
      sequencer.grid.keyPress({y: 0, x: 4, s: 0});

      // Then update the second gate to have a custom note length
      sequencer.grid.keyPress({y: 0, x: 4, s: 1});
      sequencer.grid.keyPress({y: 5, x: 9, s: 1});
      sequencer.grid.keyPress({y: 5, x: 9, s: 0});
      sequencer.grid.keyPress({y: 0, x: 4, s: 0});

      expect(track.rhythm[4].noteLength).to.be.eq("8n");

      // Then remove the second gate
      sequencer.grid.keyPress({y: 0, x: 4, s: 1});
      sequencer.grid.keyPress({y: 0, x: 4, s: 0});

      it("resets the gate's custom length in the track's rhythm", () => {
        expect(track.rhythm[4].noteLength).to.be.undefined;
      });
    });


    describe("when a non-manual algorithm is selected and gate buttons are pressed", () => {
      const sequencer = new Sequencer(configDirectory, testing);
      sequencer.grid.keyPress({y: 7, x: 7, s: 1});

      const track      = sequencer.daw.getActiveTrack();
      const controller = sequencer.grid.activePage as RhythmController;

      // Select the surround algorithm, confirm the track rhythm and transport row are empty
      sequencer.grid.keyPress({y: 6, x: 1, s: 1});
      expect(track.rhythmAlgorithm).to.eq("surround");
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      // Then attempt to add a gate
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      it("does not update the track's rhythm", () => {
        const pattern = patternForRhythmSteps(track.rhythm);
        expect(pattern).to.have.ordered.members([
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("does not update the grid transport row", () => {
        expect(controller.getRhythmGatesRow()).to.have.ordered.members([
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });
  });
});
