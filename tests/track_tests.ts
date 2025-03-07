import { expect } from "chai";
import { before } from "mocha";
import { AbletonTrack } from "../app/model/ableton/track";
import { Sequencer } from "../app/model/sequencer";
import { AbletonLive } from "../app/model/ableton/live";
import { configDirectory, patternForRhythmSteps, rhythmStepsForPattern, velocityWithinRange } from "./test_helpers";


const testing   = true;
const sequencer = new Sequencer(configDirectory, testing);
const daw       = new AbletonLive(sequencer);


describe("AbletonTrack", () => {
  describe("a new instance", () => {
    const track = daw.getActiveTrack();

    it("can set rhythm steps with default velocities", () => {
      track.rhythmStepLength = 32;
      track.rhythm = rhythmStepsForPattern([
        1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,
        1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1
      ]);
      track.updateCurrentAbletonNotes();
      expect(velocityWithinRange(track.currentAbletonNotes[0].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[1].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[2].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[3].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[4].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[5].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[6].velocity, 75)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[7].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[8].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[9].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[10].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[11].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[12].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[13].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[14].velocity, 75)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[15].velocity, 60)).to.be.true;

      expect(velocityWithinRange(track.currentAbletonNotes[16].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[17].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[18].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[19].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[20].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[21].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[22].velocity, 75)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[23].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[24].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[25].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[26].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[27].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[28].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[29].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[30].velocity, 75)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[31].velocity, 60)).to.be.true;
    });

    it("can set rhythm steps with default velocities for non-default step lengths", () => {
      track.rhythmStepLength = 12;
      track.rhythm = rhythmStepsForPattern([
        1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      track.updateCurrentAbletonNotes();
      expect(velocityWithinRange(track.currentAbletonNotes[0].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[1].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[2].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[3].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[4].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[5].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[6].velocity, 75)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[7].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[8].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[9].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[10].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[11].velocity, 60)).to.be.true;

      expect(velocityWithinRange(track.currentAbletonNotes[12].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[13].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[14].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[15].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[16].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[17].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[18].velocity, 75)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[19].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[20].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[21].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[22].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[23].velocity, 60)).to.be.true;

      expect(velocityWithinRange(track.currentAbletonNotes[24].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[25].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[26].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[27].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[28].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[29].velocity, 60)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[30].velocity, 75)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[31].velocity, 60)).to.be.true;
    });
  });


  describe("track rhythms with a breakpoint", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    const daw       = new AbletonLive(sequencer);
    const track     = daw.getActiveTrack();

    before(() => {
      track.rhythmStepLength = 12;
      track.rhythmStepBreakpoint = 5;
      track.rhythm = rhythmStepsForPattern([
        1, 0, 1, 0,  1, 1, 0, 1,  0, 1, 0, 1,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      track.updateCurrentAbletonNotes();
    });

    it("generate velocities based on grid row position", () => {
      // First measure, pre-breakpoint
      expect(velocityWithinRange(track.currentAbletonNotes[0].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[1].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[2].velocity, 105)).to.be.true;
      // First measure, post-breakpoint
      expect(velocityWithinRange(track.currentAbletonNotes[3].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[4].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[5].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[6].velocity, 75)).to.be.true;

      // Second measure, pre-breakpoint
      expect(velocityWithinRange(track.currentAbletonNotes[7].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[8].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[9].velocity, 105)).to.be.true;
      // Second measure, post-breakpoint
      expect(velocityWithinRange(track.currentAbletonNotes[10].velocity, 120)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[11].velocity, 90)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[12].velocity, 105)).to.be.true;
      expect(velocityWithinRange(track.currentAbletonNotes[13].velocity, 75)).to.be.true;

      // ...
    });
  });


  describe("rhythm algorithms", () => {
    describe("setting the rhythm algorithm to acceleration", () => {
      const sequencer = new Sequencer(configDirectory, testing);
      const daw       = new AbletonLive(sequencer);
      const track     = daw.getActiveTrack();
      track.rhythmStepLength = 16;

      it("generates accelerating beat positions", () => {
        track.rhythm = rhythmStepsForPattern([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
        track.rhythmAlgorithm  = "accelerating";
        track.updateCurrentAbletonNotes();
        let abletonNotes = track.currentAbletonNotes.sort((a, b) => {
          if (a.clipPosition > b.clipPosition) return 1;
          if (a.clipPosition < b.clipPosition) return -1;
          return 0;
        });

        const actual = abletonNotes.slice(0, 20).map(note => (Math.round((note.clipPosition + Number.EPSILON) * 1000) / 1000));
        expect(actual).to.have.ordered.members([
          0, 0.614, 1.167, 1.664, 2.112, 2.515, 2.878, 3.204, 3.498, 3.762,
          4, 4.614, 5.167, 5.664, 6.112, 6.515, 6.878, 7.204, 7.498, 7.762
        ]);
      });

      it("generates accelerating beat positions that matches the gate pattern", () => {
        track.rhythmStepLength = 32;
        track.rhythm = rhythmStepsForPattern([
          1, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
          1, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0
        ]);
        track.rhythmAlgorithm  = "accelerating";
        track.updateCurrentAbletonNotes();
        let abletonNotes = track.currentAbletonNotes.sort((a, b) => {
          if (a.clipPosition > b.clipPosition) return 1;
          if (a.clipPosition < b.clipPosition) return -1;
          return 0;
        });

        const actual = abletonNotes.slice(0, 30).map(note => (Math.round((note.clipPosition + Number.EPSILON) * 1000) / 1000));
        expect(actual).to.have.ordered.members([
          0, 0.154, 0.292, 0.416, 0.528, 0.629, 0.72, 0.802, 0.875, 0.941,
          1, 1.307, 1.583, 1.832, 2.056, 2.257, 2.438, 2.601, 2.748, 2.88,
          3, 3.154, 3.292, 3.416, 3.528, 3.629, 3.72, 3.802, 3.875, 3.941
        ]);
      });

      it("generates accelerating beat positions that matches the gate pattern and shortened step lengths", () => {
        track.rhythmStepLength = 16;
        track.rhythm = rhythmStepsForPattern([
          1, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
        track.rhythmAlgorithm  = "accelerating";
        track.updateCurrentAbletonNotes();
        let abletonNotes = track.currentAbletonNotes.sort((a, b) => {
          if (a.clipPosition > b.clipPosition) return 1;
          if (a.clipPosition < b.clipPosition) return -1;
          return 0;
        });

        const actual = abletonNotes.slice(0, 60).map(note => (Math.round((note.clipPosition + Number.EPSILON) * 1000) / 1000));
        expect(actual).to.have.ordered.members([
          0, 0.154, 0.292, 0.416, 0.528, 0.629, 0.72, 0.802, 0.875, 0.941,
          1, 1.307, 1.583, 1.832, 2.056, 2.257, 2.438, 2.601, 2.748, 2.88,
          3, 3.154, 3.292, 3.416, 3.528, 3.629, 3.72, 3.802, 3.875, 3.941,
          4, 4.154, 4.292, 4.416, 4.528, 4.629, 4.72, 4.802, 4.875, 4.941,
          5, 5.307, 5.583, 5.832, 6.056, 6.257, 6.438, 6.601, 6.748, 6.88,
          7, 7.154, 7.292, 7.416, 7.528, 7.629, 7.72, 7.802, 7.875, 7.941

        ]);
      })
    });


    describe("setting the rhythm algorithm to surround then setting the related track", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];

      perc.rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;

      it("generates the surrounding track's rhythm", () => {
        expect(patternForRhythmSteps(hihat.rhythm)).to.have.ordered.members([
          1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });

    describe("updating the subject track observed by a dependent track", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];

      // Set the first state
      perc.rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;

      expect(patternForRhythmSteps(perc.rhythm)).to.have.ordered.members([
        0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      expect(patternForRhythmSteps(hihat.rhythm)).to.have.ordered.members([
        1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      // Change the subject to a new state
      perc.rhythm = rhythmStepsForPattern([0, 1, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);

      it("causes the dependent track to be updated", () => {
        expect(patternForRhythmSteps(hihat.rhythm)).to.have.ordered.members([
          1, 0, 0, 1,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });

    describe("unsetting the related rhythm track for a surround rhythm algorithm", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];

      perc.rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;
      expect(hihat.rhythm.map(step => step.state)).to.have.ordered.members([
        1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      hihat.relatedRhythmTrackDawIndex = undefined;

      it("leaves the track's rhythm as the surrouned rhythm for editing", () => {
        expect(hihat.rhythm.map(step => step.state)).to.have.ordered.members([
          1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });

    describe("when a track is set to surround another, the dependent track will inherit the pulse rate", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];
      expect(hihat.pulseRate).to.eq("16n");

      perc.rhythm    = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      perc.pulseRate = "8n";
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;

      it("updates the surround track's pulse rate", () => {
        expect(hihat.pulseRate).to.eq("8n");
      });
    });

    describe("when a surrounding track's subject track has its pulse rate updated", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];
      expect(hihat.pulseRate).to.eq("16n");

      perc.rhythm    = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;
      perc.pulseRate = "8n";

      it("updates the surrounding track's pulse rate", () => {
        expect(hihat.pulseRate).to.eq("8n");
      });
    });

    describe("a surrounding track's rhythm", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];
      expect(hihat.pulseRate).to.eq("16n");

      perc.rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;
      expect(patternForRhythmSteps(hihat.rhythm)).to.have.ordered.members([
        1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      hihat.rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);

      it("cannot be updated through itself", () => {
        expect(patternForRhythmSteps(hihat.rhythm)).to.have.ordered.members([
          1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });

    describe("a surrounding track's pulse rate", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];
      expect(hihat.pulseRate).to.eq("16n");

      perc.rhythm    = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;
      perc.pulseRate = "8n";
      hihat.pulseRate = "4n";

      it("cannot be updated through itself", () => {
        expect(hihat.pulseRate).to.eq("8n");
      });
    });

    describe("when a track is set to surround another, the dependent track will inherit the rhythm step length", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];
      expect(hihat.rhythmStepLength).to.eq(32);

      perc.rhythm    = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      perc.rhythmStepLength = 8;
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;

      it("updates the surround track's rhythm step length", () => {
        expect(hihat.rhythmStepLength).to.eq(8);
      });
    });

    describe("when a surrounding track's subject track has its rhythm step length updated", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];
      expect(hihat.rhythmStepLength).to.eq(32);

      perc.rhythm    = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;
      perc.rhythmStepLength = 8;

      it("updates the surrounding track's rhythm step length", () => {
        expect(hihat.rhythmStepLength).to.eq(8);
      });
    });

    describe("a surrounding track's rhythm step length", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];
      expect(hihat.rhythmStepLength).to.eq(32);

      perc.rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;
      perc.rhythmStepLength = 8;
      hihat.rhythmStepLength = 12;

      it("cannot be updated through itself", () => {
        expect(hihat.rhythmStepLength).to.eq(8);
      });
    });

    describe("setting the rhythm algorithm to manual after it was another algorithm", () => {
      const daw   = new AbletonLive(sequencer);
      const perc  = daw.tracks[3];
      const hihat = daw.tracks[2];

      perc.rhythm = rhythmStepsForPattern([0, 1, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]);
      hihat.rhythmAlgorithm = "surround";
      hihat.relatedRhythmTrackDawIndex = perc.dawIndex;
      expect(hihat.rhythm.map(step => step.state)).to.have.ordered.members([
        1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      hihat.rhythmAlgorithm = "manual";

      it("unsets its related rhythm track index", () => {
        expect(hihat.relatedRhythmTrackDawIndex).to.be.undefined;
      });

      it("leaves the last rhythm intact", () => {
        expect(hihat.rhythm.map(step => step.state)).to.have.ordered.members([
          1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });
  });


  describe("melodic evolution properties exhibit mutual exclusivity", () => {
    describe("setting a mutating track to randomizing", () => {
      const daw   = new AbletonLive(sequencer);
      const track = daw.getActiveTrack();

      track.mutating    = true;
      track.randomizing = true;

      it("sets the randomizing property to true", () => expect(track.randomizing).to.be.true);
      it("unsets the mutating property (sets to false)", () => expect(track.mutating).to.be.false);
    });


    describe("setting a randomizing track to mutating", () => {
      const daw   = new AbletonLive(sequencer);
      const track = daw.getActiveTrack();

      track.randomizing = true;
      track.mutating    = true;

      it("sets the mutating property to true", () => expect(track.mutating).to.be.true);
      it("unsets the randomizing property (sets to false)", () => expect(track.randomizing).to.be.false);
    });


    describe("setting a randomizing track to soloing", () => {
      const daw   = new AbletonLive(sequencer);
      const track = daw.getActiveTrack();

      track.randomizing = true;
      track.soloing     = true;

      it("sets the soloing property to true", () => expect(track.soloing).to.be.true);
      it("adds the track's DAW index to the soloists", () => expect(daw.soloists).to.include(track.dawIndex));
      it("unsets the randomizing property (sets to false)", () => expect(track.randomizing).to.be.false);
    });


    describe("setting a soloing track to randomizing", () => {
      const daw   = new AbletonLive(sequencer);
      const track = daw.getActiveTrack();

      track.soloing     = true;
      track.randomizing = true;

      it("sets the randomizing property to true", () => expect(track.randomizing).to.be.true);
      it("sets the soloing property to false", () => expect(track.soloing).to.be.false);
      it("removes the track's DAW index from the soloists", () => expect(daw.soloists).not.to.include(track.dawIndex));
    });
  });


  describe("generating output notes", () => {
    it("should convert a melodic array to a two dimentional array (for polyphony)", () => {
      daw.getActiveTrack().setInputNotes([
        [{octave: 3, note: "C", midi: 60}],
        [{octave: 3, note: "D", midi: 62}]
      ]);

      const expected = [
        [{octave: 3, note: "C", midi: 60}],
        [{octave: 3, note: "D", midi: 62}]
      ];
      expect(daw.getActiveTrack().outputNotes).to.deep.eq(expected);
    });

    it("should set chord progression notes as is in their 2D form", () => {
      daw.getActiveTrack().setInputNotes([
        [{octave: 3, note: "C", midi: 60},  {octave: 3, note: "G", midi: 67}],
        [{octave: 3, note: "C", midi: 60},  {octave: 3, note: "Eb", midi: 63}],
      ]);

      const expected = [
        [{octave: 3, note: "C", midi: 60},  {octave: 3, note: "G", midi: 67}],
        [{octave: 3, note: "C", midi: 60},  {octave: 3, note: "Eb", midi: 63}],
      ];
      expect(daw.getActiveTrack().outputNotes).to.deep.eq(expected);
    });
  });


  describe("generating Ableton notes for a track", () => {
    const track = daw.getActiveTrack();
    describe("with a beat length of 12 16th notes", () => {

      track.rhythmStepLength = 12;
      track.rhythm = rhythmStepsForPattern([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      track.rhythm[0] = {state: 1, probability: 1, fillRepeats: 0, timingOffset: 0};
      track.setInputNotes([
        [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
        [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }],
        [{ octave: 3, note: 'G', midi: 67, scaleDegree: 5 }]
      ]);
      track.updateCurrentAbletonNotes();
      let abletonNotes = track.currentAbletonNotes.sort((a, b) => {
        if (a.clipPosition > b.clipPosition) return 1;
        if (a.clipPosition < b.clipPosition) return -1;
        return 0;
      });

      it("should the have correct number of notes for the maximum super measure of 8", () => {
        expect(abletonNotes.length).to.eq(11);
      });

      it("should have the right notes in order", () => {
        expect(abletonNotes[0].midiNote).to.eq(60);
        expect(abletonNotes[1].midiNote).to.eq(63);
        expect(abletonNotes[2].midiNote).to.eq(67);
      });

      it("should place the notes at the correct positions", () => {
        expect(abletonNotes[0].clipPosition).to.eq(0);
        expect(abletonNotes[1].clipPosition).to.eq(3);
        expect(abletonNotes[2].clipPosition).to.eq(6);
      });
    });
  });


  describe("when generating rhythmic fills", () => {
    const track = daw.getActiveTrack();
    track.rhythmStepLength = 16;
    track.setInputNotes([[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]]);
    track.rhythm = rhythmStepsForPattern([
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    track.rhythm[0]       = {state: 1, probability: 1, fillRepeats: 3, timingOffset: 0};
    track.fillMeasures[1] = 1;
    track.updateCurrentAbletonNotes();
    const abletonNotes = track.currentAbletonNotes.sort((a, b) => {
      if (a.clipPosition > b.clipPosition) return 1;
      if (a.clipPosition < b.clipPosition) return -1;
      return 0;
    });

    it("should the have correct number of notes for the maximum super measure of 8", () => {
      expect(abletonNotes.length).to.eq(11);
    });

    it("should have the right notes in order", () => {
      expect(abletonNotes[0].midiNote).to.eq(60);
      expect(abletonNotes[1].midiNote).to.eq(60);
      expect(abletonNotes[2].midiNote).to.eq(60);
      expect(abletonNotes[3].midiNote).to.eq(60);
      expect(abletonNotes[4].midiNote).to.eq(60);
    });

    it("should place the notes at the correct positions", () => {
      expect(abletonNotes[0].clipPosition).to.eq(0);
      expect(abletonNotes[1].clipPosition).to.eq(4);
      expect(abletonNotes[2].clipPosition).to.eq(4.25);
      expect(abletonNotes[3].clipPosition).to.eq(4.5);
      expect(abletonNotes[4].clipPosition).to.eq(4.75);
    });
  });


  describe("truncating note durations for overlapping notes", () => {
    const track = new AbletonTrack(daw, {name: "Kick", dawIndex: 1, rampSequencer: false});
    track.rhythmStepLength = 16;
    track.noteLength       = "8n";
    track.rhythm = rhythmStepsForPattern([
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    track.rhythm[0] = {state: 1, probability: 1, fillRepeats: 0, timingOffset: 0};
    track.rhythm[1] = {state: 1, probability: 1, fillRepeats: 0, timingOffset: 0};
    track.rhythm[4] = {state: 1, probability: 1, fillRepeats: 0, timingOffset: 0};

    describe("when successive overlapping notes share the same pitch", () => {
      track.setInputNotes([[{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]]);
      track.updateCurrentAbletonNotes();

      const abletonNotes = track.currentAbletonNotes.sort((a, b) => {
        if (a.clipPosition > b.clipPosition) return 1;
        if (a.clipPosition < b.clipPosition) return -1;
        return 0;
      });

      it("truncates earlier notes that share the same pitch", () => {
        // Measure 1
        expect(abletonNotes[0].duration).to.eq(0.25);
        // Measure 2
        expect(abletonNotes[3].duration).to.eq(0.25);
      });

      it("does not truncate notes that do not overlap", () => {
        // Measure 1
        expect(abletonNotes[1].duration).to.eq(0.5);
        expect(abletonNotes[2].duration).to.eq(0.5);
        // Measure 2
        expect(abletonNotes[4].duration).to.eq(0.5);
        expect(abletonNotes[5].duration).to.eq(0.5);
      });
    });

    describe("when successive overlapping notes do not share the same pitch", () => {
      track.setInputNotes([
        [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
        [{ octave: 3, note: 'D', midi: 62, scaleDegree: 1 }],
        [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }]
      ]);
      track.updateCurrentAbletonNotes();

      it("does not truncate earlier notes", () => {
        // Measure 1
        expect(track.currentAbletonNotes[0].duration).to.eq(0.5);
        // Measure 2
        expect(track.currentAbletonNotes[3].duration).to.eq(0.5);
      });
    });
  });


  describe("a drum pad note sequence", () => {
    describe("setting a single step", () => {
      const track = new AbletonTrack(daw, {name: "Perc", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}]);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("C");
        expect(track.outputNotes[0][0].midi).to.eq(36);
      });
    });


    describe("setting a single step with polyphony", () => {
      const track = new AbletonTrack(daw, {name: "Perc", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}, {octave: 1, note: "D", midi: 38}]);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("C");
        expect(track.outputNotes[0][0].midi).to.eq(36);
        expect(track.outputNotes[0][1].octave).to.eq(1);
        expect(track.outputNotes[0][1].note).to.eq("D");
        expect(track.outputNotes[0][1].midi).to.eq(38);
      });
    });


    describe("setting multiple steps", () => {
      const track = new AbletonTrack(daw, {name: "Perc", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}]);
      track.setDrumPadStep(8, [{octave: 1, note: "Eb", midi: 39}]);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("C");
        expect(track.outputNotes[0][0].midi).to.eq(36);
        expect(track.outputNotes[1][0].octave).to.eq(1);
        expect(track.outputNotes[1][0].note).to.eq("Eb");
        expect(track.outputNotes[1][0].midi).to.eq(39);
      });
    });


    describe("removing a step", () => {
      const track = new AbletonTrack(daw, {name: "Perc", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}]);
      track.setDrumPadStep(8, [{octave: 1, note: "Eb", midi: 39}]);
      track.setDrumPadStep(0, undefined);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("Eb");
        expect(track.outputNotes[0][0].midi).to.eq(39);
      });
    });


    describe("removing one note from a step with multiple notes", () => {
      const track = new AbletonTrack(daw, {name: "Perc", dawIndex: 4, rampSequencer: false});
      track.setDrumPadStep(0, [{octave: 1, note: "C", midi: 36}, {octave: 1, note: "D", midi: 38}]);
      track.setDrumPadStep(0, [{octave: 1, note: "D", midi: 38}]);

      it("should update the rhythm", () => {
        expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
          1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("should update the input melody", () => {
        expect(track.outputNotes[0][0].octave).to.eq(1);
        expect(track.outputNotes[0][0].note).to.eq("D");
        expect(track.outputNotes[0][0].midi).to.eq(38);
      });
    });
  });


  describe("editing the rhythm step length", () => {
    const track = new AbletonTrack(daw, {name: "Perc", dawIndex: 4, rampSequencer: false});
    track.rhythmStepLength = 16;
    track.rhythm = rhythmStepsForPattern([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
    ]);
    track.generateOutputNotes();
    expect(track.sequence[0].length).to.eq(1);
    expect(track.sequence[16].length).to.eq(1);
    expect(track.sequence[20].length).to.eq(0);

    it("should update the track's sequence of notes", () => {
      track.rhythmStepLength = 20;
      expect(track.sequence[0].length).to.eq(1);
      expect(track.sequence[16].length).to.eq(0);
      expect(track.sequence[20].length).to.eq(1);
    });
  });
});
