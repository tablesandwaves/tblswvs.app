import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { InfinitySeriesController } from "../app/controller/infinity_series_controller";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";


const testing = true;


describe("InfinitySeriesController", () => {
  describe("After selecting the initial algorithm page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the note input page, then the infinity series sub-page
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});
    const activePage = sequencer.grid.activePage as InfinitySeriesController;

    it("the infinity series controller can be selected", () => {
      expect(activePage).to.be.instanceOf(InfinitySeriesController)
    });

    describe("the default infinity series controller state", () => {
      it("has the default infinity series seed row", () => {
        activePage.getSeedRangeRows().forEach(row => {
          expect(row).to.have.ordered.members([0, 0, 0, 0,  0, 0, 0, 0]);
        });
      });

      it("has the default repetitions row", () => {
        expect(activePage.getRhythmRepetitionsRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("has the default algorithm row (infinity series selected)", () => expect(activePage.getGridAlgorithmRow()).to.have.ordered.members([
        0, 0, 10, 0,  0, 0, 0, 0
      ]));
    });

    describe("after paging right and then back", () => {
      sequencer.grid.keyPress({y: 7, x: 15, s: 1});
      sequencer.grid.keyPress({y: 7, x: 15, s: 0});
      sequencer.grid.keyPress({y: 7, x: 14, s: 1});
      sequencer.grid.keyPress({y: 7, x: 14, s: 0});

      it("reloads the infinity series page and not the (simple) input notes controller", () => {
        expect(sequencer.grid.activePage).to.be.instanceOf(InfinitySeriesController);
      });
    });
  });


  describe("Setting the infinity series on a drum rack", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Choose the percussion track, update the rhythm
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.rhythmStepLength = 16;
    track.rhythm = rhythmStepsForPattern([1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0]);

    // Select the note input page, then the infinity series sub-page
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});

    // Set the seed and advance
    sequencer.grid.keyPress({y: 2, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 15, s: 1});

    const activePage = sequencer.grid.activePage as InfinitySeriesController;

    it("updates the track's infinity series seeds", () => {
      expect(track.infinitySeriesSeeds).to.have.ordered.members([1, 0, 0, 0]);
    });

    it("updates the track's output notes", () => {
      const outputNotes = track.outputNotes.flat().map(note => note.midi);
      expect(outputNotes).to.have.ordered.members([44, 45, 43, 46,  45, 44, 42, 47]);
    });

    it("updates the track's sequence", () => {
      const baseSequence = [
        44, undefined, 45, undefined, 43, undefined, 46, undefined,
        45, undefined, 44, undefined, 42, undefined, 47, undefined
      ];
      const expectedSequence = new Array(8).fill(baseSequence).flat();
      const actualSequence   = track.sequence.map(step => step.length == 0 ? undefined : step[0].midi);
      expect(actualSequence).to.have.ordered.members(expectedSequence);
    });
  });
});
