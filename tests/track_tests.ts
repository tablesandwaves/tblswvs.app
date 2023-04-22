import { expect } from "chai";
import { AbletonTrack } from "../app/model/ableton/track";
import { Sequencer } from "../app/model/sequencer";
import { AbletonLive } from "../app/model/ableton/live";


const testing   = true;
const sequencer = new Sequencer(testing);
const daw       = new AbletonLive(sequencer);
const track     = new AbletonTrack("Kick", daw, 0);


describe("AbletonTrack", () => {
  describe("when generating rhythmic fills", () => {
    sequencer.superMeasure = 2;
    track.outputNotes      = [ [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }] ];
    track.rhythm           = new Array(16).fill({...{state: 0, probability: 1, fillRepeats: 0}});
    track.rhythm[0]        = {state: 1, probability: 1, fillRepeats: 3};
    track.fillMeasures[1]  = 1;
    let abletonNotes = track.abletonNotes();

    it("should the have correct number of notes", () => {
      expect(abletonNotes.length).to.eq(5);
    });

    it("should have the right notes in order", () => {
      expect(abletonNotes[0].midiNote).to.eq(60);
      expect(abletonNotes[1].midiNote).to.eq(60);
      expect(abletonNotes[2].midiNote).to.eq(60);
      expect(abletonNotes[3].midiNote).to.eq(60);
      expect(abletonNotes[4].midiNote).to.eq(60);
    });

    it("should place the notes at the correct positions", () => {
      expect(abletonNotes[0].clipPosition).to.eq(0);
      expect(abletonNotes[1].clipPosition).to.eq(4);
      expect(abletonNotes[2].clipPosition).to.eq(4.25);
      expect(abletonNotes[3].clipPosition).to.eq(4.5);
      expect(abletonNotes[4].clipPosition).to.eq(4.75);
    });
  });


  describe("when successive notes that share the same pitch overlap", () => {
    track.outputNotes = [ [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }] ];
    track.noteLength  = "8n";
    track.rhythm      = new Array(16).fill({...{state: 0, probability: 1, fillRepeats: 0}});
    track.rhythm[0]   = {state: 1, probability: 1, fillRepeats: 0};
    track.rhythm[1]   = {state: 1, probability: 1, fillRepeats: 0};
    track.rhythm[4]   = {state: 1, probability: 1, fillRepeats: 0};
    const abletonNotes = track.abletonNotes();

    it("truncates earlier notes that share the same pitch", () => {
      // Measure 1
      expect(abletonNotes[0].duration).to.eq(0.25);
      // Measure 2
      expect(abletonNotes[3].duration).to.eq(0.25);
    });

    it("does not truncate notes that do not overlap", () => {
      // Measure 1
      expect(abletonNotes[1].duration).to.eq(0.5);
      expect(abletonNotes[2].duration).to.eq(0.5);
      // Measure 2
      expect(abletonNotes[4].duration).to.eq(0.5);
      expect(abletonNotes[5].duration).to.eq(0.5);
    });
  });
});
