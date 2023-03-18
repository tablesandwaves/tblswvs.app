outlets = 2;

var notesPattern = /\/tracks\/(\d+)\/clips\/(\d+)\/notes/;
var clipFirePattern = /\/tracks\/(\d+)\/clips\/(\d+)\/fire/;
var newClipPattern = /\/tracks\/(\d+)\/clips\/(\d+)\/create/;


function osc_message() {
  var a = arrayfromargs(arguments);
  post("Received: " + a[0] + "\n");

  var notesMatch = a[0].match(notesPattern);
  if (notesMatch) {
    var response = syncClipNotes(notesMatch[1], notesMatch[2], a.slice(1));
    outlet(0, notesMatch[0], response);
  }

  var fireMatch = a[0].match(clipFirePattern);
  if (fireMatch) {
    fireClipSlot(fireMatch[1], fireMatch[2]);
  }

  var newClipMatch = a[0].match(newClipPattern);
  if (newClipMatch) {
    createClip(newClipMatch[1], newClipMatch[2], a[1]);
    outlet(0, newClipMatch[0], "Created");
    outlet(1, newClipMatch[0], "Created");
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


/**
 * Performs a diff of the current notes and new notes passed to the method by comparing note start times,
 * MIDI note numbers and probabilities.
 *
 * @param {number} trackIndex 0-indexed track number
 * @param {number} clipIndex 0-indexed clip number in the specified track
 * @param {Array} newNotes the set of notes that should represent the clip's state
 * @returns "Success" or "Failed" if the note count after this function runs matches the note count of newNotes
 */
function syncClipNotes(trackIndex, clipIndex, newNotes) {
  var currentNotes = getClipNotes(trackIndex, clipIndex);

  var removedNoteIds = new Array();
  var addedNotes     = new Array();

  var newNoteIdentifiers     = new Array();
  var currentNoteIdentifiers = new Array();

  for (var i = 0; i < newNotes.length; i += 5)
    newNoteIdentifiers.push(newNotes[i + 1] + "::" + newNotes[i] + "::" + newNotes[i + 4]);

  for (var i = 0; i < currentNotes.notes.length; i++)
    currentNoteIdentifiers.push(currentNotes.notes[i].start_time + "::" + currentNotes.notes[i].pitch + "::" + currentNotes.notes[i].probability);

  for (var i = 0; i < currentNotes.notes.length; i++) {
    if (newNoteIdentifiers.indexOf(currentNotes.notes[i].start_time + "::" + currentNotes.notes[i].pitch + "::" + currentNotes.notes[i].probability) == -1)
      removedNoteIds.push(currentNotes.notes[i].note_id);
  }

  for (var i = 0; i < newNotes.length; i += 5) {
    if (currentNoteIdentifiers.indexOf(newNotes[i + 1] + "::" + newNotes[i] + "::" + newNotes[i + 4]) == -1) {
      addedNotes.push(newNotes[i]);
      addedNotes.push(newNotes[i + 1]);
      addedNotes.push(newNotes[i + 2]);
      addedNotes.push(newNotes[i + 3]);
      addedNotes.push(newNotes[i + 4]);
    }
  }

  removeClipNotes(trackIndex, clipIndex, removedNoteIds);
  addClipNotes(trackIndex, clipIndex, addedNotes);

  currentNotes = getClipNotes(trackIndex, clipIndex);
  return (currentNotes.notes.length == newNotes.length / 5) ? "Success" : "Failed";
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


function getClipNotes(trackIndex, clipIndex) {
  var path = "live_set tracks " + trackIndex + " clip_slots " + clipIndex + " clip";
  return JSON.parse(new LiveAPI(path).call("get_notes_extended", 0, 127, 0.0, 33.0));
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
