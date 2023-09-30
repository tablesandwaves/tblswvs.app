// var rampSequenceBuffer;
var buffers = new Array();


function init() {
  var track        = new LiveAPI("this_device canonical_parent");
  var trackName    = track.get("name");
  var trackIndex   = (parseInt(("" + trackName).split(" ")[0]) - 1);
  var receiverName = "rampseq_" + trackIndex;

  init_buffers(trackIndex);
  outlet(0, "receiver", receiverName);
}


function init_buffers(trackIndex) {
  for (var i = 0; i < 2; i++) {
    var bufferName   = "ramp_sequence_" + trackIndex + "_" + i;
    var buffer = new Buffer(bufferName);
    buffers[i] = buffer;

    outlet(0, "buffer_" + i, bufferName);
  }
}

function list() {
  var args      = arrayfromargs(arguments);
  var rampIndex = args.slice(0, 1);

  if (args[1] == "clear_macro") {

    if (rampIndex == 0)
      outlet(0, "unmap15", "bang");
    else
      outlet(0, "unmap16", "bang");

  } else if (args[1] == "map_macro") {

    map_macro(rampIndex);

  } else {
    var sequenceDivisions = args.slice(1);
    post(sequenceDivisions, "\n");

    var step = 0;
    for (var i = 0; i < sequenceDivisions.length; i += 4) {
      for (var rampStep = 0; rampStep < sequenceDivisions[i]; rampStep++, step++) {
        buffers[rampIndex].poke(1, step, sequenceDivisions[i] * 0.0625);
        buffers[rampIndex].poke(2, step, sequenceDivisions[i + 1] / sequenceDivisions[i]);
        buffers[rampIndex].poke(3, step, sequenceDivisions[i + 2]);
        buffers[rampIndex].poke(4, step, sequenceDivisions[i + 3]);
      }
    }
  }

  outlet(0, "bang");
}


function map_macro(rampIndex) {
  var param15, param16;
  var firstDevice = new LiveAPI("this_device canonical_parent devices 0");
  var parameters  = firstDevice.get("parameters");

  for (var i = 0; i < parameters.length; i += 2) {
    var param = new LiveAPI("id " + firstDevice.get("parameters")[i+1]);

    if (rampIndex == 0 && param.get("original_name") == "Macro 15") {
      param15 = parseInt(param.id);
    } else if (rampIndex == 1 && param.get("original_name") == "Macro 16") {
      param16 = parseInt(param.id);
    }
  }

  if (param15 != undefined) outlet(0, "param15", param15);
  if (param16 != undefined) outlet(0, "param16", param16);
}
