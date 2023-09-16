var rampSequenceBufferName = "ramp_sequence";
var rampSequenceBuffer;


function init(uniq_patch_id) {
  init_buffer(uniq_patch_id);
  init_receiver();
}


function init_buffer(uniq_patch_id) {
	rampSequenceBuffer = new Buffer(uniq_patch_id + "_" + rampSequenceBufferName);
}


function init_receiver() {
  var trackName = new LiveAPI("this_device canonical_parent").get("name");
  outlet(0, "receiver", "rampseq_" + (parseInt(("" + trackName).split(" ")[0]) - 1));
}


function list()
{
  var sequenceDivisions = arrayfromargs(arguments);

  var step = 0;
  for (var i = 0; i < sequenceDivisions.length; i += 4) {
    for (var rampStep = 0; rampStep < sequenceDivisions[i]; rampStep++, step++) {
      rampSequenceBuffer.poke(1, step, sequenceDivisions[i] * 0.0625);
      rampSequenceBuffer.poke(2, step, sequenceDivisions[i + 1] / sequenceDivisions[i]);
	    rampSequenceBuffer.poke(3, step, sequenceDivisions[i + 2]);
	    rampSequenceBuffer.poke(4, step, sequenceDivisions[i + 3]);
    }
  }

  outlet(0, "bang");
}


function map_macros() {
  var param15, param16;

  var firstDevice = new LiveAPI("this_device canonical_parent devices 0");

  var parameters = firstDevice.get("parameters");
  for (var i = 0; i < parameters.length; i += 2) {
    var param = new LiveAPI("id " + firstDevice.get("parameters")[i+1]);
    if (param.get("original_name") == "Macro 15") {
      param15 = parseInt(param.id);
    } else if (param.get("original_name") == "Macro 16") {
      param16 = parseInt(param.id);
    }
  }

  if (param15 != undefined) outlet(0, "param15", param15);
  if (param16 != undefined) outlet(0, "param16", param16);
}
