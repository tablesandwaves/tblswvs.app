import { expect } from "chai";
import { RandomStateMachine } from "../app/model/automata/random_state_machine";
import { NamedRandomStateMachine } from "../app/model/automata/named_random_state_machine";
import { PatternStateMachine } from "../app/model/automata/pattern_state_machine";


describe("RandomStateMachine", () => {
  const rsm = new RandomStateMachine([1, 2, 3]);

  it("stores its choices", () => {
    expect(rsm.choices).to.have.ordered.members([1, 2, 3]);
  });

  it("can return a next choice", () => {
    expect(rsm.next()).to.be.oneOf([1, 2, 3]);
  });
});


describe("NamedRandomStateMachine", () => {
  const nrsm = new NamedRandomStateMachine({
    "small":  ["0.0.120", "0.0.240", "0.0.240", "0.0.240"],
    "medium": ["0.1.0", "0.2.0"],
    "large":  ["1.0.0", "1.2.0", "2.0.0"]
  });

  it("stores its named choices", () => {
    expect(Object.keys(nrsm.choices)).to.have.ordered.members(["small", "medium", "large"]);
  });

  it("can return a next choice", () => {
    expect(nrsm.next("medium")).to.be.oneOf(["0.1.0", "0.2.0"]);
  });
});


describe("PatternStateMachine", () => {
  const psm = new PatternStateMachine([1, 2, 3]);

  it("stores its pattern", () => {
    expect(psm.pattern).to.have.ordered.members([1, 2, 3]);
  });

  it("cycles through the pattern", () => {
    expect(psm.next()).to.eq(1);
    expect(psm.next()).to.eq(2);
    expect(psm.next()).to.eq(3);
    expect(psm.next()).to.eq(1);
    expect(psm.next()).to.eq(2);
    expect(psm.next()).to.eq(3);
  });
});
