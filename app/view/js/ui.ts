window.stepSequencer.transport((event: any, rhythm: number[]) => setRhythmDisplay(rhythm));


window.parameters.activateTrack((event: any, track: any) => {
  document.querySelectorAll(".nav li").forEach(elem => {
    if (elem.textContent == track.name)
      elem.classList.add("selected");
    else
      elem.classList.remove("selected");
  });

  setRhythmDisplay(track.rhythm);
  const melody = track.algorithm + " " + track.inputMelody.map((n: any) => `${n.note}${n.octave}`).join(" ");
  updateText("#track-melody", melody);
});


window.parameters.updateScale((event: any, name: string) => updateText("#current-scale span", name));
window.parameters.updateQueuedMelody((event: any, melody: string) => updateText("#queued-melody span", melody));
window.parameters.updateTrackMelody((event: any, melody: string) => updateText("#track-melody", melody));
window.parameters.updateSuperMeasure((event: any, superMeasure: string) => updateText("#super-measure", superMeasure))


const updateText = (selector: string, text: string) => document.querySelector(selector).textContent = text;


const setRhythmDisplay = (rhythm: number[]) => {
  rhythm.forEach((step: number, i: number) => {
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
