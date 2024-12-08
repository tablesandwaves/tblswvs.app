import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { expect } from "chai";
import { before } from "mocha";
import { HarmonicAutomaton } from "../app/model/automata/harmonic_automaton";
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

    it("should have a name", () => {
      expect(automaton.name).to.eq("standard");
    });
  });
});
