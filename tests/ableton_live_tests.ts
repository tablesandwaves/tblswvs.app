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
    const dawPostRemove = mockObject("removed-note.json");

    it("removes the note from the track clip", () => {
      expect(dawPostRemove.tracks[0].clips[0].notes.length).to.eq(0);
    });

    it("has no queued notes", () => {
      expect(dawPostRemove.tracks[0].clips[0].queuedNotes.length).to.eq(0);
    });
  });


  describe("adding a clip", () => {
    const dawPostAdd = mockObject("added-clip.json");

    it("adds the clip in the specified slot", () => {
      expect(dawPostAdd.tracks[0].clips.length).to.eq(2);
    });

    it("the new clip has the correct length in beats", () => {
      expect(dawPostAdd.tracks[0].clips[0].length).to.eq(16);
    });
  });


  // describe("deleting a clip", () => {
  //   const dawPostDelete = mockObject("deleted-clip.json");

  //   it("does not alter the size of the clip array", () => {
  //     expect(dawPostDelete.tracks[0].clips.length).to.eq(2);
  //   });

  //   it("the track's clip array does not remove the item but sets it to undefined", () => {
  //     expect(dawPostDelete.tracks[0].clips[1]).to.eq(undefined);
  //   });
  // });
});


