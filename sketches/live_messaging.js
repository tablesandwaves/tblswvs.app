const OscEmitter  = require("osc-emitter");
const OscReceiver = require("osc-receiver");


let liveResponse = undefined;

const liveResponseHandler = (...response) => {
  liveResponse = response[1];
}

const liveRequest = (liveApiCall, expectation) => {
  const delay = 50;
  const repetitions = 3;

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

const fulfilledMsg = ([result, maxTime]) => console.log(`Live responsed with ${result} in under ${maxTime}ms`);
const rejectedMsg  = (maxTime) => console.log(`Waited more than ${maxTime}ms for confirmed response`);


// Establish communication TO Live
const emitter  = new OscEmitter();
emitter.add("localhost", 33333);

// Establish communication FROM Live & and create a handler for receiving notes
const receiver = new OscReceiver();
receiver.bind(33334, "localhost");
receiver.on("message", liveResponseHandler);


module.exports = {
  emitter: emitter,
  receiver: receiver,
  liveRequest: liveRequest,
  fulfilledMsg: fulfilledMsg,
  rejectedMsg: rejectedMsg
}
