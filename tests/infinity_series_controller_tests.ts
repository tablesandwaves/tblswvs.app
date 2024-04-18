import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { InfinitySeriesController } from "../app/controller/infinity_series_controller";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";


const testing = true;


describe("InfinitySeriesController", () => {
  describe("After selecting the initial algorithm page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the algorithm page, then the infinity series sub-page
    sequencer.grid.keyPress({y: 7, x: 11, s: 1});
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});
    const activePage = sequencer.grid.activePage as InfinitySeriesController;

    it("the shift register controller can be selected", () => {
      expect(activePage).to.be.instanceOf(InfinitySeriesController)
    });

    describe("the default shift register controller state", () => {
      it("has the default shift register range row", () => {
        activePage.getSeedRangeRows().forEach(row => {
          expect(row).to.have.ordered.members([0, 0, 0, 0,  0, 0, 0, 0]);
        });
      });

      it("has the default repetitions row", () => {
        expect(activePage.getInfinitySeriesRepetitionsRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0
        ]);
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

    // Select the algorithm page, then the infinity series sub-page
    sequencer.grid.keyPress({y: 7, x: 11, s: 1});
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});

    // Set the seed and advance
    sequencer.grid.keyPress({y: 2, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 15, s: 1});

    const activePage = sequencer.grid.activePage as InfinitySeriesController;

    it("updates the track's infinity series seeds", () => {
      console.log(track.outputNotes)
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
