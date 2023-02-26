const path     = require("path");
const fs       = require("fs");
const { AbletonLive } = require("../../../dist/app/model/ableton/live");
// const { Note } = require("../../../dist/lib/es5/note");

const mocksDirectory = path.resolve(__dirname, "..", "serializations");

const serializeDaw = async (filename, daw) => {
  const filepath = path.resolve(mocksDirectory, filename);
  fs.writeFileSync(filepath, JSON.stringify(daw), err => console.log((err) ? err : filepath + " saved"));
}

const daw = new AbletonLive();

const updateTrackNotes = async (trackIndex, clipIndex, notes) => new Promise(async (resolve) => {
  daw.setNotes(trackIndex, clipIndex, notes);
  setTimeout(() => resolve(daw), 1000);
});


module.exports = {
  daw: daw,
  serializeDaw: serializeDaw,
  updateTrackNotes: updateTrackNotes,
  mocksDirectory: mocksDirectory
}
