import * as path from "path";
import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { AbletonTrack, RhythmStep } from "../app/model/ableton/track";
import { RhythmController } from "../app/controller/rhythm_controller";
import { DrumTrack } from "../app/model/ableton/drum_track";
import { GridKeyPress } from "../app/controller/application_controller";
import { MelodicTrack } from "../app/model/ableton/melodic_track";
import { InputNoteController } from "../app/controller/input_note_controller";


export const configDirectory = path.join(__dirname, "..", "config");


export const rhythmStepsForPattern = (pattern: (0|1)[]): RhythmStep[] => {
  return pattern.map(state => {
    return {state: state, probability: 1, fillRepeats: 0, timingOffset: 0}
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


export const baselineDrumPadActivation = (sequencer: Sequencer) => {
  // Select the Perc track with a drum rack, then set its drum rack chain
  sequencer.grid.keyPress({y: 7, x: 3, s: 1});
  const track = sequencer.daw.getActiveTrack() as DrumTrack;

  // Select the rhythm page
  sequencer.grid.keyPress({y: 7, x: 7, s: 1});

  // Turn on note recording
  sequencer.grid.keyPress({y: 4, x: 4, s: 1});

  // Press and hold a gate, then select a drum pad: step 0, midi note 36
  sequencer.grid.keyPress({y: 0, x: 0, s: 1});
  sequencer.grid.keyPress({y: 6, x: 0, s: 1});
  sequencer.grid.keyPress({y: 6, x: 0, s: 0});
  sequencer.grid.keyPress({y: 0, x: 0, s: 0});
  // Press and hold a gate, then select a drum pad: step 12, midi note 37
  sequencer.grid.keyPress({y: 0, x: 12, s: 1});
  sequencer.grid.keyPress({y: 6, x: 1, s: 1});
  sequencer.grid.keyPress({y: 6, x: 1, s: 0});
  sequencer.grid.keyPress({y: 0, x: 12, s: 0});

  expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
    1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
    0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
  ]);
  expect(track.outputNotes.length).to.eq(2);
  expect(track.outputNotes.flatMap(noteArray => noteArray[0].midi)).to.have.ordered.members([36, 37]);
  const stepsWithBeats = track.sequence.reduce((indices: number[], step, i) => {
    if (step.length > 0) indices.push(i);
    return indices;
  }, []);
  expect(stepsWithBeats).to.have.ordered.members([0, 12]);

  const pad36Positions = track.currentAbletonNotes.filter(note => note.midiNote == 36).map(note => note.clipPosition);
  const pad37Positions = track.currentAbletonNotes.filter(note => note.midiNote == 37).map(note => note.clipPosition);
  expect(pad36Positions).to.have.ordered.members([0, 8, 16, 24]);
  expect(pad37Positions).to.have.ordered.members([3, 11, 19, 27]);
}


export const mockDrumNoteRecording = (sequencer: Sequencer, rhythmKeyPresses: GridKeyPress[], noteKeyPresses: GridKeyPress[]) => {
  sequencer.grid.keyPress({y: 7, x: 3, s: 1}); // Select the Perc track, which is a drum rack,
  sequencer.grid.keyPress({y: 7, x: 8, s: 1}); // then select the input notes page.

  // Add rhythm gates
  rhythmKeyPresses.forEach(keyPress => sequencer.grid.keyPress(keyPress));

  sequencer.grid.keyPress({y: 2, x: 15, s: 1}); // Turn on note recording
  noteKeyPresses.forEach(keyPress => sequencer.grid.keyPress(keyPress)); // Add notes
  sequencer.grid.keyPress({y: 2, x: 15, s: 1}); // Turn off note recording
  sequencer.grid.keyPress({y: 6, x: 15, s: 1}); // Advance
}


export const getInputRecordingMocks = (): [Sequencer, AbletonTrack, InputNoteController] => {
  const sequencer = new Sequencer(configDirectory, true);
  sequencer.grid.keyPress({y: 7, x: 6, s: 1}); // Set the active track to a melodic track.
  sequencer.grid.keyPress({y: 7, x: 8, s: 1}); // Select the note input page

  const track = sequencer.daw.getActiveTrack() as MelodicTrack;
  const controller = sequencer.grid.activePage as InputNoteController;

  return [sequencer, track, controller];
}
