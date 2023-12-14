import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { DrumPadController } from "../app/controller/drum_pad_controller";
import { patternForRhythmSteps } from "./test_helpers";


const testing   = true;


describe("DrumPadController", () => {
  describe("Selecting the initial drum controller page", () => {
    const sequencer = new Sequencer(testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    const activePage = sequencer.grid.activePage as DrumPadController;

    it("sets the active page to a melody evolution page", () => expect(activePage).to.be.instanceOf(DrumPadController));
  });


  describe("activating a pad for a rhythm step", () => {
    const sequencer = new Sequencer(testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording/editing
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the track's input melody", () => {
      expect(track.outputNotes[0][0].octave).to.eq(1);
      expect(track.outputNotes[0][0].note).to.eq("C");
      expect(track.outputNotes[0][0].midi).to.eq(36);
    });
  });


  describe("activating multiple pads for a rhythm step", () => {
    const sequencer = new Sequencer(testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording/editing
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    // Press and hold a gate, then select 2 drum pads
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 0});
    sequencer.grid.keyPress({y: 5, x: 2, s: 1});
    sequencer.grid.keyPress({y: 5, x: 2, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the track's input melody", () => {
      expect(track.outputNotes[0][0].octave).to.eq(1);
      expect(track.outputNotes[0][0].note).to.eq("C");
      expect(track.outputNotes[0][0].midi).to.eq(36);
      expect(track.outputNotes[0][1].octave).to.eq(1);
      expect(track.outputNotes[0][1].note).to.eq("D");
      expect(track.outputNotes[0][1].midi).to.eq(38);
    });
  });


  describe("deactivating a rhythm step", () => {
    const sequencer = new Sequencer(testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording/editing
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    expect(track.outputNotes[0][0].octave).to.eq(1);
    expect(track.outputNotes[0][0].note).to.eq("C");
    expect(track.outputNotes[0][0].midi).to.eq(36);

    // Turn the active gate off by pressing the button while gate editing is on without pressing a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the track's input melody", () => {
      expect(track.outputNotes.length).to.eq(0);
    });
  });


  describe("deactivating a rhythm step when note editing is not on", () => {
    const sequencer = new Sequencer(testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Toggle note recording/editing on
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    expect(track.outputNotes[0][0].octave).to.eq(1);
    expect(track.outputNotes[0][0].note).to.eq("C");
    expect(track.outputNotes[0][0].midi).to.eq(36);

    // Toggle note recording/editing off
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    // Turn the active gate off by pressing the button while gate editing is on without pressing a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("does not update the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("does not update the track's input melody", () => {
      expect(track.inputMelody.length).to.eq(1);
    });
  });


  describe("activating steps and then changing the step length", () => {
    const sequencer = new Sequencer(testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording/editing
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 12, s: 1});
    sequencer.grid.keyPress({y: 5, x: 1, s: 1});
    sequencer.grid.keyPress({y: 5, x: 1, s: 0});
    sequencer.grid.keyPress({y: 0, x: 12, s: 0});

    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0
    ]);
    expect(track.outputNotes.length).to.eq(2);

    // Shorten the track rhythm step length
    sequencer.grid.keyPress({y: 7, x: 13, s: 1});
    sequencer.grid.keyPress({y: 0, x: 11, s: 1});

    it("updates the track rhythm step length", () => expect(track.rhythmStepLength).to.eq(12));

    it("does not update the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0
      ]);
    });

    it("updates the track input melody so it does not include notes/pads beyond the step length", () => {
      expect(track.outputNotes.length).to.eq(1);
    });
  });
});
