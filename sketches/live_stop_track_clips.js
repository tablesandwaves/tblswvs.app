/**
 * Before running this script, open Live, create a MIDI track on track 1. Then add
 * the tblswvs.osc.amxd device to the clip. Create a clip in clip slot 1 and play it.
 *
 * Usage:
 *
 *  $ node sketches/stop_track_clips.js
    Live responsed with Stopped in under 50ms
    Finishing Up.
 */

const live = require("./live_messaging");

const stopTrackClips = () => live.emitter.emit("/tracks/0/clips/stop");

live.liveRequest(stopTrackClips, "Stopped")
  .then(result   => live.fulfilledMsg(result))
  .catch(maxTime => live.rejectedMsg(maxTime))
  .finally(()    => {
    console.log("Finishing Up.");
    live.emitter._socket.close();
    live.receiver._socket.close();
  });

