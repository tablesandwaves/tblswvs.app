// const shared   = require("./shared");


// console.log("Removing a clip from a clip slot");


// const trackIndex = 0, clipIndex = 1;

// let creation = await shared.createClip(trackIndex, clipIndex, 16);

// creation.then(async (daw) => {
//   // await shared.serializeDaw("deleted-clip.json", daw);
//   setTimeout(() => console.log("created"), 1000);
// }).catch((err) => {
//   console.log(err);
// });

// let deletion = await shared.deleteClip(trackIndex, clipIndex);

// deletion.then(async (daw) => {
//   await shared.serializeDaw("deleted-clip.json", daw);
// }).catch((err) => {
//   console.log(err);
// }).finally(() => {
//   process.exit(0);
// });
