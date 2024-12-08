import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { expect } from "chai";
import { before } from "mocha";
import { HarmonicAutomaton } from "../app/model/automata/harmonic_automaton";
import { RandomStateMachine } from "../app/model/automata/random_state_machine";
import { NamedRandomStateMachine } from "../app/model/automata/named_random_state_machine";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";


const testing = true;


describe("HarmonicAutomaton", () => {
  describe("loading an instance from a configuration file", () => {
    let automaton: HarmonicAutomaton;

    before(() => {
      automaton = new HarmonicAutomaton(
        yaml.load(fs.readFileSync(path.resolve(configDirectory, "automata_harmonic_standard.yml"), "utf8"))
      );
    });

    it("has a name", () => {
      expect(automaton.name).to.eq("standard");
    });


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
  });
});
