const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");


// Track name handler
const processTrackNames = (...trackNames) => {
  trackNames.forEach((trackName, i) => console.log(`${i + 1} ${trackName}`));
  process.exit();
}


const emitter  = new OscEmitter();
const receiver = new OscReceiver();

// Establish communication TO Live
emitter.add("localhost", 11000);

// Establish connection FROM Live and setup a call back to log the responses
receiver.bind(11001, "localhost");

// Create a specific handler for the track names
receiver.on("/live/song/get/track_names", processTrackNames)

// Create a generic handler for all messages
receiver.on("message", (...response) => console.log(response[0], response.slice(1).join(", ")));

// Request the track names from Live
emitter.emit("/live/song/get/track_names");
