import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { InputNoteController } from "../app/controller/input_note_controller";
import { configDirectory, patternForRhythmSteps, rhythmStepsForPattern } from "./test_helpers";
import { MelodicTrack } from "../app/model/ableton/melodic_track";


const testing   = true;


describe("InputNoteController", () => {
  describe("Selecting the initial input note controller page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 5, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the chord page
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});

    const activePage = sequencer.grid.activePage as InputNoteController;

    it("sets the active page to a chord page", () => expect(activePage).to.be.instanceOf(InputNoteController));

    it("has the default algorithm row (simple selected)", () => {
      expect(activePage.getGridAlgorithmRow()).to.have.ordered.members([
        10, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("adding a vector melody to an existing note sequence", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 6, s: 1}); // Set the active track to a melodic track.
    const track = sequencer.daw.getActiveTrack() as MelodicTrack;

    sequencer.grid.keyPress({y: 7, x: 7, s: 1}); // Go to the rhythm page.
    sequencer.grid.keyPress({y: 0, x: 0, s: 1}); // Add a gate so the Ableton
    sequencer.grid.keyPress({y: 0, x: 0, s: 0}); // notes will be updated.


    sequencer.grid.keyPress({y: 7, x: 8, s: 1});  // Go to the melody page, add a simple sequence
    sequencer.grid.keyPress({y: 7, x: 8, s: 0});
    sequencer.grid.keyPress({y: 2, x: 15, s: 1}); // Turn on note recording
    sequencer.grid.keyPress({y: 2, x: 15, s: 0});
    sequencer.grid.keyPress({y: 3, x: 0, s: 1});  // First note.
    sequencer.grid.keyPress({y: 3, x: 0, s: 0});
    sequencer.grid.keyPress({y: 3, x: 1, s: 1});  // Second note.
    sequencer.grid.keyPress({y: 3, x: 1, s: 0});
    sequencer.grid.keyPress({y: 3, x: 2, s: 1});  // Third note.
    sequencer.grid.keyPress({y: 3, x: 2, s: 0});
    sequencer.grid.keyPress({y: 2, x: 15, s: 1}); // Turn off note recording
    sequencer.grid.keyPress({y: 2, x: 15, s: 0});
    sequencer.grid.keyPress({y: 6, x: 15, s: 1}); // Flush notes with call to advance()
    sequencer.grid.keyPress({y: 6, x: 15, s: 0});

    track.updateCurrentAbletonNotes();

    expect(track.inputNotes).to.deep.eq([
      [{octave: 3, note: "C",  midi: 60, scaleDegree: 1}],
      [{octave: 3, note: "D",  midi: 62, scaleDegree: 2}],
      [{octave: 3, note: "Eb", midi: 63, scaleDegree: 3}]
    ]);
    expect(track.currentAbletonNotes[0].midiNote).to.eq(60);

    // Queue up a different sequence, but do not flush it to the track
    sequencer.grid.keyPress({y: 2, x: 15, s: 1});
    sequencer.grid.keyPress({y: 2, x: 15, s: 0});
    sequencer.grid.keyPress({y: 3, x: 2, s: 1});
    sequencer.grid.keyPress({y: 3, x: 2, s: 0});
    sequencer.grid.keyPress({y: 3, x: 1, s: 1});
    sequencer.grid.keyPress({y: 3, x: 1, s: 0});
    sequencer.grid.keyPress({y: 3, x: 0, s: 1});
    sequencer.grid.keyPress({y: 3, x: 0, s: 0});

    // Page right to the vector melody page, add an offset, return and apply it
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 0});
    sequencer.grid.keyPress({y: 1, x: 15, s: 1});
    sequencer.grid.keyPress({y: 1, x: 15, s: 0});
    sequencer.grid.keyPress({y: 0, x: 0, s: 1});
    sequencer.grid.keyPress({y: 0, x: 0, s: 0});
    sequencer.grid.keyPress({y: 7, x: 14, s: 1});
    sequencer.grid.keyPress({y: 7, x: 14, s: 0});
    sequencer.grid.keyPress({y: 4, x: 15, s: 1});
    sequencer.grid.keyPress({y: 4, x: 15, s: 0});
    sequencer.grid.keyPress({y: 6, x: 15, s: 1});
    sequencer.grid.keyPress({y: 6, x: 15, s: 0});

    track.updateCurrentAbletonNotes();

    it("does not update the track's input melody", () => {
      expect(track.inputNotes[0][0].midi).to.eq(60);
    });

    it("updates the track's Ableton notes", () => {
      expect(track.currentAbletonNotes[0].midiNote).to.eq(72);
    });
  });
});
