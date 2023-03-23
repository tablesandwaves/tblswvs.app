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

const live = require("./live_messaging");

const addTrackNotes = () => {
  const melodyOffsets = [0, 3, 7];
  const trackIndex    = 0;
  const clipIndex     = 0;
  const midiTonic     = 60;

  let melodyData = melodyOffsets.flatMap((noteOffset, i) => [noteOffset + midiTonic, i * 0.25, 0.25, 64, 0.5]);
  let address = `/tracks/${trackIndex}/clips/${clipIndex}/notes`;
  live.emitter.emit(address, ...melodyData);
}


const createTrackClip = () => {
  const trackIndex = 0;
  const clipIndex  = 0;
  let address = `/tracks/${trackIndex}/clips/${clipIndex}/create`;
  live.emitter.emit(address, 4);
}


live.liveRequest(createTrackClip, "Created")
  .then(result   => live.fulfilledMsg(result))
  .then(()       => live.liveRequest(addTrackNotes, "Success"))
  .then(result   => live.fulfilledMsg(result))
  .catch(maxTime => live.rejectedMsg(maxTime))
  .finally(()    => {
    console.log("Finishing Up.");
    live.emitter._socket.close();
    live.receiver._socket.close();
  });
