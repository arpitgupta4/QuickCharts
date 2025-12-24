// Js/indianRenderer.js

/* =========================================================
   TRADINGVIEW SYMBOL MAP (DO NOT TOUCH)
   ========================================================= */

const TV_SYMBOL_MAP = {
  "NIFTY_50": "NSE:NIFTY",
  "SENSEX": "BSE:SENSEX",
  "INDIA_VIX": "NSE:INDIAVIX",
  "NIFTY_BANK": "NSE:BANKNIFTY",
  "NIFTY_AUTO": "NSE:CNXAUTO",
  "NIFTY_IT": "NSE:CNXIT",
  "NIFTY_METAL": "NSE:CNXMETAL",
  "NIFTY_REALTY": "NSE:CNXREALTY",
  "NIFTY_FMCG": "NSE:CNXFMCG",
  "NIFTY_PHARMA": "NSE:CNXPHARMA",
  "NIFTY_MEDIA": "NSE:CNXMEDIA",
  "NIFTY_PSU_BANK": "NSE:PSUBANK",
  "NIFTY_FIN_SERVICE": "NSE:FINNIFTY",
  "NIFTY_PVT_BANK": "NSE:NIFTYPVTBANK"
};

/* =========================================================
   DISPLAY NAME MAP (UI ONLY)
   ========================================================= */

const DISPLAY_NAME_MAP = {
  "NIFTY_50": "Nifty 50",
  "SENSEX": "Sensex",
  "INDIA_VIX": "India VIX",
  "NIFTY_BANK": "Bank Nifty",
  "NIFTY_AUTO": "Auto",
  "NIFTY_IT": "IT",
  "NIFTY_METAL": "Metal",
  "NIFTY_REALTY": "Realty",
  "NIFTY_FMCG": "FMCG",
  "NIFTY_PHARMA": "Pharma",
  "NIFTY_MEDIA": "Media",
  "NIFTY_PSU_BANK": "PSU Bank",
  "NIFTY_FIN_SERVICE": "Fin Services",
  "NIFTY_PVT_BANK": "Private Bank"
};

/* =========================================================
   HELPERS
   ========================================================= */

function resolveKey(symbol = "") {
  // Handles "INDEX:NIFTY_50" or "NIFTY_50"
  return symbol.split(":").pop();
}

function resolveTVSymbol(symbol = "") {
  const key = resolveKey(symbol);
  return TV_SYMBOL_MAP[key] || "NSE:NIFTY";
}

function resolveDisplayName(symbol = "") {
  const key = resolveKey(symbol);
  return DISPLAY_NAME_MAP[key] || key.replace(/_/g, " ");
}

/* =========================================================
   RENDERER
   ========================================================= */

window.IndianRenderer = {
  render(container, indices) {
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    indices.forEach(i => {
      const isUp = i.__pct >= 0;

      const tvSymbol = resolveTVSymbol(i.symbol);
      const displayName = resolveDisplayName(i.symbol);

      const card = document.createElement("div");
      card.className =
        "rounded-xl p-4 bg-slate-800/80 border border-slate-700 " +
        "hover:border-purple-500 transition cursor-pointer";

      // 🔗 TradingView click (correct & untouched)
      card.onclick = () => {
        window.open(
          `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`,
          "_blank",
          "noopener"
        );
      };

      card.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <!-- CARD NAME -->
            <h3 class="text-lg font-semibold">
              ${displayName}
            </h3>

            <!-- TYPE -->
            <p class="text-xs text-slate-400">
              Index
            </p>
          </div>

          <div class="text-right">
            <p class="text-lg font-bold">
              ${i.__ltp.toLocaleString("en-IN")}
            </p>
            <p class="${
              isUp ? "text-emerald-400" : "text-red-400"
            } text-sm font-medium">
              ${isUp ? "+" : ""}${i.__pct.toFixed(2)}%
            </p>
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }
};
