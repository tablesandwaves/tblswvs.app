import { expect } from "chai";
import { before } from "mocha";
import { Sequencer } from "../app/model/sequencer";
import { AbletonLive } from "../app/model/ableton/live";
import { configDirectory, rhythmStepsForPattern, velocityWithinRange } from "./test_helpers";


const testing   = true;
const sequencer = new Sequencer(configDirectory, testing);
const daw       = new AbletonLive(sequencer);


describe("AbletonTrack", () => {
  describe("a new instance", () => {
    // Select a melodic track
    sequencer.grid.keyPress({y: 7, x: 4, s: 1});

    const track = sequencer.daw.getActiveTrack();

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

    // Select a melodic track
    sequencer.grid.keyPress({y: 7, x: 4, s: 1});
    const track = sequencer.daw.getActiveTrack();

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

      // Select a melodic track
      sequencer.grid.keyPress({y: 7, x: 4, s: 1});
      const track = sequencer.daw.getActiveTrack();
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
});
