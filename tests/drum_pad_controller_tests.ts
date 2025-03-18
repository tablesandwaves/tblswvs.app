import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { DrumTrack } from "../app/model/ableton/drum_track";
import { DrumPadController } from "../app/controller/drum_pad_controller";
import { configDirectory, patternForRhythmSteps, rhythmStepsForPattern } from "./test_helpers";


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


  describe("toggling note editing when note recording is active", () => {
    const sequencer = new Sequencer(configDirectory, testing);
    sequencer.queuedNotes.push([{ octave: 1, note: 'C', midi: 36 }]);

    // Select the Perc track with a drum rack
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});

    // Select the rhythm page to load the drum pad controller
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    const activePage = sequencer.grid.activePage as DrumPadController;

    // Toggle note recording
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});
    expect(activePage.noteRecordingActive).to.be.true;

    // Toggle note editing
    sequencer.grid.keyPress({y: 5, x: 4, s: 1});

    it("enables note editing", () => expect(activePage.noteEditingActive).to.be.true);
    it("disables note recording", () => expect(activePage.noteRecordingActive).to.be.false);
    it("clears the sequencer's queued melody", () => expect(sequencer.queuedNotes.length).to.eq(0));
  });


  describe("toggling note recording when note editing is active", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    // const track = sequencer.daw.getActiveTrack();

    // Select the rhythm page to load the drum pad controller
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    const activePage = sequencer.grid.activePage as DrumPadController;

    // Toggle note editing
    sequencer.grid.keyPress({y: 5, x: 4, s: 1});
    expect(activePage.noteEditingActive).to.be.true;

    // Toggle note recording
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});

    it("enables note recording", () => expect(activePage.noteRecordingActive).to.be.true);
    it("disables note editing", () => expect(activePage.noteEditingActive).to.be.false);
  });


  describe("adding notes while in note editing mode", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, select the rhythm controller
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Toggle note editing and press a drum pad
    sequencer.grid.keyPress({y: 5, x: 4, s: 1});
    sequencer.grid.keyPress({y: 5, x: 4, s: 0});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});

    it("adds the corresponding note to the sequencer's queued chord progression", () => {
      expect(sequencer.queuedNotes).to.deep.eq([[{ octave: 1, note: 'C', midi: 36 }]]);
    });
  });


  describe("enabling note editing and adding notes", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack() as DrumTrack;
    track.rhythm = rhythmStepsForPattern([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Select the rhythm page to load the drum pad controller
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Toggle note editing and press two drum pads then toggle note editing again to flush
    sequencer.grid.keyPress({y: 5, x: 4, s: 1});
    sequencer.grid.keyPress({y: 5, x: 4, s: 0});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 6, x: 1, s: 0});
    sequencer.grid.keyPress({y: 5, x: 4, s: 1});
    sequencer.grid.keyPress({y: 5, x: 4, s: 0});

    it("sets the track output notes", () => {
      const expected = [[{ octave: 1, note: 'C', midi: 36 }], [{ octave: 1, note: 'C#', midi: 37 }]];
      expect(track.outputNotes).to.deep.eq(expected);
    });

    it("sets the sequence", () => {
      expect(track.sequence[0]).to.deep.eq(  [{ octave: 1, note: 'C',  midi: 36 }]);
      expect(track.sequence[16]).to.deep.eq( [{ octave: 1, note: 'C#', midi: 37 }]);
      expect(track.sequence[32]).to.deep.eq( [{ octave: 1, note: 'C',  midi: 36 }]);
      expect(track.sequence[48]).to.deep.eq( [{ octave: 1, note: 'C#', midi: 37 }]);
      expect(track.sequence[64]).to.deep.eq( [{ octave: 1, note: 'C',  midi: 36 }]);
      expect(track.sequence[80]).to.deep.eq( [{ octave: 1, note: 'C#', midi: 37 }]);
      expect(track.sequence[96]).to.deep.eq( [{ octave: 1, note: 'C',  midi: 36 }]);
      expect(track.sequence[112]).to.deep.eq([{ octave: 1, note: 'C#', midi: 37 }]);
    });
  });


  describe("enabling note editing and adding notes polyphonically", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain, and add rhythm gates
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack() as DrumTrack;
    track.rhythm = rhythmStepsForPattern([
      1, 0, 1, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);

    // Select the rhythm page to load the drum pad controller
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Toggle note editing and press two drum pads then toggle note editing again to flush
    sequencer.grid.keyPress({y: 5, x: 4, s: 1});
    sequencer.grid.keyPress({y: 5, x: 4, s: 0});

    sequencer.grid.keyPress({y: 6, x: 0, s: 1}); // Press and hold 36
    sequencer.grid.keyPress({y: 6, x: 2, s: 1}); // Press and hold 38
    sequencer.grid.keyPress({y: 6, x: 0, s: 0}); // Release 36
    sequencer.grid.keyPress({y: 6, x: 2, s: 0}); // Release 38
    sequencer.grid.keyPress({y: 6, x: 1, s: 1}); // Press and hold 37
    sequencer.grid.keyPress({y: 6, x: 1, s: 0}); // Release 37

    sequencer.grid.keyPress({y: 5, x: 4, s: 1});
    sequencer.grid.keyPress({y: 5, x: 4, s: 0});

    it("sets the track output notes", () => {
      const expected = [
        [{ octave: 1, note: 'C', midi: 36 }, { octave: 1, note: 'D', midi: 38 }],
        [{ octave: 1, note: 'C#', midi: 37 }]
      ];
      expect(track.outputNotes).to.deep.eq(expected);
    });

    it("sets the sequence", () => {
      expect(track.sequence[0]).to.deep.eq( [{ octave: 1, note: 'C',  midi: 36 }, { octave: 1, note: 'D', midi: 38 }]);
      expect(track.sequence[2]).to.deep.eq( [{ octave: 1, note: 'C#',  midi: 37 }]);
      expect(track.sequence[32]).to.deep.eq([{ octave: 1, note: 'C',  midi: 36 }, { octave: 1, note: 'D', midi: 38 }]);
      expect(track.sequence[34]).to.deep.eq([{ octave: 1, note: 'C#',  midi: 37 }]);
      expect(track.sequence[64]).to.deep.eq([{ octave: 1, note: 'C',  midi: 36 }, { octave: 1, note: 'D', midi: 38 }]);
      expect(track.sequence[66]).to.deep.eq([{ octave: 1, note: 'C#',  midi: 37 }]);
      expect(track.sequence[96]).to.deep.eq([{ octave: 1, note: 'C',  midi: 36 }, { octave: 1, note: 'D', midi: 38 }]);
      expect(track.sequence[98]).to.deep.eq([{ octave: 1, note: 'C#',  midi: 37 }]);
    });
  });


  describe("enabling note editing and toggling rhythm gates", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain, and add rhythm gates
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});

    // Select the rhythm page to load the drum pad controller, then turn on editing, then add rhythm gates
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});
    sequencer.grid.keyPress({y: 5, x: 4, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});

    const track = sequencer.daw.getActiveTrack();

    it("updates the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ])
    });
  });


  describe("note recording when the default gate probability is changed", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the Perc track with a drum rack, then set its drum rack chain, and add rhythm gates
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});

    // Select the rhythm page to load the drum pad controller, then change the track probability,
    // then turn on recording (not editing), then add rhythm gates
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
    track.activeChain = 1;

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
    track.activeChain = 1;

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording/editing
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
    track.activeChain = 1;

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

    // Turn the active gate off by pressing the button while gate editing is on without pressing a drum pad
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
    track.activeChain = 1;

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

    // Turn the active gate off by pressing the button while gate editing is on without pressing a drum pad
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

    // Select the Perc track with a drum rack, then set its drum rack chain
    sequencer.grid.keyPress({y: 7, x: 3, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the rhythm page
    sequencer.grid.keyPress({y: 7, x: 7, s: 1});

    // Turn on note recording
    sequencer.grid.keyPress({y: 4, x: 4, s: 1});

    // Press and hold a gate, then select a drum pad
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 1});
    sequencer.grid.keyPress({y: 6, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});
    sequencer.grid.keyPress({y: 0, x: 12, s: 1});
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 6, x: 1, s: 0});
    sequencer.grid.keyPress({y: 0, x: 12, s: 0});

    expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
    ]);
    expect(track.outputNotes.length).to.eq(2);
    expect(track.outputNotes.flatMap(noteArray => noteArray[0].midi)).to.have.ordered.members([36, 37]);

    // Shorten the track rhythm step length
    sequencer.grid.keyPress({y: 7, x: 13, s: 1});
    sequencer.grid.keyPress({y: 7, x: 13, s: 0});
    sequencer.grid.keyPress({y: 0, x: 11, s: 1});
    sequencer.grid.keyPress({y: 0, x: 11, s: 0});

    it("updates the track rhythm step length", () => expect(track.rhythmStepLength).to.eq(12));

    it("does not update the track rhythm", () => {
      expect(patternForRhythmSteps(track.rhythm)).to.have.ordered.members([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
    });

    it("updates the track input melody so it does not include notes/pads beyond the step length", () => {
      expect(track.outputNotes.length).to.eq(1);
    });
  });
});
