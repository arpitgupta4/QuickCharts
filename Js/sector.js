// Js/sector.js

const sectorGrid = document.getElementById("sector-grid");

(async () => {
  // 🔥 Fetch stocks (loader handled inside DataService)
  const stocks = await DataService.fetchStocks();

  const sectorMap = {};

  // ================= AGGREGATION =================
  stocks.forEach(s => {
    const sector = s["Sector Name"];
    if (!sector) return;

    if (!sectorMap[sector]) {
      sectorMap[sector] = {
        count: 0,
        mcap: 0,
        weightedChange: 0,
        weightedLtp: 0,
        daily: 0,
        weekly: 0
      };
    }

    sectorMap[sector].count += 1;
    sectorMap[sector].mcap += s.__mcap || 0;
    sectorMap[sector].weightedChange += (s.__change || 0) * (s.__mcap || 0);
    sectorMap[sector].weightedLtp += (s.__ltp || 0) * (s.__mcap || 0);
    sectorMap[sector].daily += s.__dailyCash || 0;
    sectorMap[sector].weekly += s.__weeklyCash || 0;
  });

  // ================= RENDER =================
  sectorGrid.innerHTML = "";
  const frag = document.createDocumentFragment();

  Object.entries(sectorMap)
    .map(([sector, v]) => {
      const pct = v.mcap ? v.weightedChange / v.mcap : 0;
      const ltp = v.mcap ? v.weightedLtp / v.mcap : 0;
      const ratio = v.mcap ? v.weekly / v.mcap : 0;

      return {
        sector,
        ...v,
        pct,
        ltp,
        ratio
      };
    })
    // 🔥 Rank by Flow / MCap (institutional priority)
    .sort((a, b) => b.ratio - a.ratio)
    .forEach(data => {
      const {
        sector,
        count,
        mcap,
        daily,
        weekly,
        pct,
        ltp,
        ratio
      } = data;

      const row = document.createElement("div");
      row.className = `sector-row ${ratio >= 0 ? "pos" : "neg"}`;

      row.onclick = () => {
        location.href =
          `sector-stocks.html?sector=${encodeURIComponent(sector)}`;
      };

      row.innerHTML = `
        <!-- SECTOR -->
        <div>
          <div class="sector-name">${sector}</div>
          <div class="sector-sub">Avg LTP: ${ltp.toFixed(0)}</div>
        </div>

        <!-- STOCK COUNT -->
        <div class="sector-cell">
          ${count}
        </div>

        <!-- MARKET CAP -->
        <div class="sector-cell">
          ₹${mcap.toFixed(0)} Cr
        </div>

        <!-- DAILY CASH -->
        <div class="sector-cell">
          ₹${daily.toFixed(2)} Cr
        </div>

        <!-- WEEKLY CASH -->
        <div class="sector-cell">
          ₹${weekly.toFixed(2)} Cr
        </div>

        <!-- FLOW / MCAP -->
        <div class="sector-cell sector-ratio">
          ${ratio >= 0 ? "+" : ""}${(ratio * 100).toFixed(2)}%
        </div>
      `;

      frag.appendChild(row);
    });

  sectorGrid.appendChild(frag);
})();
