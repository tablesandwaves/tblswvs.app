let previousStep = 15;
let pageDocumentation: any = {};
let activeDocumentationPage: any = {};
let gridMatrix: any[] = new Array(8);


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


window.stepSequencer.transport((event: any, currentStep: number) => updateTransport(currentStep));
window.stepSequencer.transportBeat((event: any, beat: string) => updateText("#current-beat", beat));


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
window.parameters.updateNoteLength((event: any, noteLength: string) => updateText("#note-length span.notes", noteLength));
window.parameters.updateFillsDuration((event: any, fillsDuration: string) => updateText("#note-length span.fills", fillsDuration));
window.parameters.updateFillMeasures((event: any, fillMeasures: string) => updateText("#note-length span.fill-measures", fillMeasures));
window.parameters.updateSuperMeasure((event: any, superMeasure: string) => updateText("#super-measure", superMeasure));
window.parameters.toggleCreateClip((event: any, state: boolean) => toggleIndicator("#create-clip span", state));
window.parameters.toggleMelodyRandomizer((event: any, state: boolean) => toggleIndicator("#randomizer-active span", state));
window.parameters.updateActiveClip((event: any, clipIndex: string) => updateText("p#current-clip span", clipIndex));
window.parameters.updateMutations((event: any, trackNames: string, mutations: string) => {
  updateText("#mutating-tracks span", trackNames);
  updateText("#mutations span", mutations);
});


window.parameters.updateTrackChains((event: any, chains: any[]) => {
  const chainList = document.querySelector("#chains ol");
  chainList.querySelectorAll("li").forEach(item => item.remove());

  chains.forEach(chain => {
    const item = document.createElement("li");
    if (chain.active) item.classList.add("on");
    item.textContent = chain.name;
    chainList.appendChild(item);
  });
});


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


window.parameters.setRhythmDisplay((event: any, rhythm: any[], beatLength: number) => {
  rhythm.forEach((step, i: number) => {
    if (i < beatLength)
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
});


const updateTransport = (currentStep: number) => {
  document.querySelector(`#sequencer-steps .step-${previousStep}`).classList.remove("current");
  document.querySelector(`#sequencer-steps .step-${currentStep}`).classList.add("current");
  previousStep = currentStep;
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


const ready = () => {
  setupGridMatrix();
  document.getElementById("docs").addEventListener("click", toggleDocumentation);
  document.querySelectorAll("#page-list li").forEach(page => page.addEventListener("click", () => loadPageDocumentation(page)));
}


document.addEventListener("DOMContentLoaded", ready);
