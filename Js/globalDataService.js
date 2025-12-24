// Js/globalDataService.js
const GLOBAL_CACHE_KEY = "QC_GLOBAL_V2";

const GLOBAL_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQVkHAog5NgWQxC_H8QGqLj4b4CpufV4ncEyOYQzW-lS7qL55_Ngkr7HQy82SMA6YXxS59UU6pI8AeN/pub?gid=1806942186&single=true&output=csv";

window.GlobalDataService = {
  fetchIndices(force = false) {
  if (!force) {
    const cached = Common.loadCache(GLOBAL_CACHE_KEY);
    if (cached) return Promise.resolve(cached);
  }

  showLoader?.(300);

  return new Promise((resolve, reject) => {
    Papa.parse(GLOBAL_CSV, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const num = v => parseFloat(v) || 0;

          const normalized = data.map(r => ({
            country: r.Country || "",
            index: r.Index || "",
            __ltp: num(r.Ltp),
            __pct: num(r["%change"])
          }));

          Common.saveCache(
            GLOBAL_CACHE_KEY,
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
