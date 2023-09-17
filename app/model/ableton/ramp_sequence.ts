export type RampRange = {
  start: number,
  end: number
}


export type RampSegment = {
  startIndex: number,
  length: number,
  subdivisionLength: number,
  range: RampRange
}


export class RampSequence {
  segments: RampSegment[] = new Array();


  addSegment(index: number): RampSegment {
    if (index < 0) index = 0;
    if (index > 15) index = 15;

    const rampSegment = {
      startIndex: index,
      length: -1,
      subdivisionLength: -1,
      range: {start: 0, end: 1}
    }

    this.segments.push(rampSegment);

    this.#rebalance();

    return rampSegment;
  }


  removeSegment(index: number) {
    // Capture the state just before the segment is removed so you know which segments should have their subdivisions
    // set to full segment length when rebalancing.
    const fullLengthSubdivisionSegments = this.segments.map(segment => segment.length == segment.subdivisionLength);
    const removalIndex = this.segments.findIndex(segment => segment.startIndex == index);

    this.segments.splice(removalIndex, 1);
    fullLengthSubdivisionSegments.splice(removalIndex, 1);

    this.#rebalance(fullLengthSubdivisionSegments);
  }


  #rebalance(fullLengthSubdivisionSegments?: boolean[]) {
    this.segments.sort((a, b) => a.startIndex - b.startIndex);
    this.segments.forEach((segment, i, arr) => {
      segment.length = arr[i + 1] == undefined ? 16 - segment.startIndex : arr[i + 1].startIndex - segment.startIndex;
      if (segment.subdivisionLength == -1 ||
        (fullLengthSubdivisionSegments && fullLengthSubdivisionSegments[i]) ||
        segment.subdivisionLength > segment.length) {
        segment.subdivisionLength = segment.length;
      }
    });
  }


  updateSubdivisionLength(segmentStartIndex: number, subdivisionLength: number) {
    const segment = this.segments.find(segment => segment.startIndex == segmentStartIndex);
    if (subdivisionLength >= 1 && subdivisionLength <= segment.length) {
      segment.subdivisionLength = subdivisionLength;
    }
  }


  updateRange(segmentStartIndex: number, start: number, end: number) {
    if (start < 0) start = 0;
    if (start > 1) start = 1;
    if (end < 0)   end   = 0;
    if (end > 1)   end   = 1;

    this.segments.find(segment => segment.startIndex == segmentStartIndex).range.start = start;
    this.segments.find(segment => segment.startIndex == segmentStartIndex).range.end = end;
  }


  gridSegmentRow(): (0|1)[] {
    if (this.segments.length == 0) return new Array(16).fill(0);

    return this.segments.reduce((row, segment) => {
      const subsegment = new Array(segment.length).fill(0);
      subsegment[0] = 1;
      return row.concat(subsegment);
    }, new Array());
  }


  gridSubdivisionRow(): (0|1)[] {
    if (this.segments.length == 0) return new Array(16).fill(0);

    return this.segments.reduce((row, segment) => {
      return row.concat(new Array(segment.subdivisionLength).fill(1))
                .concat(new Array(segment.length - segment.subdivisionLength).fill(0));
    }, new Array());
  }


  gridRangeRow(segmentStartIndex: number): (0|1)[] {
    if (this.segments.length == 0) return new Array(16).fill(0);

    const segment = this.segments.find(segment => segment.startIndex == segmentStartIndex);

    return [...new Array(16)].map((e, i) => {
      if (segment.range.start <= segment.range.end && i / 16 >= segment.range.start && i / 16 <= segment.range.end) return 1;
      if (segment.range.start >  segment.range.end && i / 16 <= segment.range.start && i / 16 >= segment.range.end) return 1;
      return 0;
    });
  }
}
