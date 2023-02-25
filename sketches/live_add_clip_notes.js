const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");
const { Melody }  = require("tblswvs");


const processClipNotes = (...response) => {
  console.log("clip path", response[0], response[1]);
  for (let i = 2; i < response.length; i += 5) {
    console.log(response.slice(i, i + 5).join(" "));
  }
}


// Establish communication TO Live
const emitter  = new OscEmitter();
emitter.add("localhost", 11000);

// Establish communication FROM Live & and create a handler for receiving notes
const receiver = new OscReceiver();
receiver.bind(11001, "localhost");
receiver.on("/live/clip/get/notes", processClipNotes)


// Get half step offsets for the Infinity Series sequence
const melodyOffsets = Melody.infinitySeries([0, 3]).steps;

// Translate offsets to Live note data format
let melodyData = melodyOffsets.flatMap((noteOffset, i) => {
  return [
    {type: "integer", value: 60 + noteOffset},
    {type: "double",  value: i * 0.25},
    {type: "double",  value: 0.25},
    {type: "float",   value: 64},
    {type: "boolean", value: false},
  ]
});


// Track 1, Clip 1 are index 0, 0
let firstTrackFirstClip = [{type: 'integer', value: 0}, {type: 'integer', value: 0}];

// Tell Live to add the MIDI notes to the clip
emitter.emit("/live/clip/add/notes", ...firstTrackFirstClip, ...melodyData);
emitter.emit("/live/clip/get/notes", ...firstTrackFirstClip);
