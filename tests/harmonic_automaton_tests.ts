import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { expect } from "chai";
import { before } from "mocha";
import { HarmonicAutomaton, chordType } from "../app/model/automata/harmonic_automaton";
import { RandomStateMachine } from "../app/model/automata/random_state_machine";
import { NamedRandomStateMachine } from "../app/model/automata/named_random_state_machine";
import { PatternStateMachine } from "../app/model/automata/pattern_state_machine";
import { configDirectory } from "./test_helpers";
import { RangeStateMachine } from "../app/model/automata/range_state_machine";


describe("HarmonicAutomaton", () => {
  describe("loading an instance from a configuration file", () => {
    let automaton: HarmonicAutomaton;

    before(() => {
      automaton = new HarmonicAutomaton(
        yaml.load(fs.readFileSync(path.resolve(configDirectory, "automata_harmonic_standard.yml"), "utf8"))
      );
    });

    it("has a name", () => expect(automaton.name).to.eq("standard"));
    it("has a min melody iterations", () => expect(automaton.minMelodyIterations).to.eq(20));
    it("has a min chord iterations", () => expect(automaton.minChordIterations).to.eq(4));


    describe("the attack parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.attack).to.be.an.instanceOf(RandomStateMachine);
      });

      it("has a list of choices", () => {
        expect(automaton.attack.choices).to.have.ordered.members([0, 0.25, 0.5, 0.5, 0.75, 0.75, 1, 1]);
      });
    });


    describe("the duration parameter", () => {
      it("is a named random state machine", () => {
        expect(automaton.duration).to.be.an.instanceOf(NamedRandomStateMachine);
      });

      it("has named choices", () => {
        expect(automaton.duration.next("medium")).to.be.oneOf(["0.1.0", "0.2.0"])
      });
    });


    describe("the velocity parameter", () => {
      it("is a pattern state machine", () => {
        expect(automaton.velocity).to.be.an.instanceOf(PatternStateMachine);
      });

      it("has cycling choices", () => {
        expect(automaton.velocity.next()).to.eq(100);
        expect(automaton.velocity.next()).to.eq(60);
        expect(automaton.velocity.next()).to.eq(60);
        expect(automaton.velocity.next()).to.eq(80);
      });
    });


    describe("the filter frequency parameter", () => {
      it("is a range state machine", () => {
        expect(automaton.filterFrequency).to.be.an.instanceOf(RangeStateMachine);
      });

      it("generates random frequencies within range", () => {
        expect(automaton.filterFrequency.next()).to.be.within(200, 16000);
      });
    });


    describe("the melody duration size parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.melodyDurationSize).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates random duration sizes", () => {
        expect(automaton.melodyDurationSize.next()).to.be.oneOf(["small", "medium"]);
      });
    });


    describe("the chord duration size parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.chordDurationSize).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates random duration sizes", () => {
        expect(automaton.chordDurationSize.next()).to.be.oneOf(["medium", "large"]);
      });
    });


    describe("the melody start degree parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.melodyStartDegree).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates random duration sizes", () => {
        expect(automaton.melodyStartDegree.next()).to.be.oneOf([1, 2, 3, 4, 5, 6, 7]);
      });
    });


    describe("the chord start root parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.chordStartRoot).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates random duration sizes", () => {
        expect(automaton.chordStartRoot.next()).to.be.oneOf([1, 3, 5]);
      });
    });


    describe("the chord start quality parameter", () => {
      it("is a random state machine", () => {
        expect(automaton.chordStartQuality).to.be.an.instanceOf(RandomStateMachine);
      });

      it("generates a random chord type", () => {
        expect(automaton.chordStartQuality.next()).to.haveOwnProperty("type").that.is.oneOf(["triad", "dyad"]);
      });
    });


    describe("the melody note distance parameter", () => {
      it("is a named random state machine", () => {
        expect(automaton.melodyNoteDistance).to.be.an.instanceOf(NamedRandomStateMachine);
      });

      it("generates a random melody note distance", () => {
        expect(automaton.melodyNoteDistance.next("small")).to.be.oneOf(["small", "medium", "large"]);
      });
    });


    describe("the chord parameter", () => {
      it("is a named random state machine", () => {
        expect(automaton.chord).to.be.an.instanceOf(NamedRandomStateMachine);
      });

      it("generates a specific chord when one is configured", () => {
        expect(automaton.chord.next("dim")).to.have.property("type", "triad");
        expect(automaton.chord.next("dim")).to.have.property("degreeOffset", 2);
      });

      it("generates a specific chord when multiple are configured", () => {
        expect(automaton.chord.next("m").interval).to.be.oneOf([4, 6]);
      });

      it("generates a random chord when no there is no other match", () => {
        expect(automaton.chord.next("default")).to.haveOwnProperty("type").that.is.oneOf(["triad", "dyad"]);
      });
    });
  });
});
