/* Event listeners and bootstrap */
if (modalColorPalette) {
  modalColorPalette.querySelectorAll(".color-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (!activeModal) return;
      const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
      if (!tile) return;
      tile.color = normalizeColor(chip.dataset.color, tile.color || "white");
      updateModalColorSelection(tile);
      markTileDirty(tile.id);
      scheduleModalSave();
      syncBoardTileById(tile.id);
    });
  });
}

/* Event listeners and bootstrap (continued) */
if (templateDialog) {
  templateDialog.addEventListener("close", () => {
    templateTarget = null;
  });
}

if (deleteConfirmDialog) {
  deleteConfirmDialog.addEventListener("click", (event) => {
    if (event.target === deleteConfirmDialog) deleteConfirmDialog.close("cancel");
  });
  deleteConfirmDialog.querySelector(".delete-cancel-button")?.addEventListener("click", () => {
    deleteConfirmDialog.close("cancel");
  });
}

function openObsidianTokenHelp() {
  if (!obsidianTokenHelpDialog) return;
  obsidianTokenHelpDialog.showModal();
}

function closeObsidianTokenHelp() {
  obsidianTokenHelpDialog?.close();
}

async function openExtensionDetails() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "OPEN_EXTENSION_DETAILS" });
    if (response?.ok === false) {
      throw new Error(response.error || "拡張機能の詳細を開けませんでした。");
    }
  } catch (error) {
    console.error("openExtensionDetails failed:", error);
    alert(t("extension.openFailed"));
  }
}

if (openExtensionDetailsButton) {
  openExtensionDetailsButton.addEventListener("click", openExtensionDetails);
}

if (openSupportPaymentButton) {
  openSupportPaymentButton.addEventListener("click", openSupportPaymentPage);
}

if (openaiPromptResetButton) {
  openaiPromptResetButton.addEventListener("click", () => {
    resetOpenAiPromptFieldsToDefaults();
  });
}

if (obsidianTokenHelpButton) {
  obsidianTokenHelpButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openObsidianTokenHelp();
  });
}

if (obsidianTokenHelpCloseButton) {
  obsidianTokenHelpCloseButton.addEventListener("click", closeObsidianTokenHelp);
}

if (obsidianTokenHelpDialog) {
  obsidianTokenHelpDialog.addEventListener("click", (event) => {
    if (event.target === obsidianTokenHelpDialog) closeObsidianTokenHelp();
  });

  obsidianTokenHelpDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && obsidianTokenHelpDialog.open) closeObsidianTokenHelp();
  });
}

settingsButton.addEventListener("click", openSettings);
settingsSaveButton.addEventListener("click", saveSettings);
if (settingsUiLocaleSelect) {
  settingsUiLocaleSelect.addEventListener("change", () => {
    applyLocale(settingsUiLocaleSelect.value);
    populateOpenAiPromptFields();
  });
}
obsidianSaveButton.addEventListener("click", saveAllFilledTilesToObsidian);
if (sidebarObsidianSyncButton) {
  sidebarObsidianSyncButton.addEventListener("click", saveAllFilledTilesToObsidian);
}
if (jsonBackupButton) {
  jsonBackupButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    downloadJsonBackup().catch((error) => {
      console.error("downloadJsonBackup failed:", error);
      alert(t("backup.exportFailed"));
    });
  });
}
if (jsonImportButton) {
  jsonImportButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    pickAndImportJsonBackup().catch((error) => {
      console.error("pickAndImportJsonBackup failed:", error);
      alert(t("backup.readFailed"));
    });
  });
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", async () => {
    document.body.classList.toggle("sidebar-collapsed");
    settings.sidebarCollapsed = document.body.classList.contains("sidebar-collapsed");
    updateSidebarToggleLabel();
    await saveState();
  });
}

async function expandSidebarAndOpenTagFilter() {
  if (document.body.classList.contains("sidebar-collapsed")) {
    document.body.classList.remove("sidebar-collapsed");
    settings.sidebarCollapsed = false;
    updateSidebarToggleLabel();
  }

  settings.tagFilterOpen = true;
  updateTagFilterPanelState();
  await saveState();
}

if (sidebarCollapsedTagButton) {
  sidebarCollapsedTagButton.addEventListener("click", expandSidebarAndOpenTagFilter);
}

if (sidebarCollapsedSettingsButton) {
  sidebarCollapsedSettingsButton.addEventListener("click", openSettings);
}

if (tagFilterToggle) {
  tagFilterToggle.addEventListener("click", async () => {
    settings.tagFilterOpen = !settings.tagFilterOpen;
    updateTagFilterPanelState();
    await saveState();
  });
}

if (clearTagFilterButton) {
  clearTagFilterButton.addEventListener("click", () => setActiveTagFilter(""));
}

if (modalAiChatOpenButton) {
  modalAiChatOpenButton.addEventListener("click", () => {
    showModalAiChatOverlay();
  });
}

if (modalAiChatCloseButton) {
  modalAiChatCloseButton.addEventListener("click", () => {
    dismissModalAiChatOverlay();
  });
}

if (modalAiChatCancelButton) {
  modalAiChatCancelButton.addEventListener("click", () => {
    dismissModalAiChatOverlay();
  });
}

if (modalAiChatOverlay) {
  modalAiChatOverlay.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-ai-chat-backdrop")) {
      dismissModalAiChatOverlay();
    }
  });
}

if (modalAiSupplementSendButton) {
  modalAiSupplementSendButton.addEventListener("click", () => {
    submitModalAiSupplement().catch((error) => {
      console.error("submitModalAiSupplement failed:", error);
    });
  });
}

if (modalAiSupplementInput) {
  modalAiSupplementInput.addEventListener("input", () => {
    updateModalAiSupplementFieldState();
  });

  modalAiSupplementInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    submitModalAiSupplement().catch((error) => {
      console.error("submitModalAiSupplement failed:", error);
    });
  });
}

if (modalTagAddToggle) {
  modalTagAddToggle.addEventListener("click", () => {
    openTagAddDialog();
  });
}

if (tagAddDialog) {
  const tagAddCancelButton = tagAddDialog.querySelector(".tag-add-cancel-button");

  tagAddCancelButton?.addEventListener("click", () => {
    tagAddDialog.close("cancel");
  });

  tagAddInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    tagAddDialog.close("confirm");
  });

  tagAddDialog.addEventListener("close", () => {
    if (tagAddDialog.returnValue === "confirm") {
      applyTagAddDialog();
    }
    resetTagAddDialogState();
  });
}

modalMarkdownPreview.addEventListener("click", (event) => {
  if (!activeModal || !modalMarkdownEnabled) return;
  if (event.target.closest("a")) return;
  switchModalToEditMode();
});

function bindModalPreviewEditKeydown(element) {
  if (!element) return;
  element.addEventListener("keydown", (event) => {
    handleModalPreviewEditKeydown(event);
  });
}

bindModalPreviewEditKeydown(modalMarkdownPreview);
bindModalPreviewEditKeydown(modalEditorScroll);
if (tileDialog) {
  tileDialog.addEventListener("keydown", (event) => {
    handleModalPreviewEditKeydown(event);
  });
}

modalTextarea.addEventListener("keydown", (event) => {
  handleModalTextareaKeydown(event);
});

modalTextarea.addEventListener("input", () => {
  if (!activeModal) return;
  const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
  if (!tile) return;

  updateModalYoutubeSection(getModalTextFromUi());
  syncModalEditorToTile(tile);
  updateModalMarkdownView();
  updateModalTemplateButtonVisibility(tile);
  updateModalContentDependentButtons();
  updateModalAiSupplementFieldState();
  scheduleModalSave();
});

modalMarkdownToggle.addEventListener("click", () => {
  if (modalMarkdownToggle.disabled) return;

  modalMarkdownEnabled = !modalMarkdownEnabled;
  updateModalMarkdownView();
});

if (modalTemplateButton) {
  modalTemplateButton.addEventListener("click", () => {
    if (!activeModal) return;
    templateTarget = { colIndex: activeModal.colIndex, tileIndex: activeModal.tileIndex };
    renderTemplates();
    templateDialog.showModal();
  });
}

if (modalSpeechButton) {
  modalSpeechButton.addEventListener("click", () => {
    if (!activeModal || modalAiBusy) return;
    toggleModalSpeechInput().catch((error) => {
      console.error("toggleModalSpeechInput failed:", error);
      stopModalSpeechInput();
      alert(t("modal.speechErrorGeneric"));
    });
  });
}

if (modalAiButton) {
  modalAiButton.addEventListener("click", () => {
    handleModalAiSummary().catch((error) => {
      console.error("handleModalAiSummary failed:", error);
    });
  });
}

modalAiActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const actionId = button.dataset.aiAction;
    if (!actionId || modalAiBusy) return;
    hideModalAiActionButtons();
    handleModalAiSummary(actionId).catch((error) => {
      console.error("handleModalAiSummary failed:", error);
    });
  });
});

if (modalAiSupplementPanel) {
  modalAiSupplementPanel.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-ai-action-backdrop")) {
      dismissModalAiActionOverlay();
    }
  });
}

if (modalCopyButton) {
  modalCopyButton.addEventListener("click", async () => {
    try {
      await copyPlainText(getModalTextFromUi(), () => {});
    } catch (error) {
      console.error("copy failed:", error);
    }
  });
}

if (modalDeleteButton) {
  modalDeleteButton.addEventListener("click", () => {
    if (!activeModal || modalAiBusy) return;
    removeTile(activeModal.colIndex, activeModal.tileIndex).catch((error) => {
      console.error("removeTile failed:", error);
    });
  });
}

function updateModalDeleteButtonVisibility(colIndex = activeModal?.colIndex) {
  if (!modalDeleteButton) return;
  const show = Number.isInteger(colIndex)
    && colIndex === MemoBoardShared.findClippingColumnIndex(columns);
  modalDeleteButton.hidden = !show;
}

if (modalColumnStarButton) {
  modalColumnStarButton.addEventListener("click", () => {
    if (!activeModal) return;
    toggleTileStar(activeModal.colIndex, activeModal.tileIndex);
  });
}

tileDialog.addEventListener("click", (event) => {
  if (modalAiBusy) return;
  if (event.target === tileDialog) closeTileModal();
});

document.addEventListener("keydown", (event) => {
  if (modalAiBusy) return;
  if (event.key === "Escape" && deleteConfirmDialog?.open) return;
  if (event.key === "Escape" && tagAddDialog?.open) return;
  if (event.key === "Escape" && isModalAiChatOverlayVisible()) {
    dismissModalAiChatOverlay();
    return;
  }
  if (event.key === "Escape" && isModalAiSupplementPanelVisible()) {
    dismissModalAiActionOverlay();
    return;
  }
  if (event.key === "Escape" && tileDialog.open) closeTileModal();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || suppressStorageSync) return;

  const columnsChange = changes[STORAGE_KEY];
  if (!columnsChange?.newValue) return;

  const revisionChange = changes[STORAGE_REVISION_KEY];
  const nextRevision = Number(revisionChange?.newValue) || 0;
  if (nextRevision && nextRevision <= lastAppliedRevision) return;

  if (hasUnsavedLocalEdits()) {
    handleExternalColumnsUpdate(columnsChange.newValue, nextRevision);
    return;
  }

  applyExternalColumns(columnsChange.newValue, nextRevision);
});

document.addEventListener("DOMContentLoaded", async () => {
  columns = await loadState();
  if (pruneEmptyColumns()) {
    await saveState();
  }
  await loadStorageRevision();
  resetDirtyTracking(columns);
  initClipboardTracking();

  if (sidebarToggle) {
    document.body.classList.toggle("sidebar-collapsed", Boolean(settings.sidebarCollapsed));
  }

  await maybeAutoBackup();
  applyLocale(settings.uiLocale);

  window.addEventListener("resize", () => {
    updateSidebarToggleLabel();
  });
});
