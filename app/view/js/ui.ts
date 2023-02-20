window.stepSequencer.transport((event: any, rhythm: number[]) => setRhythmDisplay(rhythm));


window.parameters.activateTrack((event: any, track: any) => {
  document.querySelectorAll(".nav li").forEach(elem => {
    if (elem.textContent == track.name)
      elem.classList.add("selected");
    else
      elem.classList.remove("selected");
  });

  setRhythmDisplay(track.rhythm);
  setTrackMelody(track.algorithm + " " + track.inputMelody.map((n: any) => `${n.note}${n.octave}`).join(" "))
});


window.parameters.updateScale((event: any, name: string) => {
  document.querySelector("#current-scale span").textContent = name;
});


window.parameters.updateQueuedMelody((event: any, melody: string) => {
  document.querySelector("#queued-melody span").textContent = melody;
});


window.parameters.updateTrackMelody((event: any, melody: string) => setTrackMelody(melody));


const setTrackMelody = (melody: string) => document.querySelector("#track-melody").textContent = melody;


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
