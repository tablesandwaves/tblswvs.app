const shared   = require("./shared");
const { AbletonNote } = require("../../../dist/app/model/ableton/note");


console.log("Adding a single note to an empty clip");

const notes = [new AbletonNote(60, 0, 0.25, 100)],
      trackIndex = 0,
      clipIndex = 0;

let result = shared.updateTrackNotes(trackIndex, clipIndex, notes);

result.then(async (daw) => {
  await shared.serializeDaw("added-note.json", daw);
}).catch((err) => {
  console.log(err);
}).finally(() => {
  process.exit(0);
});
