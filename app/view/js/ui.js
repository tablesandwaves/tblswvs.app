window.stepSequencer.toggleStep((event, step, state) => {
  if (state == 0)
    document.getElementById(`step-${step}`).classList.remove("on");
  else
    document.getElementById(`step-${step}`).classList.add("on");
});


const ready = () => {
  document.querySelectorAll("div.rhythm div").forEach(step => {
    step.addEventListener("click", toggleStep);
  });
}


document.addEventListener("DOMContentLoaded", ready);
