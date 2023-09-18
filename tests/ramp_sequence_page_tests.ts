import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { RampSequencePage } from "../app/model/grid/ramp_sequence_page";


const testing   = true;


describe("RampSequencePage", () => {
  describe("Range editing", () => {
    it("can set a range from zero to any number", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      expect(rampSequencePage.rampPressRange).to.eq(undefined);

      // Press the first two range buttons
      sequencer.grid.keyPress({y: 2, x: 0, s: 1});
      sequencer.grid.keyPress({y: 2, x: 1, s: 1});
      sequencer.grid.keyPress({y: 2, x: 0, s: 0});
      sequencer.grid.keyPress({y: 2, x: 1, s: 0});
      expect(rampSequencePage.rampPressRange.startIndex).to.eq(0);
      expect(sequencer.daw.getActiveTrack().rampSequence.segments[0].range.start).to.eq(0);
      expect(sequencer.daw.getActiveTrack().rampSequence.segments[0].range.end).to.eq(0.125);
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [12, 12, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("can zero out the active sequence range", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      expect(rampSequencePage.rampPressRange).to.eq(undefined);

      // Set the segment range to 0.0625
      sequencer.grid.keyPress({y: 2, x: 0, s: 1});
      expect(rampSequencePage.rampPressRange.startIndex).to.eq(1);
      expect(rampSequencePage.rampPressRange.endIndex).to.eq(undefined);

      sequencer.grid.keyPress({y: 2, x: 0, s: 0});
      expect(sequencer.daw.getActiveTrack().rampSequence.segments[0].range.start).to.eq(0.0625);
      expect(sequencer.daw.getActiveTrack().rampSequence.segments[0].range.end).to.eq(0.0625);
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [12, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );

      // Set the segment range to 0 by pressing the same 0-index button again while it is on
      sequencer.grid.keyPress({y: 2, x: 0, s: 1});
      sequencer.grid.keyPress({y: 2, x: 0, s: 0});
      expect(sequencer.daw.getActiveTrack().rampSequence.segments[0].range.start).to.eq(0);
      expect(sequencer.daw.getActiveTrack().rampSequence.segments[0].range.end).to.eq(0);
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });
});
