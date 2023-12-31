import * as path from "path";
import { RhythmStep } from "../app/model/ableton/track";


export const configDirectory = path.join(__dirname, "..", "config");


export const rhythmStepsForPattern = (pattern: (0|1)[]): RhythmStep[] => {
  return pattern.map(state => {
    return {state: state, probability: 1, fillRepeats: 0}
  });
}


export const patternForRhythmSteps = (rhythmSteps: RhythmStep[]): number[] => {
  return rhythmSteps.map(rhythmStep => rhythmStep.state);
}
