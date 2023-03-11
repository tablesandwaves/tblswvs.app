/**
 * Before running this script, open Live, create a MIDI track on track 1. Then add
 * the tblswvs.osc.amxd device to the clip.
 *
 * Usage:
 *
 *  $ node sketches/live_add_clip_notes.js
    Live responsed with Created in under 50ms
    Live responsed with Success in under 50ms
    Finishing Up.
 */


const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");


let liveResponse = undefined;

const liveResponseHandler = (...response) => {
  liveResponse = response[1];
}

const liveRequest = (liveApiCall, expectation, delay, repetitions) => {
  liveApiCall();

  return new Promise((resolve, reject) => {
    let x = 1;
    const intervalId = setInterval(() => {
      if (liveResponse == expectation) {
        clearInterval(intervalId);
        liveResponse = undefined;
        resolve([expectation, x * delay]);
      }
      if (++x === repetitions + 1) {
        clearInterval(intervalId);
        reject(x * delay);
      }
    }, delay);
  });
}


const addTrackNotes = () => {
  const melodyOffsets = [0, 3, 7];
  const trackIndex    = 0;
  const clipIndex     = 0;
  const midiTonic     = 60;

  let melodyData = melodyOffsets.flatMap((noteOffset, i) => [noteOffset + midiTonic, i * 0.25, 0.25, 64, 0.5]);
  let address = `/tracks/${trackIndex}/clips/${clipIndex}/notes`;
  emitter.emit(address, ...melodyData);
}


const createTrackClip = () => {
  const trackIndex = 0;
  const clipIndex  = 0;
  let address = `/tracks/${trackIndex}/clips/${clipIndex}/create`;
  emitter.emit(address, 4);
}


const fulfilledMsg = ([result, maxTime]) => console.log(`Live responsed with ${result} in under ${maxTime}ms`);
const rejectedMsg  = (maxTime) => console.log(`Waited more than ${maxTime}ms for confirmed response`);


// Establish communication TO Live
const emitter  = new OscEmitter();
emitter.add("localhost", 33333);

// Establish communication FROM Live & and create a handler for receiving notes
const receiver = new OscReceiver();
receiver.bind(33334, "localhost");
receiver.on("message", liveResponseHandler);

const responseWaitTime = 50;
const maxNumberOfWaits = 3;

liveRequest(createTrackClip, "Created", responseWaitTime, maxNumberOfWaits)
.then(result   => fulfilledMsg(result))
.then(()       => liveRequest(addTrackNotes, "Success", responseWaitTime, maxNumberOfWaits))
.then(result   => fulfilledMsg(result))
.catch(maxTime => rejectedMsg(maxTime))
.finally(()    => {
  console.log("Finishing Up.");
  emitter._socket.close();
  receiver._socket.close();
});
