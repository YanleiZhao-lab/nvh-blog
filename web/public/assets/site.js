// NVH Test — 搜索 & 筛选
(function () {
  const group = document.querySelector("[data-filter-group]");
  if (!group) return;

  const cards = group.querySelectorAll("[data-filter-card]");
  const filters = group.querySelectorAll("[data-filter]");
  const searchInput = group.querySelector("[data-search]");
  const emptyState = group.querySelector("[data-empty-state]");
  let activeFilter = "all";

  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let visibleCount = 0;

    cards.forEach(function (card) {
      const category = card.dataset.category || "";
      const tags = card.dataset.tags || "";
      const text = card.textContent.toLowerCase();

      const categoryMatch =
        activeFilter === "all" || category === activeFilter;
      const searchMatch =
        !query ||
        text.includes(query) ||
        tags.toLowerCase().includes(query);

      if (categoryMatch && searchMatch) {
        card.hidden = false;
        visibleCount++;
      } else {
        card.hidden = true;
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? "block" : "none";
    }
  }

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (f) {
        f.setAttribute("aria-pressed", "false");
      });
      btn.setAttribute("aria-pressed", "true");
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  if (searchInput) {
    let timer;
    searchInput.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 150);
    });
  }
})();
