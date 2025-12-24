// Js/indian.js
const grid = document.getElementById("indian-grid");

(async () => {
  try {
    const data = await IndianDataService.fetchIndices();
    IndianRenderer.render(grid, data);
  } catch (e) {
    console.error(e);
    grid.innerHTML =
      "<div class='text-red-400'>Failed to load Indian indices</div>";
  }
})();
