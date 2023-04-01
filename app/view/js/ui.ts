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
window.parameters.updateTrackNotes((event: any, notes: string) => updateText("#track-notes p", notes));
window.parameters.updateNoteLength((event: any, noteLength: string) => updateText("#note-length p span", noteLength));
window.parameters.updateSuperMeasure((event: any, superMeasure: string) => updateText("#super-measure", superMeasure));
window.parameters.toggleCreateClip((event: any, state: boolean) => toggleIndicator("#create-clip span", state));
window.parameters.updateMutations((event: any, trackNames: string, mutations: string) => {
  updateText("#mutating-tracks span", trackNames);
  updateText("#mutations span", mutations);
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

  document.querySelector("#melodic-vector p span").className = active ? "on" : "";
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


window.parameters.setRhythmDisplay((event: any, rhythm: number[], beatLength: number) => {
  rhythm.forEach((step: any, i: number) => {
    if (i < beatLength)
      document.getElementById(`step-${i}`).classList.remove("active");
    else
      document.getElementById(`step-${i}`).classList.add("active");

    if (step.state == 0) {
      document.getElementById(`step-${i}`).classList.remove("on");
      document.querySelector(`#step-${i} span:last-child`).className = "prob000";
    } else {
      document.getElementById(`step-${i}`).classList.add("on");
      document.querySelector(`#step-${i} span`).className = "prob" + `${Math.floor(step.probability * 100)}`.padStart(3, "0");
    }
  });
});


const updateTransport = (currentStep: number) => {
  document.getElementById(`step-${previousStep}`).classList.remove("current");
  document.getElementById(`step-${currentStep}`).classList.add("current");
  previousStep = currentStep;
}


const toggleDocumentation = () => {
  const showingDocs = document.getElementById("documentation").style.display == "block";
  if (showingDocs) {
    document.getElementById("main").style.display = "block";
    document.getElementById("documentation").style.display = "none";
    document.getElementById("docs").classList.remove("active");
  } else {
    document.getElementById("main").style.display = "none";
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

  loadButtonRows(pageDocumentation[page.textContent].rows);
  loadButtonMatrices(pageDocumentation[page.textContent].matrices);
}


const loadButtonMatrices = (matrices: any[]) => {
  if (matrices == undefined) return;

  matrices.forEach((matrix: any) => {
    for (let y = matrix.rowStart; y <= matrix.rowEnd; y++) {
      for (let x = matrix.columnStart; x <= matrix.columnEnd; x++) {
        let entry: any = {
          name: matrix.name,
          description: matrix.description,
          type: matrix.type,
          group: matrix.group,
          value: matrix.value,
          shiftValue: matrix.shiftValue,
          displayValue: matrix.displayValue
        };

        if (matrix.columnValues)      entry.value      = matrix.columnValues[y - matrix.rowStart];
        if (matrix.shiftColumnValues) entry.shiftValue = matrix.shiftColumnValues[y - matrix.rowStart];
        if (matrix.rowValues)         entry.value      = matrix.rowValues[y - matrix.rowStart][x - matrix.columnStart];

        gridMatrix[y][x] = entry;

        if (matrix.group)     document.getElementById(`grid-button-${x}-${y}`).classList.add(matrix.group);
        if (matrix.sub_group) document.getElementById(`grid-button-${x}-${y}`).classList.add(matrix.sub_group);
      }
    }
  });
}


const loadButtonRows = (rows: any[]) => {
  if (rows == undefined) return;

  rows.forEach((row: any) => {
    for (let x = row.xStart; x < row.xLength + row.xStart; x++) {
      let entry: any = {
        name: row.name,
        description: row.description,
        type: row.type,
        group: row.group,
        sub_group: row.sub_group,
        value: row.value,
        displayValue: row.displayValue,
        shiftValue: row.shiftValue,
        shiftDisplayValue: row.shiftDisplayValue
      };

      if (row.values)             entry.value = row.values[x - row.xStart];
      if (row.displayValues)      entry.value = row.displayValues[x - row.xStart];
      if (row.shiftValues)        entry.shiftValue = row.shiftValues[x - row.xStart];
      if (row.shiftDisplayValues) entry.shiftValue = row.shiftDisplayValues[x - row.xStart];

      gridMatrix[row.index][x] = entry;

      if (row.group)     document.getElementById(`grid-button-${x}-${row.index}`).classList.add(row.group);
      if (row.sub_group) document.getElementById(`grid-button-${x}-${row.index}`).classList.add(row.sub_group);
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

    let name   = gridMatrix[y][x].name;
    let value  = gridMatrix[y][x].value      ? gridMatrix[y][x].value              : "";
        value += gridMatrix[y][x].shiftValue ? ` / ${gridMatrix[y][x].shiftValue}` : "";

    addButtonDetail(buttonDetails, value != "" ? `${name}: ${value}` : name);
    addButtonDetail(buttonDetails, gridMatrix[y][x].description);
    addButtonDetail(buttonDetails, `Type: ${gridMatrix[y][x].type}`);

    if (gridMatrix[y][x].group) {
      document.querySelectorAll(`.${gridMatrix[y][x].group}`).forEach(elem => elem.classList.add("related-group"));
    }
    if (gridMatrix[y][x].sub_group) {
      document.querySelectorAll(`.${gridMatrix[y][x].sub_group}`).forEach(elem => elem.classList.add("related-sub-group"));
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
