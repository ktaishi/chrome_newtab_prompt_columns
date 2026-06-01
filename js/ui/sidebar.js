/* Tag filter, filled tile list, templates */
let sidePanelRenderTimer = null;
const SIDE_PANEL_RENDER_DELAY_MS = 150;

function scheduleRenderSidePanels() {
  if (sidePanelRenderTimer) {
    clearTimeout(sidePanelRenderTimer);
  }

  sidePanelRenderTimer = setTimeout(() => {
    sidePanelRenderTimer = null;
    renderSidePanels();
  }, SIDE_PANEL_RENDER_DELAY_MS);
}

function renderSidePanelsNow() {
  if (sidePanelRenderTimer) {
    clearTimeout(sidePanelRenderTimer);
    sidePanelRenderTimer = null;
  }
  renderSidePanels();
}
function getAllTags() {
  const tags = new Set();

  columns.forEach((column) => {
    column.tiles.forEach((tile) => {
      parseTags(tile.tags).forEach((tag) => tags.add(tag));
    });
  });

  return [...tags].sort((a, b) => a.localeCompare(b, "ja"));
}

function tileMatchesActiveFilter(tile) {
  if (!settings.activeTagFilter) return true;
  return parseTags(tile.tags).includes(settings.activeTagFilter);
}

function updateTagFilterPanelState() {
  if (!tagFilterPanel || !tagFilterToggle || !tagFilterIndicator) return;

  tagFilterPanel.hidden = !settings.tagFilterOpen;
  tagFilterToggle.setAttribute("aria-expanded", String(settings.tagFilterOpen));
  tagFilterIndicator.textContent = settings.tagFilterOpen ? "−" : "＋";

  if (clearTagFilterButton) {
    clearTagFilterButton.hidden = !settings.activeTagFilter;
  }

  if (sidebarCollapsedTagButton) {
    sidebarCollapsedTagButton.classList.toggle("active", Boolean(settings.activeTagFilter));
  }
}

function setActiveTagFilter(tag) {
  settings.activeTagFilter = tag || "";
  saveState().then((ok) => {
    if (!ok) console.error("saveState failed after setActiveTagFilter");
    render();
  });
}

function renderTagFilterList() {
  if (!tagFilterList) return;

  tagFilterList.innerHTML = "";
  const tags = getAllTags();

  if (tags.length === 0) {
    return;
  }

  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.className = "tag-filter-chip";
    button.type = "button";
    button.textContent = `#${tag}`;
    button.title = `#${tag}`;
    button.classList.toggle("active", settings.activeTagFilter === tag);
    button.addEventListener("click", () => setActiveTagFilter(tag));
    tagFilterList.appendChild(button);
  });
}

function renderFilledTileList() {
  if (!filledTileList) return;

  filledTileList.innerHTML = "";

  if (activeFilterLabel) {
    if (settings.activeTagFilter) {
      activeFilterLabel.hidden = false;
      activeFilterLabel.textContent = t("sidebar.filterActive", { tag: settings.activeTagFilter });
    } else {
      activeFilterLabel.hidden = true;
      activeFilterLabel.textContent = "";
    }
  }

  filledTileList.hidden = !settings.activeTagFilter;
  if (!settings.activeTagFilter) return;

  const filled = [];
  columns.forEach((column, colIndex) => {
    column.tiles.forEach((tile, tileIndex) => {
      if (tile.text.trim() && tileMatchesActiveFilter(tile)) {
        filled.push({ column, tile, colIndex, tileIndex });
      }
    });
  });

  if (filled.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-list";
    empty.textContent = settings.activeTagFilter
      ? t("sidebar.noTilesForTag", { tag: settings.activeTagFilter })
      : t("sidebar.noFilledTiles");
    filledTileList.appendChild(empty);
    return;
  }

  filled.forEach(({ column, tile, colIndex, tileIndex }) => {
    const button = document.createElement("button");
    const title = document.createElement("span");
    const sub = document.createElement("span");
    const tags = document.createElement("span");

    button.className = "filled-tile-item";
    title.className = "filled-tile-title";
    sub.className = "filled-tile-sub";
    tags.className = "filled-tile-tags";

    title.textContent = getTileSidebarTitle(tile);
    sub.textContent = `${column.title} / ${tile.text.replace(/\s+/g, " ").slice(0, 120)}`;
    tags.textContent = formatTags(tile.tags);
    button.title = `${getTileSidebarTitle(tile)}\n${tile.text.replace(/\s+/g, " ").slice(0, 240)}`;

    button.addEventListener("click", () => openTileModal(colIndex, tileIndex));

    button.append(title, sub);
    if (tags.textContent) button.appendChild(tags);
    filledTileList.appendChild(button);
  });
}

function renderSidePanels() {
  renderTagFilterList();
  updateTagFilterPanelState();
  renderFilledTileList();
}
