let previousStep = 15;
let previousPianoRollStep = 63;
let pianoRollWidth = 1280;
let pianoRollLeftMargin = 48;

let pageDocumentation: any = {};
let activeDocumentationPage: any = {};
let gridMatrix: any[] = new Array(8);
let noteData: any[];

const RAMP_SEQ_HEIGHT     = 80;
const RAMP_SEQ_STEP_WIDTH = 50;


window.documentation.pageDocumentation((event: any, page: any) => {
  pageDocumentation[page.name] = page;
  if (page.name == "Rhythm") {
    loadPageDocumentation(document.querySelector("#documentation #page-list li"));
  }
  if (page.name == "Main Navigation") {
    gridMatrix[7] = new Array();
    loadButtonRows(pageDocumentation[page.name].rows);
  }
});


window.documentation.setNoteData((event: any, _noteData: any[]) => noteData = _noteData);


window.stepSequencer.transport((event: any, currentStep: number, currentPianoRollStep: number) => updateTransport(currentStep, currentPianoRollStep));


window.parameters.activateTrackNav((event: any, trackName: string) => {
  document.querySelectorAll(".nav li").forEach(elem => {
    if (elem.textContent == trackName)
      elem.classList.add("selected");
    else
      elem.classList.remove("selected");
  });
});


window.parameters.updateScale((event: any, name: string) => updateText("#current-scale span", name));
window.parameters.updateQueuedMelody((event: any, melody: string) => updateText("#melody p span", melody));
window.parameters.updateQueuedProgression((event: any, progression: string) => updateText("#chord-progression p span", progression));
window.parameters.updateTrackNotes((event: any, type: string, notes: string) => {
  updateText("#note-type", type);
  updateText("#input-notes", notes);
});
window.parameters.updateNoteLength((event: any, noteLength: string) => updateText("#rhythm-params #note-length span", noteLength));
window.parameters.updatePulseRate((event: any, pulse: string) => updateText("#rhythm-params #pulse span", pulse));
window.parameters.updateFillsDuration((event: any, fillsDuration: string) => updateText("#rhythm-params #fills-duration span", fillsDuration));
window.parameters.updateFillMeasures((event: any, fillMeasures: string) => updateText("#rhythm-params #fill-measures span", fillMeasures));
window.parameters.updateSuperMeasure((event: any, superMeasure: string) => updatePianoRollTransport(parseInt(superMeasure) * 16));
window.parameters.toggleCreateClip((event: any, state: boolean) => toggleIndicator("#create-clip span", state));
window.parameters.updateActiveClip((event: any, clipIndex: string) => updateText("div#current-clip span", clipIndex));


window.parameters.updateMutations((event: any, mutations: string) => {
  document.querySelectorAll("#mutations ul li").forEach(mutation => {
    if (mutations.includes(mutation.textContent))
      mutation.classList.add("on");
    else
      mutation.classList.remove("on");
  });
});


window.parameters.updateTrackChains((event: any, chains: any[], activeChainIndex: number) => {
  const chainList = document.querySelector("#chains ol");
  chainList.querySelectorAll("li").forEach(item => item.remove());

  chains.forEach((chain, i) => {
    const item = document.createElement("li");
    if (i == activeChainIndex) item.classList.add("on");
    item.textContent = chain.name;
    chainList.appendChild(item);
  });
});


window.parameters.updateTrackEvolution((event: any, randomizingTracks: number[], mutatingTracks: number[], soloingTracks: number[]) => {
  toggleEvolutionIndicator("randomizing", randomizingTracks);
  toggleEvolutionIndicator("mutating", mutatingTracks);
  toggleEvolutionIndicator("soloing", soloingTracks);
});


const toggleEvolutionIndicator = (evolutionType: string, trackIndices: number[]) => {
  document.querySelectorAll(`#${evolutionType}-tracks ol li`).forEach((trackItem, i) => {
    if (trackIndices.includes(i))
      trackItem.classList.add("on");
    else
      trackItem.classList.remove("on");
  });
}


window.parameters.updateMelodyVector((event: any, vector: number[], activeLength: number, active: boolean) => {
  document.querySelectorAll(".vector-step").forEach((vectorStep, i) => {
    if (i < activeLength)
      vectorStep.classList.add("active");
    else
      vectorStep.classList.remove("active");

    vectorStep.querySelector("span:first-child").className = `shift${vector[i]}`;
    vectorStep.querySelector("span:last-child").textContent = `${vector[i]}`;
  });

  document.querySelector("#melodic-vector-active span").className = active ? "on" : "";
});


const updateText = (selector: string, text: string) => {
  document.querySelector(selector).textContent = text
}

const toggleIndicator = (selector: string, state: boolean) => {
  if (state)
    document.querySelector(selector).classList.add("on");
  else
    document.querySelector(selector).classList.remove("on");
}


window.parameters.setRhythmDisplay((event: any, rhythm: any[], stepLength: number, rhythmAlgorithm: string, relatedTrackName: string, rhythmSectionRhythm: (0|1)[], harmonicSectionRhythm: (0|1)[]) => {
  rhythm.forEach((step, i: number) => {
    if (i < stepLength)
      document.querySelector(`#sequencer-steps .step-${i}`).classList.remove("active");
    else
      document.querySelector(`#sequencer-steps .step-${i}`).classList.add("active");

    if (step.state == 0) {
      document.querySelector(`#sequencer-steps .step-${i}`).classList.remove("on");
      document.querySelector(`#sequencer-steps .step-${i} span:last-child`).className = "prob000";
      document.querySelector(`#sequencer-fills .step-${i} span`).textContent = "";
    } else {
      document.querySelector(`#sequencer-steps .step-${i}`).classList.add("on");
      document.querySelector(`#sequencer-steps .step-${i} span`).className = "prob" + `${Math.floor(step.probability * 100)}`.padStart(3, "0");
      document.querySelector(`#sequencer-fills .step-${i} span`).textContent = step.fillRepeats == 0 ? "" : step.fillRepeats;
    }
  });

  displayRhythmCircle(rhythm.slice(0, stepLength).map(step => step.state), "track-rhythm-circle");
  displayRhythmCircle(rhythmSectionRhythm, "full-rhythm-circle");
  displayRhythmCircle(harmonicSectionRhythm, "harmonic-rhythm-circle");

  let algorithm = rhythmAlgorithm;
  if (relatedTrackName) algorithm += "/" + relatedTrackName;
  document.querySelector("#rhythm-params #algorithm span").textContent = algorithm;
});


window.parameters.updateRampSequence((event: any, rampSequence: number[], superMeasureLength: number) => {
  const rampSequenceWrapper = document.getElementById("ramp-sequence");
  const currentCanvas = document.getElementById("rampseq");
  if (currentCanvas != undefined) rampSequenceWrapper.removeChild(currentCanvas);

  const canvasWidth  = 1280;
  const canvasHeight = 80;

  const newCanvas = document.createElement("canvas");
  newCanvas.setAttribute("id", "rampseq");
  newCanvas.setAttribute("width", "" + canvasWidth);
  newCanvas.setAttribute("height", "" + canvasHeight);
  rampSequenceWrapper.appendChild(newCanvas);

  const ctx = newCanvas.getContext("2d");
  ctx.strokeStyle = "#117733";

  let measureWidth       = canvasWidth / superMeasureLength;
  let rampSeqStepWidth   = measureWidth / 16;

  for (let currentMeasure = 0; currentMeasure < superMeasureLength; currentMeasure++) {
    let segmentStartX = currentMeasure * measureWidth;

    for (let i = 0; i < rampSequence.length; i += 4) {
      const segmentStepLength = rampSequence[i];
      const subdivStepLength  = rampSequence[i + 1];
      const segmentStartY     = canvasHeight - (rampSequence[i + 2] * canvasHeight);
      const segmentEndY       = canvasHeight - (rampSequence[i + 3] * canvasHeight);
      const segmentLength     = segmentStepLength * rampSeqStepWidth;
      const subdivLength      = subdivStepLength  * rampSeqStepWidth;
      const numSegments       = segmentStepLength / subdivStepLength;

      for (let j = 0; j < numSegments; j++) {
        let rampStartX = (subdivLength * j) + segmentStartX;
        let rampEndX   = (subdivLength * j) + subdivLength + segmentStartX;
        let rampStartY = segmentStartY;
        let rampEndY   = segmentEndY;

        if (currentMeasure > 0 && j == 0) {
          ctx.lineTo(rampStartX, rampStartY);
        }

        if (i != 0 && j == 0) {
          ctx.lineTo(rampStartX, rampStartY);
        }

        const percentFit = (segmentLength - rampStartX + segmentStartX) / subdivLength;
        if (percentFit < 1) {
          rampEndX = segmentLength + segmentStartX;
          if (segmentStartY > segmentEndY) {
            rampEndY = segmentStartY - ((segmentStartY - segmentEndY) * percentFit);
          } else {
            rampEndY = segmentStartY + ((segmentEndY - segmentStartY) * percentFit);
          }
        }

        ctx.moveTo(rampStartX, rampStartY);
        ctx.lineTo(rampEndX, rampEndY);
        if (percentFit >= 1 && rampEndX != segmentStartX + segmentLength) {
          ctx.lineTo(rampEndX, segmentStartY);
        }
      }

      segmentStartX += segmentLength;
    }
  }

  ctx.stroke();
});


window.parameters.setDrumRackNotes((event: any, notes: number[][], pads: string[], superMeasureLength: number) => {
  const lowPadMidiNote = 36;
  const noteSpan = [...new Array(pads.length)].map((_, i) => i + lowPadMidiNote);
  const canvasWidth = 1312;
  const canvasHeight = 300;

  const pianoRollWrapper = document.getElementById("piano-roll");
  const currentCanvas = document.getElementById("pianoroll");
  if (currentCanvas != undefined) pianoRollWrapper.removeChild(currentCanvas);

  const newCanvas = document.createElement("canvas");
  newCanvas.setAttribute("id", "pianoroll");
  newCanvas.setAttribute("width", "" + canvasWidth);
  newCanvas.setAttribute("height", "" + canvasHeight);
  pianoRollWrapper.appendChild(newCanvas);

  const context = newCanvas.getContext("2d");

  const pianoRollMargin = {top: 0, right: 0, bottom: 0, left: 64};
  pianoRollWidth        = canvasWidth - pianoRollMargin.left;
  pianoRollLeftMargin   = 1344 - pianoRollWidth - 16;
  const keyHeight       = canvasHeight / noteSpan.length;

  context.font = "12px sans-serif";
  context.fillStyle = "#cccccc";
  pads.reverse().forEach((padLabel, i) => {
    const xPos = 0;
    const yPos = (i * keyHeight) + keyHeight - ((keyHeight - 12) / 2);
    context.fillText(padLabel, xPos, yPos);
  });

  context.strokeStyle = "#ffffff";
  context.lineWidth = 0.25;

  noteSpan.reverse().forEach((midiNoteNumber, i) => {
    context.fillStyle = i % 2 == 0 ? "#222" : "#111";
    context.fillRect(pianoRollMargin.left, i * keyHeight, pianoRollWidth, keyHeight);

    context.beginPath();
    context.moveTo(pianoRollMargin.left, (i * keyHeight) + keyHeight);
    context.lineTo(pianoRollMargin.left + pianoRollWidth, (i * keyHeight) + keyHeight);
    context.stroke();
  });

  let stepWidth = pianoRollWidth / (superMeasureLength * 16);
  for (let i = 0; i <= superMeasureLength * 16; i++) {
    const xPos = (i * stepWidth) + pianoRollMargin.left;

    context.beginPath();
    context.strokeStyle = "#ffffff";
    context.lineWidth   = i % 16 == 0 ? 1 : i % 4 == 0 ? 0.5 : 0.25;

    context.moveTo(xPos, 0);
    context.lineTo(xPos, canvasHeight);
    context.stroke();
  }

  notes.forEach(note => {
    const xPos = ((note[1] / 0.25) * stepWidth) + pianoRollMargin.left;
    const yPos = (lowPadMidiNote + pads.length - 1 - note[0]) * keyHeight;
    const dur  = (note[2] / 0.25) * stepWidth;
    context.fillStyle = "#117733";
    context.fillRect(xPos, yPos, dur, keyHeight);
    context.strokeStyle = "#5be88a";

    context.beginPath();
    context.moveTo(xPos + dur, yPos);
    context.lineTo(xPos + dur, yPos + keyHeight);
    context.stroke();
  });

  updatePianoRollTransport(superMeasureLength * 16);
});


window.parameters.setPianoRollNotes((event: any, notes: number[][], midiTonic: number, superMeasureLength: number, rhythmStepLength: number) => {
  let low: number, high: number;
  if (notes.length == 0) {
    low  = 60;
    high = 72;
  } else {
    const sortedNotes = notes.sort((a,b) => {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });
    low  = sortedNotes.at(0).at(0);
    high = sortedNotes.at(-1).at(0);
    if (high < low + 12) high = low + 12;
  }

  const noteSpan     = [...new Array(high - low + 1)].map((_, i) => i + low);
  const canvasWidth  = 1312;
  const canvasHeight = 300;

  const pianoRollWrapper = document.getElementById("piano-roll");
  const currentCanvas = document.getElementById("pianoroll");
  if (currentCanvas != undefined) pianoRollWrapper.removeChild(currentCanvas);

  const newCanvas = document.createElement("canvas");
  newCanvas.setAttribute("id", "pianoroll");
  newCanvas.setAttribute("width", "" + canvasWidth);
  newCanvas.setAttribute("height", "" + canvasHeight);
  pianoRollWrapper.appendChild(newCanvas);

  const ctx = newCanvas.getContext("2d");

  const pianoRollMargin = {top: 0, right: 0, bottom: 0, left: 32};
  pianoRollWidth        = canvasWidth - pianoRollMargin.left;
  pianoRollLeftMargin   = 1344 - pianoRollWidth - 16;
  const keyHeight       = canvasHeight / noteSpan.length;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.25;

  noteSpan.reverse().forEach((midiNoteNumber, i) => {
    ctx.fillStyle = noteData[midiNoteNumber].note.at(-1) == "#" ? "#111" : "#333";
    ctx.fillRect(pianoRollMargin.left, i * keyHeight, pianoRollWidth, keyHeight);

    ctx.beginPath();
    ctx.moveTo(pianoRollMargin.left, (i * keyHeight) + keyHeight);
    ctx.lineTo(pianoRollMargin.left + pianoRollWidth, (i * keyHeight) + keyHeight);
    ctx.stroke();
  });

  let stepWidth = pianoRollWidth / (superMeasureLength * 16);
  for (let i = 0; i <= superMeasureLength * 16; i++) {
    const xPos = (i * stepWidth) + pianoRollMargin.left;

    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = i % rhythmStepLength == 0 ? 1 : i % 4 == 0 ? 0.5 : 0.25;

    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, canvasHeight);
    ctx.stroke();
  }

  notes.forEach(note => {
    const xPos = ((note[1] / 0.25) * stepWidth) + pianoRollMargin.left;
    const yPos = (high - note[0]) * keyHeight;
    const dur  = (note[2] / 0.25) * stepWidth;
    ctx.fillStyle = "#117733";
    ctx.fillRect(xPos, yPos, dur, keyHeight);
    ctx.strokeStyle = "#5be88a";

    ctx.beginPath();
    ctx.moveTo(xPos + dur, yPos);
    ctx.lineTo(xPos + dur, yPos + keyHeight);
    ctx.stroke();
  });

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#cccccc";
  ctx.fillText(noteData[low].note + noteData[low].octave, 0, canvasHeight - 2);
  ctx.fillText(noteData[high].note + noteData[high].octave, 0, 12);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.25;
  noteSpan.slice(1, -1).forEach((note, i) => {
    if (note % 12 == midiTonic % 12) {
      const xPos = 0;
      // * 2 because of slice. Above the first and last are already added.
      const yPos = (i * keyHeight) + (keyHeight * 2);
      ctx.beginPath();
      ctx.moveTo(xPos, yPos);
      ctx.lineTo(pianoRollMargin.left, yPos);
      ctx.stroke();

      ctx.fillText(noteData[note].note + noteData[note].octave, 0, yPos);
    }
  });

  updatePianoRollTransport(superMeasureLength * 16);
});


const updateTransport = (currentStep: number, currentPianoRollStep: number) => {
  // document.querySelector(`#sequencer-steps .step-${previousStep}`).classList.remove("current");
  // document.querySelector(`#sequencer-steps .step-${currentStep}`).classList.add("current");
  // previousStep = currentStep;

  if (document.querySelector(`#pianoroll-transport #pianoroll-step-${previousPianoRollStep}`))
    document.querySelector(`#pianoroll-transport #pianoroll-step-${previousPianoRollStep}`).classList.remove("current");
  if (document.querySelector(`#pianoroll-transport #pianoroll-step-${currentPianoRollStep}`))
    document.querySelector(`#pianoroll-transport #pianoroll-step-${currentPianoRollStep}`).classList.add("current");
  previousPianoRollStep = currentPianoRollStep;
}


const toggleDocumentation = () => {
  const showingDocs = document.getElementById("documentation").style.display == "block";
  if (showingDocs) {
    document.getElementById("app").style.display = "block";
    document.getElementById("documentation").style.display = "none";
    document.getElementById("docs").classList.remove("active");
  } else {
    document.getElementById("app").style.display = "none";
    document.getElementById("documentation").style.display = "block";
    document.getElementById("docs").classList.add("active");
  }
}


const loadPageDocumentation = (page: Element) => {
  document.querySelectorAll("#page-list li").forEach(p => {
    if (p.textContent == page.textContent)
      p.classList.add("active");
    else
      p.classList.remove("active");
  });
  document.getElementById("page-overview").textContent = pageDocumentation[page.textContent].description;

  clearGridButtons();
  resetRelatedButtons();
  clearOnButton();
  document.querySelector("#button-details").textContent = "";

  for (let row = 0; row < 7; row++) {
    gridMatrix[row] = new Array();
  }

  loadButtonMatrices(pageDocumentation[page.textContent].matrices);
  loadButtonRows(pageDocumentation[page.textContent].rows);
}


const loadButtonMatrices = (matrices: any[]) => {
  if (matrices == undefined) return;

  matrices.forEach((matrix: any) => {
    for (let y = matrix.rowStart; y <= matrix.rowEnd; y++) {
      for (let x = matrix.columnStart; x <= matrix.columnEnd; x++) {

        let entry: any = gridMatrix[y][x] ? gridMatrix[y][x] : {};
        entry.name = matrix.name ? matrix.name : entry.name;
        entry.description = matrix.description ? matrix.description : entry.description;
        entry.type = matrix.type ? matrix.type : entry.type;
        entry.group = matrix.group ? matrix.group : entry.group;
        entry.value = matrix.value ? matrix.value : entry.value;
        entry.displayValue = matrix.displayValue ? matrix.displayValue : entry.displayValue;
        entry.shiftName = matrix.shiftName ? matrix.shiftName : entry.shiftName;
        entry.shiftDescription = matrix.shiftDescription ? matrix.shiftDescription : entry.shiftDescription;
        entry.shiftType = matrix.shiftType ? matrix.shiftType : entry.shiftType;
        entry.shiftGroup = matrix.shiftGroup ? matrix.shiftGroup : entry.shiftGroup;
        entry.shiftValue = matrix.shiftValue ? matrix.shiftValue : entry.shiftValue;
        entry.shiftDisplayValue = matrix.shiftDisplayValue ? matrix.shiftDisplayValue : entry.shiftDisplayValue;

        if (matrix.columnValues)          entry.value      = matrix.columnValues[y - matrix.rowStart];
        if (matrix.shiftColumnValues)     entry.shiftValue = matrix.shiftColumnValues[y - matrix.rowStart];
        if (matrix.columnDisplayValues)   entry.value      = matrix.columnDisplayValues[y - matrix.rowStart];
        if (matrix.rowValues)             entry.value      = matrix.rowValues[y - matrix.rowStart][x - matrix.columnStart];
        if (matrix.rowShiftValues)        entry.shiftValue = matrix.rowShiftValues[y - matrix.rowStart][x - matrix.columnStart];
        if (matrix.rowShiftDisplayValues) entry.shiftValue = matrix.rowShiftDisplayValues[y - matrix.rowStart][x - matrix.columnStart];

        gridMatrix[y][x] = entry;

        if (matrix.group)     document.getElementById(`grid-button-${x}-${y}`).classList.add(matrix.group);
        if (matrix.shiftGroup) document.getElementById(`grid-button-${x}-${y}`).classList.add(matrix.shiftGroup);
      }
    }
  });
}


const loadButtonRows = (rows: any[]) => {
  if (rows == undefined) return;

  rows.forEach((row: any) => {
    for (let x = row.xStart; x < row.xLength + row.xStart; x++) {

      let entry: any = gridMatrix[row.index][x] ? gridMatrix[row.index][x] : {};
      entry.name = row.name ? row.name : entry.name;
      entry.description = row.description ? row.description : entry.description;
      entry.type = row.type ? row.type : entry.type;
      entry.group = row.group ? row.group : entry.group;
      entry.value = row.value ? row.value : entry.value;
      entry.displayValue = row.displayValue ? row.displayValue : entry.displayValue;
      entry.shiftName = row.shiftName ? row.shiftName : entry.shiftName;
      entry.shiftDescription = row.shiftDescription ? row.shiftDescription : entry.shiftDescription;
      entry.shiftType = row.shiftType ? row.shiftType : entry.shiftType;
      entry.shiftGroup = row.shiftGroup ? row.shiftGroup : entry.shiftGroup;
      entry.shiftValue = row.shiftValue ? row.shiftValue : entry.shiftValue;
      entry.shiftDisplayValue = row.shiftDisplayValue ? row.shiftDisplayValue : entry.shiftDisplayValue;

      if (row.values)             entry.value = row.values[x - row.xStart];
      if (row.displayValues)      entry.value = row.displayValues[x - row.xStart];
      if (row.shiftValues)        entry.shiftValue = row.shiftValues[x - row.xStart];
      if (row.shiftDisplayValues) entry.shiftValue = row.shiftDisplayValues[x - row.xStart];

      gridMatrix[row.index][x] = entry;

      if (row.group)      document.getElementById(`grid-button-${x}-${row.index}`).classList.add(row.group);
      if (row.shiftGroup) document.getElementById(`grid-button-${x}-${row.index}`).classList.add(row.shiftGroup);
    }
  });
}


const setupGridMatrix = () => {
  const grid = document.querySelector("#grid");
  for (let y = 0; y < 8; y++) {
    const row = document.createElement("div");
    row.classList.add("row");
    row.setAttribute("id", `grid-row-${y}`);
    grid.appendChild(row);
    for (let x = 0; x < 16; x++) {
      const button = document.createElement("div");
      button.classList.add("button");
      button.setAttribute("id", `grid-button-${x}-${y}`);
      button.addEventListener("click", () => displayFunction(x, y));
      row.appendChild(button);
    }
  }
}


const displayFunction = (x: number, y: number) => {

  // Clear the previous button if any, then set this button to "on"
  clearOnButton();
  document.querySelector(`#grid-button-${x}-${y}`).classList.add("on");
  resetRelatedButtons();

  const buttonDetails = document.querySelector("#button-details");

  if (gridMatrix[y][x]) {
    buttonDetails.textContent = "";

    let name  = gridMatrix[y][x].name;
    let value = gridMatrix[y][x].value ? gridMatrix[y][x].value : "";
    addButtonDetail(buttonDetails, value != "" ? `${name}: ${value}` : name);
    addButtonDetail(buttonDetails, gridMatrix[y][x].description);
    addButtonDetail(buttonDetails, `Type: ${gridMatrix[y][x].type}`);

    if (gridMatrix[y][x].shiftName) {
      addButtonDetail(buttonDetails, "When Shift Key is On")
      let name  = gridMatrix[y][x].shiftName;
      let value = gridMatrix[y][x].shiftValue ? gridMatrix[y][x].shiftValue : "";
      addButtonDetail(buttonDetails, value != "" ? `${name}: ${value}` : name);
      addButtonDetail(buttonDetails, gridMatrix[y][x].shiftDescription);
      addButtonDetail(buttonDetails, gridMatrix[y][x].shiftType);
    }

    if (gridMatrix[y][x].group) {
      document.querySelectorAll(`.${gridMatrix[y][x].group}`).forEach(elem => elem.classList.add("related-group"));
    }
    if (gridMatrix[y][x].shiftGroup) {
      document.querySelectorAll(`.${gridMatrix[y][x].shiftGroup}`).forEach(elem => elem.classList.add("related-sub-group"));
    }
  } else {
    buttonDetails.textContent = "Undefined";
  }
}


const addButtonDetail = (buttonDetails: Element, textContent: string) => {
  if (textContent && textContent != "") {
    const paragraph = document.createElement("p");
    paragraph.textContent = textContent;
    buttonDetails.append(paragraph);
  }
}


const clearOnButton = () => {
  const activeButton = document.querySelector("#grid .on");
  if (activeButton) activeButton.classList.remove("on");
}


const clearGridButtons = () => {
  // Clear only the related groups for rows 1-7, the main navigation row 8 (index 7) is stable.
  for (let y = 0; y < 7; y++) {
    document.querySelectorAll(`grid-row-${y} .button`).forEach(elem => elem.className = "button");
  }
}


const resetRelatedButtons = () => {
  document.querySelectorAll(`.button`).forEach(elem => {
    elem.classList.remove("related-group");
    elem.classList.remove("related-sub-group");
  });
}


const updatePianoRollTransport = (numSteps: number) => {
  const pianoRollTransport = <HTMLDivElement> document.querySelector("div#pianoroll-transport");
  pianoRollTransport.style.width = pianoRollWidth + "px";
  pianoRollTransport.style.marginLeft = pianoRollLeftMargin + "px";
  document.querySelectorAll("#pianoroll-transport .step").forEach(e => pianoRollTransport.removeChild(e));
  for (let i = 0; i < numSteps; i++) {
    const step = document.createElement("div");
    step.classList.add("step");
    step.setAttribute("id", `pianoroll-step-${i}`);
    step.style.width = (pianoRollWidth / numSteps) + "px";
    pianoRollTransport.appendChild(step);
  }
}


const displayRhythmCircle = (rhythm: (0|1)[] = [], circleId: string) => {
  let highlightColor = "#555";
  switch(circleId) {
    case "track-rhythm-circle":
      highlightColor = "#173";
      break;
    case "full-rhythm-circle":
      highlightColor = "#48c";
      break;
    case "harmonic-rhythm-circle":
      highlightColor = "#c7e";
      break;
  }

  const rhythmCircleWrapper = document.getElementById(circleId);
  const currentCanvas = rhythmCircleWrapper.querySelector("canvas");
  if (currentCanvas != undefined) rhythmCircleWrapper.removeChild(currentCanvas);

  const canvasWidth  = 120;
  const canvasHeight = 120;

  const newCanvas = document.createElement("canvas");
  newCanvas.setAttribute("width", "" + canvasWidth);
  newCanvas.setAttribute("height", "" + canvasHeight);
  rhythmCircleWrapper.appendChild(newCanvas);

  const context       = newCanvas.getContext("2d");
  const centerX       = 60;
  const centerY       = 60;
  const radius        = 55;
  const startAngle    = 0;
  const endAngle      = 2 * Math.PI;
  const gatePointSize = circleId == "track-rhythm-circle" ? 3 : 1;
  const font          = "bold 48px Helvetica";

  context.beginPath();
  context.strokeStyle = "#555";
  context.arc(centerX, centerY, radius, startAngle, endAngle);
  context.stroke();

  const singleStepAngle = 360 / rhythm.length;

  for (let i = 0; i < rhythm.length; i++) {
    const x = centerX + radius * Math.cos(((singleStepAngle * i) - 90) * Math.PI/180);
    const y = centerY + radius * Math.sin(((singleStepAngle * i) - 90) * Math.PI/180);

    context.beginPath();
    context.fillStyle = rhythm[i] == 1 ? highlightColor : "#555";
    context.arc(x, y, gatePointSize, 0, 2 * Math.PI);
    context.fill();
  }

  context.strokeStyle = highlightColor;

  const onGates = rhythm.reduce((onGates, step, i) => {
    if (step == 1) onGates.push(i);
    return onGates;
  }, new Array());

  if (onGates.length > 0) {
    // Generate the rhythmic circle's rim
    const firstGateX = centerX + radius * Math.cos(((singleStepAngle * onGates[0]) - 90) * Math.PI/180);
    const firstGateY = centerY + radius * Math.sin(((singleStepAngle * onGates[0]) - 90) * Math.PI/180);
    context.moveTo(firstGateX, firstGateY);

    for (let i = 1; i <= onGates.length; i++) {
      const destGateX = centerX + radius * Math.cos(((singleStepAngle * onGates[i % onGates.length]) - 90) * Math.PI/180);
      const destGateY = centerY + radius * Math.sin(((singleStepAngle * onGates[i % onGates.length]) - 90) * Math.PI/180);
      context.lineTo(destGateX, destGateY);
    }

    // Generate the rhythmic circle's spokes
    for (let i = 0; i < onGates.length; i++) {
      context.moveTo(centerX, centerY);
      const destGateX = centerX + radius * Math.cos(((singleStepAngle * onGates[i]) - 90) * Math.PI/180);
      const destGateY = centerY + radius * Math.sin(((singleStepAngle * onGates[i]) - 90) * Math.PI/180);
      context.lineTo(destGateX, destGateY);
    }

    context.stroke();
  }

  context.font = font;
  context.textAlign = "center";
  context.fillStyle = "#777";
  context.fillText(rhythm.length + "", centerX, centerY + 16);
}


const ready = () => {
  displayRhythmCircle(new Array(16).fill(0), "track-rhythm-circle");
  displayRhythmCircle(new Array(16).fill(0), "full-rhythm-circle");
  displayRhythmCircle(new Array(16).fill(0), "harmonic-rhythm-circle");

  updatePianoRollTransport(64);
  setupGridMatrix();
  document.getElementById("docs").addEventListener("click", toggleDocumentation);
  document.querySelectorAll("#page-list li").forEach(page => page.addEventListener("click", () => loadPageDocumentation(page)));
}


document.addEventListener("DOMContentLoaded", ready);
