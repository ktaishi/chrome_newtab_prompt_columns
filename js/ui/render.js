/* Board and tile rendering */
async function applyTemplate(templateItem) {
  const target = templateTarget || findFirstEmptySlot();
  const { colIndex, tileIndex } = target;

  columns[colIndex].tiles[tileIndex] = {
    ...columns[colIndex].tiles[tileIndex],
    title: getTileFirstLine(templateItem.text) || templateItem.title,
    text: templateItem.text,
    color: templateItem.color,
    tags: parseTags(columns[colIndex].tiles[tileIndex].tags),
    markdownPreview: false
  };
  touchTileUpdated(columns[colIndex].tiles[tileIndex]);
  markTileDirty(columns[colIndex].tiles[tileIndex].id);
  markStructureDirty();

  templateTarget = null;
  await saveState();
  templateDialog.close();
  render();
  if (activeModal?.colIndex === colIndex && activeModal?.tileIndex === tileIndex && tileDialog.open) {
    const tile = columns[colIndex]?.tiles[tileIndex];
    if (tile) {
      setModalEditorContent(tile.text);
      modalMarkdownEnabled = shouldOpenModalMarkdownPreview(tile.text);
      updateModalMarkdownView();
      updateModalColorSelection(tile);
      updateModalUpdatedLabel();
      updateModalTemplateButtonVisibility(tile);
      renderModalTags();
    }
  }
}

function renderTemplates() {
  templateList.innerHTML = "";

  getPromptTemplates().forEach((item) => {
    const row = document.createElement("div");
    row.className = "template-item";

    const body = document.createElement("div");
    const title = document.createElement("div");
    const desc = document.createElement("div");
    const button = document.createElement("button");

    title.className = "template-item-title";
    desc.className = "template-item-desc";
    button.className = "template-apply";

    title.textContent = item.title;
    desc.textContent = item.description;
    button.textContent = t("template.add");
    button.type = "button";
    button.addEventListener("click", () => applyTemplate(item));

    body.append(title, desc);
    row.append(body, button);
    templateList.appendChild(row);
  });
}

function updateTileTagsOnElement(tileElement, tile) {
  let tagContainer = tileElement.querySelector(".tile-tags");
  if (!tagContainer) {
    const footer = tileElement.querySelector(".tile-footer");
    tagContainer = document.createElement("div");
    tagContainer.className = "tile-tags";
    tileElement.insertBefore(tagContainer, footer);
  }

  tagContainer.innerHTML = "";
  parseTags(tile.tags).slice(0, 4).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tile-tag";
    span.textContent = `#${tag}`;
    tagContainer.appendChild(span);
  });
}

function syncBoardTileById(tileId) {
  const tileElement = document.querySelector(`[data-tile-id="${tileId}"]`);
  if (!tileElement) return;

  let tile = null;
  columns.forEach((column) => {
    column.tiles.forEach((item) => {
      if (item.id === tileId) tile = item;
    });
  });
  if (!tile) return;

  updateTileTitleDisplay(tileElement, tile, Number(tileElement.dataset.tileIndex) || 0);
  tileElement.dataset.color = tile.color || "white";
  tileElement.classList.toggle("is-starred", Boolean(tile.starred));

  updateTileTagsOnElement(tileElement, tile);
  updatePreview(tileElement, tile);

  tileElement.querySelectorAll(".color-chip").forEach((chip) => {
    const selected = chip.dataset.color === tile.color;
    chip.classList.toggle("selected", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });

  const matches = tileMatchesActiveFilter(tile);
  tileElement.classList.toggle("filtered-out", !matches);
  tileElement.classList.toggle("tile-has-body", isTileFilled(tile));

  const colIndex = Number(tileElement.dataset.colIndex);
  if (Number.isFinite(colIndex)) {
    refreshColumnFilledLayout(colIndex);
  }
}

function isClippingColumnIndex(colIndex) {
  return colIndex === MemoBoardShared.findClippingColumnIndex(columns);
}

function mountClippingTileActions(tileElement, tileHeader, tileActions) {
  if (!tileElement || !tileHeader || !tileActions) return;
  tileElement.classList.add("tile-clipping");
  tileHeader.appendChild(tileActions);
}

function renderTile(tile, colIndex, tileIndex) {
  const fragment = tileTemplate.content.cloneNode(true);
  applyI18nToRoot(fragment);
  const tileElement = fragment.querySelector(".tile");
  const copyButton = fragment.querySelector(".copy-button");
  const clearButton = fragment.querySelector(".clear-button");
  const colorChips = fragment.querySelectorAll(".color-chip");
  const footer = fragment.querySelector(".tile-footer");
  const tileHeader = fragment.querySelector(".tile-header");
  const tileActions = fragment.querySelector(".tile-actions");
  const isClippingTile = isClippingColumnIndex(colIndex);

  tileElement.dataset.tileId = tile.id;
  tileElement.dataset.colIndex = String(colIndex);
  tileElement.dataset.tileIndex = String(tileIndex);
  tileElement.dataset.color = tile.color;
  tileElement.classList.toggle("is-starred", Boolean(tile.starred));
  if (isClippingTile) {
    mountClippingTileActions(tileElement, tileHeader, tileActions);
  }

  updateTileTitleDisplay(tileElement, tile, tileIndex);

  const tagContainer = document.createElement("div");
  tagContainer.className = "tile-tags";
  tileElement.insertBefore(tagContainer, footer);

  function updateTileTags() {
    updateTileTagsOnElement(tileElement, tile);
  }

  function updateColorSelection() {
    colorChips.forEach((chip) => {
      const selected = chip.dataset.color === tile.color;
      chip.classList.toggle("selected", selected);
      chip.setAttribute("aria-pressed", String(selected));
    });
  }

  function prefetchClipboardIfEmpty() {
    if (settings.autoPasteClipboardOnOpen !== true) return;
    if (!tile.text.trim()) prefetchClipboardText();
  }

  colorChips.forEach((chip) => {
    chip.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      tile.color = normalizeColor(chip.dataset.color, tile.color || "white");
      tileElement.dataset.color = tile.color;
      updateColorSelection();
      markTileDirty(tile.id);
      scheduleSave(`color-${tile.id}`, tileElement);
    });

    chip.addEventListener("mousedown", (event) => event.stopPropagation());
    chip.addEventListener("dragstart", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  copyButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    try {
      await copyPlainText(tile.text || "", () => {});
      copyButton.classList.add("copied");
      setTimeout(() => copyButton.classList.remove("copied"), 1200);
    } catch (_) {}
  });

  clearButton.addEventListener("click", (event) => {
    event.stopPropagation();
    removeTile(colIndex, tileIndex).catch(() => {});
  });

  [copyButton, clearButton].forEach((button) => {
    button.addEventListener("dragstart", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  function startTileDrag(event) {
    dragged = { colIndex, tileIndex };
    suppressTileClick = true;
    tileElement.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(dragged));
    event.dataTransfer.setData("text/plain", `${colIndex},${tileIndex}`);
  }

  function endTileDrag() {
    dragged = null;
    tileElement.classList.remove("dragging");
    clearDragHighlights();
    setTimeout(() => {
      suppressTileClick = false;
    }, 0);
  }

  tileElement.addEventListener("mousedown", (event) => {
    if (event.target.closest(TILE_INTERACTIVE_SELECTOR)) return;
    prefetchClipboardIfEmpty();
  });

  tileElement.addEventListener("click", (event) => {
    if (suppressTileClick) return;
    if (event.target.closest(TILE_INTERACTIVE_SELECTOR)) return;
    openTileModal(colIndex, tileIndex);
  });

  tileElement.addEventListener("dragstart", (event) => {
    if (event.target.closest(TILE_INTERACTIVE_SELECTOR)) {
      event.preventDefault();
      return;
    }
    startTileDrag(event);
  });

  tileElement.addEventListener("dragend", endTileDrag);

  tileElement.classList.toggle("tile-has-body", isTileFilled(tile));

  updateColorSelection();
  updateTileTags();
  updatePreview(tileElement, tile);
  return fragment;
}

function createColumnAddTileSlot(colIndex) {
  const addSlot = document.createElement("button");
  addSlot.type = "button";
  addSlot.className = "column-add-tile-slot";
  addSlot.setAttribute("aria-label", t("tile.add"));
  addSlot.title = t("tile.add");
  addSlot.innerHTML = `
      <span class="column-add-tile-slot-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6Z"/>
        </svg>
      </span>
    `;
  addSlot.addEventListener("click", () => {
    const tileIndex = addTile(colIndex);
    openTileModal(colIndex, tileIndex).catch((error) => {
      console.error("openTileModal after add failed:", error);
    });
  });
  return addSlot;
}

function applyColumnFilledState(columnElement, column) {
  const filledCount = getFilledTileCount(column);
  columnElement.classList.toggle("column-no-filled", filledCount === 0);
  columnElement.classList.toggle("column-one-filled", filledCount === 1);
  columnElement.classList.toggle("column-multi-filled", filledCount >= 2);
}

function refreshColumnFilledLayout(colIndex) {
  const column = columns[colIndex];
  const columnElement = document.querySelector(`.column[data-col-index="${colIndex}"]`);
  if (!column || !columnElement) return;

  applyColumnFilledState(columnElement, column);

  const columnBody = columnElement.querySelector(".column-body");
  if (!columnBody) return;

  const filledCount = getFilledTileCount(column);
  const addSlot = columnBody.querySelector(".column-add-tile-slot");

  if (filledCount === 0) {
    addSlot?.remove();
    return;
  }

  if (!addSlot) {
    columnBody.appendChild(createColumnAddTileSlot(colIndex));
  }
}

function render() {
  columnsRoot.innerHTML = "";
  const clippingColumnIndex = MemoBoardShared.findClippingColumnIndex(columns);

  columns.forEach((column, colIndex) => {
    const fragment = columnTemplate.content.cloneNode(true);
    applyI18nToRoot(fragment);
    const columnElement = fragment.querySelector(".column");
    const titleInput = fragment.querySelector(".column-title-input");
    const columnBody = fragment.querySelector(".column-body");
    const tileList = fragment.querySelector(".column-tiles");

    columnElement.dataset.colIndex = String(colIndex);
    columnElement.dataset.column = String(colIndex);

    if (colIndex === 0 || colIndex === 1) {
      columnElement.classList.add("column-primary");
    }

    if (colIndex === clippingColumnIndex) {
      columnElement.classList.add("column-clipping");
    }

    if (colIndex >= clippingColumnIndex) {
      columnElement.classList.add("column-clipping-width");
    }

    if (titleInput) {
      titleInput.value = column.title;
      titleInput.placeholder = getDefaultColumnTitles()[colIndex] || `Column ${colIndex + 1}`;

      titleInput.addEventListener("mousedown", (event) => event.stopPropagation());
      titleInput.addEventListener("click", (event) => event.stopPropagation());

      titleInput.addEventListener("input", () => {
        // NOTE: addColumn() 直後は saveState() により columns 配列が差し替わるため、
        // render 時点で閉じ込めた column 参照ではなく最新の columns[colIndex] を更新する。
        const latestColumn = columns[colIndex];
        if (!latestColumn) return;
        latestColumn.title = titleInput.value;
        markStructureDirty();
        scheduleSave(`column-${latestColumn.id || colIndex}`);
        scheduleRenderSidePanels();
      });
    }

    getTilesInDisplayOrder(column).forEach(({ tile, tileIndex }) => {
      const tileFragment = renderTile(tile, colIndex, tileIndex);
      const tileElement = tileFragment.querySelector(".tile");

      if (!tileMatchesActiveFilter(tile)) {
        tileElement.classList.add("filtered-out");
      }

      tileList.appendChild(tileFragment);
    });

    applyColumnFilledState(columnElement, column);
    if (getFilledTileCount(column) > 0 && columnBody) {
      columnBody.appendChild(createColumnAddTileSlot(colIndex));
    }

    mountColumnTileDropZone(columnElement, colIndex, tileList);

    columnsRoot.appendChild(fragment);
  });

  if (columns.length < MAX_COLUMN_COUNT) {
    const addColumnSlot = document.createElement("button");
    addColumnSlot.type = "button";
    addColumnSlot.className = "board-add-column-slot";
    addColumnSlot.setAttribute("aria-label", t("column.add"));
    addColumnSlot.title = t("column.add");
    addColumnSlot.innerHTML = `
      <span class="board-add-column-slot-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6Z"/>
        </svg>
      </span>
    `;
    addColumnSlot.addEventListener("click", () => {
      addColumn();
    });
    columnsRoot.appendChild(addColumnSlot);
  }

  renderSidePanels();
}
