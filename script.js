// Start of all JavaScript
let expenses = [];
let currentEditIndex = -1;
let chart = null;

// Initialize the app when page loads
window.onload = function () {
  populateYears();
  setCurrentMonth();
  loadData();
  renderTable();
  updateSummary();
  
  // Save initial state to ensure data persists across refreshes
  saveFiltersState();
};

// Save filter state to sessionStorage
function saveFiltersState() {
  const currentYear = document.getElementById("yearSelect").value;
  const currentMonth = document.getElementById("monthSelect").value;
  const startAmount = document.getElementById("startAmount").value;
  
  sessionStorage.setItem('expenseTrackerYear', currentYear);
  sessionStorage.setItem('expenseTrackerMonth', currentMonth);
  sessionStorage.setItem('expenseTrackerBudget', startAmount);
}

// Populate year selection from 2023 to current year + 5
const populateYears = () => {
  const currentYear = new Date().getFullYear();
  let yearSelect = document.getElementById("yearSelect");
  yearSelect.innerHTML = "";

  for (let year = 2023; year <= currentYear + 5; year++) {
    let option = document.createElement("option");
    option.value = year;
    option.innerText = year;
    yearSelect.appendChild(option);
  }

  // Set stored year as default, or current year if none stored
  const storedYear = sessionStorage.getItem('expenseTrackerYear');
  yearSelect.value = storedYear || currentYear;
};

// Initialize with stored month or current month
const setCurrentMonth = () => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  
  const storedMonth = sessionStorage.getItem('expenseTrackerMonth');
  
  if (storedMonth && months.includes(storedMonth)) {
    document.getElementById("monthSelect").value = storedMonth;
  } else {
    document.getElementById("monthSelect").value = months[new Date().getMonth()];
  }
  
  // Set stored budget amount if available
  const storedBudget = sessionStorage.getItem('expenseTrackerBudget');
  if (storedBudget) {
    document.getElementById("startAmount").value = storedBudget;
  }
};

// Modal functions
function openModal() {
  document.getElementById("modalOverlay").classList.add("active");
  document.getElementById("modalDesc").focus();
  // Reset fields
  document.getElementById("modalDesc").value = "";
  document.getElementById("modalAmount").value = "";
  document.querySelector(".modal h3").textContent = "Add New Expense"; // Reset modal title
  currentEditIndex = -1;
}

function openEditModal(index) {
  const expense = expenses[index];
  document.getElementById("modalDesc").value = expense.desc;
  document.getElementById("modalAmount").value = expense.amount;
  currentEditIndex = index;
  document.querySelector(".modal h3").textContent = "Edit Expense"; // Change modal title
  document.getElementById("modalOverlay").classList.add("active"); // Show modal
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("active");
}

function saveExpense() {
  const desc = document.getElementById("modalDesc").value.trim();
  const amount = parseFloat(
    document.getElementById("modalAmount").value.trim()
  );

  if (desc === "" || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid description and amount.");
    return;
  }

  if (currentEditIndex === -1) {
    // Add new expense
    expenses.push({ desc, amount });
  } else {
    // Edit existing expense
    expenses[currentEditIndex] = { desc, amount };
  }

  saveData(); // Save to sessionStorage first
  closeModal(); // Then close modal
  renderTable(); // Then render table
  updateSummary(); // Then update summary
}

function renderTable() {
  const tableBody = document.getElementById("expenseTable");
  const emptyState = document.getElementById("emptyState");

  // Clear the table first
  tableBody.innerHTML = "";

  if (expenses.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";

    // Populate table with expenses
    expenses.forEach((expense, index) => {
      let row = tableBody.insertRow();
      row.innerHTML = `
                <td>${expense.desc}</td>
                <td class="currency">₹ ${expense.amount.toFixed(2)}</td>
                <td class="action-btns">
                    <button class="edit-btn" onclick="openEditModal(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteExpense(${index})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
    });
  }
}

function deleteExpense(index) {
  if (confirm("Are you sure you want to delete this expense?")) {
    expenses.splice(index, 1);
    saveData();
    renderTable();
    updateSummary();
  }
}

function updateSummary() {
  const totalBudget =
    parseFloat(document.getElementById("startAmount").value) || 0;
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const savings = totalBudget - totalExpenses;
  const budgetUsed =
    totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(2) : 0;

  document.getElementById("totalBudget").textContent = totalBudget.toFixed(2);
  document.getElementById("totalExpenses").textContent =
    totalExpenses.toFixed(2);
  document.getElementById("savings").textContent = savings.toFixed(2);
  document.getElementById("budgetPercentage").textContent = budgetUsed;

  // Save budget value to sessionStorage
  sessionStorage.setItem('expenseTrackerBudget', totalBudget);
  
  updateChart(totalBudget, totalExpenses, savings);
}

function saveData() {
  const currentYear = document.getElementById("yearSelect").value;
  const currentMonth = document.getElementById("monthSelect").value;
  const storageKey = `expenses_${currentYear}_${currentMonth}`;

  // Save to sessionStorage
  sessionStorage.setItem(storageKey, JSON.stringify(expenses));
  
  // Save current filters state
  saveFiltersState();
}

function loadData() {
  const currentYear = document.getElementById("yearSelect").value;
  const currentMonth = document.getElementById("monthSelect").value;
  const storageKey = `expenses_${currentYear}_${currentMonth}`;

  const storedData = sessionStorage.getItem(storageKey);
  if (storedData) {
    expenses = JSON.parse(storedData);
  } else {
    expenses = [];
  }
}

// Add event listeners for year and month changes
document.getElementById("yearSelect").addEventListener("change", function () {
  saveFiltersState();
  loadData();
  renderTable();
  updateSummary();
});

document.getElementById("monthSelect").addEventListener("change", function () {
  saveFiltersState();
  loadData();
  renderTable();
  updateSummary();
});

// Add event listener for budget amount changes
document.getElementById("startAmount").addEventListener("change", function() {
  saveFiltersState();
  updateSummary();
});

function updateChart(totalBudget, totalExpenses, savings) {
  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Expenses", "Remaining"],
      datasets: [
        {
          data: [totalExpenses, Math.max(0, savings)],
          backgroundColor: ["darkred", "green"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}