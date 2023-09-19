import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { RampSequencePage } from "../app/model/grid/ramp_sequence_page";
import { RampSequence } from "../app/model/ableton/ramp_sequence";


const testing   = true;


describe("RampSequencePage", () => {
  describe("Selecting the initial blank ramp sequence page", () => {
    const sequencer = new Sequencer(testing);
    const track = sequencer.daw.getActiveTrack();

    // Select the ramp sequencer page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    const rampSequencePage = sequencer.grid.activePage as RampSequencePage;

    it("sets the active page to a ramp sequence page",() => expect(rampSequencePage).to.be.instanceOf(RampSequencePage));
    it("has no active segment", () => expect(rampSequencePage.activeSegment).to.be.undefined);
    it("has a track with a ramp sequence", () => expect(track.rampSequence).to.be.instanceOf(RampSequence));
    it("has no segments", () => expect(track.rampSequence.segments.length).to.eq(0));

    it("has a blank segment row", () => {
      expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has a blank subdivision row", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has a blank range row", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });

  describe("Adding a segment", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

    // Add a segment at index 0
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});

    it("sets the activeSegment", () => expect(rampSequencePage.activeSegment).not.to.be.undefined);
    it("adds the segment to a track", () => expect(rampSequence.segments.length).to.eq(1));
    it("has the default length", () => expect(rampSequence.segments[0].length).to.eq(16));
    it("has the default subdiv length", () => expect(rampSequence.segments[0].subdivisionLength).to.eq(16));
    it("has the start index", () => expect(rampSequence.segments[0].startIndex).to.eq(0));
    it("has the default range start", () => expect(rampSequence.segments[0].range.start).to.eq(0));
    it("has the default range end", () => expect(rampSequence.segments[0].range.end).to.eq(1));

    it("produces the specified grid segment row", () => {
      expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
        [12, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("produces the default grid subdivision row", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12]
      );
    });

    it("produces the default grid range row", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12]
      );
    });
  });


  describe("adding multiple segments", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

    // Add a segment at index 0
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 6, s: 1});

    it("adds the segment to a track", () => expect(rampSequence.segments.length).to.eq(2));
    it("adjusts the first segment length", () => expect(rampSequence.segments[0].length).to.eq(6));
    it("has the default second segment length", () => expect(rampSequence.segments[1].length).to.eq(10));
    it("adjusts the first segment subdiv length", () => expect(rampSequence.segments[0].subdivisionLength).to.eq(6));
    it("has the default second segment subdiv length", () => expect(rampSequence.segments[1].subdivisionLength).to.eq(10));
    it("leaves the first segment start index in place", () => expect(rampSequence.segments[0].startIndex).to.eq(0));
    it("adds the specified second segment start index", () => expect(rampSequence.segments[1].startIndex).to.eq(6));
    it("leaves the default ranges in tact", () => {
      expect(rampSequence.segments[0].range.start).to.eq(0);
      expect(rampSequence.segments[0].range.end).to.eq(1);
      expect(rampSequence.segments[1].range.start).to.eq(0);
      expect(rampSequence.segments[1].range.end).to.eq(1);
    });

    it("produces a grid segment row with the most recently added segment highlighted ", () => {
      expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
        [3, 0, 0, 0,  0, 0, 12, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("produces a subdivision row with the most recently added segment highlighted", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [3, 3, 3, 3,  3, 3, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12]
      );
    });

    it("produces the default grid range row", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12]
      );
    });
  });


  describe("removing a segment", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

    // Add a segment at index 0
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    expect(rampSequence.segments.length).to.eq(1);

    // Remove the segment
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});

    it("unsets the active segment", () => expect(rampSequencePage.activeSegment).to.be.undefined);

    it("has a blank segment row", () => {
      expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has a blank subdivision row", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has a blank range row", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("Subdivision editing", () => {
    describe("shortening the subdivision length", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

      // Add a segment at index 0 and adjust the subdivision length
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 1, x: 3, s: 1});

      it("shortens the active segment subdiv length", () => {
        expect(rampSequence.segments[0].subdivisionLength).to.eq(4);
      });

      it("updates the grid subdivision row", () => {
        expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
          [12, 12, 12, 12,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
        );
      });
    });


    describe("extending the subdivision length when it is the same size as the segment length", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

      // Add segments at index 0, 8, then press
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 0, x: 8, s: 1});

      // Not in it() functions so the execution order is guaranteed
      // Verify the lengths to confirm that the first segment was shortened before re-extending.
      expect(rampSequence.segments[0].length).to.eq(8);
      expect(rampSequence.segments[1].length).to.eq(8);
      expect(rampSequence.segments[0].subdivisionLength).to.eq(8);
      expect(rampSequence.segments[1].subdivisionLength).to.eq(8);

      // Remove the second segment
      sequencer.grid.keyPress({y: 0, x: 8, s: 1});

      it("extends the first segment length", () => expect(rampSequence.segments[0].length).to.eq(16));
      it("extends the subdivision length", () => expect(rampSequence.segments[0].subdivisionLength).to.eq(16));
    });


    describe("subdivision lengths are not extended when it is not the same size as the segment length", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

      // Add segments at index 0, 8, then press
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});
      sequencer.grid.keyPress({y: 1, x: 3, s: 1});
      sequencer.grid.keyPress({y: 0, x: 8, s: 1});

      // Not in it() functions so the execution order is guaranteed
      expect(rampSequence.segments[0].length).to.eq(8);
      expect(rampSequence.segments[1].length).to.eq(8);
      expect(rampSequence.segments[0].subdivisionLength).to.eq(4);
      expect(rampSequence.segments[1].subdivisionLength).to.eq(8);
      // Remove the second segment
      sequencer.grid.keyPress({y: 0, x: 8, s: 1});

      it("extends the first segment length", () => expect(rampSequence.segments[0].length).to.eq(16));
      it("does not extend the shortened subdivision length", () => expect(rampSequence.segments[0].subdivisionLength).to.eq(4));
    });
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
