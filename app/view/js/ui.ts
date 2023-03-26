let previousStep = 15;
let pageDocumentation: any = {};
let activeDocumentationPage: any = {};
let gridMatrix: any[];


window.documentation.pageDocumentation((event: any, page: any) => {
  pageDocumentation[page.name] = page;
  if (page.name == "Rhythm") {
    loadPageDocumentation(document.querySelector("#documentation #page-list li"));
  }
});


window.stepSequencer.transport((event: any, currentStep: number) => updateTransport(currentStep));
window.stepSequencer.transportBeat((event: any, beat: string) => updateText("#current-beat", beat));


window.parameters.activateTrack((event: any, track: any) => {
  document.querySelectorAll(".nav li").forEach(elem => {
    if (elem.textContent == track.name)
      elem.classList.add("selected");
    else
      elem.classList.remove("selected");
  });

  setRhythmDisplay(track);
  const melody = track.algorithm + " " + track.inputMelody.map((n: any) => `${n.note}${n.octave}`).join(" ");
  updateText("#track-notes p", melody);
  updateText("#note-length p span", track.noteLength);
});


window.parameters.updateScale((event: any, name: string) => updateText("#current-scale span", name));
window.parameters.updateQueuedMelody((event: any, melody: string) => updateText("#melody p span", melody));
window.parameters.updateQueuedProgression((event: any, progression: string) => updateText("#chord-progression p span", progression));
window.parameters.updateTrackNotes((event: any, notes: string) => updateText("#track-notes p", notes));
window.parameters.updateTrackRhythm((event: any, track: any) => setRhythmDisplay(track));
window.parameters.updateNoteLength((event: any, noteLength: string) => updateText("#note-length p span", noteLength));
window.parameters.updateSuperMeasure((event: any, superMeasure: string) => updateText("#super-measure", superMeasure));
window.parameters.toggleCreateClip((event: any, state: boolean) => toggleIndicator("#create-clip span", state));
window.parameters.updateMutations((event: any, trackNames: string, mutations: string) => {
  updateText("#mutating-tracks span", trackNames);
  updateText("#mutations span", mutations);
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


const setRhythmDisplay = (track: any) => {
  track.rhythm.forEach((step: any, i: number) => {
    if (i < track.beatLength)
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
}


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
  activeDocumentationPage = pageDocumentation[page.textContent];
  document.querySelectorAll("#page-list li").forEach(p => {
    if (p.textContent == page.textContent)
      p.classList.add("active");
    else
      p.classList.remove("active");
  });
  clearGridButtons();
  document.querySelector("#button-details").textContent = "";

  gridMatrix = new Array();
  for (let row = 0; row < 8; row++) {
    gridMatrix[row] = new Array();
  }

  pageDocumentation[page.textContent].rows.forEach((row: any) => {
    for (let x = row.xStart; x < row.xLength - row.xStart; x++) {
      let entry: any = { rowName: row.name, mapping: row.mapping, shiftMapping: row.shiftMapping, type: row.type };
      if (row.type == "radio") {
        entry.value = row.values[x - row.xStart];
        entry.group = row.group
      } else if (row.type == "vertical meter") {
        entry.value = row.value;
      }
      gridMatrix[row.index][x] = entry;
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
  clearGridButtons();
  document.querySelector(`#grid-button-${x}-${y}`).classList.add("on");
  document.querySelector("#button-details").textContent = JSON.stringify(gridMatrix[y][x]);
}


const clearGridButtons = () => {
  document.querySelectorAll("#grid .button").forEach(button => button.classList.remove("on"))
}


const ready = () => {
  setupGridMatrix();
  document.getElementById("docs").addEventListener("click", toggleDocumentation);
  document.querySelectorAll("#page-list li").forEach(page => page.addEventListener("click", () => loadPageDocumentation(page)));
}


document.addEventListener("DOMContentLoaded", ready);
