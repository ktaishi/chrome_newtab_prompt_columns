/* Modal editor split, sync, and preview helpers */
function updateYouTubeThumbnail(anchor, text) {
  if (!anchor) return;

  const videoId = extractYouTubeVideoId(text);
  const img = anchor.querySelector("img");

  if (!videoId) {
    anchor.hidden = true;
    anchor.removeAttribute("href");
    if (img) img.removeAttribute("src");
    return;
  }

  anchor.hidden = false;
  anchor.href = youtubeWatchUrl(videoId);
  if (img) img.src = youtubeThumbUrl(videoId);
}

function getModalHeadingLine(text) {
  const firstLine = getTileFirstLine(text);
  return /^#{1,6}\s+\S/.test(firstLine) ? firstLine : "";
}

function getModalTitlePlain(text) {
  const headingLine = getModalHeadingLine(text);
  if (!headingLine) return "";
  return headingLine.replace(/^#+\s*/, "").trim();
}

function getModalBodyText(text) {
  const lines = String(text || "").split("\n");
  const firstLine = lines[0]?.trim() || "";
  if (!/^#{1,6}\s+\S/.test(firstLine)) return String(text || "");
  return lines.slice(1).join("\n").replace(/^\n/, "");
}

function shouldTreatFirstLineAsPreviewHeading(firstLine) {
  if (!firstLine || firstLine === "---") return false;
  if (/^#{1,6}\s+\S/.test(firstLine)) return false;
  if (/^(-|\*|\+|\d+\.)\s+\S/.test(firstLine)) return false;
  if (/^>\s+\S/.test(firstLine)) return false;
  if (/^```/.test(firstLine)) return false;
  return true;
}

function ensureFirstLineMarkdownHeading(text) {
  const full = String(text || "").trim();
  if (!full) return "";

  const lines = full.split("\n");
  const firstLine = lines[0]?.trim() || "";
  if (!shouldTreatFirstLineAsPreviewHeading(firstLine)) {
    return full;
  }

  const titlePlain = firstLine.replace(/^#+\s*/, "").trim();
  if (!titlePlain) return full;

  if (lines.length === 1) {
    return `# ${titlePlain}`;
  }

  return `# ${titlePlain}\n${lines.slice(1).join("\n")}`;
}

function updateModalYoutubeSection(text) {
  const normalized = String(text || "");
  const videoId = extractYouTubeVideoId(normalized);

  if (modalTitleSection) {
    if (videoId) {
      modalTitleSection.removeAttribute("hidden");
    } else {
      modalTitleSection.setAttribute("hidden", "");
    }
  }

  updateYouTubeThumbnail(modalYoutubeThumb, normalized);
}

function updateModalTextareaPlaceholder() {
  modalTextarea.placeholder = t("modal.titlePlaceholder");
}

function getModalTextFromUi() {
  return modalTextarea.value;
}

function setModalEditorPreviewContent(text) {
  modalTextarea.value = String(text || "");
  updateModalYoutubeSection(text);
  updateModalTextareaPlaceholder();
}

function setModalEditorContent(text) {
  modalTextarea.value = String(text || "");
  updateModalYoutubeSection(text);
  updateModalTextareaPlaceholder();
}

function syncModalEditorToTile(tile) {
  if (!tile) return;
  tile.text = getModalTextFromUi();
  syncTileTitleFromText(tile);
  markTileDirty(tile.id);
  clearPendingAddedIfFilled(tile);
}

function isTileTextEmpty(tile) {
  return !String(tile?.text || "").trim();
}

function clearPendingAddedIfFilled(tile) {
  if (tile?.id && !isTileTextEmpty(tile)) {
    pendingAddedTileIds.delete(tile.id);
  }
}

function removePendingAddedTileIfEmpty(colIndex, tileIndex) {
  const column = columns[colIndex];
  const tile = column?.tiles[tileIndex];
  if (!tile || !pendingAddedTileIds.has(tile.id) || !isTileTextEmpty(tile)) {
    return false;
  }

  pendingAddedTileIds.delete(tile.id);
  column.tiles.splice(tileIndex, 1);
  ensureColumnHasTile(colIndex);
  pruneEmptyColumns();
  return true;
}

function discardEmptyPendingAddedTilesInColumn(colIndex, exceptTileIndex = -1) {
  const column = columns[colIndex];
  if (!column) return false;

  let removed = false;
  for (let tileIndex = column.tiles.length - 1; tileIndex >= 0; tileIndex -= 1) {
    if (tileIndex === exceptTileIndex) continue;
    if (removePendingAddedTileIfEmpty(colIndex, tileIndex)) removed = true;
  }
  return removed;
}

async function finalizeActiveModalSession({ adjustTarget } = {}) {
  if (!activeModal) return { discarded: false, target: adjustTarget || null };

  const snapshot = { ...activeModal };
  const tile = columns[snapshot.colIndex]?.tiles[snapshot.tileIndex];
  if (tile) syncModalEditorToTile(tile);

  if (modalSaveTimer) {
    clearTimeout(modalSaveTimer);
    modalSaveTimer = null;
  }

  const discarded = removePendingAddedTileIfEmpty(snapshot.colIndex, snapshot.tileIndex);
  const pruned = pruneEmptyColumns();
  activeModal = null;

  let target = adjustTarget ? { ...adjustTarget } : null;
  if (discarded && target && target.colIndex === snapshot.colIndex && target.tileIndex > snapshot.tileIndex) {
    target.tileIndex -= 1;
  }

  if (discarded || pruned) {
    await saveState();
    render();
  }

  return { discarded, target, snapshot: discarded ? null : snapshot };
}

function buildYouTubeEmbeddedPreviewHtml(text, inlineClass) {
  let html = markdownToHtml(ensureFirstLineMarkdownHeading(text));
  const videoId = extractYouTubeVideoId(text);
  if (!videoId) return html;

  const thumbHtml = `<a class="youtube-thumb ${inlineClass}" href="${youtubeWatchUrl(videoId)}" target="_blank" rel="noopener noreferrer"><img src="${youtubeThumbUrl(videoId)}" alt="YouTube thumbnail" /></a>`;
  if (/<h1[\s>]/i.test(html)) {
    return html.replace(/(<h1[\s\S]*?<\/h1>)/i, `$1${thumbHtml}`);
  }
  return `${thumbHtml}${html}`;
}

function buildModalMarkdownPreviewHtml(text) {
  return buildYouTubeEmbeddedPreviewHtml(text, "modal-youtube-thumb modal-youtube-thumb-inline");
}

const TILE_PREVIEW_CACHE_MAX = 256;
const tileBoardPreviewCache = new Map();

function getTileBoardPreviewBodyText(text) {
  const normalized = String(text || "");
  const lines = normalized.split("\n");
  const firstLine = lines[0]?.trim() || "";

  if (/^#{1,6}\s+\S/.test(firstLine)) {
    return getModalBodyText(normalized);
  }

  if (shouldTreatFirstLineAsPreviewHeading(firstLine)) {
    if (lines.length <= 1) return "";
    return lines.slice(1).join("\n").replace(/^\n/, "");
  }

  return normalized;
}

function buildTileBoardPreviewHtml(text) {
  const bodyText = getTileBoardPreviewBodyText(text);
  if (!String(bodyText).trim()) return "";

  const bodyHtml = markdownToHtml(bodyText);
  const videoId = extractYouTubeVideoId(text);
  if (!videoId) return bodyHtml;

  const thumbHtml = `<a class="youtube-thumb tile-youtube-thumb-inline" href="${youtubeWatchUrl(videoId)}" target="_blank" rel="noopener noreferrer"><img src="${youtubeThumbUrl(videoId)}" alt="YouTube thumbnail" /></a>`;
  if (/<h1[\s>]/i.test(bodyHtml)) {
    return bodyHtml.replace(/(<h1[\s\S]*?<\/h1>)/i, `$1${thumbHtml}`);
  }
  return `${thumbHtml}${bodyHtml}`;
}

function getTileBoardPreviewState(tile) {
  const tileId = String(tile?.id || "");
  const text = String(tile?.text || "");
  const cached = tileBoardPreviewCache.get(tileId);
  if (cached && cached.text === text) {
    return cached;
  }

  const html = buildTileBoardPreviewHtml(text);
  const entry = { text, html };
  tileBoardPreviewCache.set(tileId, entry);

  if (tileBoardPreviewCache.size > TILE_PREVIEW_CACHE_MAX) {
    const oldestKey = tileBoardPreviewCache.keys().next().value;
    tileBoardPreviewCache.delete(oldestKey);
  }

  return entry;
}

function updatePreview(tileElement, tile) {
  const preview = tileElement.querySelector(".markdown-preview");
  const previewButton = tileElement.querySelector(".preview-button");
  if (!preview) return;

  const text = String(tile?.text || "").trim();
  if (!text) {
    preview.innerHTML = "";
    preview.classList.add("is-empty");
    preview.classList.remove("is-title-only");
  } else {
    const { html } = getTileBoardPreviewState(tile);
    if (!html.trim()) {
      preview.innerHTML = "";
      preview.classList.add("is-title-only");
      preview.classList.remove("is-empty");
    } else {
      preview.innerHTML = html;
      preview.classList.remove("is-empty", "is-title-only");
    }
  }

  if (previewButton) previewButton.classList.toggle("active", shouldShowMarkdownPreview(tile));
}

function updateModalColorSelection(tile) {
  if (!tile) return;
  if (tileDialogPanel) tileDialogPanel.dataset.color = tile.color || "white";
  if (!modalColorPalette) return;
  modalColorPalette.querySelectorAll(".color-chip").forEach((chip) => {
    const selected = chip.dataset.color === tile.color;
    chip.classList.toggle("selected", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
}

function isNewTileInput(tile) {
  return !String(tile?.text || "").trim();
}

function updateModalTemplateButtonVisibility(tile) {
  if (!modalTemplateButton) return;
  modalTemplateButton.hidden = !isNewTileInput(tile);
}

function updateModalUpdatedLabel() {
  if (!modalUpdatedLabel || !activeModal) return;
  const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
  const label = formatTileUpdatedLabel(tile);
  modalUpdatedLabel.textContent = label;
  modalUpdatedLabel.hidden = !label;
}

let tagAddDialogSelected = new Set();

function getActiveModalTile() {
  if (!activeModal) return null;
  return columns[activeModal.colIndex]?.tiles[activeModal.tileIndex] || null;
}

function stripHashPrefixesFromTagInput(value) {
  return String(value || "").replace(/(^|[,\u3001\uFF0C\s\u3000])#+/g, "$1");
}

function addTagToActiveModalTile(tag) {
  const tile = getActiveModalTile();
  if (!tile) return false;

  const normalized = normalizeTagToken(tag);
  if (!normalized) return false;

  const tags = parseTags(tile.tags);
  if (tags.includes(normalized)) return false;

  tags.push(normalized);
  tile.tags = tags;
  markTileDirty(tile.id);
  renderModalTags();
  scheduleModalSave();
  return true;
}

function addTagsToActiveModalTile(tags) {
  const normalizedTags = parseTags(tags);
  if (!normalizedTags.length) return 0;

  let added = 0;
  normalizedTags.forEach((tag) => {
    if (addTagToActiveModalTile(tag)) added += 1;
  });

  const tile = getActiveModalTile();
  if (added > 0 && tile?.id) {
    syncBoardTileById(tile.id);
    scheduleRenderSidePanels();
  }

  return added;
}

function removeTagFromActiveModalTile(tag) {
  const tile = getActiveModalTile();
  if (!tile) return false;

  const normalized = normalizeTagToken(tag);
  const tags = parseTags(tile.tags).filter((item) => item !== normalized);
  if (tags.length === parseTags(tile.tags).length) return false;

  tile.tags = tags;
  markTileDirty(tile.id);
  renderModalTags();
  scheduleModalSave();
  return true;
}

function renderModalTags() {
  if (!modalTagsList) return;

  const tile = getActiveModalTile();
  const tags = parseTags(tile?.tags || []);

  modalTagsList.innerHTML = "";
  if (tags.length === 0) {
    modalTagsList.hidden = true;
    return;
  }

  modalTagsList.hidden = false;
  tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "modal-tag-chip";

    const label = document.createElement("span");
    label.className = "modal-tag-chip-label";
    label.textContent = `#${tag}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "modal-tag-chip-remove";
    removeButton.setAttribute("aria-label", t("modal.tagRemove", { tag }));
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      removeTagFromActiveModalTile(tag);
    });

    chip.append(label, removeButton);
    modalTagsList.appendChild(chip);
  });
}

function renderTagAddExistingList() {
  if (!tagAddExistingList) return;

  const tile = getActiveModalTile();
  const current = new Set(parseTags(tile?.tags || []));
  const available = getAllTags().filter((tag) => !current.has(tag));

  tagAddExistingList.innerHTML = "";
  if (available.length === 0) {
    const empty = document.createElement("p");
    empty.className = "tag-add-empty";
    empty.textContent = t("modal.tagAddEmpty");
    tagAddExistingList.appendChild(empty);
    return;
  }

  available.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-add-existing-chip";
    button.textContent = tag;
    button.setAttribute("aria-pressed", String(tagAddDialogSelected.has(tag)));
    button.classList.toggle("is-selected", tagAddDialogSelected.has(tag));
    button.title = t("modal.tagAdd", { tag });
    button.addEventListener("click", () => {
      if (tagAddDialogSelected.has(tag)) {
        tagAddDialogSelected.delete(tag);
      } else {
        tagAddDialogSelected.add(tag);
      }
      button.classList.toggle("is-selected", tagAddDialogSelected.has(tag));
      button.setAttribute("aria-pressed", String(tagAddDialogSelected.has(tag)));
    });
    tagAddExistingList.appendChild(button);
  });
}

function resetTagAddDialogState() {
  tagAddDialogSelected = new Set();
  if (tagAddInput) tagAddInput.value = "";
}

function openTagAddDialog() {
  if (!activeModal || !tagAddDialog) return;

  resetTagAddDialogState();
  renderTagAddExistingList();
  tagAddDialog.showModal();
  tagAddInput?.focus();
}

function applyTagAddDialog() {
  const rawInput = stripHashPrefixesFromTagInput(tagAddInput?.value || "");
  const inputTags = parseTags(rawInput);
  const selectedTags = [...tagAddDialogSelected];
  const tagsToAdd = [...new Set([...selectedTags, ...inputTags])];

  if (tagAddInput && rawInput !== tagAddInput.value) {
    tagAddInput.value = rawInput;
  }

  addTagsToActiveModalTile(tagsToAdd);
}

function closeTagAddDialog() {
  if (tagAddDialog?.open) tagAddDialog.close();
  resetTagAddDialogState();
}

function shouldOpenModalMarkdownPreview(text) {
  return Boolean(String(text || "").trim());
}

function focusModalEditor() {
  modalTextarea?.focus();
}

function switchModalToEditMode() {
  if (!modalMarkdownEnabled) return;
  modalMarkdownEnabled = false;
  updateModalMarkdownView();
  focusModalEditor();
}

function switchModalToEditModeAfterTitleEnter() {
  switchModalToEditMode();
  if (!modalTextarea || modalTextarea.hidden) return;

  const text = String(modalTextarea.value || "");
  const firstNewline = text.indexOf("\n");
  const cursorPos = firstNewline === -1 ? text.length : firstNewline + 1;

  modalTextarea.focus();
  modalTextarea.selectionStart = cursorPos;
  modalTextarea.selectionEnd = cursorPos;
}

function isModalPreviewExcludedElement(element) {
  if (!element?.closest) return false;
  return Boolean(
    element.closest(
      ".modal-tags-field, .modal-tag-add-link, .modal-ai-supplement-field, .modal-footer, .modal-actions, .modal-color-field, .modal-ai-supplement-panel, .confirm-actions"
    )
  );
}

function isModalPreviewTitleContext(event) {
  if (!modalMarkdownPreview || modalMarkdownPreview.hidden) return false;

  const h1 = modalMarkdownPreview.querySelector("h1");
  if (!h1) return false;

  const active = document.activeElement;
  const selection = globalThis.getSelection?.();
  const anchor = selection?.rangeCount ? selection.anchorNode : null;
  if (anchor && h1.contains(anchor)) {
    return true;
  }

  const previewFocused =
    active === modalMarkdownPreview ||
    event.target === modalMarkdownPreview ||
    modalMarkdownPreview.contains(active);
  if (previewFocused && modalMarkdownPreview.firstElementChild === h1) {
    return true;
  }

  return false;
}

function isModalPreviewEditKeyTarget(element) {
  if (!element || isModalPreviewExcludedElement(element)) return false;
  if (modalTextarea && element === modalTextarea) return true;
  if (modalMarkdownPreview && !modalMarkdownPreview.hidden) {
    if (element === modalMarkdownPreview || modalMarkdownPreview.contains(element)) return true;
  }
  if (modalEditorScroll?.contains(element)) return true;
  if (tileDialog && element === tileDialog && modalMarkdownPreview && !modalMarkdownPreview.hidden) {
    return true;
  }
  return false;
}

function handleModalPreviewEditKeydown(event) {
  if (!activeModal || !modalMarkdownEnabled || modalAiBusy) return;
  if (event.isComposing || event.key !== "Enter" || event.shiftKey) return;
  if (isModalPreviewExcludedElement(event.target) || isModalPreviewExcludedElement(document.activeElement)) {
    return;
  }
  if (!isModalPreviewEditKeyTarget(event.target) && !isModalPreviewEditKeyTarget(document.activeElement)) {
    return;
  }

  event.preventDefault();
  if (isModalPreviewTitleContext(event)) {
    switchModalToEditModeAfterTitleEnter();
    return;
  }
  switchModalToEditMode();
}

async function expandStandaloneUrlLineInModal(target) {
  if (!activeModal || !modalTextarea || !target?.url) return;

  const validation = validateFetchableUrl(target.url);
  if (!validation.ok) return;

  const fetchId = ++modalUrlClipFetchSerial;
  modalUrlClipBusy = true;
  showAiLoadingOverlay(t("modal.aiFetchingUrls"));

  try {
    const context = await fetchUrlPageContextForAi(target.url);
    if (fetchId !== modalUrlClipFetchSerial || !activeModal) return;

    const expanded = composeUrlClipDocument(target.url, context);
    replaceTextareaRange(modalTextarea, target.lineStart, target.lineEnd, expanded);

    const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
    const text = getModalTextFromUi();
    updateModalYoutubeSection(text);
    if (tile) {
      syncYouTubeTagFromTile(tile, text);
      syncModalEditorToTile(tile);
      updateModalMarkdownView();
      updateModalTemplateButtonVisibility(tile);
      scheduleModalSave();
    }
    modalTextarea.dispatchEvent(new Event("input", { bubbles: true }));
  } finally {
    if (fetchId === modalUrlClipFetchSerial) {
      modalUrlClipBusy = false;
      hideAiLoadingOverlay();
    }
  }
}

function handleModalTextareaKeydown(event) {
  if (!activeModal || modalAiBusy || modalUrlClipBusy) return;
  if (event.isComposing || event.target !== modalTextarea) return;

  if (event.key === "Tab") {
    if (applyMarkdownBulletIndent(modalTextarea, { outdent: event.shiftKey })) {
      event.preventDefault();
      modalTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return;
  }

  if (event.key !== "Enter" || event.shiftKey) return;

  const urlLineTarget = getStandaloneUrlLineTarget(modalTextarea);
  if (urlLineTarget && !isUrlClipAlreadyApplied(modalTextarea, urlLineTarget)) {
    event.preventDefault();
    void expandStandaloneUrlLineInModal(urlLineTarget);
    return;
  }

  if (applyMarkdownBulletContinuation(modalTextarea)) {
    event.preventDefault();
    modalTextarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function focusModalMarkdownPreviewSurface() {
  if (!modalMarkdownPreview || modalMarkdownPreview.hidden) return;
  modalMarkdownPreview.tabIndex = 0;
  modalMarkdownPreview.focus({ preventScroll: true });
}

function clearModalMarkdownPreviewSurfaceFocus() {
  modalMarkdownPreview?.removeAttribute("tabindex");
}

function updateModalMarkdownView() {
  const text = getModalTextFromUi();
  if (!hasModalEditorContent(text) && modalMarkdownEnabled) {
    modalMarkdownEnabled = false;
  }

  modalMarkdownPreview.innerHTML = buildModalMarkdownPreviewHtml(text);
  modalMarkdownPreview.hidden = !modalMarkdownEnabled;
  modalTextarea.hidden = modalMarkdownEnabled;
  if (modalTextareaWrap) {
    modalTextareaWrap.hidden = modalMarkdownEnabled;
  }
  if (modalEditorScroll) {
    modalEditorScroll.classList.toggle("is-markdown-preview", modalMarkdownEnabled);
  }

  if (modalTitleSection) {
    if (modalMarkdownEnabled) {
      modalTitleSection.setAttribute("hidden", "");
      focusModalMarkdownPreviewSurface();
    } else {
      clearModalMarkdownPreviewSurfaceFocus();
      updateModalYoutubeSection(text);
      updateModalTextareaPlaceholder();
    }
  }

  updateModalContentDependentButtons();
}

function hasModalEditorContent(text = getModalTextFromUi()) {
  return Boolean(String(text || "").trim());
}

function updateModalContentDependentButtons() {
  if (!activeModal) return;

  const hasContent = hasModalEditorContent();
  const emptyTitle = t("modal.enterBodyFirst");

  if (modalMarkdownToggle) {
    modalMarkdownToggle.disabled = !hasContent;
    if (hasContent) {
      modalMarkdownToggle.classList.toggle("active", modalMarkdownEnabled);
      modalMarkdownToggle.setAttribute("aria-pressed", String(modalMarkdownEnabled));
      const label = modalMarkdownEnabled ? t("modal.editView") : t("modal.markdownPreview");
      modalMarkdownToggle.title = label;
      modalMarkdownToggle.setAttribute("aria-label", label);
    } else {
      modalMarkdownToggle.classList.remove("active");
      modalMarkdownToggle.setAttribute("aria-pressed", "false");
      modalMarkdownToggle.title = emptyTitle;
      modalMarkdownToggle.setAttribute("aria-label", t("modal.markdownPreview"));
    }
  }

  if (modalAiButton && isOpenAiConfigured() && !modalAiBusy) {
    modalAiButton.disabled = !hasContent;
    if (!hasContent) {
      modalAiButton.title = emptyTitle;
    } else if (isModalAiSupplementPanelVisible()) {
      modalAiButton.title = t("modal.aiActionSelect");
    } else {
      modalAiButton.title = t("modal.aiSummary");
    }
  }

  updateModalSpeechButtonState();
}

