import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { expect } from "chai";
import { before } from "mocha";
import { HarmonicAutomaton, musicalEventData } from "../app/model/automata/harmonic_automaton";
import { RandomStateMachine } from "../app/model/automata/random_state_machine";
import { NamedRandomStateMachine } from "../app/model/automata/named_random_state_machine";
import { PatternStateMachine } from "../app/model/automata/pattern_state_machine";
import { configDirectory } from "./test_helpers";
import { RangeStateMachine } from "../app/model/automata/range_state_machine";
import { Key, Scale } from "tblswvs";

describe("HarmonicAutomaton", () => {
  describe("loading an instance from a configuration file", () => {
    let automaton: HarmonicAutomaton;

    before(() => {
      automaton = new HarmonicAutomaton(
        yaml.load(fs.readFileSync(path.resolve(configDirectory, "automata_harmonic_standard.yml"), "utf8")),
        new Key(60, Scale.Minor)
      );
    });

    it("has a name", () => expect(automaton.name).to.eq("standard"));
    it("has an initial note type", () => expect(automaton.noteType).to.be.undefined);
    it("has a min melody iterations", () => expect(automaton.minMelodyIterations).to.eq(20));
    it("has a min chord iterations", () => expect(automaton.minChordIterations).to.eq(4));

    it("has a key", () => {
      expect(automaton.key).to.be.an.instanceOf(Key);
      expect(automaton.key.scale).to.eq(Scale.Minor);
    });


    describe("the attack parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.attacks).to.be.an.instanceOf(RandomStateMachine);
      });

      it("has a list of choices", () => {
        expect(automaton.attacks.choices).to.have.ordered.members([0, 0.25, 0.5, 0.5, 0.75, 0.75, 1, 1]);
      });
    });


    describe("the duration parameter", () => {
      it("is a named random state machine", () => {
        expect(automaton.durations).to.be.an.instanceOf(NamedRandomStateMachine);
      });

      it("has named choices", () => {
        expect(automaton.durations.next("medium")).to.be.oneOf(["0.1.0", "0.2.0"])
      });
    });


    describe("the velocity parameter", () => {
      it("is a pattern state machine", () => {
        expect(automaton.velocities).to.be.an.instanceOf(PatternStateMachine);
      });

      it("has cycling choices", () => {
        expect(automaton.velocities.next()).to.eq(100);
        expect(automaton.velocities.next()).to.eq(60);
        expect(automaton.velocities.next()).to.eq(60);
        expect(automaton.velocities.next()).to.eq(80);
      });
    });


    describe("the filter frequency parameter", () => {
      it("is a range state machine", () => {
        expect(automaton.filterFrequencies).to.be.an.instanceOf(RangeStateMachine);
      });

      it("generates random frequencies within range", () => {
        expect(automaton.filterFrequencies.next()).to.be.within(200, 16000);
      });
    });


    describe("the melody duration size parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.melodyDurationSizes).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates random duration sizes", () => {
        expect(automaton.melodyDurationSizes.next()).to.be.oneOf(["small", "medium"]);
      });
    });


    describe("the chord duration size parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.chordDurationSizes).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates random duration sizes", () => {
        expect(automaton.chordDurationSizes.next()).to.be.oneOf(["medium", "large"]);
      });
    });


    describe("the melody start degree parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.melodyStartDegrees).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates random duration sizes", () => {
        expect(automaton.melodyStartDegrees.next()).to.be.oneOf([1, 2, 3, 4, 5, 6, 7]);
      });
    });


    describe("the chord start root parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.chordStartRoots).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates random duration sizes", () => {
        expect(automaton.chordStartRoots.next()).to.be.oneOf([1, 3, 5]);
      });
    });


    describe("the chord start quality parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.chordStartQualities).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates a random chord type", () => {
        expect(automaton.chordStartQualities.next()).to.haveOwnProperty("type").that.is.oneOf(["triad", "dyad"]);
      });
    });


    describe("the melody note distance parameter", () => {
      it("is a named random state machine", () => {
        expect(automaton.melodyNotes).to.be.an.instanceOf(NamedRandomStateMachine);
      });

      it("generates a random melody note distance", () => {
        expect(automaton.melodyNotes.next("small")).to.be.oneOf(["small", "medium", "large"]);
      });
    });


    describe("the chord parameter", () => {
      it("is a named random state machine", () => {
        expect(automaton.chords).to.be.an.instanceOf(NamedRandomStateMachine);
      });

      it("generates a specific chord when one is configured", () => {
        expect(automaton.chords.next("dim")).to.have.property("type", "triad");
        expect(automaton.chords.next("dim")).to.have.property("degreeOffset", 2);
      });

      it("generates a specific chord when multiple are configured", () => {
        expect(automaton.chords.next("m").interval).to.be.oneOf([4, 6]);
      });

      it("generates a random chord when no there is no other match", () => {
        expect(automaton.chords.next("default")).to.haveOwnProperty("type").that.is.oneOf(["triad", "dyad"]);
      });
    });
  });


  describe("advancing to the next state", () => {
    let automaton: HarmonicAutomaton;

    before(() => {
      automaton = new HarmonicAutomaton(
        yaml.load(fs.readFileSync(path.resolve(configDirectory, "automata_harmonic_standard.yml"), "utf8")),
        new Key(60, Scale.Minor)
      );
    });

    describe("when the automaton starts", () => {
      let parameterData: musicalEventData;
      before(() => parameterData = automaton.next());

      it("begins as a chord", () => {
        expect(automaton.noteType).to.eq("chords");
      });

      it("has a chord root from the initializing set of scale degrees", () => {
        expect(automaton.degree).to.be.oneOf([1, 3, 5]);
      });

      it("has a previous degree distance", () => {
        expect(automaton.degreeDistance).to.eq(0);
      });

      it("generates a duration", () => {
        expect(automaton.duration).to.be.oneOf(["0.1.0", "0.2.0", "1.0.0", "1.2.0", "2.0.0"]);
      });

      it("generates a velocity", () => {
        expect(automaton.velocity).to.eq(100);
      });

      it("generates an attack", () => {
        expect(automaton.attack).to.be.oneOf([0, 0.25, 0.5, 0.75, 1]);
      });

      it("generates a filter frequency", () => {
        expect(automaton.filterFrequency).to.be.within(200, 16000);
      });

      it("generates MIDI note numbers", () => {
        expect(automaton.midiNotes).to.be.an.instanceOf(Array);
        automaton.midiNotes.forEach(n => expect(typeof n).to.eq("number"));
      });

      it("advances the iteration counter", () => {
        expect(automaton.iteration).to.eq(1);
      });

      it("the returned parameter data is a two-dimentional array", () => {
        expect(parameterData).to.be.an.instanceOf(Array);
        parameterData.forEach(parameterSet => expect(parameterSet).to.be.an.instanceOf(Array));
      });


      describe("when advancing past the first state", () => {
        // 1 because the first note happened when it switched
        let chordCount = 1;

        before(() => {
          while(automaton.noteType !== "melody") {
            automaton.next();
            chordCount++;
          }
        });

        it("will generate at least three more chords", () => {
          expect(chordCount).to.be.greaterThanOrEqual(3);
        });

        it("will eventually switch over to a melody", () => {
          expect(automaton.noteType).to.eq("melody");
        });

        it("resets the iteration count when it switches", () => {
          expect(automaton.iteration).to.eq(1);
        });


        describe("while cycling through a melody", () => {
          // 1 because the first note happened when it switched
          let melodicNoteCount = 1;
          // let lastNoteType: string|undefined

          before(() => {
            while(automaton.noteType !== "chords") {
              automaton.next();
              melodicNoteCount++;
            }
          });

          it("will generate a minimum number of melody notes", () => {
            expect(melodicNoteCount).to.be.greaterThanOrEqual(20);
          });
        });
      });
    });
  });
});
