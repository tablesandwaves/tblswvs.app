outlets = 3;


var selectTrackPattern  = /\/tracks\/(\d+)/;
var trackChainPattern   = /\/tracks\/(\d+)\/chains\/(\d+)/;
var notesByBarPattern   = /\/tracks\/(\d+)\/clips\/(\d+)\/bars\/(\d+)\/notes/;
var clipFirePattern     = /\/tracks\/(\d+)\/clips\/(\d+)\/fire/;
var newClipPattern      = /\/tracks\/(\d+)\/clips\/(\d+)\/create/;
var stopAllClipsPattern = /\/tracks\/(\d+)\/clips\/stop/;
var rampSeqPattern      = /\/tracks\/(\d+)\/ramp_seq\/(\d+)/;
var superMeasurePattern = /\/set\/super_measure/

var activeTrackClips = [-1, 0, 0, 0, 0, 0, 0, 0];


function osc_message() {
  var a = arrayfromargs(arguments);
  // outlet(1, "OSC Message 1: " + a[0]);

  var selectTrackMatch = a[0].match(selectTrackPattern);
  if (selectTrackMatch) {
    selectTrack(selectTrackMatch[1]);
  }

  var notesByBarMatch = a[0].match(notesByBarPattern);
  if (notesByBarMatch) {
    outlet(1, "notesByBarMatch", notesByBarMatch[1]);
    var response = syncClipBarNotes(notesByBarMatch[1], notesByBarMatch[2], notesByBarMatch[3], a.slice(1));
    outlet(1, notesByBarMatch[0], response);
  }

  var fireMatch = a[0].match(clipFirePattern);
  if (fireMatch) {
    fireClipSlot(fireMatch[1], fireMatch[2]);
    activeTrackClips[fireMatch[1]] = fireMatch[2];
  }

  var stopClipMatch = a[0].match(stopAllClipsPattern);
  if (stopClipMatch) {
    stopTrackClips(stopClipMatch[1]);
    activeTrackClips[stopClipMatch[1]] = -1;
    outlet(0, stopClipMatch[0], "Stopped");
    outlet(1, stopClipMatch[0], "Stopped");
  }

  var rampSeqMatch = a[0].match(rampSeqPattern);
  if (rampSeqMatch) {
    var rampSequenceData = [parseInt(rampSeqMatch[2])].concat(a.slice(1));
    messnamed("rampseq_" + rampSeqMatch[1], rampSequenceData);
  }

  var trackChainMatch = a[0].match(trackChainPattern);
  if (trackChainMatch) {
    updateTrackChain(trackChainMatch[1], trackChainMatch[2]);
  }

  var newClipMatch = a[0].match(newClipPattern);
  if (newClipMatch) {
    createClip(newClipMatch[1], newClipMatch[2], a[1]);
    outlet(0, newClipMatch[0], "Created");
    outlet(1, newClipMatch[0], "Created");
  }

  var superMeasureMatch = a[0].match(superMeasurePattern);
  if (superMeasureMatch) {
    for (var trackIndex = 0; trackIndex < 8; trackIndex++) {
      new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + activeTrackClips[trackIndex] + " clip")
          .set("loop_end", parseInt(a[1]) * 4);
    }
    outlet(2, parseInt(a[1]) * 16);
  }
}


function updateTrackChain(trackIndex, chainIndex) {
  var chainIds = new LiveAPI("live_set tracks " + trackIndex + " devices 0").get("chains");

  for (var i = 0, chainIdx = 0; i < chainIds.length; i += 2, chainIdx++) {
    var chain = new LiveAPI(chainIds[i] + " " + chainIds[i + 1]);
    var rootChainDeviceParameterIds = new LiveAPI(chain.get("devices")).get("parameters");
    for (var j = 0; j < rootChainDeviceParameterIds.length; j += 2) {
      var param = new LiveAPI(rootChainDeviceParameterIds[j] + " " + rootChainDeviceParameterIds[j + 1]);
      if (param.get("name") == "Device On") {
        param.set("value", chainIndex == chainIdx ? 1 : 0);
      }
    }
  }
}


function createClip(trackIndex, clipIndex, length) {
  var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + clipIndex);
  if (clipSlot.get("has_clip") == 1) clipSlot.call("delete_clip");
  clipSlot.call("create_clip", length);
}


function fireClipSlot(trackIndex, clipIndex) {
  new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + clipIndex).call("fire");
}


function stopTrackClips(trackIndex) {
  new LiveAPI("live_set tracks " + trackIndex).call("stop_all_clips");
}


/**
 * Performs a diff of the current notes and new notes passed to the method by comparing note start times,
 * MIDI note numbers and probabilities.
 *
 * @param {number} trackIndex 0-indexed track number
 * @param {number} clipIndex 0-indexed clip number in the specified track
 * @param {Array} newNotes the set of notes that should represent the clip's state
 * @returns "Success" or "Failed" if the note count after this function runs matches the note count of newNotes
 */
function syncClipBarNotes(trackIndex, clipIndex, barIndex, newNotes) {
  var currentNotes = getClipBarNotes(trackIndex, clipIndex, barIndex);

  var removedNoteIds = new Array();
  var addedNotes     = new Array();

  var newNoteIdentifiers     = new Array();
  var currentNoteIdentifiers = new Array();

  for (var i = 0; i < newNotes.length; i += 5)
    newNoteIdentifiers.push(
      newNotes[i] + "::" +
      (Math.round((newNotes[i + 1] + Number.EPSILON) * 1000) / 1000) + "::" +
      // newNotes[i + 1] + "::" +
      newNotes[i + 2] + "::" +
      newNotes[i + 3] + "::" +
      newNotes[i + 4]
    );

  for (var i = 0; i < currentNotes.notes.length; i++)
    currentNoteIdentifiers.push(
      currentNotes.notes[i].pitch + "::" +
      (Math.round((currentNotes.notes[i].start_time + Number.EPSILON) * 1000) / 1000) + "::" +
      // currentNotes.notes[i].start_time + "::" +
      currentNotes.notes[i].duration + "::" +
      currentNotes.notes[i].velocity + "::" +
      currentNotes.notes[i].probability
    );

  for (var i = 0; i < currentNotes.notes.length; i++) {
    if (newNoteIdentifiers.indexOf(
        currentNotes.notes[i].pitch + "::" +
        currentNotes.notes[i].start_time + "::" +
        currentNotes.notes[i].duration + "::" +
        currentNotes.notes[i].velocity + "::" +
        currentNotes.notes[i].probability
      ) == -1)
      removedNoteIds.push(currentNotes.notes[i].note_id);
  }

  for (var i = 0; i < newNotes.length; i += 5) {
    if (currentNoteIdentifiers.indexOf(
        newNotes[i] + "::" +
        newNotes[i + 1] + "::" +
        newNotes[i + 2] + "::" +
        newNotes[i + 3] + "::" +
        newNotes[i + 4]
      ) == -1) {
      addedNotes.push(newNotes[i]);
      addedNotes.push(newNotes[i + 1]);
      addedNotes.push(newNotes[i + 2]);
      addedNotes.push(newNotes[i + 3]);
      addedNotes.push(newNotes[i + 4]);
    }
  }

  removeClipNotes(trackIndex, clipIndex, removedNoteIds);
  addClipNotes(trackIndex, clipIndex, addedNotes);

  currentNotes = getClipBarNotes(trackIndex, clipIndex, barIndex);
  var failureMessage = "New Notes: " + (newNotes.length / 5) + "; Notes After Update: " + currentNotes.notes.length;
  return (currentNotes.notes.length == newNotes.length / 5) ? "Success" : failureMessage;
}


function removeClipNotes(trackIndex, clipIndex, noteIds) {
  // There appears to be a bug in the Live API and multiple note IDs may not be sent despite what the documentation says
  for (var i = 0; i < noteIds.length; i++)
    new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + clipIndex + " clip")
          .call("remove_notes_by_id", noteIds[i]);
}


function addClipNotes(trackIndex, clipIndex, oscNoteData) {
  var noteData   = { notes: new Array() };

  for (var i = 0; i < oscNoteData.length; i += 5) {
    noteData.notes.push({
      pitch:       oscNoteData[i],
      start_time:  oscNoteData[i + 1],
      duration:    oscNoteData[i + 2],
      velocity:    oscNoteData[i + 3],
      probability: oscNoteData[i + 4]
    });
  }

  new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + clipIndex + " clip")
        .call("add_new_notes", noteData);
}


function getClipBarNotes(trackIndex, clipIndex, barIndex) {
  var path = "live_set tracks " + trackIndex + " clip_slots " + clipIndex + " clip";
  var firstBeatInBar = parseFloat(barIndex) * 4;
  return JSON.parse(new LiveAPI(path).call("get_notes_extended", 0, 127, firstBeatInBar, firstBeatInBar + 4));
}


function getClipNoteIds(trackIndex, clipIndex) {
  var response = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + clipIndex + " clip")
                      .call("get_notes_extended", 0, 127, 0.0, 33.0);

  var notes = new Array();
  var responseData = JSON.parse(response);
  for (var i = 0; i < responseData.notes.length; i++) {
    notes.push(responseData.notes[i].note_id);
    notes.push(responseData.notes[i].start_time);
    notes.push(responseData.notes[i].pitch);
  }

  return notes;
}


function selectTrack(trackIndex) {
  var liveSet = new LiveAPI('live_set view');
  var targetTrackDevice = new LiveAPI("live_set tracks " + trackIndex + " devices 0");
  liveSet.call("select_device", "id " + targetTrackDevice.id);
}
