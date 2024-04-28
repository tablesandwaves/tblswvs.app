import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { SelfSimilarityController } from "../app/controller/self_similarity_controller";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";


const testing = true;


describe("SelfSimilarityController", () => {
  describe("After selecting the initial algorithm page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the algorithm page, then the self-similarity sub-page
    sequencer.grid.keyPress({y: 7, x: 11, s: 1});
    sequencer.grid.keyPress({y: 6, x: 3, s: 1});
    const activePage = sequencer.grid.activePage as SelfSimilarityController;

    it("the self-similarity controller can be selected", () => {
      expect(activePage).to.be.instanceOf(SelfSimilarityController)
    });

    describe("the default self-similarity controller state", () => {
      it("has the default self-similarity type range row", () => {
        expect(activePage.getGridSelfSimilarityTypeRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("has the default repetitions row", () => {
        expect(activePage.getRhythmRepetitionsRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });
  });


  // describe("Setting the self-similarty algorithm on a drum rack", () => {
  // });
});
