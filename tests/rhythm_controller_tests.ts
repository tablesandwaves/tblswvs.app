import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { AbletonLive } from "../app/model/ableton/live";
import { RhythmController } from "../app/controller/rhythm_controller";
import { patternForRhythmSteps } from "./test_helpers";


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

    it("updates the track's related rhythm track", () => expect(track.relatedRhythmTrackIndex).to.eq(2));

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

  describe("setting the a related rhythm track and then the surround rhythm", () => {
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
});
