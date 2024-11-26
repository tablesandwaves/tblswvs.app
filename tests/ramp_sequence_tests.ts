import { expect } from "chai";
import { RampSequence } from "../app/model/ableton/ramp_sequence";


describe("RampSequence", () => {
  describe("an empty sequence", () => {
    const rampSequence = new RampSequence();

    it("has an empty segment array", () => {
      expect(rampSequence.segments.length).to.eq(0);
    });
  });


  describe("adding the first outer steps at position 0", () => {
    const rampSequence = new RampSequence();
    const rampSegment = rampSequence.addSegment(0);

    it("should have one segment", () => {
      expect(rampSequence.segments.length).to.eq(1);
    });

    it("should store the outer gate", () => {
      expect(rampSegment.startIndex).to.eq(0);
    });

    it("should set the default length", () => {
      expect(rampSegment.length).to.eq(16);
    });

    it("should set the default value for the subdivision length", () => {
      expect(rampSegment.subdivisionLength).to.eq(16);
    });

    it("should set the default value for the range", () => {
      expect(rampSegment.range.start).to.eq(0);
      expect(rampSegment.range.end).to.eq(1);
    });

    it("should generate a tblswvs.rampseq M4L device data", () => {
      expect(rampSequence.deviceData()).to.have.ordered.members([16, 16, 0, 1]);
    });

    it("can have its subdivision length updated, which updates the grid subdivision row", () => {
      const rampSequence = new RampSequence();
      rampSequence.addSegment(0);
      rampSequence.updateSubdivisionLength(0, 5);
      expect(rampSequence.segments[0].subdivisionLength).to.eq(5);
      expect(rampSequence.deviceData()).to.have.ordered.members([16, 5, 0, 1]);
    });

    it("can have its range updated, which updates the grid range row", () => {
      rampSequence.updateRange(0, 0.25, 0.75);
      expect(rampSequence.segments[0].range.start).to.eq(0.25);
      expect(rampSequence.segments[0].range.end).to.eq(0.75);
      expect(rampSequence.deviceData()).to.have.ordered.members([16, 16, 0.25, 0.75]);
    });
  });


  describe("adding multiple steps", () => {
    const rampSequence = new RampSequence();
    rampSequence.addSegment(0);
    rampSequence.addSegment(6);

    it("should have two segments", () => {
      expect(rampSequence.segments.length).to.eq(2);
    });

    it("should store the outer gates", () => {
      expect(rampSequence.segments[0].startIndex).to.eq(0);
      expect(rampSequence.segments[1].startIndex).to.eq(6);
    });

    it("should set the default length and adjust the existing length", () => {
      expect(rampSequence.segments[0].length).to.eq(6);
      expect(rampSequence.segments[1].length).to.eq(10);
    });

    it("should set the default value for the subdivision length", () => {
      expect(rampSequence.segments[0].subdivisionLength).to.eq(6);
      expect(rampSequence.segments[1].subdivisionLength).to.eq(10);
    });

    it("should extend the tblswvs.rampseq M4L device data", () => {
      expect(rampSequence.deviceData()).to.have.ordered.members([6, 6, 0, 1,  10, 10, 0, 1]);
    });
  });


  describe("adding a segment that alters a previous segment's subdivision length", () => {
    const rampSequence = new RampSequence();
    rampSequence.addSegment(0);
    rampSequence.updateSubdivisionLength(0, 8);
    rampSequence.addSegment(6);
    rampSequence.updateSubdivisionLength(6, 3);

    it("should have two segments", () => {
      expect(rampSequence.segments.length).to.eq(2);
    });

    it("should store the outer gates", () => {
      expect(rampSequence.segments[0].startIndex).to.eq(0);
      expect(rampSequence.segments[1].startIndex).to.eq(6);
    });

    it("should set the default length and adjust the existing length", () => {
      expect(rampSequence.segments[0].length).to.eq(6);
      expect(rampSequence.segments[1].length).to.eq(10);
    });

    it("does not allow a subdivision length to be greater than the segment length", () => {
      expect(rampSequence.segments[0].subdivisionLength).to.eq(6);
      expect(rampSequence.segments[1].subdivisionLength).to.eq(3);
    });

    it("generate the correct tblswvs.rampseq M4L device data", () => {
      expect(rampSequence.deviceData()).to.have.ordered.members([6, 6, 0, 1,  10, 3, 0, 1]);
    });
  });


  describe("segment validation", () => {
    it("will not start a segment at an index less than 0", () => {
      const rampSequence = new RampSequence();
      rampSequence.addSegment(-1);
      expect(rampSequence.segments[0].startIndex).to.eq(0);
    });

    it("will not start a segment at an index greater than 15", () => {
      const rampSequence = new RampSequence();
      rampSequence.addSegment(16);
      expect(rampSequence.segments[0].startIndex).to.eq(15);
      expect(rampSequence.segments[0].length).to.eq(1);
    });
  });


  describe("subdivision validation", () => {
    const rampSequence = new RampSequence();
    rampSequence.addSegment(0);

    it("will not set a subdivision length greater than the segment length", () => {
      rampSequence.updateSubdivisionLength(0, 17);
      expect(rampSequence.segments[0].subdivisionLength).to.eq(16);
    });

    it("will not set a subdivision length less than 1", () => {
      rampSequence.updateSubdivisionLength(0, 0);
      expect(rampSequence.segments[0].subdivisionLength).to.eq(16);
    });

    it("will not set a subdivision that would run past the 16 step limit", () => {
      rampSequence.addSegment(14);
      rampSequence.updateSubdivisionLength(14, 3);
      expect(rampSequence.segments[1].subdivisionLength).to.eq(2);
    });
  });


  describe("range validation", () => {
    const rampSequence = new RampSequence();
    rampSequence.addSegment(0);

    it("will not set a range below 0", () => {
      rampSequence.updateRange(0, -0.25, 0.75);
      expect(rampSequence.segments[0].range.start).to.eq(0);
      expect(rampSequence.segments[0].range.end).to.eq(0.75);
    });

    it("will not set a range greater than 1", () => {
      rampSequence.updateRange(0, 0.25, 1.25);
      expect(rampSequence.segments[0].range.start).to.eq(0.25);
      expect(rampSequence.segments[0].range.end).to.eq(1);
    });

    it("will not set a range below 0 when high to low", () => {
      rampSequence.updateRange(0, 0.75, -0.25);
      expect(rampSequence.segments[0].range.start).to.eq(0.75);
      expect(rampSequence.segments[0].range.end).to.eq(0);
    });

    it("will not set a range greater than 1 when high to low", () => {
      rampSequence.updateRange(0, 1.25, 0.25);
      expect(rampSequence.segments[0].range.start).to.eq(1);
      expect(rampSequence.segments[0].range.end).to.eq(0.25);
    });

    it("will allow a static range", () => {
      rampSequence.updateRange(0, 0.5, 0.5);
      expect(rampSequence.segments[0].range.start).to.eq(0.5);
      expect(rampSequence.segments[0].range.end).to.eq(0.5);
    });
  });


  describe("removing a segment", () => {
    it("can remove a single segment", () => {
      const rampSequence = new RampSequence();
      rampSequence.addSegment(0);
      expect(rampSequence.segments.length).to.eq(1);
      rampSequence.removeSegment(0);
      expect(rampSequence.segments.length).to.eq(0);
    });


    describe("rebalancing the last segment after removal from a multi-segment sequence", () => {
      it("will extend a subdivision when it is equal to its length", () => {
        const rampSequence = new RampSequence();
        rampSequence.addSegment(0);
        expect(rampSequence.segments.length).to.eq(1);
        expect(rampSequence.segments[0].subdivisionLength).to.eq(16);

        rampSequence.addSegment(4);
        expect(rampSequence.segments.length).to.eq(2);
        expect(rampSequence.segments[0].subdivisionLength).to.eq(4);
        expect(rampSequence.segments[1].subdivisionLength).to.eq(12);

        rampSequence.addSegment(8);
        expect(rampSequence.segments.length).to.eq(3);
        expect(rampSequence.segments[0].subdivisionLength).to.eq(4);
        expect(rampSequence.segments[1].subdivisionLength).to.eq(4);
        expect(rampSequence.segments[2].subdivisionLength).to.eq(8);

        rampSequence.removeSegment(8);
        expect(rampSequence.segments.length).to.eq(2);
        expect(rampSequence.segments[0].subdivisionLength).to.eq(4);
        expect(rampSequence.segments[1].subdivisionLength).to.eq(12);
      });
    });

    describe("rebalancing a non-last after removal from a multi-segment sequence", () => {
      it("will extend a subdivision when it is equal to its length", () => {
        const rampSequence = new RampSequence();
        rampSequence.addSegment(0);
        expect(rampSequence.segments.length).to.eq(1);
        expect(rampSequence.segments[0].subdivisionLength).to.eq(16);

        rampSequence.addSegment(4);
        expect(rampSequence.segments.length).to.eq(2);
        expect(rampSequence.segments[0].subdivisionLength).to.eq(4);
        expect(rampSequence.segments[1].subdivisionLength).to.eq(12);

        rampSequence.addSegment(8);
        expect(rampSequence.segments.length).to.eq(3);
        expect(rampSequence.segments[0].subdivisionLength).to.eq(4);
        expect(rampSequence.segments[1].subdivisionLength).to.eq(4);
        expect(rampSequence.segments[2].subdivisionLength).to.eq(8);

        rampSequence.removeSegment(4);
        expect(rampSequence.segments.length).to.eq(2);
        expect(rampSequence.segments[0].subdivisionLength).to.eq(8);
        expect(rampSequence.segments[1].subdivisionLength).to.eq(8);
      });
    });
  });


  describe("random steps", () => {
    const rampSequence = new RampSequence();
    rampSequence.generateRandomSteps();

    it("generates at least 4 segments based on the max segment length", () => {
      expect(rampSequence.segments.length).to.be.greaterThanOrEqual(4);
    });

    it("has segments with flat ramps", () => {
      rampSequence.segments.forEach(segment => expect(segment.range.start).to.eq(segment.range.end));
    });
  });
});
