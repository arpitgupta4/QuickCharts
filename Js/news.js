/* =========================================================
   MARKET INTELLIGENCE – CLEAN & SMART NEWS ENGINE
   FILE: js/news.js
========================================================= */

const FEED_URL = "https://quickcharts.arpitambala3.workers.dev/";

/* ================= DOM ================= */

const container = document.getElementById("news-container");
const regimeEl = document.getElementById("market-regime");

/* ================= STATE ================= */

let NEWS = [];
let FILTER_SECTOR = "ALL";
let SHOW_SAVED = false;

/* ================= RULES ================= */

const SECTOR_RULES = [
  { sector: "BANKS", match: ["bank", "rbi", "hdfc", "icici", "sbi", "axis"] },
  { sector: "IT", match: ["it", "software", "tcs", "infosys", "wipro", "hcl"] },
  { sector: "AUTO", match: ["auto", "vehicle", "car", "tata motors", "maruti"] },
  { sector: "PHARMA", match: ["pharma", "drug", "medicine", "hospital"] },
  { sector: "METAL", match: ["steel", "aluminium", "copper", "metal"] },
  { sector: "GLOBAL", match: ["fed", "us", "china", "global", "europe"] }
];

const EVENT_RULES = [
  { event: "RESULTS", match: ["result", "earnings", "q1", "q2", "q3", "q4"] },
  { event: "IPO", match: ["ipo", "listing", "gmp"] },
  { event: "POLICY", match: ["policy", "rbi", "budget", "tax", "rate"] },
  { event: "M&A", match: ["acquire", "stake", "buy", "merger"] },
  { event: "MACRO", match: ["inflation", "gdp", "economy", "growth"] }
];

/* ================= UTIL ================= */

function decodeHTML(str = "") {
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

function normalizeHeadline(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\b(check|details|here|explained|why|what|how)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSector(text = "") {
  const t = text.toLowerCase();
  for (const r of SECTOR_RULES) {
    if (r.match.some(k => t.includes(k))) return r.sector;
  }
  return "OTHER";
}

function detectEvent(text = "") {
  const t = text.toLowerCase();
  for (const r of EVENT_RULES) {
    if (r.match.some(k => t.includes(k))) return r.event;
  }
  return "GENERAL";
}

/* ================= FETCH ================= */

async function fetchNews() {
  try {
    const res = await fetch(FEED_URL);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const now = Date.now();

    return data.map(n => ({
      id: n.id,
      headline: decodeHTML(n.headline),
      link: n.link,
      source: n.source,
      timestamp: Math.min(n.timestamp || now, now),
      sector: detectSector(n.headline),
      event: detectEvent(n.headline),
      dedupeKey: normalizeHeadline(n.headline)
    }));
  } catch (e) {
    console.error("News fetch failed:", e);
    return [];
  }
}

/* ================= DEDUPE ================= */

function dedupe(items) {
  const seen = new Set();
  return items.filter(n => {
    if (seen.has(n.dedupeKey)) return false;
    seen.add(n.dedupeKey);
    return true;
  });
}

/* ================= RENDER ================= */

function render() {
  container.innerHTML = "";
  regimeEl.innerHTML = "";

  let items = [...NEWS];

  if (FILTER_SECTOR !== "ALL") {
    items = items.filter(n => n.sector === FILTER_SECTOR);
  }

  if (SHOW_SAVED) {
    items = items.filter(n => isSaved(n.id));
  }

  items.sort((a, b) => b.timestamp - a.timestamp);

  drawSection("Latest News", items.slice(0, 40));

}

function drawSection(title, items) {
  if (!items.length) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;color:#94a3b8">
        No news available
      </div>`;
    return;
  }

  const sec = document.createElement("div");
  sec.className = "news-section";
  sec.innerHTML = `<h2>${title}</h2>`;

  items.forEach(n => {
    const div = document.createElement("div");
    div.className = "news-item cursor-pointer";

    // CLICK ANYWHERE → OPEN NEWS
    div.onclick = () => {
      window.open(n.link, "_blank");
    };

    div.innerHTML = `
      <div class="news-left">
        <div class="news-title">${n.headline}</div>
        <div class="news-meta">
          <span class="badge sector">${n.sector}</span>
          <span class="badge event">${n.event}</span>
          <span>${n.source}</span>
          <span>${new Date(n.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      <div class="news-actions">
        <button class="news-save ${isSaved(n.id) ? "saved" : ""}">
          ${isSaved(n.id) ? "Saved" : "Save"}
        </button>
      </div>
    `;

    // Prevent card click when saving
    div.querySelector(".news-save").onclick = e => {
      e.stopPropagation();
      toggleSave(n.id);
    };

    sec.appendChild(div);
  });

  container.appendChild(sec);
}

/* ================= HELPERS ================= */

function mostCommonSector(items) {
  const map = {};
  items.forEach(n => map[n.sector] = (map[n.sector] || 0) + 1);
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
}

/* ================= SAVE ================= */

function isSaved(id) {
  return Common.load("saved_news", []).includes(id);
}

function toggleSave(id) {
  let saved = Common.load("saved_news", []);
  saved = saved.includes(id)
    ? saved.filter(x => x !== id)
    : [...saved, id];
  Common.save("saved_news", saved);
  render();
}

/* ================= EVENTS ================= */

document.querySelectorAll(".tab[data-sector]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    FILTER_SECTOR = btn.dataset.sector;
    SHOW_SAVED = false;
    render();
  };
});

document.getElementById("toggle-saved").onclick = () => {
  SHOW_SAVED = !SHOW_SAVED;
  render();
};

/* ================= INIT ================= */

(async () => {
  NEWS = dedupe(await fetchNews());
  render();

  setInterval(async () => {
    NEWS = dedupe(await fetchNews());
    render();
  }, 30000);
})();
