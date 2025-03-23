import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { DrumInputNoteController } from "../app/controller/drum_input_note_controller";
import { DrumTrack } from "../app/model/ableton/drum_track";
import { configDirectory, baselineDrumPadActivation, mockDrumNoteRecording } from "./test_helpers";
import { GridKeyPress } from "../app/controller/application_controller";


const testing = true;


describe("DrumInputNoteController", () => {
  describe("selecting the initial drum controller page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 3, s: 1}); // Select the Perc track, which is a drum rack,
    sequencer.grid.keyPress({y: 7, x: 8, s: 1}); // then select the input notes page.

    it("sets the active page to a drum pad page", () => {
      expect(sequencer.grid.activePage).to.be.instanceOf(DrumInputNoteController);
    });

    it("generates the drum pad matrix for the grid", () => {
      (sequencer.grid.activePage as DrumInputNoteController).getGridDrumPadRows().forEach(row => {
        expect(row).to.have.ordered.members([1, 1, 1, 1,  0, 0, 0, 0]);
      });
    });

    it("generates the algorithm row for the grid", () => {
      expect((sequencer.grid.activePage as DrumInputNoteController).getGridAlgorithmRow()).to.have.ordered.members([
        10, 0, 0, 0,  0, 0, 0, 0
      ]);
    });
  });


  describe("adding notes", () => {
    describe("when no rhythm gates are active", () => {
      const sequencer = new Sequencer(configDirectory, testing);
      const rhythmKeyPresses: GridKeyPress[] = [];
      const noteKeyPresses = [
        {y: 5, x: 0, s: 1}, {y: 5, x: 0, s: 0}, // Add first note
        {y: 5, x: 2, s: 1}, {y: 5, x: 2, s: 0}, // Add second note
        {y: 5, x: 0, s: 1}, {y: 5, x: 0, s: 0}, // Add third note
        {y: 5, x: 2, s: 1}, {y: 5, x: 2, s: 0}  // Add fourth note
      ];
      mockDrumNoteRecording(sequencer, rhythmKeyPresses, noteKeyPresses);
      const track = sequencer.daw.getActiveTrack() as DrumTrack;

      it("loads the queued sequence in the controller's input notes field", () => {
        expect((sequencer.grid.activePage as DrumInputNoteController).inputNotes).to.deep.eq([
          [{octave: 1, note: "C", midi: 36}],
          [{octave: 1, note: "D", midi: 38}],
          [{octave: 1, note: "C", midi: 36}],
          [{octave: 1, note: "D", midi: 38}]
        ]);
      });

      it("does not set the drum track's sequence", () => {
        expect(track.sequence[0].map(n => n.midi)).to.have.ordered.members([]);
        expect(track.sequence[4].map(n => n.midi)).to.have.ordered.members([]);
        expect(track.sequence[8].map(n => n.midi)).to.have.ordered.members([]);
        expect(track.sequence[12].map(n => n.midi)).to.have.ordered.members([]);
      });

      it("does not set the drum track's output notes", () => {
        expect(track.outputNotes).to.have.ordered.members([]);
      });

      it("sets the drum track's Ableton notes", () => {
        const pad36Positions = track.currentAbletonNotes.filter(note => note.midiNote == 36).map(note => note.clipPosition);
        const pad38Positions = track.currentAbletonNotes.filter(note => note.midiNote == 38).map(note => note.clipPosition);
        expect(pad36Positions).to.have.ordered.members([]);
        expect(pad38Positions).to.have.ordered.members([]);
      });
    });


    describe("when rhythm gates are active", () => {
      const sequencer = new Sequencer(configDirectory, testing);
      const rhythmKeyPresses = [
        {y: 0, x: 0, s: 1},  {y: 0, x: 0, s: 0},
        {y: 0, x: 4, s: 1},  {y: 0, x: 4, s: 0},
        {y: 0, x: 8, s: 1},  {y: 0, x: 8, s: 0},
        {y: 0, x: 12, s: 1}, {y: 0, x: 12, s: 0}
      ];
      const noteKeyPresses = [
        {y: 5, x: 0, s: 1}, {y: 5, x: 0, s: 0}, // Add first note
        {y: 5, x: 2, s: 1}, {y: 5, x: 2, s: 0}, // Add second note
        {y: 5, x: 0, s: 1}, {y: 5, x: 0, s: 0}, // Add third note
        {y: 5, x: 2, s: 1}, {y: 5, x: 2, s: 0}  // Add fourth note
      ];
      mockDrumNoteRecording(sequencer, rhythmKeyPresses, noteKeyPresses);
      const track = sequencer.daw.getActiveTrack() as DrumTrack;

      it("loads the queued sequence in the controller's input notes field", () => {
        expect((sequencer.grid.activePage as DrumInputNoteController).inputNotes).to.deep.eq([
          [{octave: 1, note: "C", midi: 36}],
          [{octave: 1, note: "D", midi: 38}],
          [{octave: 1, note: "C", midi: 36}],
          [{octave: 1, note: "D", midi: 38}]
        ]);
      });

      it("sets the drum track's sequence", () => {
        expect(track.sequence[0].map(n => n.midi)).to.have.ordered.members([36]);
        expect(track.sequence[4].map(n => n.midi)).to.have.ordered.members([38]);
        expect(track.sequence[8].map(n => n.midi)).to.have.ordered.members([36]);
        expect(track.sequence[12].map(n => n.midi)).to.have.ordered.members([38]);
      });

      it("sets the drum track's output notes", () => {
        expect(track.outputNotes).to.deep.eq([
          [{octave: 1, note: "C", midi: 36}],
          [{octave: 1, note: "D", midi: 38}],
          [{octave: 1, note: "C", midi: 36}],
          [{octave: 1, note: "D", midi: 38}]
        ]);
      });

      it("sets the drum track's Ableton notes", () => {
        const pad36Positions = track.currentAbletonNotes.filter(note => note.midiNote == 36).map(note => note.clipPosition);
        const pad38Positions = track.currentAbletonNotes.filter(note => note.midiNote == 38).map(note => note.clipPosition);
        expect(pad36Positions).to.have.ordered.members([0, 2, 8, 10, 16, 18, 24, 26]);
        expect(pad38Positions).to.have.ordered.members([1, 3, 9, 11, 17, 19, 25, 27]);
      });
    });
  });


  describe("setting a drum track to the infinity series and then back to the simple algorithm", () => {
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

    it("resets the sequence pattern", () => {
      const pad36Positions = track.currentAbletonNotes.filter(note => note.midiNote == 36).map(note => note.clipPosition);
      const pad37Positions = track.currentAbletonNotes.filter(note => note.midiNote == 37).map(note => note.clipPosition);
      expect(pad36Positions).to.have.ordered.members([0, 8, 16, 24]);
      expect(pad37Positions).to.have.ordered.members([3, 11, 19, 27]);
    });
  });
});
