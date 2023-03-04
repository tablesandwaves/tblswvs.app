window.stepSequencer.transport((event: any, rhythm: number[]) => setRhythmDisplay(rhythm));
window.stepSequencer.transportBeat((event: any, beat: string) => updateText("#current-beat", beat));


window.parameters.activateTrack((event: any, track: any) => {
  document.querySelectorAll(".nav li").forEach(elem => {
    if (elem.textContent == track.name)
      elem.classList.add("selected");
    else
      elem.classList.remove("selected");
  });

  setRhythmDisplay(track.rhythm);
  const melody = track.algorithm + " " + track.inputMelody.map((n: any) => `${n.note}${n.octave}`).join(" ");
  updateText("#track-melody p", melody);
  updateText("#note-length p span", track.noteLength);
});


window.parameters.updateScale((event: any, name: string) => updateText("#current-scale span", name));
window.parameters.updateQueuedMelody((event: any, melody: string) => updateText("#queued-melody span", melody));
window.parameters.updateTrackMelody((event: any, melody: string) => updateText("#track-melody p", melody));
window.parameters.updateNoteLength((event: any, noteLength: string) => updateText("#note-length p span", noteLength));
window.parameters.updateSuperMeasure((event: any, superMeasure: string) => updateText("#super-measure", superMeasure));
window.parameters.toggleCreateClip((event: any, state: boolean) => toggleIndicator("#create-clip span", state));


const updateText = (selector: string, text: string) => document.querySelector(selector).textContent = text;

const toggleIndicator = (selector: string, state: boolean) => {
  if (state)
    document.querySelector(selector).classList.add("on");
  else
    document.querySelector(selector).classList.remove("on");
}


const setRhythmDisplay = (rhythm: number[]) => {
  rhythm.forEach((step: number, i: number) => {
    if (step == null)
      document.getElementById(`step-${i}`).classList.remove("active");
    else
      document.getElementById(`step-${i}`).classList.add("active");

    if (step == 0)
      document.getElementById(`step-${i}`).classList.remove("on");
    else
      document.getElementById(`step-${i}`).classList.add("on");

    if (step == 15)
      document.getElementById(`step-${i}`).classList.add("current");
    else
      document.getElementById(`step-${i}`).classList.remove("current");
  });
}
