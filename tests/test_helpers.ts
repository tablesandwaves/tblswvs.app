import * as path from "path";
import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { AbletonTrack, RhythmStep } from "../app/model/ableton/track";
import { RhythmController } from "../app/controller/rhythm_controller";


export const configDirectory = path.join(__dirname, "..", "config");


export const rhythmStepsForPattern = (pattern: (0|1)[]): RhythmStep[] => {
  return pattern.map(state => {
    return {state: state, probability: 1, fillRepeats: 0}
  });
}


export const patternForRhythmSteps = (rhythmSteps: RhythmStep[]): number[] => {
  return rhythmSteps.map(rhythmStep => rhythmStep.state);
}


export const getRhythmControllerMocks = (): [Sequencer, AbletonTrack, RhythmController] => {
  const testing = true;
  const sequencer = new Sequencer(configDirectory, testing);
  sequencer.grid.keyPress({y: 7, x: 7, s: 1});

  const track      = sequencer.daw.getActiveTrack();
  const controller = sequencer.grid.activePage as RhythmController;

  // Select the manual algorithm, confirm the track rhythm and transport row are empty
  sequencer.grid.keyPress({y: 6, x: 0, s: 1});
  expect(track.rhythmAlgorithm).to.eq("manual");
  expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
    0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
    0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
  ]);
  expect(controller.getRhythmGatesRow()).to.have.ordered.members([
    0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
    0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
  ]);

  return [sequencer, track, controller];
}


const velocityDeviation = 5;

export const velocityWithinRange = (value: number, defaultValue: number) => {
  const min = defaultValue - velocityDeviation;
  const max = defaultValue + velocityDeviation;
  return value >= min && value <= max;
}
