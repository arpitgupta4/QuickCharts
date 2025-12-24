let ALL = [];
let VIEW = [];

const grid = document.getElementById("stock-grid");

/* ================= METRICS ================= */

/* --- Market Cap --- */

function updateMarketCapBar(lakhCr) {
  // Reference scale (can tweak later)
  const max = 500; // 500 Lakh Cr = full bar
  const pct = Math.min(100, (lakhCr / max) * 100);

  const bar = document.getElementById("marketcap-bar");
  if (!bar) return;

  bar.setAttribute("width", pct);
}

function updateMarketCap(stocks) {
  const totalCr = stocks.reduce((s, x) => s + (x.__mcap || 0), 0);
  const lakhCr = totalCr / 100000;

  document.getElementById("metric-marketcap").innerText =
    `₹${lakhCr.toFixed(2)} Lakh Cr`;

  updateMarketCapBar(lakhCr);
}

/* --- Advance / Decline --- */

function updateAdvanceDecline(stocks) {
  let adv = 0, dec = 0;

  stocks.forEach(s => {
    if (s.__change > 0) adv++;
    else if (s.__change < 0) dec++;
  });

  document.getElementById("metric-advdec").innerText =
    `${adv} / ${dec}`;

  document.getElementById("metric-advdec-text").innerText =
    adv > dec ? "Bullish" : "Bearish";

  // Breadth bar
  const total = adv + dec || 1;
  const advPct = (adv / total) * 100;
  const decPct = (dec / total) * 100;

  const advBar = document.getElementById("adv-bar");
  const decBar = document.getElementById("dec-bar");

  if (advBar && decBar) {
    advBar.setAttribute("width", advPct);
    decBar.setAttribute("x", advPct);
    decBar.setAttribute("width", decPct);
  }
}

/* --- Weekly Momentum (True Institutional) --- */

function updateWeeklyMomentum(stocks) {
  const total = stocks.length;
  if (!total) return;

  // 1️⃣ Avg weekly % change
  const avgChange =
    stocks.reduce((s, x) => s + (x.__change || 0), 0) / total;

  // 2️⃣ Breadth
  const breadth =
    stocks.filter(s => (s.__change || 0) > 0).length / total;

  // 3️⃣ Cash bias
  const totalWeeklyCash =
    stocks.reduce((s, x) => s + (x.__weeklyCash || 0), 0);

  const totalMcap =
    stocks.reduce((s, x) => s + (x.__mcap || 0), 0);

  const cashBias =
    totalMcap > 0 ? totalWeeklyCash / totalMcap : 0;

  // 4️⃣ Score (0–100)
  let score =
    50 +
    avgChange * 10 +
    (breadth - 0.5) * 40 +
    cashBias * 300;

  score = Math.max(0, Math.min(100, score));

  // 5️⃣ Label + color
  let label, color;

  if (score >= 70) {
    label = "Strong";
    color = "#22c55e";
  } else if (score >= 55) {
    label = "Positive";
    color = "#86efac";
  } else if (score >= 40) {
    label = "Weak";
    color = "#facc15";
  } else {
    label = "Very Weak";
    color = "#ef4444";
  }

  document.getElementById("metric-momentum").innerText = label;

  // 6️⃣ Curve animation (NO DOT)
  const curve = document.getElementById("momentum-curve");
  if (!curve) return;

  const curveLength = 240;
  const offset = curveLength - (score / 100) * curveLength;

  curve.style.stroke = color;
  curve.style.strokeDashoffset = offset;
}

/* --- Fear & Greed --- */

function updateFearGreed(stocks) {
  const total = stocks.length;
  if (!total) return;

  // 1️⃣ Price momentum
  const avgChange =
    stocks.reduce((s, x) => s + (x.__change || 0), 0) / total;

  const priceScore = Math.max(
    0,
    Math.min(100, 50 + avgChange * 10)
  );

  // 2️⃣ Breadth
  const advancing =
    stocks.filter(s => (s.__change || 0) > 0).length;

  const breadthScore = (advancing / total) * 100;

  // 3️⃣ Flow bias
  const avgFlow =
    stocks.reduce((s, x) => s + (x.__weeklyCash || 0), 0) / total;

  const avgMcap =
    stocks.reduce((s, x) => s + (x.__mcap || 1), 0) / total;

  const flowRatio = avgFlow / avgMcap;

  const flowScore = Math.max(
    0,
    Math.min(100, 50 + flowRatio * 500)
  );

  // 4️⃣ Final score
  const finalScore = Math.round(
    priceScore * 0.4 +
    breadthScore * 0.3 +
    flowScore * 0.3
  );

  // 5️⃣ Elements
  const valueEl = document.getElementById("fg-score");
  const labelEl = document.getElementById("fg-label");
  const arc = document.getElementById("fg-arc");

  if (!valueEl || !labelEl || !arc) return;

  // 6️⃣ Animate arc
  const totalLength = 157;
  arc.style.strokeDashoffset =
    totalLength - (finalScore / 100) * totalLength;

  // 7️⃣ Animate number
  animateNumber(valueEl, finalScore);

  // 8️⃣ Dynamic color
  const color = getFearGreedColor(finalScore);
  valueEl.style.color = color;
  arc.style.stroke = color;

  // 9️⃣ Label
  labelEl.textContent =
    finalScore < 35 ? "Fear" :
    finalScore < 60 ? "Neutral" :
    finalScore < 75 ? "Greed" :
    "Extreme Greed";
}


/* ================= SORTING ================= */

let sortState = { key: null, asc: true };

function sortBy(key) {
  if (!key) return; // ignore ⭐ column

  const map = {
    name: s => s.Symbol,
    price: s => s.__ltp,

    absChange: s => s.__ltp * (s.__change / 100),
    pctChange: s => s.__change,

    mcap: s => s.__mcap,
    dailyCash: s => s.__dailyCash,
    weeklyCash: s => s.__weeklyCash,

    // 🔥 WATCHLIST DATE SORT
    date: s => {
      const d = Common.watchlist.getDate(s.Symbol);
      return d ? new Date(d).getTime() : 0;
    }
  };

  // Toggle direction
  if (sortState.key === key) {
    sortState.asc = !sortState.asc;
  } else {
    sortState.key = key;
    sortState.asc = false; // default = DESC
  }

  VIEW.sort((a, b) => {
    const va = map[key](a);
    const vb = map[key](b);

    if (typeof va === "string") {
      return sortState.asc
        ? va.localeCompare(vb)
        : vb.localeCompare(va);
    }

    return sortState.asc ? va - vb : vb - va;
  });

  // Re-render table
  StockRenderer.render(grid, VIEW);

  /* ================= HEADER UI SYNC ================= */

  document
    .querySelectorAll(".qc-table-header .th")
    .forEach(th => {
      th.classList.remove("active", "asc", "desc");
    });

  const activeTh =
    document.querySelector(`.th[data-key="${key}"]`);

  if (activeTh) {
    activeTh.classList.add("active");
    activeTh.classList.add(sortState.asc ? "asc" : "desc");
  }
}



/* ================= SEARCH ================= */

const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();

  VIEW = !q
    ? [...ALL]
    : ALL.filter(s =>
        (s.Symbol || "").toLowerCase().includes(q) ||
        (s["Industry New Name"] || "").toLowerCase().includes(q) ||
        (s["Sector Name"] || "").toLowerCase().includes(q)
      );

  StockRenderer.render(grid, VIEW);

  // 🔥 Metrics follow current view
  updateMarketCap(VIEW);
  updateAdvanceDecline(VIEW);
  updateWeeklyMomentum(VIEW);
  updateFearGreed(VIEW);
});

/* ================= INIT ================= */

async function init() {
  ALL = await DataService.fetchStocks();
  VIEW = [...ALL];

  StockRenderer.render(grid, VIEW);

  updateMarketCap(VIEW);
  updateAdvanceDecline(VIEW);
  updateWeeklyMomentum(VIEW);
  updateFearGreed(VIEW);

  document
    .querySelectorAll(".qc-table-header .th")
    .forEach(th => {
      th.addEventListener("click", () => {
        sortBy(th.dataset.key);
      });
    });
}

function animateNumber(el, target, duration = 900) {
  let start = 0;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(progress * target);
    el.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function getFearGreedColor(value) {
  // Custom tuned curve for financial UX
  let hue;

  if (value < 30) {
    // Deep fear → red
    hue = 0;
  } else if (value < 50) {
    // Fear → yellow
    hue = 20 + (value - 30) * 1.5; // 20 → 50
  } else if (value < 70) {
    // Neutral → yellow-green
    hue = 50 + (value - 50) * 2;   // 50 → 90
  } else {
    // Greed → green
    hue = 90 + (value - 70) * 1.5; // 90 → 120
  }

  return `hsl(${hue}, 80%, 55%)`;
}


function hideLoader() {
  const loader = document.getElementById("app-loader");
  if (!loader) return;

  requestAnimationFrame(() => {
    loader.classList.add("hide");
  });
}

init();
