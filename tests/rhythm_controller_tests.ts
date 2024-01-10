import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { RhythmController } from "../app/controller/rhythm_controller";
import { configDirectory, patternForRhythmSteps, rhythmStepsForPattern } from "./test_helpers";


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
      const sequencer = new Sequencer(configDirectory, testing);
      sequencer.grid.keyPress({y: 7, x: 7, s: 1});

      const track      = sequencer.daw.getActiveTrack();
      const controller = sequencer.grid.activePage as RhythmController;

      // Select the manual algorithm, confirm the track rhythm and transport row are empty
      sequencer.grid.keyPress({y: 6, x: 0, s: 1});
      expect(track.rhythmAlgorithm).to.eq("manual");
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      expect(controller.getRhythmGatesRow()).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

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
