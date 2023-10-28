import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { RhythmController } from "../app/controller/rhythm_controller";


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

    // Select the surround algorithm
    sequencer.grid.keyPress({y: 5, x: 2, s: 1});

    it("updates the track's related rhythm track", () => expect(track.relatedRhythmTrackIndex).to.eq(2));

    it("updates the grid related track row", () => {
      expect(controller.getRhythmRelatedTrackRow()).to.have.ordered.members([0, 0, 10, 0,  0, 0, 0, 0]);
    });
  });
});
