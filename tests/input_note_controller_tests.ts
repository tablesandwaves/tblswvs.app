import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { InputNoteController } from "../app/controller/input_note_controller";
import { configDirectory, getInputRecordingMocks, rhythmStepsForPattern } from "./test_helpers";
import { MelodicTrack } from "../app/model/ableton/melodic_track";
import { DrumInputNoteController } from "../app/controller/drum_input_note_controller";


const testing   = true;


describe("InputNoteController", () => {
  describe("selecting the initial input note controller page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 5, s: 1});
    const track = sequencer.daw.getActiveTrack();
    track.activeChain = 1;

    // Select the melodic note input page
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});

    it("sets the active page to a melodic note page", () => expect(sequencer.grid.activePage).to.be.instanceOf(InputNoteController));

    it("has the default algorithm row (simple selected)", () => {
      expect((sequencer.grid.activePage as InputNoteController).getGridAlgorithmRow()).to.have.ordered.members([
        10, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("switching from a drum track to a melodic track while on the input note controller pages", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 3, s: 1}); // Select a drum track
    sequencer.grid.keyPress({y: 7, x: 8, s: 1}); // Select a the input note page
    expect(sequencer.grid.activePage).to.be.instanceOf(DrumInputNoteController);

    sequencer.grid.keyPress({y: 7, x: 4, s: 1}); // Select a melodic track

    it("loads the (melodic) input note controller", () => {
      expect(sequencer.grid.activePage).to.be.instanceOf(InputNoteController);
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


  describe("setting the editable clip", () => {
    describe("when note recording is off", () => {
      const [sequencer, track, controller] = getInputRecordingMocks();
      track.rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);

      controller.recordingInputNotes = false;
      sequencer.grid.keyPress({y: 3, x: 14, s: 1}); // Press the button for the second clip

      it("sets the editable clip property in the controller for queueing launch", () => {
        expect(controller.editableClip).to.eq(1);
      });
    });


    describe("when note recording is on", () => {
      const [sequencer, track, controller] = getInputRecordingMocks();
      track.rhythm = rhythmStepsForPattern([
        1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
      ]);
      sequencer.grid.keyPress({y: 2, x: 15, s: 1}); // Press the button for note recording
      sequencer.grid.keyPress({y: 3, x: 14, s: 1}); // Press the button for the second clip (index 1)
      sequencer.grid.keyPress({y: 3, x: 1, s: 1});  // Add a note
      sequencer.grid.keyPress({y: 3, x: 1, s: 0});
      sequencer.grid.keyPress({y: 6, x: 15, s: 1}); // Flush notes with call to advance()
      sequencer.grid.keyPress({y: 6, x: 15, s: 0});

      it("sets the editable clip property in the controller", () => {
        expect(controller.editableClip).to.eq(1);
      });

      it("does not update the actively playing clip notes", () => {
        expect(track.currentAbletonNotes.length).to.eq(0);
      });

      it("updates the editing clip output notes", () => {
        expect(track.clips[1].outputNotes[0][0].midi).to.eq(62);
      });

      it("updates the editing clip's current Ableton notes", () => {
        expect(track.clips[1].currentAbletonNotes[0].midiNote).to.eq(62);
      });
    });
  });
});
