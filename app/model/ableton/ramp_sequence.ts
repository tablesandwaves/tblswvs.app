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
  active: boolean = false;
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


  generateRandomSteps() {
    let sequenceLength = 0;
    this.segments = new Array();

    while (sequenceLength < 16) {
      const segmentLength = Math.ceil(Math.random() * 4);
      const segmentRange  = Math.random();
      const rampSegment = {
        startIndex: sequenceLength,
        length: segmentLength,
        subdivisionLength: segmentLength,
        range: {start: segmentRange, end: segmentRange}
      }

      this.segments.push(rampSegment);
      sequenceLength += segmentLength;
    }
    this.segments.at(-1).length = 16 - this.segments.at(-1).startIndex;
  }


  deviceData(): number[] {
    return this.segments.flatMap(segment => [
      segment.length,
      segment.subdivisionLength,
      segment.range.start,
      segment.range.end
    ]);
  }
}
