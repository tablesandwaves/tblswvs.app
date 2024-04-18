import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { InfinitySeriesController } from "../app/controller/infinity_series_controller";
import { configDirectory } from "./test_helpers";


const testing = true;


describe("InfinitySeriesController", () => {
  describe("After selecting the initial algorithm page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the algorithm page, then the shift register sub-page
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
});
