import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { ShiftRegisterController } from "../app/controller/shift_register_controller";
import { configDirectory } from "./test_helpers";
import { MelodicTrack } from "../app/model/ableton/melodic_track";


const testing = true;


describe("ShiftRegisterController", () => {
  describe("After selecting the initial algorithm page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select a non-drum rack track
    sequencer.grid.keyPress({y: 7, x: 4, s: 1});

    // Select the note input page, then the shift register sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});
    const activePage = sequencer.grid.activePage as ShiftRegisterController;

    it("the shift register controller can be selected", () => {
      expect(activePage).to.be.instanceOf(ShiftRegisterController)
    });

    describe("the default shift register controller state", () => {
      it("has the default shift register length row", () => expect(activePage.getShiftRegisterLengthRow()).to.have.ordered.members([
        10, 10, 10, 10,  10, 10, 10, 10
      ]));

      it("has the default shift register chance row", () => expect(activePage.getShiftRegisterChanceRow()).to.have.ordered.members([
        10, 10, 10, 10,  10, 10, 10, 10
      ]));

      it("has the default shift register range row", () => expect(activePage.getShiftRegisterRangeRow()).to.have.ordered.members([
        0, 10, 10, 0
      ]));

      it("has the default algorithm row (shift register selected)", () => expect(activePage.getGridAlgorithmRow()).to.have.ordered.members([
        0, 0, 10, 0,  0, 0, 0, 0
      ]));
    });

    describe("after paging right and then back", () => {
      sequencer.grid.keyPress({y: 7, x: 15, s: 1});
      sequencer.grid.keyPress({y: 7, x: 15, s: 0});
      sequencer.grid.keyPress({y: 7, x: 14, s: 1});
      sequencer.grid.keyPress({y: 7, x: 14, s: 0});

      it("reloads the shift register page and not the (simple) input notes controller", () => {
        expect(sequencer.grid.activePage).to.be.instanceOf(ShiftRegisterController);
      });
    });
  });


  describe("Updating shift register parameters", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select a non-drum rack track
    sequencer.grid.keyPress({y: 7, x: 4, s: 1});

    const track = sequencer.daw.getActiveTrack() as MelodicTrack;

    // Select the note input page, then the shift register sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});

    it("can update the track's shift register length", () => {
      sequencer.grid.keyPress({y: 2, x: 2, s: 1});
      expect(track.shiftRegister.length).to.eq(3);
    });

    it("can update the track's shift register chance", () => {
      sequencer.grid.keyPress({y: 3, x: 2, s: 1});
      expect(track.shiftRegister.chance).to.eq(0.375);
    });

    it("can update the track's shift register range", () => {
      sequencer.grid.keyPress({y: 2, x: 8, s: 1});
      sequencer.grid.keyPress({y: 2, x: 10, s: 1});
      sequencer.grid.keyPress({y: 2, x: 8, s: 0});
      sequencer.grid.keyPress({y: 2, x: 10, s: 0});
      expect(track.shiftRegisterOctaveRange).to.have.ordered.members([1, 1, 1, 0]);
    });
  });
});
