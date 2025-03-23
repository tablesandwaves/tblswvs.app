import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { DrumInputNoteController } from "../app/controller/drum_input_note_controller";
import { configDirectory } from "./test_helpers";


const testing = true;


describe("DrumInputNoteController", () => {
  describe("selecting the initial drum controller page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 3, s: 1}); // Select the Perc track, which is a drum rack,
    sequencer.grid.keyPress({y: 7, x: 8, s: 1}); // then select the input notes page.

    it("sets the active page to a drum pad page", () => {
      expect(sequencer.grid.activePage).to.be.instanceOf(DrumInputNoteController);
    });

    it("generates the drum pad matrix for the grid", () => {
      (sequencer.grid.activePage as DrumInputNoteController).getGridDrumPadRows().forEach(row => {
        expect(row).to.have.ordered.members([1, 1, 1, 1,  0, 0, 0, 0]);
      });
    });
  });
});
