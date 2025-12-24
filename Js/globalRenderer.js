// Js/globalRenderer.js
window.GlobalRenderer = {
  render(container, indices) {
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    indices.forEach(i => {
      const isUp = i.__pct >= 0;

      const card = document.createElement("div");
      card.className =
        "rounded-xl p-4 bg-slate-800/80 border border-slate-700 hover:border-purple-500 transition";

      card.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-semibold">${i.index}</h3>
            <p class="text-xs text-slate-400">${i.country}</p>
          </div>

          <div class="text-right">
            <p class="text-lg font-bold">${i.__ltp.toLocaleString()}</p>
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
