import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { RampSequencePage } from "../app/model/grid/ramp_sequence_page";


const testing   = true;


describe("RampSequencePage", () => {
  describe("Adding a segment", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

    // Add a segment at index 0
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});

    it("adds the segment to a track", () => expect(rampSequence.segments.length).to.eq(1));
    it("has the default length", () => expect(rampSequence.segments[0].length).to.eq(16));
    it("has the default subdiv length", () => expect(rampSequence.segments[0].subdivisionLength).to.eq(16));
    it("has the start index", () => expect(rampSequence.segments[0].startIndex).to.eq(0));
    it("has the default range start", () => expect(rampSequence.segments[0].range.start).to.eq(0));
    it("has the default range end", () => expect(rampSequence.segments[0].range.end).to.eq(1));
    it("produces the default grid range row", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12]
      );
    })
  });


  describe("Range editing", () => {
    it("can set a range between 0 and 1", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.25 and 0.75
      sequencer.grid.keyPress({y: 2, x: 3, s: 1});
      sequencer.grid.keyPress({y: 2, x: 11, s: 1});
      sequencer.grid.keyPress({y: 2, x: 3, s: 0});
      sequencer.grid.keyPress({y: 2, x: 11, s: 0});

      expect(rampSequence.segments.length).to.eq(1);
      expect(rampSequence.segments[0].range.start).to.eq(0.25);
      expect(rampSequence.segments[0].range.end).to.eq(0.75);
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 12,  12, 12, 12, 12,  12, 12, 12, 12,  0, 0, 0, 0]
      );
    });

    it("can set a high-to-low range", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.75 and 0.25
      sequencer.grid.keyPress({y: 2, x: 11, s: 1});
      sequencer.grid.keyPress({y: 2, x: 3, s: 1});
      sequencer.grid.keyPress({y: 2, x: 3, s: 0});
      sequencer.grid.keyPress({y: 2, x: 11, s: 0});

      expect(rampSequence.segments.length).to.eq(1);
      expect(rampSequence.segments[0].range.start).to.eq(0.75);
      expect(rampSequence.segments[0].range.end).to.eq(0.25);
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 12,  12, 12, 12, 12,  12, 12, 12, 12,  0, 0, 0, 0]
      );
    });

    it("can set a static range", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.25 and 0.75
      sequencer.grid.keyPress({y: 2, x: 3, s: 1});
      sequencer.grid.keyPress({y: 2, x: 3, s: 0});

      expect(rampSequence.segments.length).to.eq(1);
      expect(rampSequence.segments[0].range.start).to.eq(0.25);
      expect(rampSequence.segments[0].range.end).to.eq(0.25);
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 12,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

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

    it("can set a static range of 1", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.25 and 0.75
      sequencer.grid.keyPress({y: 2, x: 15, s: 1});
      sequencer.grid.keyPress({y: 2, x: 15, s: 0});

      expect(rampSequence.segments.length).to.eq(1);
      expect(rampSequence.segments[0].range.start).to.eq(1);
      expect(rampSequence.segments[0].range.end).to.eq(1);
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 12]
      );
    });

    it("can set a static range of 0", () => {
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
