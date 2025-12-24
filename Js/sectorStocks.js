/* =========================================================
   SECTOR STOCKS — FINAL WORKING ENGINE
   ========================================================= */

const grid = document.getElementById("stock-grid");
const titleEl = document.getElementById("sector-title");
const industryBtn = document.getElementById("industry-rank-btn");
const heatmapBtn = document.getElementById("heatmap-toggle");
const heatmapEl = document.getElementById("subindustry-heatmap");
const headerEl = document.querySelector(".qc-table-header");


/* ================= STATE ================= */

let ALL = [];                // Raw sector stocks
let VIEW = [];               // What is currently rendered
let rankedIndustries = [];   // Cached industry strength
let sortStrongestFirst = true;
let heatmapVisible = false;
let activeIndustry = null;

let currentSort = { key: null, dir: "desc" };

/* ================= INIT ================= */

(async () => {
  const sector = new URLSearchParams(location.search).get("sector");
  if (!sector) return;

  titleEl.textContent = sector;

  window.showLoader?.();

  const stocks = await DataService.fetchStocks();

  ALL = stocks.filter(
    s =>
      (s["Sector Name"] || "").toLowerCase() ===
      sector.toLowerCase()
  );

  rankedIndustries = computeIndustryRanking();

  VIEW = [...ALL];
  StockRenderer.render(grid, VIEW);

  window.hideLoader?.();
})();

/* ================= HELPERS ================= */

function stdDev(arr) {
  if (!arr.length) return 0;
  const mean = arr.reduce((s, x) => s + x, 0) / arr.length;
  const variance =
    arr.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/* ================= INDUSTRY RANKING ================= */

function computeIndustryRanking() {
  const map = {};

  ALL.forEach(s => {
    const key = s["Industry New Name"] || "Other";
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });

  return Object.entries(map)
    .map(([name, stocks]) => {
      const changes = stocks.map(s => s.__change || 0);

      const avg =
        changes.reduce((s, x) => s + x, 0) / changes.length;

      const breadth =
        changes.filter(x => x > 0).length / changes.length;

      const dispersion = stdDev(changes);

      const leaders = [...changes]
        .sort((a, b) => b - a)
        .slice(0, Math.max(1, Math.ceil(changes.length * 0.3)));

      const leaderAvg =
        leaders.reduce((s, x) => s + x, 0) / leaders.length;

      const score =
        avg * 0.5 +
        breadth * 0.3 +
        leaderAvg * 0.2 -
        dispersion * 0.2;

      return { name, score };
    })
    .sort((a, b) => b.score - a.score);
}

/* ================= INDUSTRY SORT ================= */

function applyIndustrySort() {
  const ordered = sortStrongestFirst
    ? rankedIndustries
    : [...rankedIndustries].reverse();

  const rankMap = {};
  ordered.forEach((x, i) => {
    rankMap[x.name] = i;
  });

  VIEW = [...ALL].sort((a, b) => {
    const aKey = a["Industry New Name"] || "Other";
    const bKey = b["Industry New Name"] || "Other";
    return rankMap[aKey] - rankMap[bKey];
  });

  StockRenderer.render(grid, VIEW);
}

/* ================= COLUMN SORT ================= */

headerEl.addEventListener("click", e => {
  const cell = e.target.closest("[data-sort]");
  if (!cell) return;

  const key = cell.dataset.sort;

  currentSort.dir =
    currentSort.key === key && currentSort.dir === "desc"
      ? "asc"
      : "desc";

  currentSort.key = key;

  headerEl.querySelectorAll("div").forEach(d => {
    d.classList.remove("sorted", "asc", "desc");
  });

  cell.classList.add("sorted", currentSort.dir);

  applyColumnSort();
});

function applyColumnSort() {
  VIEW = [...VIEW].sort((a, b) => {
    let av, bv;

    switch (currentSort.key) {
      case "name":
        av = a.Symbol;
        bv = b.Symbol;
        break;

      case "price":
        av = a.__ltp;
        bv = b.__ltp;
        break;

      case "change":
        av = (a.__ltp * a.__change) / 100;
        bv = (b.__ltp * b.__change) / 100;
        break;

      case "pct":
        av = a.__change;
        bv = b.__change;
        break;

      case "mcap":
        av = a.__mcap;
        bv = b.__mcap;
        break;

      case "daily":
        av = a.__dailyCash;
        bv = b.__dailyCash;
        break;

      case "weekly":
        av = a.__weeklyCash;
        bv = b.__weeklyCash;
        break;

      default:
        return 0;
    }

    if (typeof av === "string") {
      return currentSort.dir === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    }

    return currentSort.dir === "asc" ? av - bv : bv - av;
  });

  StockRenderer.render(grid, VIEW);
}

/* ================= HEATMAP ================= */

heatmapBtn.onclick = () => {
  heatmapVisible = !heatmapVisible;
  heatmapBtn.classList.toggle("active", heatmapVisible);
  heatmapEl.classList.toggle("hidden", !heatmapVisible);

  if (heatmapVisible) {
    renderHeatmap();
  }
};

function renderHeatmap() {
  heatmapEl.innerHTML = "";

  rankedIndustries.forEach(r => {
    const tile = document.createElement("div");
    tile.className =
      "heat-tile " + (r.score >= 0 ? "heat-pos" : "heat-neg");

    tile.innerHTML = `
      <div class="heat-title">${r.name}</div>
      <div class="heat-score">
        Strength: ${r.score.toFixed(2)}
      </div>
    `;

    tile.onclick = () => {
      if (activeIndustry === r.name) {
        activeIndustry = null;
        VIEW = [...ALL];
        StockRenderer.render(grid, VIEW);
        tile.style.outline = "none";
      } else {
        activeIndustry = r.name;
        VIEW = ALL.filter(
          s => (s["Industry New Name"] || "Other") === r.name
        );
        StockRenderer.render(grid, VIEW);
      }
    };

    heatmapEl.appendChild(tile);
  });
}

/* ================= INDUSTRY BUTTON ================= */

industryBtn.onclick = () => {
  sortStrongestFirst = !sortStrongestFirst;

  industryBtn.textContent = sortStrongestFirst
    ? "Industry Strength ↓"
    : "Industry Strength ↑";

  applyIndustrySort();
};
