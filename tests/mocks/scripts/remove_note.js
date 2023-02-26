const shared   = require("./shared");

console.log("Setting clip notes to an empty array");

const notes = [],
      trackIndex = 0,
      clipIndex = 0;

let result = shared.updateTrackNotes(trackIndex, clipIndex, notes);

result.then(async (daw) => {
  await shared.serializeDaw("removed-note.json", daw);
}).catch((err) => {
  console.log(err);
}).finally(() => {
  process.exit(0);
});
