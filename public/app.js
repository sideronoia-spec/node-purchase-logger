const expenseList = document.getElementById("expenseList");
const summaryText = document.getElementById("summary");
const monthSelect = document.getElementById("month");
const yearSelect = document.getElementById("year");
let dailyChart;

let monthlyChart;

const now = new Date();

// Populate month/year dropdowns
for (let i = 1; i <= 12; i++)
  monthSelect.innerHTML += `<option value="${i}">${i}</option>`;

for (let y = 2024; y <= now.getFullYear(); y++)
  yearSelect.innerHTML += `<option value="${y}">${y}</option>`;

monthSelect.value = now.getMonth() + 1;
yearSelect.value = now.getFullYear();

// Default date = today
document.getElementById("date").value = now.toISOString().split("T")[0];

// Load expenses list
async function loadExpenses() {
  const adminRes = await fetch("/is-admin");
  const adminData = await adminRes.json();

  const res = await fetch("/expenses");
  const data = await res.json();

  expenseList.innerHTML = "";

  data.forEach(exp => {
    expenseList.innerHTML += `
      <div class="item">
        <div>
          <div class="date">${exp.date}</div>
          <div class="amount">₹${exp.amount}</div>
        </div>
        ${adminData.isAdmin ? `<a class="delete" href="/delete/${exp._id}">🗑</a>` : ""}
      </div>
    `;
  });
}


// Monthly summary
async function loadSummary() {
  const res = await fetch(`/monthly-summary/${yearSelect.value}/${monthSelect.value}`);
  const data = await res.json();
  summaryText.innerText = `₹${data.totalAmount} (${data.count} entries)`;
}

// Monthly trend chart
async function loadMonthlyChart() {
  const res = await fetch("/monthly-report");
  const report = await res.json();

  const labels = [];
  const totals = [];

  report.reverse().forEach(r => {
    labels.push(`${r._id.month}/${r._id.year}`);
    totals.push(r.total);
  });

  const ctx = document.getElementById("monthlyChart").getContext("2d");

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Monthly Spending ₹",
        data: totals,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

document.getElementById("loadSummary").onclick = () => {
  loadSummary();
  loadMonthlyChart();
  loadDailyChart();
};


document.getElementById("expenseForm").onsubmit = async (e) => {
  e.preventDefault();

  await fetch("/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: document.getElementById("date").value,
      amount: document.getElementById("amount").value
    })
  });

  document.getElementById("amount").value = "";

  loadExpenses();
  loadSummary();
  loadMonthlyChart();
};
async function loadDailyChart() {
  const res = await fetch(`/daily-report/${yearSelect.value}/${monthSelect.value}`);
  const data = await res.json();

  const labels = data.map(d => d._id.split("-")[2]);  // Day only
  const totals = data.map(d => d.total);

  const ctx = document.getElementById("dailyChart").getContext("2d");

  if (dailyChart) dailyChart.destroy();

  dailyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Daily Spending ₹",
        data: totals,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

document.getElementById("adminForm").onsubmit = async (e) => {
  e.preventDefault();

  await fetch("/admin-login", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      email: adminEmail.value,
      password: adminPass.value
    })
  });

  location.reload();
};
const isAdmin = document.cookie.includes("connect.sid");

if(isAdmin){
  deleteBtn = `<a class="delete" href="/delete/${exp._id}">🗑</a>`;
}else{
  deleteBtn = "";
}
document.getElementById("logoutBtn").onclick = async () => {
  await fetch("/admin-logout");
  location.reload();
};
async function loadAdminControls() {
  const res = await fetch("/is-admin");
  const data = await res.json();

  const controls = document.getElementById("adminControls");

  if (data.isAdmin) {
    controls.innerHTML = `<button id="logoutBtn" class="logout">Logout Admin</button>`;
    document.getElementById("logoutBtn").onclick = async () => {
      await fetch("/admin-logout");
      location.reload();
    };
  } else {
    controls.innerHTML = "";
  }
}

loadExpenses();
loadSummary();
loadMonthlyChart();
loadDailyChart();
loadAdminControls();


