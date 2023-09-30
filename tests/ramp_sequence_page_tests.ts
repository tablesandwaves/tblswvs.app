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
    it("has a track with a ramp sequence", () => expect(track.getRampSequence(0)).to.be.instanceOf(RampSequence));
    it("has no segments", () => expect(track.getRampSequence(0).segments.length).to.eq(0));

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

    it("produces the default grid ramp sequence globals row with the first track selected", () => {
      expect(rampSequencePage.gridRampSequenceGlobalsRow()).to.have.ordered.members(
        [10, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });

  describe("Adding a segment", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

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


  describe("Adding multiple segments", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

    // Add segments at index 0 and 6
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


  describe("Removing a segment", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

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


  describe("Activating a ramp sequence", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

    // Add a segment at index 0
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    expect(rampSequence.segments.length).to.eq(1);

    // Activate the ramp sequence in Live
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});

    it("actives the ramp sequence", () => expect(rampSequence.active).to.be.true);

    it("lights up the 'active' indicator in the grid ramp sequence globals row", () => {
      expect(rampSequencePage.gridRampSequenceGlobalsRow()).to.have.ordered.members(
        [10, 0, 10, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("Removing the first segment when two were added", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    // let rampSequence = sequencer.daw.getActiveTrack().rampSequence;

    // Add segments at indices 0 and 8
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 8, s: 1});

    // Select the first segment (index 0) and remove it (press it twice)
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});

    it("unsets the active segment", () => expect(rampSequencePage.activeSegment).to.be.undefined);

    it("the track's ramp sequence size is updated", () => {
      expect(sequencer.daw.getActiveTrack().getRampSequence(0).segments.length).to.eq(1);
    });

    it("the track's ramp sequence has a remaining segment at the right index", () => {
      expect(sequencer.daw.getActiveTrack().getRampSequence(0).segments[0].startIndex).to.eq(8);
    });

    it("has a segment row that only includes the remaining segment", () => {
      expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  3, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has a subdivision row for the remaining segment", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  3, 3, 3, 3,  3, 3, 3, 3]
      );
    });

    it("has a blank range row with no active segment", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("Adding segments to both of a track's 2 ramp sequences", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence1 = sequencer.daw.getActiveTrack().getRampSequence(0);
    let rampSequence2 = sequencer.daw.getActiveTrack().getRampSequence(1);

    // Add a segment at index 0
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});

    // Select the second ramp segment, then add two segments to it.
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 6, s: 1});

    it("adds the the correct segments to the first track", () => expect(rampSequence1.segments.length).to.eq(1));
    it("adds the the correct segments to the second track", () => expect(rampSequence2.segments.length).to.eq(2));

    it("produces a grid segment row with the most recently added ramp sequence's most recent segment highlighted ", () => {
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

    it("produces the grid ramp sequence globals row with the last selected track", () => {
      expect(rampSequencePage.gridRampSequenceGlobalsRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("Adding segments to both of a track's 2 ramp sequences and reselecting the first edited segment", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
    let rampSequence1 = sequencer.daw.getActiveTrack().getRampSequence(0);
    let rampSequence2 = sequencer.daw.getActiveTrack().getRampSequence(1);

    // Add a segment at index 0
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});

    // Select the second ramp segment, then add two segments to it.
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 6, s: 1});

    // Re-select the track's first ramp segment
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});

    it("adds the the correct segments to the first track", () => expect(rampSequence1.segments.length).to.eq(1));
    it("adds the the correct segments to the second track", () => expect(rampSequence2.segments.length).to.eq(2));
    it("unsets the the grid page's active segment", () => expect(rampSequencePage.activeSegment).to.be.undefined);

    it("produces a grid segment row with no segment highlighted ", () => {
      expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
        [3, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("produces a subdivision row with no segment highlighted", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [3, 3, 3, 3,  3, 3, 3, 3,  3, 3, 3, 3,  3, 3, 3, 3]
      );
    });

    it("produces an empty grid range row because no segment is selected", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("produces the grid ramp sequence globals row with the last selected track", () => {
      expect(rampSequencePage.gridRampSequenceGlobalsRow()).to.have.ordered.members(
        [10, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("Subdivision editing", () => {
    describe("shortening the subdivision length", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

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
      let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

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
      let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

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


  describe("Removing a segment updates the grid rows", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;

    // Add segments at index 0, 8, then press
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 8, s: 1});
    sequencer.grid.keyPress({y: 0, x: 8, s: 1});

    it("has the non-removed segment row", () => {
      expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
        [3, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has the non-removed segment subdivision row", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [3, 3, 3, 3,  3, 3, 3, 3,  3, 3, 3, 3,  3, 3, 3, 3]
      );
    });

    it("has an empty range row with no active segment", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("Selecting another track while on the ramp sequence page", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;

    // Add segments at index 0, 8, then press
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 8, s: 1});

    expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
      [3, 0, 0, 0,  0, 0, 0, 0,  12, 0, 0, 0,  0, 0, 0, 0]
    );
    expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
      [3, 3, 3, 3,  3, 3, 3, 3,  12, 12, 12, 12,  12, 12, 12, 12]
    );
    expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
      [12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12]
    );

    // Select a different track. Simulating track selection via keyPress:
    //
    //  sequencer.grid.keyPress({y: 7, x: 1, s: 1});
    //
    // would trigger an attempt to update the Electron browser window, which is not available in tests
    // (for now, at least). Therefore set the track and call the refresh() manually, as if
    //
    //   MonomeGrid.#setActiveTrack(1)
    //
    // were called.
    sequencer.daw.activeTrack = 1;
    rampSequencePage.refresh();

    it("empties the segment row", () => {
      [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
    });

    it("empties subdivision row", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("empties the range row", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("Going back to a track with segments while on the ramp sequence page", () => {
    const sequencer = new Sequencer(testing);
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    let rampSequencePage = sequencer.grid.activePage as RampSequencePage;

    // Add segments at index 0, 8, then press
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 8, s: 1});

    expect(rampSequencePage.gridSegmentRow()).to.have.ordered.members(
      [3, 0, 0, 0,  0, 0, 0, 0,  12, 0, 0, 0,  0, 0, 0, 0]
    );
    expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
      [3, 3, 3, 3,  3, 3, 3, 3,  12, 12, 12, 12,  12, 12, 12, 12]
    );
    expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
      [12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12,  12, 12, 12, 12]
    );

    // Select a different track. Simulating track selection via keyPress:
    //
    //  sequencer.grid.keyPress({y: 7, x: 1, s: 1});
    //
    // would trigger an attempt to update the Electron browser window, which is not available in tests
    // (for now, at least). Therefore set the track and call the refresh() manually, as if
    //
    //   MonomeGrid.#setActiveTrack(1)
    //
    // were called.
    sequencer.daw.activeTrack = 1;
    rampSequencePage.refresh();
    sequencer.daw.activeTrack = 0;
    rampSequencePage.refresh();

    it("displays the segment row with no active segment", () => {
      [3, 0, 0, 0,  0, 0, 0, 0,  3, 0, 0, 0,  0, 0, 0, 0]
    });

    it("displays the subdivision row with no active segment", () => {
      expect(rampSequencePage.gridSubdivisionRow()).to.have.ordered.members(
        [3, 3, 3, 3,  3, 3, 3, 3,  3, 3, 3, 3,  3, 3, 3, 3]
      );
    });

    it("displays an empty range row because no segment is active", () => {
      expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("Range editing", () => {
    describe("can set a range between 0 and 1", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.267 and 0.733, the middle 8 buttons
      sequencer.grid.keyPress({y: 2, x: 4, s: 1});
      sequencer.grid.keyPress({y: 2, x: 11, s: 1});
      sequencer.grid.keyPress({y: 2, x: 4, s: 0});
      sequencer.grid.keyPress({y: 2, x: 11, s: 0});

      it("updates the range start", () => expect(rampSequence.segments[0].range.start).to.eq(0.267));
      it("updates the range end", () => expect(rampSequence.segments[0].range.end).to.eq(0.733));

      it("updates the grid range row", () => {
        expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
          [0, 0, 0, 0,  12, 12, 12, 12,  12, 12, 12, 12,  0, 0, 0, 0]
        );
      });
    });

    describe("setting a high-to-low range", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.733 and 0.267, th middle 8 buttons
      sequencer.grid.keyPress({y: 2, x: 11, s: 1});
      sequencer.grid.keyPress({y: 2, x: 4, s: 1});
      sequencer.grid.keyPress({y: 2, x: 4, s: 0});
      sequencer.grid.keyPress({y: 2, x: 11, s: 0});

      it("updates the range start", () => expect(rampSequence.segments[0].range.start).to.eq(0.733));
      it("updates the range end", () => expect(rampSequence.segments[0].range.end).to.eq(0.267));

      it("updates the grid range row", () => {
        expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
          [0, 0, 0, 0,  12, 12, 12, 12,  12, 12, 12, 12,  0, 0, 0, 0]
        );
      });

      it("produces a grid ramp sequence globals row with the high-to-low indicator on", () => {
        expect(rampSequencePage.gridRampSequenceGlobalsRow()).to.have.ordered.members(
          [10, 0, 0, 10,  0, 0, 0, 0]
        );
      });
    });

    describe("setting a static range", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.25 and 0.75
      sequencer.grid.keyPress({y: 2, x: 3, s: 1});
      sequencer.grid.keyPress({y: 2, x: 3, s: 0});

      it("updates the range start", () => expect(rampSequence.segments[0].range.start).to.eq(0.2));
      it("updates the range end", () => expect(rampSequence.segments[0].range.end).to.eq(0.2));

      it("updates the grid range row", () => {
        expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
          [0, 0, 0, 12,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
        );
      });

      it("does not produce a grid ramp sequence globals row with the high-to-low indicator on", () => {
        expect(rampSequencePage.gridRampSequenceGlobalsRow()).to.have.ordered.members(
          [10, 0, 0, 0,  0, 0, 0, 0]
        );
      });
    });

    describe("setting a static range of 1", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.25 and 0.75
      sequencer.grid.keyPress({y: 2, x: 15, s: 1});
      sequencer.grid.keyPress({y: 2, x: 15, s: 0});

      it("updates the range start", () => expect(rampSequence.segments[0].range.start).to.eq(1));
      it("updates the range end", () => expect(rampSequence.segments[0].range.end).to.eq(1));

      it("updates the grid range row", () => {
        expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
          [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 12]
        );
      });
    });

    describe("setting a static range of 0", () => {
      const sequencer = new Sequencer(testing);
      sequencer.grid.keyPress({y: 7, x: 9, s: 1});
      let rampSequencePage = sequencer.grid.activePage as RampSequencePage;
      let rampSequence = sequencer.daw.getActiveTrack().getRampSequence(0);

      // Add a segment at index 0
      sequencer.grid.keyPress({y: 0, x: 0, s: 1});

      // Press buttons for the range between 0.25 and 0.75
      sequencer.grid.keyPress({y: 2, x: 0, s: 1});
      sequencer.grid.keyPress({y: 2, x: 0, s: 0});

      it("updates the range start", () => expect(rampSequence.segments[0].range.start).to.eq(0));
      it("updates the range end", () => expect(rampSequence.segments[0].range.end).to.eq(0));

      it("updates the grid range row", () => {
        expect(rampSequencePage.gridRangeRow()).to.have.ordered.members(
          [12, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
        );
      });
    });
  });
});
