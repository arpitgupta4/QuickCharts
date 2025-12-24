window.grid = document.getElementById("stock-grid");
window.VIEW = [];


/* ================= RENDER WATCHLIST ================= */

async function renderWatchlist() {
  const all = await DataService.fetchStocks();

  // Get watchlist (object: { SYMBOL: date })
  const watchMap = Common.watchlist.getAll();
  const symbols = Object.keys(watchMap);

  // Filter stocks
  const stocks = all.filter(s => symbols.includes(s.Symbol));

  // Empty state
  if (!stocks.length) {
    grid.innerHTML = `
      <div class="text-slate-400 text-center p-10">
        No stocks in watchlist
      </div>`;
    VIEW = [];
    return;
  }

  window.VIEW = stocks;
StockRenderer.render(window.grid, window.VIEW);


  // Visual starred marker
  requestAnimationFrame(() => {
    document
      .querySelectorAll(".qc-row")
      .forEach(r => r.classList.add("qc-starred"));
  });
}

/* ================= INIT ================= */

renderWatchlist();

/* ================= HEADER SORT WIRING ================= */

document
  .querySelectorAll(".qc-table-header .th[data-key]")
  .forEach(th => {
    th.addEventListener("click", () => {
      sortBy(th.dataset.key);
    });
  });

/* ================= REACTIVE UPDATES ================= */

// Re-render when watchlist changes anywhere
Common.watchlist.onChange(() => {
  renderWatchlist();
});
