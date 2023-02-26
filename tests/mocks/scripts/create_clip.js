const shared   = require("./shared");


console.log("Adding a new clip to an empty clip slot");

const trackIndex = 0, clipIndex = 1, length = 16;

let result = shared.createClip(trackIndex, clipIndex, length);

result.then(async (daw) => {
  await shared.serializeDaw("added-clip.json", daw);
}).catch((err) => {
  console.log(err);
}).finally(() => {
  process.exit(0);
});
