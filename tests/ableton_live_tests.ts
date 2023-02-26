const path     = require("path");
const fs       = require("fs");
import { expect } from "chai";


const mockObject = (filename: string) => {
  const filepath = path.resolve(__dirname, "mocks", "serializations", filename);
  return JSON.parse(fs.readFileSync(filepath, {encoding:'utf8', flag:'r'}));
}


describe("AbletonLive", () => {
  describe("adding a note", () => {
    const dawPostAdd = mockObject("added-note.json");

    it("creates the note and stores it in the track clip", () => {
      expect(dawPostAdd.tracks[0].clips[0].notes[0].midiNote).to.eq(60);
    });

    it("does not keep the new notes queued in the clip", () => {
      expect(dawPostAdd.tracks[0].clips[0].queuedNotes.length).to.eq(0);
    });
  });

  describe("removing a note", () => {
    const dawPostAdd = mockObject("removed-note.json");

    it("removes the note from the track clip", () => {
      expect(dawPostAdd.tracks[0].clips[0].notes.length).to.eq(0);
    });

    it("has no queued notes", () => {
      expect(dawPostAdd.tracks[0].clips[0].queuedNotes.length).to.eq(0);
    });
  });
});


