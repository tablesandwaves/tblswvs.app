const path     = require("path");
const fs       = require("fs");
const { AbletonLive } = require("../../../dist/app/model/ableton/live");

const mocksDirectory = path.resolve(__dirname, "..", "serializations");

const serializeDaw = async (filename, daw) => {
  const filepath = path.resolve(mocksDirectory, filename);
  fs.writeFileSync(filepath, JSON.stringify(daw), err => console.log((err) ? err : filepath + " saved"));
}

const daw = new AbletonLive();

const createClip = async (trackIndex, clipIndex, length) => new Promise(async (resolve) => {
  daw.createClip(trackIndex, clipIndex, length);
  setTimeout(() => resolve(daw), 1000);
});

const deleteClip = async (trackIndex, clipIndex) => new Promise(async (resolve) => {
  daw.deleteClip(trackIndex, clipIndex);
  setTimeout(() => resolve(daw), 1000);
});

const updateTrackNotes = async (trackIndex, notes) => new Promise(async (resolve) => {
  daw.setNotes(trackIndex, notes);
  setTimeout(() => resolve(daw), 1000);
});

module.exports = {
  daw: daw,
  serializeDaw: serializeDaw,
  createClip: createClip,
  deleteClip: deleteClip,
  updateTrackNotes: updateTrackNotes,
  mocksDirectory: mocksDirectory
}
