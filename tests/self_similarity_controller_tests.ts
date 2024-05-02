import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { SelfSimilarityController } from "../app/controller/self_similarity_controller";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";


const testing = true;


describe("SelfSimilarityController", () => {
  describe("After selecting the initial algorithm page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the note input page, then the self-similarity sub-page
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});
    sequencer.grid.keyPress({y: 6, x: 3, s: 1});
    const activePage = sequencer.grid.activePage as SelfSimilarityController;

    it("the self-similarity controller can be selected", () => {
      expect(activePage).to.be.instanceOf(SelfSimilarityController)
    });

    describe("the default self-similarity controller state", () => {
      it("has the default self-similarity type range row", () => {
        expect(activePage.getGridSelfSimilarityTypeRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0
        ]);
      });

      it("has the default repetitions row", () => {
        expect(activePage.getRhythmRepetitionsRow()).to.have.ordered.members([
          10, 0, 0, 0,  0, 0, 0, 0
        ]);
      });
    });
  });


  describe("The self-similarity algorithms that can be set", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    const track = sequencer.daw.getActiveTrack();
    sequencer.queuedNotes = [
      [{ octave: 3, note: 'C',  midi: 60, scaleDegree: 1 }],
      [{ octave: 3, note: 'D',  midi: 62, scaleDegree: 2 }],
      [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }],
      [{ octave: 3, note: 'F',  midi: 65, scaleDegree: 4 }],
      [{ octave: 3, note: 'G',  midi: 67, scaleDegree: 5 }]
    ];

    // Select the note input page, then the self-similarity sub-page
    sequencer.grid.keyPress({y: 7, x: 8, s: 1});
    sequencer.grid.keyPress({y: 6, x: 3, s: 1});

    it("include self-replication melodies", () => {
      // Select the self-replicating type, then advance
      sequencer.grid.keyPress({y: 2, x: 0, s: 1});
      sequencer.grid.keyPress({y: 6, x: 15, s: 1});

      const actual = track.outputNotes.flat().slice(0, 4).map(note => note.midi);
      expect(actual).to.have.ordered.members([ 60, 62, 62, 63 ]);
    });

    it("include counted melodies", () => {
      // Select the counting type, then advance
      sequencer.grid.keyPress({y: 2, x: 1, s: 1});
      sequencer.grid.keyPress({y: 6, x: 15, s: 1});

      const actual = track.outputNotes.flat().slice(0, 25).map(note => note == undefined ? undefined : note.midi);
      expect(actual).to.have.ordered.members([
        60, undefined, 62, undefined, 63, undefined, 65, undefined, 67, undefined,
        60, 62, undefined, 63, 65, undefined, 67, 60, undefined, 62, 63, undefined, 65, 67, undefined
      ]);
    });

    it("include zig zag melodies", () => {
      // Select the counting type, then advance
      sequencer.grid.keyPress({y: 2, x: 2, s: 1});
      sequencer.grid.keyPress({y: 6, x: 15, s: 1});

      const actual = track.outputNotes.flat().slice(0, 16).map(note => note == undefined ? undefined : note.midi);
      expect(actual).to.have.ordered.members([
        60, 62, 63, 63,  62, 62, 63, 65,  65, 63, 63, 65,  67, 67, 65, 65
      ]);
    });
  });


  // describe("Setting the self-similarty algorithm on a drum rack", () => {
  // });
});
