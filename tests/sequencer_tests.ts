import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";



describe("Sequencer", () => {
  describe("generating Ableton notes for a track", () => {
    describe("with a beat length of 12 16th notes", () => {
      const testing = true;
      const sequencer = new Sequencer(testing);
      sequencer.superMeasure = 2;
      sequencer.getActiveTrack().beatLength = 12;
      sequencer.getActiveTrack().rhythm = new Array(12).fill({...{state: 0, probability: 1}});
      sequencer.getActiveTrack().rhythm[0] = {state: 1, probability: 1};
      sequencer.getActiveTrack().outputNotes = [
        [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
        [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }],
        [{ octave: 3, note: 'G', midi: 67, scaleDegree: 5 }]
      ];
      let abletonNotes = sequencer.abletonNotesForCurrentTrack();


      it("should the have correct number of notes", () => {
        expect(abletonNotes.length).to.eq(3);
      });

      it("should have the right notes in order", () => {
        expect(abletonNotes[0].midiNote).to.eq(60);
        expect(abletonNotes[1].midiNote).to.eq(63);
        expect(abletonNotes[2].midiNote).to.eq(67);
      });

      it("should place the notes at the correct positions", () => {
        expect(abletonNotes[0].clipPosition).to.eq(0);
        expect(abletonNotes[1].clipPosition).to.eq(3);
        expect(abletonNotes[2].clipPosition).to.eq(6);
      })
    });
  });
});
