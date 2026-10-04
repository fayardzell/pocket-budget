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
let justAddedId = null; // the entry to highlight after tapping Add

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
const addButton = form.querySelector(".add-btn");
const list = document.getElementById("entries");
const emptyMessage = document.getElementById("empty");
const monthLabel = document.getElementById("month-label");
const balanceEl = document.getElementById("balance");
const incomeTotalEl = document.getElementById("income-total");
const expenseTotalEl = document.getElementById("expense-total");

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

// "2026-10" -> "October 2026"
function formatMonth(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Add up income and expenses for one month, e.g. monthTotals("2026-10")
function monthTotals(yearMonth) {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const entry of entries) {
    if (!entry.date.startsWith(yearMonth)) continue; // skip other months
    if (entry.type === "income") incomeCents += entry.amountCents;
    else expenseCents += entry.amountCents;
  }
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents };
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

// ===== Draw the summary card: totals for the current month =====
function renderSummary() {
  const thisMonth = todayISO().slice(0, 7); // "2026-10-04" -> "2026-10"
  const { incomeCents, expenseCents, balanceCents } = monthTotals(thisMonth);

  monthLabel.textContent = formatMonth(thisMonth);
  incomeTotalEl.textContent = formatMoney(incomeCents);
  expenseTotalEl.textContent = formatMoney(expenseCents);
  balanceEl.textContent = formatMoney(balanceCents); // negative shows as "-$12.00"
  balanceEl.classList.toggle("negative", balanceCents < 0);
}

// ===== Draw everything from `entries` =====
function render() {
  renderSummary();

  // Newest date first; for the same date, the most recently added first
  const sorted = [...entries].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );

  list.innerHTML = "";
  let currentMonth = null;
  for (const entry of sorted) {
    // The list is sorted newest first, so when the month changes we start a new group
    const entryMonth = entry.date.slice(0, 7);
    if (entryMonth !== currentMonth) {
      currentMonth = entryMonth;
      list.append(createMonthHeading(entryMonth));
    }
    list.append(createEntryItem(entry));
  }
  emptyMessage.hidden = entries.length > 0;
  justAddedId = null; // the flash only plays once
}

// Heading row for a month group: "October 2026 ... +$1,185.50"
function createMonthHeading(yearMonth) {
  const li = document.createElement("li");
  li.className = "month-heading";
  const { balanceCents } = monthTotals(yearMonth);
  const net = (balanceCents < 0 ? "−" : "+") + formatMoney(Math.abs(balanceCents));
  li.innerHTML = `<span></span><span class="month-net"></span>`;
  li.children[0].textContent = formatMonth(yearMonth);
  li.children[1].textContent = net;
  li.children[1].classList.add(balanceCents < 0 ? "negative" : "positive");
  return li;
}

// Build one <li> for an entry (same structure as the design in Step 2)
function createEntryItem(entry) {
  const li = document.createElement("li");
  li.className = `entry ${entry.type}`;
  li.dataset.id = entry.id; // becomes data-id="…" so the delete button knows which entry this is
  if (entry.id === justAddedId) li.classList.add("just-added"); // brief highlight (see style.css)

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
    </div>
    <button type="button" class="delete-btn" aria-label="Delete entry">×</button>`;

  // Fill in the text with textContent, never innerHTML, so a note like "<b>hi</b>"
  // shows up as plain text instead of being treated as code.
  li.querySelector(".entry-badge").textContent = entry.category[0];
  li.querySelector(".entry-category").textContent = entry.category;
  li.querySelector(".entry-note").textContent = entry.note;
  li.querySelector(".entry-amount").textContent = sign + formatMoney(entry.amountCents);
  li.querySelector(".entry-date").textContent = formatDate(entry.date);
  return li;
}

// Briefly change the Add button to "Added ✓" so you know it worked,
// even when the list is scrolled off-screen on a phone
let addedTimer;
function showAdded() {
  addButton.textContent = "Added ✓";
  addButton.classList.add("added");
  clearTimeout(addedTimer); // if you add twice quickly, restart the countdown
  addedTimer = setTimeout(() => {
    addButton.textContent = "Add";
    addButton.classList.remove("added");
  }, 1200); // milliseconds
}

// ===== Events: things that happen when you interact =====

// Switching Expense/Income swaps the category choices
form.elements.type.forEach((radio) => radio.addEventListener("change", fillCategories));

// Tapping "Add"
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the browser's default: reloading the page

  const amountCents = Math.round(Number(amountInput.value) * 100);
  if (!(amountCents > 0)) return; // the "required" + "min" rules on the input already block this; just a safety net

  const entry = {
    id: Date.now().toString(36), // a unique-enough id based on the current time
    type: selectedType(),
    amountCents,
    category: categorySelect.value,
    date: dateInput.value || todayISO(),
    note: noteInput.value.trim(),
  };
  entries.push(entry);
  justAddedId = entry.id;
  saveEntries();
  render();
  showAdded();

  // Get ready for the next entry: clear amount + note, keep type/category/date
  amountInput.value = "";
  noteInput.value = "";
  amountInput.focus();
});

// Tapping × on an entry. One listener on the whole list ("event delegation")
// handles every delete button, including ones added later.
list.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-btn");
  if (!button) return; // the tap wasn't on a delete button

  const id = button.closest(".entry").dataset.id;
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  const sign = entry.type === "income" ? "+" : "−";
  const description = `${entry.category} ${sign}${formatMoney(entry.amountCents)} on ${formatDate(entry.date)}`;
  if (!confirm(`Delete this entry?\n\n${description}`)) return; // tapped Cancel

  entries = entries.filter((e) => e.id !== id); // keep every entry except this one
  saveEntries();
  render();
});

// ===== Start-up =====
fillCategories();
dateInput.value = todayISO();
render();
