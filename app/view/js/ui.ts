window.stepSequencer.activateTrack((event: any, name: string, rhythm: number[]) => {
  document.querySelectorAll(".nav li").forEach(elem => {
    if (elem.textContent == name)
      elem.classList.add("selected");
    else
      elem.classList.remove("selected");
  });

  rhythm.forEach((step, i) => {
    if (step == 0)
      document.getElementById(`step-${i}`).classList.remove("on");
    else
      document.getElementById(`step-${i}`).classList.add("on");

    if (step == 15)
      document.getElementById(`step-${i}`).classList.add("current");
    else
      document.getElementById(`step-${i}`).classList.remove("current");
  })
});


window.parameters.updateScale((event: any, name: string) => {
  document.querySelector("#current-scale span").textContent = name;
});


window.parameters.updateQueuedMelody((event: any, melody: string) => {
  document.querySelector("#queued-melody span").textContent = melody;
});


window.parameters.updateTrackMelody((event: any, melody: string) => {
  document.querySelector("#track-melody").textContent = melody;
});
