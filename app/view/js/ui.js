window.stepSequencer.activateTrack((event, name, rhythm) => {
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
