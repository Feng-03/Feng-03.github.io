let selectedYear = null;
let selectedMonth = null;
let selectedDay = null;

const blogData = {
  "2025-1-1": "Test 1"
};

const popupDate = document.getElementById("popup-date");
const popupContent = document.getElementById("popup-content");

const yearButtons = document.getElementById("year-buttons");
const monthButtons = document.getElementById("month-buttons");
const dayButtons = document.getElementById("day-buttons");

// Handle years selection
document.querySelectorAll('[data-year]').forEach(button => {
  button.addEventListener('click', () => {
    selectedYear = button.getAttribute("data-year");
    toggleButtons(yearButtons, monthButtons);
  });
});

// Handle months selection
document.querySelectorAll('[data-month]').forEach(button => {
  button.addEventListener('click', () => {
    selectedMonth = button.getAttribute("data-month");
    toggleButtons(monthButtons, dayButtons);
  });
});

// Handle days selection
document.querySelectorAll('[data-day]').forEach(button => {
  button.addEventListener('click', () => {
    selectedDay = button.getAttribute("data-day");
    showPopup();
  });
});

function toggleButtons(currentGroup, nextGroup) {
  currentGroup.classList.remove("active");
  nextGroup.classList.add("active");
}

function showPopup() {
  const key = `${selectedYear}-${parseInt(selectedMonth)}-${parseInt(selectedDay)}`;
  const content = blogData[key] || "No entry for this date.";

  popupDate.textContent = `Date: ${selectedYear}-${selectedMonth}-${selectedDay}`;
  popupContent.textContent = content;
  document.getElementById("popup").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("overlay").style.display = "none";

  // Reset for another pick
  selectedYear = null;
  selectedMonth = null;
  selectedDay = null;

  // Reset button views
  yearButtons.classList.add("active");
  monthButtons.classList.remove("active");
  dayButtons.classList.remove("active");
}