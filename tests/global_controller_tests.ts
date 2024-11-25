import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { GlobalController } from "../app/controller/global_controller";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";


const testing = true;


describe("GlobalController", () => {
  describe("when loading the global page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the rhythm page and page over two to the right
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    const controller = sequencer.grid.activePage as GlobalController;

    it("sets the active page to a globals page", () => expect(controller).to.be.instanceOf(GlobalController));
  });


  describe("timing offset patterns", () => {
    describe("humanization", () => {
      const sequencer = new Sequencer(configDirectory, testing);
      const track     = sequencer.daw.getActiveTrack();
      track.rhythm = rhythmStepsForPattern([
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0
      ]);

      // Select the global page
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});
      const controller = sequencer.grid.activePage as GlobalController;

      // Engage the humanize algorithm
      sequencer.grid.keyPress({y: 6, x: 12, s: 1});

      it("sets huminization in the sequencer", () => expect(sequencer.humanize).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        track.rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
      });

      it("humanizes at the point of generating Ableton notes", () => {
        track.updateCurrentAbletonNotes();
        track.currentAbletonNotes.forEach((note, i) => {
          if (i % 8 != 0) {
            const noOffsetExpectedPosition = i * 0.25 * 2;
            expect(Math.round((Math.abs(note.clipPosition - noOffsetExpectedPosition) + Number.EPSILON) * 1000) / 1000).to.equal(0.025);
          }
        });
      });

      it("does not humanize step rhythm step 0", () => {
        expect(track.currentAbletonNotes[0].clipPosition).to.equal(0);
      });
    });


    describe("hihat swing", () => {
      const sequencer = new Sequencer(configDirectory, testing);

      // Set the kick track to a the 4n drum pattern
      sequencer.daw.tracks[0].rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,
        1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0
      ]);

      // Set the hihat track to an 8n drum pattern
      sequencer.daw.tracks[2].rhythm = rhythmStepsForPattern([
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0
      ]);

      // Select the global page
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});

      // Engage the hihat swing algorithm
      sequencer.grid.keyPress({y: 6, x: 13, s: 1});

      it("sets hihat swing in the sequencer", () => expect(sequencer.hihatSwing).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        sequencer.daw.tracks[0].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
        sequencer.daw.tracks[2].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
      });

      it("swings every second hihat note at the point of generating Ableton notes", () => {
        sequencer.daw.tracks[2].updateCurrentAbletonNotes();
        sequencer.daw.tracks[2].currentAbletonNotes.forEach((note, i) => {
          if (i % 2 != 0) {
            const noOffsetExpectedPosition = i * 0.25 * 2;
            expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000).to.equal(0.1125);
          }
        });
      });

      it("does not swing a non-hihat track", () => {
        sequencer.daw.tracks[0].updateCurrentAbletonNotes();
        sequencer.daw.tracks[0].currentAbletonNotes.forEach((note, noOffsetExpectedPosition) => {
          expect(note.clipPosition).to.equal(noOffsetExpectedPosition);
        });
      });
    });


    describe("drunk", () => {
      const sequencer = new Sequencer(configDirectory, testing);

      // Set the kick track to a the 4n drum pattern
      sequencer.daw.tracks[0].rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,
        1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0
      ]);

      // Set the snare track to a backbeat pattern
      sequencer.daw.tracks[1].rhythm = rhythmStepsForPattern([
        0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
        0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0
      ]);

      // Set the hihat track to an 8n drum pattern
      sequencer.daw.tracks[2].rhythm = rhythmStepsForPattern([
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,
        1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0
      ]);

      // Select the global page
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});

      // Engage the drunk algorithm
      sequencer.grid.keyPress({y: 6, x: 14, s: 1});

      it("sets drunk in the sequencer", () => expect(sequencer.drunk).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        sequencer.daw.tracks[0].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
        sequencer.daw.tracks[1].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
        sequencer.daw.tracks[2].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
      });

      it("shifts the snares very early", () => {
        sequencer.daw.tracks[1].updateCurrentAbletonNotes();
        sequencer.daw.tracks[1].currentAbletonNotes.forEach((note, i) => {
          const noOffsetExpectedPosition = i * 2 + 1;
          expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000).to.equal(-0.1125);
        });
      });

      it("adds a small to medium amount of random variation to the hihats", () => {
        sequencer.daw.tracks[2].updateCurrentAbletonNotes();
        sequencer.daw.tracks[2].currentAbletonNotes.forEach((note, i) => {
          const noOffsetExpectedPosition = i * 0.25 * 2;
          expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000)
            .to.satisfy((value: number) => Math.abs(value) == 0.025 || Math.abs(value) == 0.0625);
        });
      });

      it("does not adjust timing of the track", () => {
        sequencer.daw.tracks[0].updateCurrentAbletonNotes();
        sequencer.daw.tracks[0].currentAbletonNotes.forEach((note, noOffsetExpectedPosition) => {
          expect(note.clipPosition).to.equal(noOffsetExpectedPosition);
        });
      });
    });


    describe("ghost notes", () => {
      const sequencer = new Sequencer(configDirectory, testing);

      // Set the kick track to a the 2n drum pattern
      const kickGatePattern: (0|1)[] = [
        1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,
        1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0
      ];
      sequencer.daw.tracks[0].rhythm = rhythmStepsForPattern(kickGatePattern);

      // Set the snare track to a backbeat pattern
      const snareGatePattern: (0|1)[] = [
        0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
        0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0
      ];
      sequencer.daw.tracks[1].rhythm = rhythmStepsForPattern(snareGatePattern);

      // Set the hihat track to a weak beats drum pattern
      const hihatGatePattern: (0|1)[] = [
        0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,
        0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0
      ];
      sequencer.daw.tracks[2].rhythm = rhythmStepsForPattern(hihatGatePattern);

      // Select the global page and engage the drunk algorithm
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});
      sequencer.grid.keyPress({y: 6, x: 15, s: 1});

      sequencer.daw.tracks[0].updateCurrentAbletonNotes();
      sequencer.daw.tracks[1].updateCurrentAbletonNotes();
      sequencer.daw.tracks[2].updateCurrentAbletonNotes();

      it("sets ghosts in the sequencer", () => expect(sequencer.ghostNotes).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        expect(sequencer.daw.tracks[0].rhythm.map(n => n.state)).to.have.ordered.members(kickGatePattern);
        expect(sequencer.daw.tracks[1].rhythm.map(n => n.state)).to.have.ordered.members(snareGatePattern);
        expect(sequencer.daw.tracks[2].rhythm.map(n => n.state)).to.have.ordered.members(hihatGatePattern);
      });

      it("adds ghost kicks between the 1st and 2nd hits and between the 3rd and 4th hits", () => {
        expect(sequencer.daw.tracks[0].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition < 2;
        }).length).to.eq(2);
        expect(sequencer.daw.tracks[0].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition >= 4 && abletonNote.clipPosition < 6;
        }).length).to.eq(2);
      });

      it("adds ghost snares between the 1st and 2nd hits and between the 3rd and 4th hits", () => {
        expect(sequencer.daw.tracks[1].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition >= 1 && abletonNote.clipPosition < 3;
        }).length).to.eq(2);
        expect(sequencer.daw.tracks[1].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition >= 5 && abletonNote.clipPosition < 7;
        }).length).to.eq(2);
      });

      it("does not add ghost notes to the hihat track", () => {
        expect(sequencer.daw.tracks[2].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition >= 0 && abletonNote.clipPosition < 8;
        }).length).to.eq(8);
      });

      it("does not add ghost kicks between the 2nd and 3rd hits or after the 4th hit", () => {
        expect(sequencer.daw.tracks[0].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition >= 2 && abletonNote.clipPosition < 4;
        }).length).to.eq(1);
        expect(sequencer.daw.tracks[0].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition >= 6 && abletonNote.clipPosition < 8;
        }).length).to.eq(1);
      });

      it("does not add ghost snares between the 2nd and 3rd hits or after the 4th hit", () => {
        expect(sequencer.daw.tracks[1].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition >= 3 && abletonNote.clipPosition < 5;
        }).length).to.eq(1);
        expect(sequencer.daw.tracks[1].currentAbletonNotes.filter(abletonNote => {
          return abletonNote.clipPosition >= 7 && abletonNote.clipPosition < 8;
        }).length).to.eq(1);
      });
    });
  });
});
