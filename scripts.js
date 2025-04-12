function barsClicked(x) {
  x.classList.toggle("change");
  document.getElementById("darken").classList.toggle("vertical");
  document.querySelector(".navbar").classList.toggle("vertical");
  for (let element of document.querySelectorAll("nav a")) {
    element.classList.toggle("vertical");
  }
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 790) {
    notVertical();
  }
})

document.addEventListener("click", event => {
  if (!document.querySelector(".navbar").contains(event.target)) {
    notVertical();
  }
});

function notVertical() {
  for (let verticalStuff of document.querySelectorAll(".vertical")) {
    verticalStuff.classList.remove("vertical");
  }
  let stuff = document.querySelector(".change");
  if (stuff !== null) {
    stuff.classList.remove("change");
  }
}

function popUp() {
  alert("Stay tune, account yet to come!");
}
function blogTime(){
  alert("Isn't that time of the year yet");
}
