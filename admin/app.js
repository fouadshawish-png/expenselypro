const statusEl = document.getElementById("statusMessage");
const tableBody = document.getElementById("reportTable");
const totalUsersEl = document.getElementById("totalUsers");
const newUsersEl = document.getElementById("newUsers");
const activeUsersEl = document.getElementById("activeUsers");
const totalTransactionsEl = document.getElementById("totalTransactions");
const userEmailEl = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
let growthChart;
let hasLoaded = false;

const Auth = window.Auth || {};
const db = Auth.db;

function setStatus(message, type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = type ? `status ${type}` : "status";
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString() : "0";
}

function updateKpis(latest) {
  const fallback = { activeUsers: 0, newUsers: 0, totalTransactions: 0 };
  const data = latest || fallback;
  totalUsersEl.textContent = formatNumber(data.activeUsers || 0);
  newUsersEl.textContent = formatNumber(data.newUsers || 0);
  activeUsersEl.textContent = formatNumber(data.activeUsers || 0);
  totalTransactionsEl.textContent = formatNumber(data.totalTransactions || 0);
}

function renderTable(reports) {
  tableBody.innerHTML = "";
  reports.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.weekLabel || "-"}</td>
      <td>${formatNumber(item.newUsers)}</td>
      <td>${formatNumber(item.activeUsers)}</td>
      <td>${formatNumber(item.totalTransactions)}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderChart(reportsChronological) {
  const labels = reportsChronological.map((r) => r.weekLabel);
  const newUsers = reportsChronological.map((r) => r.newUsers);
  const activeUsers = reportsChronological.map((r) => r.activeUsers);
  const transactions = reportsChronological.map((r) => r.totalTransactions);

  const ctx = document.getElementById("growthChart");
  if (growthChart) {
    growthChart.destroy();
  }

  growthChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "New Users",
          data: newUsers,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.08)",
          tension: 0.3,
          fill: false
        },
        {
          label: "Active Users",
          data: activeUsers,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          tension: 0.3,
          fill: false
        },
        {
          label: "Transactions",
          data: transactions,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

async function loadReports() {
  if (!db) {
    setStatus("Firestore not initialized.", "error");
    return;
  }

  setStatus("Loading latest weekly reports...");
  tableBody.innerHTML = "";

  try {
    const snapshot = await db
      .collection("weekly_reports")
      .orderBy("createdAt", "desc")
      .limit(8)
      .get();

    if (snapshot.empty) {
      updateKpis(null);
      renderTable([]);
      if (growthChart) growthChart.destroy();
      setStatus("No reports found.", "success");
      return;
    }

    const reportsDesc = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        weekLabel: data.weekLabel,
        newUsers: data.newUsers,
        activeUsers: data.activeUsers,
        totalTransactions: data.totalTransactions,
        createdAt: data.createdAt
      };
    });

    const latest = reportsDesc[0];
    updateKpis(latest);
    renderTable(reportsDesc);

    const reportsChrono = [...reportsDesc].reverse();
    renderChart(reportsChrono);

    setStatus("", "");
  } catch (error) {
    console.error("Error loading reports", error);
    if (error.code === "permission-denied") {
      setStatus("Permission error: check Firestore rules.", "error");
    } else {
      setStatus("Error loading data. Please retry.", "error");
    }
  }
}

function redirectToLogin() {
  window.location.href = "login.html";
}

async function handleAuth(user) {
  if (!user) {
    redirectToLogin();
    return;
  }

  setStatus("Checking permissions...");

  try {
    const { isAdmin } = await Auth.getAdminStatus(user);
    if (!isAdmin) {
      setStatus("Access denied. Admin only.", "error");
      await Auth.signOutUser();
      setTimeout(redirectToLogin, 1200);
      return;
    }

    userEmailEl.textContent = user.email || "Admin";
    if (!hasLoaded) {
      hasLoaded = true;
      loadReports();
    }
  } catch (error) {
    console.error("Auth check failed", error);
    setStatus("Permission error: check Firestore rules.", "error");
    await Auth.signOutUser();
    setTimeout(redirectToLogin, 1200);
  }
}

if (Auth.onAuthStateChange) {
  Auth.onAuthStateChange(handleAuth);
} else {
  setStatus("Auth not initialized.", "error");
}

logoutBtn.addEventListener("click", async () => {
  if (Auth.signOutUser) {
    await Auth.signOutUser();
  }
  redirectToLogin();
});