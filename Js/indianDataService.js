// Js/indianDataService.js
const INDIAN_CACHE_KEY = "QC_INDIAN_INDICES_V1";

const INDIAN_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQVkHAog5NgWQxC_H8QGqLj4b4CpufV4ncEyOYQzW-lS7qL55_Ngkr7HQy82SMA6YXxS59UU6pI8AeN/pub?gid=269283681&single=true&output=csv";

window.IndianDataService = {
  fetchIndices(force = false) {
  if (!force) {
    const cached = Common.loadCache(INDIAN_CACHE_KEY);
    if (cached) return Promise.resolve(cached);
  }

  showLoader?.(300);

  return new Promise((resolve, reject) => {
    Papa.parse(INDIAN_CSV, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const num = v => parseFloat(v) || 0;

          const normalized = data.map(r => ({
            instrument: r.Instrument || "",
            symbol: r.Symbol || "",
            __ltp: num(r.LTP),
            __change: num(r.Change),
            __pct: num(r["%Change"])
          }));

          Common.saveCache(
            INDIAN_CACHE_KEY,
            normalized,
            15 * 60 * 1000
          );

          resolve(normalized);
        } catch (e) {
          reject(e);
        } finally {
          hideLoader?.();
        }
      },
      error: err => {
        hideLoader?.();
        reject(err);
      }
    });
  });
}

};
