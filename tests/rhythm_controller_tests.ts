import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { RhythmController } from "../app/controller/rhythm_controller";
import { patternForRhythmSteps, rhythmStepsForPattern } from "./test_helpers";


const testing = true;


describe("RhythmController", () => {
  describe("setting the rhythm algorithm", () => {
    const sequencer = new Sequencer(testing);

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


  describe("setting the related rhythm track", () => {
    const sequencer = new Sequencer(testing);

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
    const sequencer = new Sequencer(testing);
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
        1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the grid transport row", () => {
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });

  describe("setting a related rhythm track and then the surround rhythm", () => {
    const sequencer = new Sequencer(testing);
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
        1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the grid transport row", () => {
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        10, 0, 10, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });

  describe("updating a subject track that has a dependent track", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    const sourceTrack   = sequencer.daw.tracks[1];
    const surroundTrack = sequencer.daw.getActiveTrack();
    const controller    = sequencer.grid.activePage as RhythmController;

    // Set the source/subject track rhythm
    sourceTrack.rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);

    // Select the surround algorithm and the related track
    sequencer.grid.keyPress({y: 5, x: 1, s: 1});
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    expect(surroundTrack.rhythmAlgorithm).to.eq("surround");
    expect(patternForRhythmSteps(surroundTrack.rhythm)).to.have.ordered.members([
      1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Update the source/subject track rhythm
    sourceTrack.rhythm = rhythmStepsForPattern([0, 1, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);

    it("updates the dependent track's rhythm", () => {
      const pattern = patternForRhythmSteps(surroundTrack.rhythm);
      expect(pattern).to.have.ordered.members([
        1, 0, 0, 1,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the grid transport row", () => {
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        10, 0, 0, 10,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });

  describe("Editing steps in the transport row", () => {
    describe("when the manual algorithm is selected and gate buttons are pressed", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 7, s: 1});

      const track      = sequencer.daw.getActiveTrack();
      const controller = sequencer.grid.activePage as RhythmController;

      // Select the manual algorithm, confirm the track rhythm and transport row are empty
      sequencer.grid.keyPress({y: 6, x: 0, s: 1});
      expect(track.rhythmAlgorithm).to.eq("manual");
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      // Then add a gate
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      it("updates the track's rhythm", () => {
        const pattern = patternForRhythmSteps(track.rhythm);
        expect(pattern).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("updates the grid transport row", () => {
        expect(controller.getRhythmGatesRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });

    describe("when a non-manual algorithm is selected and gate buttons are pressed", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 7, s: 1});

      const track      = sequencer.daw.getActiveTrack();
      const controller = sequencer.grid.activePage as RhythmController;

      // Select the surround algorithm, confirm the track rhythm and transport row are empty
      sequencer.grid.keyPress({y: 6, x: 1, s: 1});
      expect(track.rhythmAlgorithm).to.eq("surround");
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      // Then attempt to add a gate
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      it("does not update the track's rhythm", () => {
        const pattern = patternForRhythmSteps(track.rhythm);
        expect(pattern).to.have.ordered.members([
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("does not update the grid transport row", () => {
        expect(controller.getRhythmGatesRow()).to.have.ordered.members([
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });
  });
});
