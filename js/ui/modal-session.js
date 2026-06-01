/* Modal open/close and autosave */
async function openTileModal(colIndex, tileIndex) {
  if (
    activeModal &&
    (activeModal.colIndex !== colIndex || activeModal.tileIndex !== tileIndex)
  ) {
    const { target } = await finalizeActiveModalSession({
      adjustTarget: { colIndex, tileIndex }
    });
    if (target) {
      colIndex = target.colIndex;
      tileIndex = target.tileIndex;
    }
  }

  const tile = columns[colIndex]?.tiles[tileIndex];
  if (!tile) return;

  activeModal = { colIndex, tileIndex };
  resetModalAiUserSupplement();

  let tileText = tile.text;
  let insertedClipText = "";
  if (!tileText.trim() && settings.autoPasteClipboardOnOpen === true) {
    const clipText = await getInsertableClipboardText();
    if (clipText) {
      tileText = clipText;
      tile.text = clipText;
      insertedClipText = clipText;
      markTileDirty(tile.id);
      syncTileTitleFromText(tile);
      touchTileUpdated(tile);
      clearPendingAddedIfFilled(tile);
      scheduleModalSave();
    }
  }

  setModalEditorContent(tileText);
  modalMarkdownEnabled = shouldOpenModalMarkdownPreview(tileText);
  resetModalAiSupplementPanel();
  updateModalMarkdownView();
  updateObsidianButtonStates();
  updateOpenAiButtonStates();
  updateModalSpeechButtonState();
  updateModalColorSelection(tile);
  updateModalUpdatedLabel();
  updateModalTemplateButtonVisibility(tile);
  updateModalColumnStarButton(colIndex);
  updateModalDeleteButtonVisibility(colIndex);
  renderModalTags();
  tileDialog.showModal();
  setTimeout(() => {
    if (!modalMarkdownEnabled) focusModalEditor();
  }, 0);

  if (insertedClipText) {
    markClipboardInserted(insertedClipText);
    syncBoardTileById(tile.id);
  }
}

function applyExternalColumns(nextColumns, revision) {
  columns = normalizeColumns(nextColumns);
  if (revision) lastAppliedRevision = revision;
  resetDirtyTracking(columns);
  render();
}

function closeTileModal() {
  if (modalAiBusy) return;

  closeTagAddDialog();
  stopModalSpeechInput();

  const snapshot = activeModal;
  if (snapshot) {
    const tile = columns[snapshot.colIndex]?.tiles[snapshot.tileIndex];
    if (tile) syncModalEditorToTile(tile);
  }

  const discarded = snapshot
    ? removePendingAddedTileIfEmpty(snapshot.colIndex, snapshot.tileIndex)
    : false;
  const pruned = snapshot ? pruneEmptyColumns() : false;
  activeModal = null;
  resetModalAiSupplementPanel();
  resetModalAiUserSupplement();

  if (modalSaveTimer) {
    clearTimeout(modalSaveTimer);
    modalSaveTimer = null;
  }

  const finishClose = async () => {
    if (snapshot && !discarded) {
      const tile = columns[snapshot.colIndex]?.tiles[snapshot.tileIndex];
      if (tile) {
        syncModalEditorToTile(tile);
        touchTileUpdated(tile);
      }
    }

    const ok = await saveState();
    if (!ok) console.error("saveState failed on modal close");

    if (discarded || pruned) {
      render();
    } else if (snapshot) {
      const tile = columns[snapshot.colIndex]?.tiles[snapshot.tileIndex];
      if (tile) syncBoardTileById(tile.id);
    }

    renderSidePanels();
    mergePendingIncomingTiles();
  };

  finishClose();

  if (tileDialog.open) tileDialog.close();
}

function scheduleModalSave() {
  if (!activeModal) return;

  const tileId = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex]?.id;

  if (modalSaveTimer) clearTimeout(modalSaveTimer);

  modalSaveTimer = setTimeout(async () => {
    modalSaveTimer = null;
    if (activeModal) {
      const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
      if (tile) {
        syncModalEditorToTile(tile);
        touchTileUpdated(tile);
      }
    }
    const ok = await saveState();
    updateModalUpdatedLabel();
    if (tileId) syncBoardTileById(tileId);
    renderSidePanels();
    if (!hasUnsavedLocalEdits()) mergePendingIncomingTiles();
    if (!ok) console.error("saveState failed during modal autosave");
  }, SAVE_DELAY_MS);
}
