const shared = require("./shared");


console.log("Removing a clip from a clip slot");


console.log("creating a clip to setup state...")
const trackIndex = 0, clipIndex = 1;
let creation = shared.createClip(trackIndex, clipIndex, 16);

creation.then(async (daw) => {
  console.log("created");
}).catch((err) => {
  console.log(err);
});

setTimeout(() => {
  console.log("removing a clip to test state change...")
  let deletion = shared.deleteClip(trackIndex, clipIndex);

  deletion.then(async (daw) => {
    await shared.serializeDaw("deleted-clip.json", daw);
  }).catch((err) => {
    console.log(err);
  }).finally(() => {
    process.exit(0);
  });
}, 1000)
