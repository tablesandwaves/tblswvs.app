const toggleStep = (e) => {
  e.currentTarget.classList.toggle("on");
  let x = 1, s = 2;
  window.sequencer.step(x, s);
}


const ready = () => {
  document.querySelectorAll("div.rhythm div").forEach(step => {
    step.addEventListener("click", toggleStep);
  });
}


document.addEventListener("DOMContentLoaded", ready);
