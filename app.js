// ===== Settings =====
const CATEGORIES = {
  expense: ["Food", "Gas", "Supplies", "Bills", "Fun", "Other"],
  income: ["Jobs", "Other income"],
};

// The name our data is saved under in the browser's localStorage
const STORAGE_KEY = "pocket-budget.entries";

// ===== State: the one list of entries. The screen is drawn from this. =====
// Each entry looks like:
// { id: "…", type: "expense", amountCents: 6420, category: "Gas", date: "2026-10-02", note: "Truck fill-up" }
let entries = loadEntries();

// ===== Saving and loading =====

// Read saved entries. If there's nothing saved yet (first visit), start with an empty list.
function loadEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    // Storage blocked (some private-browsing modes) or the saved text is damaged.
    // Start empty instead of crashing the whole app.
    console.error("Could not load saved entries:", error);
    return [];
  }
}

// Write all entries to storage. Called after every change.
function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Could not save entries:", error);
    alert("Couldn't save. Your browser may be blocking storage (private mode?).");
  }
}

// ===== Grab the page elements we need (once) =====
const form = document.getElementById("entry-form");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const dateInput = document.getElementById("date");
const noteInput = document.getElementById("note");
const list = document.getElementById("entries");
const emptyMessage = document.getElementById("empty");

// ===== Helpers =====

// Today's date as "YYYY-MM-DD" in YOUR time zone.
// (The built-in toISOString() uses UTC time, which in the evening in the US is already tomorrow.)
function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // getMonth() counts from 0
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// 6420 -> "$64.20"
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
function formatMoney(cents) {
  return money.format(cents / 100);
}

// "2026-10-02" -> "Oct 2"
function formatDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Which button is picked in the Expense/Income toggle?
function selectedType() {
  return form.elements.type.value; // "expense" or "income"
}

// Fill the Category dropdown with the right choices for Expense or Income
function fillCategories() {
  const options = CATEGORIES[selectedType()];
  categorySelect.innerHTML = "";
  for (const name of options) {
    categorySelect.add(new Option(name));
  }
  // Default to the last choice ("Other" / "Other income")
  categorySelect.value = options[options.length - 1];
}

// ===== Draw the list from `entries` =====
function render() {
  // Newest date first; for the same date, the most recently added first
  const sorted = [...entries].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );

  list.innerHTML = "";
  for (const entry of sorted) {
    list.append(createEntryItem(entry));
  }
  emptyMessage.hidden = entries.length > 0;
}

// Build one <li> for an entry (same structure as the design in Step 2)
function createEntryItem(entry) {
  const li = document.createElement("li");
  li.className = `entry ${entry.type}`;

  const sign = entry.type === "income" ? "+" : "−";
  li.innerHTML = `
    <span class="entry-badge" aria-hidden="true"></span>
    <div class="entry-main">
      <span class="entry-category"></span>
      <span class="entry-note"></span>
    </div>
    <div class="entry-side">
      <span class="entry-amount"></span>
      <span class="entry-date"></span>
    </div>`;

  // Fill in the text with textContent, never innerHTML, so a note like "<b>hi</b>"
  // shows up as plain text instead of being treated as code.
  li.querySelector(".entry-badge").textContent = entry.category[0];
  li.querySelector(".entry-category").textContent = entry.category;
  li.querySelector(".entry-note").textContent = entry.note;
  li.querySelector(".entry-amount").textContent = sign + formatMoney(entry.amountCents);
  li.querySelector(".entry-date").textContent = formatDate(entry.date);
  return li;
}

// ===== Events: things that happen when you interact =====

// Switching Expense/Income swaps the category choices
form.elements.type.forEach((radio) => radio.addEventListener("change", fillCategories));

// Tapping "Add"
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the browser's default: reloading the page

  const amountCents = Math.round(Number(amountInput.value) * 100);
  if (!(amountCents > 0)) return; // the "required" + "min" rules on the input already block this; just a safety net

  entries.push({
    id: Date.now().toString(36), // a unique-enough id based on the current time
    type: selectedType(),
    amountCents,
    category: categorySelect.value,
    date: dateInput.value || todayISO(),
    note: noteInput.value.trim(),
  });
  saveEntries();
  render();

  // Get ready for the next entry: clear amount + note, keep type/category/date
  amountInput.value = "";
  noteInput.value = "";
  amountInput.focus();
});

// ===== Start-up =====
fillCategories();
dateInput.value = todayISO();
render();
