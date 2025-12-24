/* =========================================================
   COMMON UTILITIES — SINGLE SOURCE OF TRUTH
   ========================================================= */

window.Common = {
  /* ================= BASIC STORAGE ================= */

  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  load(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  /* ================= CACHE ================= */

  saveCache(key, data, ttlMs) {
    const payload = {
      ts: Date.now(),
      ttl: ttlMs,
      data
    };
    localStorage.setItem(key, JSON.stringify(payload));
  },

  loadCache(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const payload = JSON.parse(raw);
      if (Date.now() - payload.ts > payload.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      return payload.data;
    } catch {
      return null;
    }
  }
};

/* =========================================================
   GLOBAL SMART LOADER (INSTITUTIONAL)
   ========================================================= */

let loaderTimer = null;

window.showLoader = function (delay = 300) {
  clearTimeout(loaderTimer);
  loaderTimer = setTimeout(() => {
    const el = document.getElementById("app-loader");
    if (el) el.classList.remove("hide");
  }, delay);
};

window.hideLoader = function () {
  clearTimeout(loaderTimer);
  const el = document.getElementById("app-loader");
  if (el) el.classList.add("hide");
};

/* =========================================================
   WATCHLIST ENGINE — DATE AWARE (FINAL)
   ========================================================= */

const WATCHLIST_KEY = "qc_watchlist";

/*
Stored format:
{
  "RELIANCE": "2025-12-01T08:21:00.000Z",
  "TCS": "2025-12-02T10:44:00.000Z"
}
*/

Common.watchlist = {
  /* ----- Core ----- */

getAll() {
  const raw = Common.load(WATCHLIST_KEY, {});

  // 🔥 AUTO-MIGRATION (ARRAY → OBJECT)
  if (Array.isArray(raw)) {
    const migrated = {};
    raw.forEach(sym => {
      migrated[sym] = new Date().toISOString();
    });
    Common.save(WATCHLIST_KEY, migrated);
    return migrated;
  }

  return raw;
},


  has(symbol) {
    const list = this.getAll();
    return !!list[symbol];
  },

  getDate(symbol) {
    const list = this.getAll();
    return list[symbol] || null;
  },

  add(symbol) {
    const list = this.getAll();
    if (!list[symbol]) {
      list[symbol] = new Date().toISOString();
      Common.save(WATCHLIST_KEY, list);
    }
  },

  remove(symbol) {
    const list = this.getAll();
    delete list[symbol];
    Common.save(WATCHLIST_KEY, list);
  },

  toggle(symbol) {
    this.has(symbol)
      ? this.remove(symbol)
      : this.add(symbol);
  },

  clear() {
    Common.remove(WATCHLIST_KEY);
  }
};

/* =========================================================
   WATCHLIST DATE FORMATTER
   ========================================================= */

window.formatWatchDate = function (iso) {
  if (!iso) return "-";

  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit"
  });
};

/* =========================================================
   LIVE WATCHLIST SYNC (MULTI-TAB / PAGE)
   ========================================================= */

window.addEventListener("storage", e => {
  if (e.key === WATCHLIST_KEY) {
    // 🔥 Auto-refresh watchlist across pages
    location.reload();
  }
});
/* =========================================================
   WATCHLIST CHANGE EVENT (INTERNAL BUS)
   ========================================================= */

Common.watchlist._listeners = [];

Common.watchlist._emit = function () {
  this._listeners.forEach(fn => fn());
};

Common.watchlist.onChange = function (fn) {
  this._listeners.push(fn);
};

/* ---- Hook into mutations ---- */

const _add = Common.watchlist.add;
const _remove = Common.watchlist.remove;
const _clear = Common.watchlist.clear;

Common.watchlist.add = function (symbol) {
  _add.call(this, symbol);
  this._emit();
};

Common.watchlist.remove = function (symbol) {
  _remove.call(this, symbol);
  this._emit();
};

Common.watchlist.clear = function () {
  _clear.call(this);
  this._emit();
};
