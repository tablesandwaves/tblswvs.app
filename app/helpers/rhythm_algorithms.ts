import { RhythmStep } from "../model/ableton/track";


export const surroundRhythm = (sourceRhythm: RhythmStep[]): RhythmStep[] => {
  const surroundingRhythm: RhythmStep[] = [...new Array(sourceRhythm.length)].map(() => {
    return {state: 0, probability: 1, fillRepeats: 0};
  });

  sourceRhythm.forEach((step, i, steps) => {
    if (step.state == 1) {
      if (steps.at(i - 1).state == 0) surroundingRhythm.at(i - 1).state = 1;
      if (steps.at((i + 1) % steps.length).state == 0) surroundingRhythm.at((i + 1) % steps.length).state = 1;
    }
  });

  return surroundingRhythm;
}


export const acceleratingBeatPositions = (gateCount: number, spreadAmount: number, offset: number) => {
  const acceleratingRange           = [...new Array(gateCount)].map((_, i) => i).map(i => 0.9 ** i);
  const acceleratingRangeNormalizer = 1 / acceleratingRange.reduce((p, c) => p + c, 0);
  const normalizedAcceleratingRange = acceleratingRange.map(offset => offset * acceleratingRangeNormalizer);

  const spreadNormalizedAcceleratingRange = normalizedAcceleratingRange.map(offset => offset * spreadAmount);
  return spreadNormalizedAcceleratingRange.reduce((beatPositions, distance, i) => {
    beatPositions.push(Math.round((beatPositions[i] + distance + Number.EPSILON) * 1000) / 1000)
    return beatPositions;
  }, [0]).slice(0, gateCount);
}
