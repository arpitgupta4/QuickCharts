function formatCr(v) {
  return `₹${v.toFixed(2)} Cr`;
}

function formatNum(v) {
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

window.StockRenderer = {
  render(container, stocks) {
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    // Detect watchlist table ONLY by class
    const isWatchlist =
      container.classList.contains("qc-table-watchlist");

    // Cached watchlist data
    const watchMap = Common.watchlist.getAll();

    stocks.forEach(stock => {
      const row = document.createElement("div");
      row.className = "qc-row";

      const absChange = (stock.__ltp * stock.__change) / 100;

      const isStarred = Common.watchlist.has(stock.Symbol);
      const addedDate = watchMap[stock.Symbol];

      row.innerHTML = `
        <!-- ⭐ STAR (NO LAYOUT CHANGE) -->
        <div class="qc-cell star">
          <span class="qc-star ${isStarred ? "active" : ""}">
            ${isStarred ? "★" : "☆"}
          </span>
        </div>

        <!-- NAME -->
        <div class="qc-cell name">
          <div class="qc-symbol">${stock.Symbol}</div>
          <div class="qc-sub">
            ${stock["Industry New Name"] || ""}
          </div>
        </div>

        ${
          isWatchlist
            ? `
        <!-- DATE (WATCHLIST ONLY) -->
        <div class="qc-cell date">
          ${addedDate ? formatWatchDate(addedDate) : "-"}
        </div>
        `
            : ""
        }

        <!-- PRICE -->
        <div class="qc-cell price">
          ₹${formatNum(stock.__ltp)}
        </div>

        <!-- ₹ CHANGE -->
        <div class="qc-cell change ${absChange >= 0 ? "pos" : "neg"}">
          ${absChange >= 0 ? "+" : ""}₹${formatNum(absChange)}
        </div>

        <!-- % CHANGE -->
        <div class="qc-cell change ${stock.__change >= 0 ? "pos" : "neg"}">
          ${stock.__change >= 0 ? "+" : ""}${formatNum(stock.__change)}%
        </div>

        <!-- MARKET CAP -->
        <div class="qc-cell mcap">
          ${formatCr(stock.__mcap)}
        </div>

        <!-- DAILY CASH -->
        <div class="qc-cell cash">
          ${formatCr(stock.__dailyCash)}
        </div>

        <!-- WEEKLY CASH -->
        <div class="qc-cell cash">
          ${formatCr(stock.__weeklyCash)}
        </div>
      `;

      /* ================= STAR CLICK (FIXED) ================= */

      const star = row.querySelector(".qc-star");
      star.onclick = e => {
        e.stopPropagation();

        Common.watchlist.toggle(stock.Symbol);

        const nowStarred =
          Common.watchlist.has(stock.Symbol);

        star.textContent = nowStarred ? "★" : "☆";
        star.classList.toggle("active", nowStarred);

        // If on watchlist page → remove row instantly
        if (isWatchlist && !nowStarred) {
          row.remove();
        }
      };

      /* ================= ROW CLICK ================= */

      row.addEventListener("click", () => {
        window.open(
          `https://www.tradingview.com/chart/?symbol=NSE:${stock.Symbol}`,
          "_blank"
        );
      });

      fragment.appendChild(row);
    });

    container.appendChild(fragment);
  }
};
