import { RhythmStep } from "../model/ableton/track";


export const surroundRhythm = (sourceRhythm: RhythmStep[]): RhythmStep[] => {
  const surroundingRhythm: RhythmStep[] = [...new Array(sourceRhythm.length)].map(() => {
    return {state: 0, probability: 1, fillRepeats: 0};
  });

  let firstOnGateEncountered = false;
  let currentGateOn          = false;

  sourceRhythm.forEach((step, i) => {
    if (step.state == 1) {
      if (!firstOnGateEncountered) surroundingRhythm.at(i - 1).state = 1;
      firstOnGateEncountered = true;
      currentGateOn          = true;
    } else {
      currentGateOn = false;
    }

    if (!currentGateOn && firstOnGateEncountered) surroundingRhythm[i].state = 1;
  });

  // Edge case: the last RhythmStep in source rhythm is on
  if (sourceRhythm[sourceRhythm.length - 1].state == 1 && sourceRhythm[0].state == 0) {
    surroundingRhythm[0].state = 1;
  }

  return surroundingRhythm;
}
