import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { DrumTrack } from "../app/model/ableton/drum_track";
import { DrumPadController } from "../app/controller/drum_pad_controller";
import { baselineDrumPadActivation, configDirectory, patternForRhythmSteps, rhythmStepsForPattern } from "./test_helpers";


const testing   = true;


describe("DrumPadController", () => {
  describe("Selecting the initial drum controller page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    const activePage = sequencer.grid.activePage as DrumPadController;

    it("sets the active page to a drum pad page", () => expect(activePage).to.be.instanceOf(DrumPadController));
  });


  describe("note recording when the default gate probability is changed", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain, and add rhythm gates
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});

    // Select the rhythm page to load the drum pad controller, then change the track probability,
    // then turn on recording, then add rhythm gates
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});
    sequencer.grid.keyPress({y: 6, x: 14, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 1});
    sequencer.grid.keyPress({y: 5, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    const track = sequencer.daw.getActiveTrack();
    track.updateCurrentAbletonNotes();

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ])
    });

    it("uses the specified probability", () => {
      expect(track.rhythm[0].probability).to.eq(0.875);
    });

    it("uses the specified probability in the Ableton notes", () => {
      expect(track.currentAbletonNotes[0].probability).to.eq(0.875);
      expect(track.currentAbletonNotes[1].probability).to.eq(0.875);
      expect(track.currentAbletonNotes[2].probability).to.eq(0.875);
      expect(track.currentAbletonNotes[3].probability).to.eq(0.875);
    });
  });


  describe("activating a pad for a rhythm step", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the track's input melody", () => {
      expect(track.outputNotes[0][0].octave).to.eq(1);
      expect(track.outputNotes[0][0].note).to.eq("C");
      expect(track.outputNotes[0][0].midi).to.eq(36);
    });
  });


  describe("activating multiple pads for a rhythm step", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});

    // Press and hold a gate, then select 2 drum pads
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 2, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});
    sequencer.grid.keyPress({y: 6, x: 2, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
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
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    expect(track.outputNotes[0][0].octave).to.eq(1);
    expect(track.outputNotes[0][0].note).to.eq("C");
    expect(track.outputNotes[0][0].midi).to.eq(36);

    // Turn the active gate off by pressing the button while gate recording is on without pressing a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the track's input melody", () => {
      expect(track.outputNotes.length).to.eq(0);
    });
  });


  describe("deactivating a rhythm step when note recording is not on", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Toggle note recording on
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    expect(track.outputNotes[0][0].octave).to.eq(1);
    expect(track.outputNotes[0][0].note).to.eq("C");
    expect(track.outputNotes[0][0].midi).to.eq(36);

    // Toggle note recording off
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});

    // Turn the active gate off by pressing the button while gate recording is on without pressing a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    it("does not update the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("does not update the track's input melody", () => {
      expect(track.outputNotes.length).to.eq(1);
    });
  });


  describe("activating steps and then changing the step length", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    baselineDrumPadActivation(sequencer);
    const track = sequencer.daw.getActiveTrack() as DrumTrack;

    // Shorten the track rhythm step length
    sequencer.grid.keyPress({y: 7, x: 13, s: 1});
    sequencer.grid.keyPress({y: 7, x: 13, s: 0});
    sequencer.grid.keyPress({y: 0, x: 11, s: 1});
    sequencer.grid.keyPress({y: 0, x: 11, s: 0});

    it("updates the track rhythm step length", () => expect(track.rhythmStepLength).to.eq(12));

    it("does not update the track rhythm so restoring the rhythm step length reintroduces notes", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("does not update the sequence so restoring the rhythm step length reintroduces notes", () => {
      const stepsWithBeats = track.sequence.reduce((indices: number[], step, i) => {
        if (step.length > 0) indices.push(i);
        return indices;
      }, []);
      expect(stepsWithBeats).to.have.ordered.members([0, 12]);
    });

    it("updates the track output notes so it does not include notes/pads beyond the step length", () => {
      expect(track.outputNotes.length).to.eq(1);
    });

    it("updates the Ableton output notes", () => {
      const pad36Positions = track.currentAbletonNotes.filter(note => note.midiNote == 36).map(note => note.clipPosition);
      const pad37Positions = track.currentAbletonNotes.filter(note => note.midiNote == 37).map(note => note.clipPosition);
      expect(pad36Positions).to.have.ordered.members([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]);
      expect(pad37Positions.length).to.eq(0);
    });
  });


  describe("setting a drum pad to the infinity series and then back to the simple algorithm", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    baselineDrumPadActivation(sequencer);
    const track = sequencer.daw.getActiveTrack() as DrumTrack;

    sequencer.grid.keyPress({y: 7, x: 8, s: 1});  // Select the input note page,
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});  // set the note algorithm to infinity series
    sequencer.grid.keyPress({y: 2, x: 0, s: 1});  // set the seed,
    sequencer.grid.keyPress({y: 2, x: 11, s: 1}); // set the algo repetitions
    sequencer.grid.keyPress({y: 6, x: 15, s: 1}); // and advance/activate.

    const outputNotes = track.outputNotes.flat().map(note => note.midi);
    expect(outputNotes).to.have.ordered.members([44, 45, 43, 46,  45, 44, 42, 47]);

    sequencer.grid.keyPress({y: 6, x: 0, s: 1});  // Set the note algorithm to simple
    sequencer.grid.keyPress({y: 6, x: 15, s: 1}); // and advance.

    it("restores the original sequence pattern", () => {
      const pad36Positions = track.currentAbletonNotes.filter(note => note.midiNote == 36).map(note => note.clipPosition);
      const pad37Positions = track.currentAbletonNotes.filter(note => note.midiNote == 37).map(note => note.clipPosition);
      expect(pad36Positions).to.have.ordered.members([0, 8, 16, 24]);
      expect(pad37Positions).to.have.ordered.members([3, 11, 19, 27]);
    });
  });
});
