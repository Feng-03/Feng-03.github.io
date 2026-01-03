let selectedYear = null;
let selectedMonth = null;
let selectedDay = null;

let yearEntries = {};

const yearButtons = document.getElementById("year-buttons");
const monthButtons = document.getElementById("month-buttons");
const dayButtons = document.getElementById("day-buttons");

const popupDate = document.getElementById("popup-date");
const popupContent = document.getElementById("popup-content");

/* ------- New Post Button ------ */

document.getElementById("new-post").addEventListener("click", () => {
  newPopup();
});

function newPopup() {
  const values = Object.values(blogData);
  const lastValue = values[values.length - 1];
  
  const entries = Object.entries(blogData); 
  const lastEntry = entries[entries.length - 1];
  const lastKey = lastEntry[0];

  popupDate.textContent = lastKey;
  popupContent.textContent = lastValue;
  document.getElementById("popup").style.display = "block";
  document.getElementById("overlay").style.display = "block";
  document.getElementById("thank-you").innerHTML = "<h3>Thanks for your time reading — Feng<h3>";
}

/* ---------- YEAR ---------- */

document.querySelectorAll("[data-year]").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedYear = btn.dataset.year;

    yearEntries = Object.fromEntries(
      Object.entries(blogData).filter(([key]) =>
        key.startsWith(`${selectedYear}-`)
      )
    );

    yearButtons.classList.remove("active");
    monthButtons.classList.add("active");
  });
});

/* ---------- MONTH ---------- */

document.querySelectorAll("[data-month]").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedMonth = btn.dataset.month;

    updateDayButtons();

    monthButtons.classList.remove("active");
    dayButtons.classList.add("active");
  });
});

/* ---------- DAY ---------- */

document.querySelectorAll("[data-day]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;

    selectedDay = btn.dataset.day;
    showPopup();
  });
});

/* ---------- ENABLE / DISABLE DAYS ---------- */

function updateDayButtons() {
  const validDays = new Set();

  Object.keys(yearEntries).forEach(date => {
    const [, month, day] = date.split("-");
    if (month === selectedMonth) validDays.add(day);
  });

  document.querySelectorAll("[data-day]").forEach(btn => {
    btn.disabled = !validDays.has(btn.dataset.day);
    btn.style.opacity = btn.disabled ? "0.3" : "1";
  });
}

/* ---------- POPUP ---------- */

function showPopup() {
  const key = `${selectedYear}-${selectedMonth}-${selectedDay}`;

  popupDate.textContent = key;
  popupContent.textContent = blogData[key] || "No entry for this date.";

  document.getElementById("popup").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

/* ---------- GO BACK ---------- */

function goBack() {
  if (dayButtons.classList.contains("active")) {
    dayButtons.classList.remove("active");
    monthButtons.classList.add("active");
    return;
  }

  if (monthButtons.classList.contains("active")) {
    monthButtons.classList.remove("active");
    yearButtons.classList.add("active");
  }
}