const OscEmitter  = require("osc-emitter");
const { Melody }  = require("tblswvs");

const emitter  = new OscEmitter();

// Establish communication TO Live
emitter.add("localhost", 11000);

// Get half step offsets for the Infinity Series sequence
const melodyOffsets = Melody.infinitySeries([0, 3]).steps;

// Translate offsets to Live note data format
let melodyData = melodyOffsets.flatMap((noteOffset, i) => {
  return [
    {type: "integer", value: 60 + noteOffset},
    {type: "double",  value: i * 0.25},
    {type: "double",  value: 0.25},
    {type: "float",  value: 64},
    {type: "boolean",  value: false},
  ]
});

// Track 1, Clip 1 are index 0, 0
let firstTrackFirstClip = [{type: 'integer', value: 0}, {type: 'integer', value: 0}];

// Tell Live to add the MIDI notes to the clip
emitter.emit("/live/clip/add/notes", ...firstTrackFirstClip, ...melodyData);
