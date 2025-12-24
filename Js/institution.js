/* =========================================================
   INSTITUTIONAL FLOW — FINAL BI-DIRECTIONAL SORT
   ========================================================= */

let ALL = [];
let VIEW = [];
let MODE = "stocks";

/* 🔥 SORT STATE (IMPORTANT) */
let CURRENT_MODE = "weeklyRatio";
let SORT_DIR = "desc"; // desc = strongest first

const grid = document.getElementById("stock-grid");

/* ================= UI HELPERS ================= */

function setActive(selector, el) {
  document.querySelectorAll(selector).forEach(b =>
    b.classList.remove("active")
  );
  el.classList.add("active");
}

/* ================= SECTOR AGGREGATION ================= */

function calculateSectorFlow(stocks) {
  const map = {};

  stocks.forEach(s => {
    const sector = s["Sector Name"] || "Unknown";

    if (!map[sector]) {
      map[sector] = {
        sector,
        count: 0,
        mcap: 0,
        daily: 0,
        weekly: 0
      };
    }

    map[sector].count++;
    map[sector].mcap += s.__mcap || 0;
    map[sector].daily += s.__dailyCash || 0;
    map[sector].weekly += s.__weeklyCash || 0;
  });

  return Object.values(map)
    .filter(x => x.weekly > 0 && x.mcap > 0)
    .map(x => ({
      ...x,
      ratio: x.weekly / x.mcap
    }))
    .sort((a, b) => b.ratio - a.ratio);
}

/* ================= RENDER SECTORS ================= */

function renderSectors(sectors) {
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  sectors.forEach(sec => {
    const row = document.createElement("div");
    row.className = "qc-row";

    row.innerHTML = `
      <div class="qc-cell name">${sec.sector}</div>
      <div class="qc-cell">${sec.count}</div>
      <div class="qc-cell">₹${sec.mcap.toFixed(0)} Cr</div>
      <div class="qc-cell">₹${sec.daily.toFixed(2)} Cr</div>
      <div class="qc-cell">₹${sec.weekly.toFixed(2)} Cr</div>
      <div class="qc-cell">${(sec.ratio * 100).toFixed(2)}%</div>
    `;

    row.onclick = () => {
      MODE = "stocks";
      VIEW = ALL.filter(s => s["Sector Name"] === sec.sector);
      showStocks();
    };

    frag.appendChild(row);
  });

  grid.appendChild(frag);
}

/* ================= STOCK VIEW ================= */

function showStocks() {
  document.getElementById("sector-header").classList.add("hidden");
  document.getElementById("stock-header").classList.remove("hidden");
  StockRenderer.render(grid, VIEW);
}

/* ================= INSTITUTIONAL SORT ================= */

function sortInstitution(mode) {
  const graded = [];

  ALL.forEach(s => {
    const mcap = s.__mcap || 0;
    const weekly = s.__weeklyCash || 0;
    const daily = s.__dailyCash || 0;

    if (!mcap || weekly <= 0) return;

    let score = 0;

    switch (mode) {
      case "weeklyRatio":
        score = (weekly / mcap) * 100;
        break;

      case "dailyRatio":
        score = (daily / mcap) * 100;
        break;

      case "weeklyCash":
        score = weekly;
        break;

      case "divergence":
        score = weekly - daily;
        break;
    }

    graded.push({ stock: s, score });
  });

  VIEW = graded
    .filter(x => x.score > 0)
    .sort((a, b) =>
      SORT_DIR === "desc"
        ? b.score - a.score
        : a.score - b.score
    )
    .slice(0, 150)  // institutional focus list
    .map(x => x.stock);

  showStocks();
}

/* ================= INIT ================= */

(async function init() {
  ALL = await DataService.fetchStocks();
  VIEW = [...ALL];

  /* Default mode */
  sortInstitution(CURRENT_MODE);

  /* 🔥 MODE BUTTONS (BI-DIRECTIONAL) */
  document.querySelectorAll(".inst-btn").forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;

      // Toggle direction only if same mode
      if (mode === CURRENT_MODE) {
        SORT_DIR = SORT_DIR === "desc" ? "asc" : "desc";
      } else {
        CURRENT_MODE = mode;
        SORT_DIR = "desc"; // reset for new mode
      }

      setActive(".inst-btn", btn);
      sortInstitution(CURRENT_MODE);
    };
  });

  /* VIEW TOGGLE */
  document.getElementById("view-sectors").onclick = e => {
    setActive("#view-stocks, #view-sectors", e.target);
    document.getElementById("stock-header").classList.add("hidden");
    document.getElementById("sector-header").classList.remove("hidden");
    renderSectors(calculateSectorFlow(ALL));
  };

  document.getElementById("view-stocks").onclick = e => {
    setActive("#view-stocks, #view-sectors", e.target);
    VIEW = [...ALL];
    showStocks();
  };
})();
