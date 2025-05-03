import { expect } from "chai";
import { acceleratingBeatPositions } from "../app/helpers/rhythm_algorithms";


describe("the Accelerating algorithm", () => {
  it("can be generated for 10 gates in 16 steps", () => {
    expect(acceleratingBeatPositions(10, 16, 0)).to.have.ordered.members([
      0, 2.457, 4.668, 6.658, 8.449, 10.061, 11.512, 12.818, 13.993, 15.05
    ]);
  });

  it("can be generated for 10 gates in 8 steps", () => {
    expect(acceleratingBeatPositions(10, 8, 0)).to.have.ordered.members([
      0, 1.228, 2.333, 3.328, 4.223, 5.029, 5.754, 6.407, 6.994, 7.523
    ]);
  });
});
