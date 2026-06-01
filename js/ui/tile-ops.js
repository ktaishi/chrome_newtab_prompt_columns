/* Add, remove, move tiles and drag-and-drop */
function confirmTileDelete(displayTitle) {
  if (!deleteConfirmDialog || !deleteConfirmMessage) {
    const confirmFn = typeof confirm === "function" ? confirm : () => true;
    return Promise.resolve(confirmFn(`「${displayTitle}」を削除します。よろしいですか？`));
  }

  deleteConfirmMessage.textContent = t("delete.message", { title: displayTitle });

  return new Promise((resolve) => {
    deleteConfirmDialog.addEventListener(
      "close",
      () => {
        resolve(deleteConfirmDialog.returnValue === "confirm");
      },
      { once: true }
    );
    deleteConfirmDialog.showModal();
    deleteConfirmDialog.querySelector('button[value="confirm"]')?.focus();
  });
}

async function removeTile(colIndex, tileIndex) {
  const column = columns[colIndex];
  const tile = column?.tiles[tileIndex];
  if (!tile) return;

  const ok = await confirmTileDelete(getTileDisplayTitle(tile, "") || "このタイル");
  if (!ok) return;

  if (activeModal?.colIndex === colIndex && activeModal?.tileIndex === tileIndex) {
    if (modalSaveTimer) {
      clearTimeout(modalSaveTimer);
      modalSaveTimer = null;
    }
    activeModal = null;
    if (tileDialog.open) tileDialog.close();
  }

  column.tiles.splice(tileIndex, 1);
  markStructureDirty();
  ensureColumnHasTile(colIndex);
  pruneEmptyColumns();
  await saveState();
  render();
}

function parseDragPayload(event) {
  let from = dragged;
  try {
    const parsed = JSON.parse(event.dataTransfer.getData("application/json"));
    if (parsed && Number.isInteger(parsed.colIndex) && Number.isInteger(parsed.tileIndex)) {
      from = parsed;
    }
  } catch (_) {}
  return from;
}

let tileDropIndicator = null;

function ensureTileDropIndicator() {
  if (!tileDropIndicator) {
    tileDropIndicator = document.createElement("div");
    tileDropIndicator.className = "tile-drop-indicator";
    tileDropIndicator.hidden = true;
    tileDropIndicator.setAttribute("aria-hidden", "true");
  }
  return tileDropIndicator;
}

function clearTileDropIndicator() {
  tileDropTarget = null;
  if (tileDropIndicator) {
    tileDropIndicator.hidden = true;
  }
}

function isPointerOverTileList(event, tileList) {
  const rect = tileList.getBoundingClientRect();
  return event.clientY >= rect.top && event.clientY <= rect.bottom;
}

function resolveTileInsertTarget(event, colIndex, tileList) {
  const y = event.clientY;
  const columnLength = columns[colIndex]?.tiles.length ?? 0;
  const tiles = [...tileList.querySelectorAll(".tile:not(.dragging)")];

  if (tiles.length === 0) {
    return { colIndex, tileIndex: 0 };
  }

  for (const tile of tiles) {
    const rect = tile.getBoundingClientRect();
    const index = Number(tile.dataset.tileIndex);
    if (!Number.isInteger(index)) continue;
    if (y < rect.top + rect.height / 2) {
      return { colIndex, tileIndex: index };
    }
  }

  const lastIndex = Number(tiles[tiles.length - 1].dataset.tileIndex);
  if (Number.isInteger(lastIndex)) {
    return { colIndex, tileIndex: lastIndex + 1 };
  }

  return { colIndex, tileIndex: columnLength };
}

function showTileDropIndicator(tileList, insertIndex) {
  const indicator = ensureTileDropIndicator();
  if (indicator.parentElement !== tileList) {
    tileList.appendChild(indicator);
  }

  const listRect = tileList.getBoundingClientRect();
  const gapHalf = 5;
  const targetTile = tileList.querySelector(`.tile[data-tile-index="${insertIndex}"]:not(.dragging)`);
  let top;

  if (targetTile) {
    const rect = targetTile.getBoundingClientRect();
    top = rect.top - listRect.top - gapHalf - 1.5;
  } else {
    const tiles = [...tileList.querySelectorAll(".tile:not(.dragging)")];
    if (tiles.length === 0) {
      top = 0;
    } else {
      const lastRect = tiles[tiles.length - 1].getBoundingClientRect();
      top = lastRect.bottom - listRect.top + gapHalf - 1.5;
    }
  }

  indicator.style.top = `${Math.max(0, top)}px`;
  indicator.hidden = false;
}

function updateTileDropPreview(event, colIndex, tileList) {
  const target = resolveTileInsertTarget(event, colIndex, tileList);
  tileDropTarget = target;
  if (isPointerOverTileList(event, tileList)) {
    showTileDropIndicator(tileList, target.tileIndex);
  } else if (tileDropIndicator) {
    tileDropIndicator.hidden = true;
  }
  return target;
}

function mountColumnTileDropZone(columnElement, colIndex, tileList) {
  columnElement.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    updateTileDropPreview(event, colIndex, tileList);
  });

  columnElement.addEventListener("dragleave", (event) => {
    const next = event.relatedTarget;
    if (!next || !columnElement.contains(next)) {
      clearTileDropIndicator();
    }
  });

  columnElement.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const target = tileDropTarget || resolveTileInsertTarget(event, colIndex, tileList);
    clearTileDropIndicator();
    moveTile(parseDragPayload(event), target);
  });
}

function clearDragHighlights() {
  document.querySelectorAll(".dragging").forEach((el) => {
    el.classList.remove("dragging");
  });
  clearTileDropIndicator();
}

function moveTile(from, to) {
  if (!from || !to) return;

  const fromCol = Number(from.colIndex);
  const fromTile = Number(from.tileIndex);
  const toCol = Number(to.colIndex);
  let toTile = Number(to.tileIndex);

  if (!Number.isInteger(fromCol) || !Number.isInteger(fromTile) || !Number.isInteger(toCol) || !Number.isInteger(toTile)) {
    return;
  }

  const sourceColumn = columns[fromCol];
  const targetColumn = columns[toCol];
  if (!sourceColumn || !targetColumn) return;
  if (fromCol === toCol && fromTile === toTile) return;

  const [movedTile] = sourceColumn.tiles.splice(fromTile, 1);
  if (!movedTile) return;

  if (fromCol === toCol && fromTile < toTile) {
    toTile -= 1;
  }

  const insertIndex = Math.min(Math.max(0, toTile), targetColumn.tiles.length);
  targetColumn.tiles.splice(insertIndex, 0, movedTile);
  if (sourceColumn.tiles.length === 0) {
    ensureColumnHasTile(fromCol);
  }
  markStructureDirty();
  pruneEmptyColumns();
  render();
  saveState().then((ok) => {
    if (!ok) console.error("saveState failed after moveTile");
  });
}

function isColumnEmpty(column) {
  if (!column) return true;
  if (!Array.isArray(column.tiles) || column.tiles.length === 0) return true;
  return column.tiles.every((tile) => !String(tile?.text || "").trim());
}

function adjustActiveModalForColumnRemoval(removedColIndex) {
  if (!activeModal) return;

  if (activeModal.colIndex === removedColIndex) {
    if (modalSaveTimer) {
      clearTimeout(modalSaveTimer);
      modalSaveTimer = null;
    }
    activeModal = null;
    if (tileDialog?.open) tileDialog.close();
    return;
  }

  if (activeModal.colIndex > removedColIndex) {
    activeModal = {
      colIndex: activeModal.colIndex - 1,
      tileIndex: activeModal.tileIndex
    };
  }
}

function removeColumnAt(colIndex) {
  if (colIndex < COLUMN_COUNT || colIndex < 0 || colIndex >= columns.length) return false;
  adjustActiveModalForColumnRemoval(colIndex);
  columns.splice(colIndex, 1);
  return true;
}

function pruneEmptyColumns() {
  let changed = false;

  for (let colIndex = columns.length - 1; colIndex >= COLUMN_COUNT; colIndex -= 1) {
    if (!isColumnEmpty(columns[colIndex])) continue;
    if (removeColumnAt(colIndex)) changed = true;
  }

  if (changed) markStructureDirty();
  return changed;
}

function ensureColumnHasTile(colIndex) {
  const column = columns[colIndex];
  if (!column || column.tiles.length > 0) return false;
  column.tiles.push(makeTile(colIndex, 0));
  return true;
}

function updateTileStarButton(starButton, tile) {
  if (!starButton) return;
  const starred = Boolean(tile?.starred);
  starButton.classList.toggle("is-starred", starred);
  starButton.setAttribute("aria-pressed", String(starred));
  starButton.title = starred ? t("tile.unstar") : t("tile.star");
  starButton.setAttribute("aria-label", starred ? t("tile.unstar") : t("tile.star"));

  const icon = starButton.querySelector(".column-star-icon");
  if (icon) icon.textContent = starred ? "★" : "☆";
}

function updateColumnStarButton(starButton, column, colIndex) {
  if (!starButton) return;
  const starred = getColumnStarVisualState(column, colIndex);
  starButton.classList.toggle("is-starred", starred);
  starButton.setAttribute("aria-pressed", String(starred));
  starButton.title = starred ? t("tile.unstar") : t("tile.star");
  starButton.setAttribute("aria-label", starred ? t("tile.unstar") : t("tile.star"));

  const icon = starButton.querySelector(".column-star-icon");
  if (icon) icon.textContent = starred ? "★" : "☆";
}

function updateModalColumnStarButton(colIndex = activeModal?.colIndex) {
  if (!modalColumnStarButton) return;

  if (!activeModal || activeModal.colIndex !== colIndex) {
    modalColumnStarButton.hidden = true;
    return;
  }

  const tile = columns[colIndex]?.tiles[activeModal.tileIndex];
  if (!tile) {
    modalColumnStarButton.hidden = true;
    return;
  }

  modalColumnStarButton.hidden = false;
  updateTileStarButton(modalColumnStarButton, tile);
}

function toggleTileStar(colIndex, tileIndex) {
  const tile = columns[colIndex]?.tiles[tileIndex];
  if (!tile) return;

  tile.starred = !tile.starred;
  markTileDirty(tile.id);
  markStructureDirty();
  render();
  updateModalColumnStarButton(colIndex);
  saveState().then((ok) => {
    if (!ok) console.error("saveState failed after toggleTileStar");
  });
}

function addColumn() {
  if (columns.length >= MAX_COLUMN_COUNT) return false;

  const colIndex = columns.length;
  columns.push({
    id: id(),
    title: getDefaultColumnTitles()[colIndex] || `Column ${colIndex + 1}`,
    tiles: [makeTile(colIndex, 0)]
  });
  markStructureDirty();
  render();
  saveState().then((ok) => {
    if (!ok) console.error("saveState failed after addColumn");
  });
  return true;
}

function addTile(colIndex) {
  discardEmptyPendingAddedTilesInColumn(colIndex);
  const tileIndex = columns[colIndex].tiles.length;
  const tile = makeTile(colIndex, tileIndex);
  pendingAddedTileIds.add(tile.id);
  columns[colIndex].tiles.push(tile);
  markStructureDirty();
  render();
  saveState().then((ok) => {
    if (!ok) console.error("saveState failed after addTile");
  });
  return tileIndex;
}

function findFirstEmptySlot() {
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const tileIndex = columns[colIndex].tiles.findIndex((tile) => !tile.text.trim());
    if (tileIndex !== -1) return { colIndex, tileIndex };
  }

  const colIndex = 0;
  columns[colIndex].tiles.push(makeTile(colIndex, columns[colIndex].tiles.length));
  return { colIndex, tileIndex: columns[colIndex].tiles.length - 1 };
}
