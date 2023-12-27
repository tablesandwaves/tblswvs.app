import { expect } from "chai";
import { AbletonLive } from "../app/model/ableton/live";
import { Sequencer } from "../app/model/sequencer";
import { rhythmStepsForPattern } from "./test_helpers";


const testing   = true;
const sequencer = new Sequencer(testing);


describe("AbletonLive", () => {
  describe("when computing the combined rhythm section rhythm", () => {
    it("generates rhythm for tracks that have the same step length", () => {
      const daw = new AbletonLive(sequencer);
      daw.tracks[0].rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      daw.tracks[1].rhythm = rhythmStepsForPattern([
        0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      expect(daw.rhythmSectionRhythm()).to.have.ordered.members([
        1, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("generates a rhythm for tracks without the same step length that is a divisor of the super measure", () => {
      const daw = new AbletonLive(sequencer);
      daw.tracks[0].rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      daw.tracks[1].rhythm = rhythmStepsForPattern([
        0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      daw.tracks[1].rhythmStepLength = 8;

      expect(daw.rhythmSectionRhythm()).to.have.ordered.members([
        1, 1, 0, 0,  0, 0, 0, 0,  0, 1, 0, 0,  0, 0, 0, 0,
        0, 1, 0, 0,  0, 0, 0, 0,  0, 1, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("generates a rhythm for tracks that without the same step length that is NOT a divisor of the super measure", () => {
      const daw = new AbletonLive(sequencer);
      daw.tracks[0].rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      daw.tracks[1].rhythm = rhythmStepsForPattern([
        0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      daw.tracks[1].rhythmStepLength = 12;

      expect(daw.rhythmSectionRhythm()).to.have.ordered.members([
        1, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 1, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 1, 0, 0,  0, 0, 0, 0,
        1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 1, 0, 0
      ]);
    });

    it("generates a rhythm for tracks that without the same step length that is a divisor of an uncommon super measure", () => {
      const sequencer = new Sequencer(testing);
      sequencer.superMeasure = 3;
      const daw = new AbletonLive(sequencer);
      daw.tracks[0].rhythm = rhythmStepsForPattern([1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      daw.tracks[1].rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      daw.tracks[0].rhythmStepLength = 8;
      daw.tracks[1].rhythmStepLength = 12;
      daw.tracks[2].rhythmStepLength = 12;
      daw.tracks[3].rhythmStepLength = 12;

      expect(daw.rhythmSectionRhythm()).to.have.ordered.members([
        1, 1, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
        0, 1, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("generates a rhythm when all tracks have a shortented step length that is a divisor of an uncommon super measure", () => {
      const sequencer = new Sequencer(testing);
      sequencer.superMeasure = 3;
      const daw = new AbletonLive(sequencer);
      daw.tracks[0].rhythm = rhythmStepsForPattern([1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      daw.tracks[0].rhythmStepLength = 12;
      daw.tracks[1].rhythmStepLength = 12;
      daw.tracks[2].rhythmStepLength = 12;
      daw.tracks[3].rhythmStepLength = 12;

      expect(daw.rhythmSectionRhythm()).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("takes into account a track's pulse rate", () => {
      const sequencer = new Sequencer(testing);
      sequencer.superMeasure = 2;
      const daw = new AbletonLive(sequencer);
      daw.tracks[0].rhythm = rhythmStepsForPattern([1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 1]);
      daw.tracks[0].pulseRate = "8n";

      expect(daw.rhythmSectionRhythm()).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 1, 0
      ]);
    });
  });
});
