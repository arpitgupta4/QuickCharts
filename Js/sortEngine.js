/* =========================================================
   SORT ENGINE — SHARED & SAFE
   ========================================================= */

let sortState = { key: null, asc: true };

window.sortBy = function (key) {
  if (!key || !window.VIEW || !window.grid) return;

  const map = {
    name: s => s.Symbol,
    price: s => s.__ltp,
    absChange: s => s.__ltp * (s.__change / 100),
    pctChange: s => s.__change,
    mcap: s => s.__mcap,
    dailyCash: s => s.__dailyCash,
    weeklyCash: s => s.__weeklyCash,

    date: s => {
      const d = Common?.watchlist?.getDate(s.Symbol);
      return d ? new Date(d).getTime() : 0;
    }
  };

  if (!map[key]) return;

  if (sortState.key === key) {
    sortState.asc = !sortState.asc;
  } else {
    sortState.key = key;
    sortState.asc = false;
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

  StockRenderer.render(grid, VIEW);

  // Header UI sync
  document.querySelectorAll(".qc-table-header .th")
    .forEach(th => th.classList.remove("active", "asc", "desc"));

  const active = document.querySelector(`.th[data-key="${key}"]`);
  if (active) {
    active.classList.add("active");
    active.classList.add(sortState.asc ? "asc" : "desc");
  }
};
