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
