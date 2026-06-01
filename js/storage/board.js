/* Board load/save and storage sync */
async function loadState() {
  const keys = [STORAGE_KEY, SETTINGS_KEY, ...LEGACY_COLUMN_KEYS, ...LEGACY_TILE_KEYS, ...LEGACY_SETTINGS_KEYS];
  const result = await chrome.storage.local.get(keys);

  const currentSettings = result[SETTINGS_KEY] || LEGACY_SETTINGS_KEYS.map((key) => result[key]).find(Boolean);

  settings = {
    globalMarkdownPreview: currentSettings?.globalMarkdownPreview !== false,
    sidebarCollapsed: Boolean(currentSettings?.sidebarCollapsed),
    obsidianFolder: currentSettings?.obsidianFolder || "Inbox",
    obsidianEndpoint: currentSettings?.obsidianEndpoint || "http://127.0.0.1:27123",
    obsidianToken: currentSettings?.obsidianToken || "",
    openaiApiKey: currentSettings?.openaiApiKey || "",
    openaiGenerationModel: currentSettings?.openaiGenerationModel || "",
    openaiSystemPrompt: currentSettings?.openaiSystemPrompt || "",
    openaiUserPromptMemo: currentSettings?.openaiUserPromptMemo || "",
    openaiUserPromptUrl: currentSettings?.openaiUserPromptUrl || "",
    autoBackupEnabled: currentSettings?.autoBackupEnabled !== false,
    autoPasteClipboardOnOpen: currentSettings?.autoPasteClipboardOnOpen === true,
    lastAutoBackupDate: currentSettings?.lastAutoBackupDate || "",
    tagFilterOpen: Boolean(currentSettings?.tagFilterOpen),
    activeTagFilter: currentSettings?.activeTagFilter || "",
    uiLocale: currentSettings?.uiLocale || "auto"
  };

  if (Array.isArray(result[STORAGE_KEY])) return normalizeColumns(result[STORAGE_KEY]);

  for (const key of LEGACY_COLUMN_KEYS) {
    if (Array.isArray(result[key])) return normalizeColumns(result[key]);
  }

  for (const key of LEGACY_TILE_KEYS) {
    if (Array.isArray(result[key])) return legacyTilesToColumns(result[key]);
  }

  return makeInitialColumns();
}

async function loadStorageRevision() {
  lastAppliedRevision = await readStorageRevision();
}

function rebuildLocalBaseline(nextColumns = columns) {
  localBaselineTileIds = collectAllTileIds(nextColumns);
}

let saveEpoch = 0;
let saveQueue = Promise.resolve();
const tileDirtyEpoch = new Map();

function markTileDirty(tileId) {
  if (!tileId) return;
  dirtyTileIds.add(tileId);
  tileDirtyEpoch.set(tileId, saveEpoch + 1);
}

function markStructureDirty() {
  structureDirty = true;
  structureDirtyEpoch = saveEpoch + 1;
}

let structureDirtyEpoch = 0;

function resetDirtyTracking(nextColumns = columns) {
  dirtyTileIds.clear();
  tileDirtyEpoch.clear();
  structureDirty = false;
  structureDirtyEpoch = 0;
  rebuildLocalBaseline(nextColumns);
}

function finalizeDirtyAfterSave(writtenEpoch) {
  for (const tileId of [...dirtyTileIds]) {
    if ((tileDirtyEpoch.get(tileId) || 0) <= writtenEpoch) {
      dirtyTileIds.delete(tileId);
      tileDirtyEpoch.delete(tileId);
    }
  }
  if (structureDirty && structureDirtyEpoch <= writtenEpoch) {
    structureDirty = false;
  }
  rebuildLocalBaseline(columns);
}

function queueIncomingTiles(incoming, revision = 0) {
  if (!incoming.length) return;

  incoming.forEach((item) => {
    if (pendingIncomingTiles.some((pending) => pending.tile.id === item.tile.id)) return;
    pendingIncomingTiles.push({
      colIndex: item.colIndex,
      tile: item.tile,
      revision: revision || lastAppliedRevision
    });
  });
}

function applyIncomingTilesToMemory(incoming) {
  if (!incoming.length) return false;

  columns = normalizeColumns(applyIncomingTiles(columns, incoming));
  incoming.forEach(({ tile }) => {
    if (tile?.id) localBaselineTileIds.add(tile.id);
  });
  return true;
}

function mergePendingIncomingTiles() {
  const pending = pendingIncomingTiles.filter((item) => !localBaselineTileIds.has(item.tile.id));
  if (!pending.length) {
    pendingIncomingTiles = pendingIncomingTiles.filter((item) => !localBaselineTileIds.has(item.tile.id));
    return false;
  }

  applyIncomingTilesToMemory(pending);
  pendingIncomingTiles = pendingIncomingTiles.filter((item) => !localBaselineTileIds.has(item.tile.id));
  render();
  renderSidePanels();
  return true;
}

function handleExternalColumnsUpdate(storedColumns, revision) {
  if (hasUnsavedLocalEdits()) {
    const incoming = extractIncomingTiles(storedColumns, localBaselineTileIds);
    if (incoming.length) {
      queueIncomingTiles(incoming, revision);
      applyIncomingTilesToMemory(incoming);
      render();
      renderSidePanels();
    }
    if (revision) lastAppliedRevision = revision;
    return;
  }

  applyExternalColumns(storedColumns, revision);
}

async function saveStateImpl() {
  try {
    suppressStorageSync = true;
    const writtenEpoch = saveEpoch + 1;
    saveEpoch = writtenEpoch;
    const pending = pendingIncomingTiles.filter((item) => !localBaselineTileIds.has(item.tile.id));
    const result = await saveBoardState({
      columns,
      settings,
      dirtyTileIds,
      structureDirty,
      incomingTiles: pending,
      localBaselineIds: localBaselineTileIds
    });

    columns = normalizeColumns(result.columns);
    lastAppliedRevision = result.revision;
    pendingIncomingTiles = [];
    finalizeDirtyAfterSave(writtenEpoch);
    return true;
  } catch (error) {
    console.error("saveState failed:", error);
    alert(t("storage.saveFailed"));
    return false;
  } finally {
    suppressStorageSync = false;
  }
}

async function saveState() {
  saveQueue = saveQueue.then(() => saveStateImpl(), () => saveStateImpl());
  return saveQueue;
}

function scheduleSave(saveKey, tileElement) {
  if (saveTimers.has(saveKey)) {
    clearTimeout(saveTimers.get(saveKey));
  }

  const timer = setTimeout(async () => {
    await saveState();
    saveTimers.delete(saveKey);
    renderSidePanels();
    if (!hasUnsavedLocalEdits()) mergePendingIncomingTiles();
  }, SAVE_DELAY_MS);

  saveTimers.set(saveKey, timer);
}
