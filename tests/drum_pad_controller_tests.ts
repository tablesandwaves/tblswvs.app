import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { DrumPadController } from "../app/controller/drum_pad_controller";
import { patternForRhythmSteps } from "./test_helpers";


const testing   = true;


describe("DrumPadController", () => {
  describe("Selecting the initial drum controller page", () => {
    const sequencer = new Sequencer(testing);

    // Select the melody page, then paginate over to the right 3 sub-pages
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as DrumPadController;

    it("sets the active page to a melody evolution page", () => expect(evolutionPage).to.be.instanceOf(DrumPadController));
  });


  describe("activating a pad for a rhythm step", () => {
    const sequencer = new Sequencer(testing);
    const track = sequencer.daw.getActiveTrack();

    // Select the melody page, then paginate over to the right 3 sub-pages
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});

    // Turn on note recording/editing
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the track's input melody", () => {
      expect(track.inputMelody[0].octave).to.eq(1);
      expect(track.inputMelody[0].note).to.eq("C");
      expect(track.inputMelody[0].midi).to.eq(36);
    });
  });

  describe("deactivating a rhythm step", () => {
    const sequencer = new Sequencer(testing);
    const track = sequencer.daw.getActiveTrack();

    // Select the melody page, then paginate over to the right 3 sub-pages
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});

    // Turn on note recording/editing
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    expect(track.inputMelody[0].octave).to.eq(1);
    expect(track.inputMelody[0].note).to.eq("C");
    expect(track.inputMelody[0].midi).to.eq(36);

    // Turn the active gate off by pressing the button while gate editing is on without pressing a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the track's input melody", () => {
      expect(track.inputMelody.length).to.eq(0);
    });
  });
});
