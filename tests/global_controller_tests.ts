import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { expect } from "chai";
import { Sequencer, BeatSet } from "../app/model/sequencer";
import { GlobalController } from "../app/controller/global_controller";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";
import { Scale } from "tblswvs";


const testing = true;


describe("GlobalController", () => {
  describe("when loading the global page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    const controller = sequencer.grid.activePage as GlobalController;

    it("sets the active page to a globals page", () => expect(controller).to.be.instanceOf(GlobalController));
  });


  describe("setting a beat pattern", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    fs.readdirSync(sequencer.configDirectory).forEach(filename => {
      if (filename.startsWith("patterns_beats")) {
        const beatPatterns = yaml.load(fs.readFileSync( path.resolve(sequencer.configDirectory, filename), "utf8" ));
        sequencer.setBeatPatterns(beatPatterns as BeatSet);
      }
    });

    // Select the global page, then set a predefined beat
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 4, x: 13, s: 1});

    it("should set the step length for the rhythm tracks", () => {
      sequencer.daw.tracks.slice(0, 3).forEach(track => {
        expect(track.rhythmStepLength).to.eq(16);
      });
    });

    it("should set the breakpoint to the step length for the rhythm tracks", () => {
      sequencer.daw.tracks.slice(0, 3).forEach(track => {
        expect(track.rhythmStepBreakpoint).to.eq(16);
      });
    });
  });


  describe("setting a key", () => {
    describe("changing the key's tonic", () => {
      const sequencer = new Sequencer(configDirectory, testing);

      // Select the global page, then set the tonic to A
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});
      sequencer.grid.keyPress({y: 3, x: 9, s: 1});

      it("updates the Key object's tonic", () => {
        expect(sequencer.key.tonic).to.eq("A");
      });

      it("does not change the scale", () => {
        expect(sequencer.key.scale).to.eq(Scale.Minor);
      });

      it("updates the harmonic automaton key", () => {
        expect(sequencer.automaton.key.tonic).to.eq("A");
      });
    });


    describe("changing the key's scale", () => {
      const sequencer = new Sequencer(configDirectory, testing);

      // Select the global page, then set the tonic to A
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});
      sequencer.grid.keyPress({y: 3, x: 13, s: 1});

      it("updates the Key object's scale", () => {
        expect(sequencer.key.scale).to.eq(Scale.WholeTone);
      });

      it("does not change the tonic", () => {
        expect(sequencer.key.tonic).to.eq("C");
      });

      it("updates the harmonic automaton key", () => {
        expect(sequencer.automaton.key.scale).to.eq(Scale.WholeTone);
      });
    });
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

      track.updateCurrentAbletonNotes();

      it("sets huminization in the sequencer", () => expect(sequencer.humanize).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        track.rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
      });

      it("humanizes at the point of generating Ableton notes: small +/- offsets", () => {
        track.currentAbletonNotes.forEach((note, i) => {
          if (i % 8 != 0) {
            const noOffsetExpectedPosition = i * 0.25 * 2;
            expect(Math.round((Math.abs(note.clipPosition - noOffsetExpectedPosition) + Number.EPSILON) * 1000) / 1000).to.equal(0.025);
          }
        });
      });

      it("does not humanize rhythm step 0 for the kick", () => {
        expect(track.currentAbletonNotes[0].clipPosition).to.equal(0);
      });

      it("does not allow any track to have an Ableton note offset below 0 so it will never be played by Live", () => {
        sequencer.daw.tracks.forEach(track => {
          track.rhythm = rhythmStepsForPattern([
            1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
          ]);
          track.updateCurrentAbletonNotes();
          expect(track.currentAbletonNotes[0].clipPosition).to.be.greaterThanOrEqual(0);
        });
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

      sequencer.daw.tracks[0].updateCurrentAbletonNotes();
      sequencer.daw.tracks[2].updateCurrentAbletonNotes();

      it("sets hihat swing in the sequencer", () => expect(sequencer.hihatSwing).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        sequencer.daw.tracks[0].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
        sequencer.daw.tracks[2].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
      });

      it("swings every second hihat note at the point of generating Ableton notes: large + offsets", () => {
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

      // Select the global page and engage the drunk algorithm
      sequencer.grid.keyPress({y: 7, x: 12, s: 1});
      sequencer.grid.keyPress({y: 6, x: 14, s: 1});

      sequencer.daw.tracks[0].updateCurrentAbletonNotes();
      sequencer.daw.tracks[1].updateCurrentAbletonNotes();
      sequencer.daw.tracks[2].updateCurrentAbletonNotes();

      it("sets drunk in the sequencer", () => expect(sequencer.drunk).to.be.true);

      it("leaves individual rhythm voice track rhythm steps intact", () => {
        sequencer.daw.tracks[0].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
        sequencer.daw.tracks[1].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
        sequencer.daw.tracks[2].rhythm.forEach(step => expect(step.timingOffset).to.equal(0));
      });

      it("shifts the snares very early", () => {
        sequencer.daw.tracks[1].currentAbletonNotes.forEach((note, i) => {
          const noOffsetExpectedPosition = i * 2 + 1;
          expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000)
            .to.satisfy((value: number) => value == -0.1125 || value == -0.0625);
        });
      });

      it("adds a small to medium amount of random variation to the hihats", () => {
        sequencer.daw.tracks[2].currentAbletonNotes.forEach((note, i) => {
          const noOffsetExpectedPosition = i * 0.25 * 2;
          expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000)
            .to.satisfy((value: number) => Math.abs(value) == 0.025 || Math.abs(value) == 0.0625);
        });
      });

      it("does not adjust timing of the kick track", () => {
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


    describe("pattern precedence", () => {
      describe("when hihat swing + and humanization are both set", () => {
        const sequencer = new Sequencer(configDirectory, testing);

        // Set the hihat track to a weak beats drum pattern
        sequencer.daw.tracks[2].rhythm = rhythmStepsForPattern([
          1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,
          1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0
        ]);

        // Select the global page and engage the humanize and hihat swing algorithms
        sequencer.grid.keyPress({y: 7, x: 12, s: 1});
        sequencer.grid.keyPress({y: 6, x: 12, s: 1});
        sequencer.grid.keyPress({y: 6, x: 13, s: 1});

        sequencer.daw.tracks[2].updateCurrentAbletonNotes();

        it("sets huminization in the sequencer", () => expect(sequencer.humanize).to.be.true);
        it("sets hihat swing in the sequencer", () => expect(sequencer.hihatSwing).to.be.true);

        it("hihats are swung rather than humanized (large late offset)", () => {
          sequencer.daw.tracks[2].currentAbletonNotes.forEach((note, i) => {
            if (i % 2 != 0) {
              const noOffsetExpectedPosition = i * 0.25 * 2;
              expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000).to.equal(0.1125);
            }
          });
        });
      });


      describe("when humanize and drunk are both set", () => {
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

        // Select the global page and engage humanization and drunk algorithm
        sequencer.grid.keyPress({y: 7, x: 12, s: 1});
        sequencer.grid.keyPress({y: 6, x: 12, s: 1});
        sequencer.grid.keyPress({y: 6, x: 14, s: 1});

        sequencer.daw.tracks[1].updateCurrentAbletonNotes();
        sequencer.daw.tracks[2].updateCurrentAbletonNotes();

        it("sets huminization in the sequencer", () => expect(sequencer.humanize).to.be.true);
        it("sets drunk in the sequencer", () => expect(sequencer.drunk).to.be.true);

        it("hihats are drunk rather than humanized (small and medium variation)", () => {
          sequencer.daw.tracks[2].currentAbletonNotes.forEach((note, i) => {
            const noOffsetExpectedPosition = i * 0.25 * 2;
            expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000)
              .to.satisfy((value: number) => Math.abs(value) == 0.025 || Math.abs(value) == 0.0625);
          });
        });

        it("snares are drunk rather than humanized (only large early offsets)", () => {
          sequencer.daw.tracks[1].currentAbletonNotes.forEach((note, i) => {
            const noOffsetExpectedPosition = i * 2 + 1;
            expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000)
              .to.satisfy((value: number) => value == -0.1125 || value == -0.0625);
          });
        });
      });


      describe("when hihat swing + and drunk are both set", () => {
        const sequencer = new Sequencer(configDirectory, testing);

        // Set the hihat track to an 8n drum pattern
        sequencer.daw.tracks[2].rhythm = rhythmStepsForPattern([
          1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,
          1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0
        ]);

        // Select the global page and engage hihat swing and drunk algorithms
        sequencer.grid.keyPress({y: 7, x: 12, s: 1});
        sequencer.grid.keyPress({y: 6, x: 13, s: 1});
        sequencer.grid.keyPress({y: 6, x: 14, s: 1});

        sequencer.daw.tracks[2].updateCurrentAbletonNotes();

        it("sets hihat swing in the sequencer", () => expect(sequencer.hihatSwing).to.be.true);
        it("sets drunk in the sequencer", () => expect(sequencer.drunk).to.be.true);

        it("hihats are drunk rather than swung (small and medium variation)", () => {
          sequencer.daw.tracks[2].currentAbletonNotes.forEach((note, i) => {
            const noOffsetExpectedPosition = i * 0.25 * 2;
            expect(Math.round((note.clipPosition - noOffsetExpectedPosition + Number.EPSILON) * 10_000) / 10_000)
              .to.satisfy((value: number) => Math.abs(value) == 0.025 || Math.abs(value) == 0.0625);
          });
        });
      });
    });
  });
});
