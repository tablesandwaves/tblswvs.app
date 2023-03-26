let previousStep = 15;
let pageDocumentation: any = {};


window.documentation.pageDocumentation((event: any, page: any) => pageDocumentation[page.name] = page);


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


const displayDocumentation = (page: string) => {
  console.log(pageDocumentation[page]);
}


const ready = () => {
  document.getElementById("docs").addEventListener("click", toggleDocumentation);
  document.querySelectorAll("#page-list li").forEach(page => {
    page.addEventListener("click", () => displayDocumentation(page.textContent));
  });
}


document.addEventListener("DOMContentLoaded", ready);
