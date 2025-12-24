// Js/global.js
const grid = document.getElementById("global-grid");

(async () => {
  try {
    const data = await GlobalDataService.fetchIndices();
    GlobalRenderer.render(grid, data);
  } catch (e) {
    console.error(e);
    grid.innerHTML =
      "<div class='text-red-400'>Failed to load global indices</div>";
  }
})();
