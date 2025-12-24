// Js/dataService.js

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQVkHAog5NgWQxC_H8QGqLj4b4CpufV4ncEyOYQzW-lS7qL55_Ngkr7HQy82SMA6YXxS59UU6pI8AeN/pub?gid=532776328&single=true&output=csv";

const CACHE_KEY = "QC_STOCKS_V3";

const num = v => parseFloat(String(v || "0").replace(/,/g, "")) || 0;

window.DataService = {
async fetchStocks(force = false) {
  if (!force) {
    const cached = Common.loadCache(CACHE_KEY);
    // const cached = null;

    if (cached) return cached;
  }

  showLoader?.(300);

  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("CSV fetch failed");

    const csvText = await res.text();

    return await new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: r => {
          const stocks = r.data.map(row => ({
            ...row,
            __ltp: num(row.LTP),
            __change: num(row["%Change"]),
            __mcap: num(row["Market cap"]),
            __dailyCash: num(row["Daily Cash Deployed"]),
            __weeklyCash: num(row["Weekly Cash Deployed"])
          }));

          Common.saveCache(CACHE_KEY, stocks, 10 * 60 * 1000);
          resolve(stocks);
        },
        error: reject
      });
    });
  } finally {
    hideLoader?.();
  }
}



};
