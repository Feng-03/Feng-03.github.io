function barsClicked(x) {
  x.classList.toggle("change");
  document.getElementById("darken").classList.toggle("vertical");
  document.querySelector(".lists").classList.toggle("vertical");
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
  if (!document.querySelector(".lists").contains(event.target)) {
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
