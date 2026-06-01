/* JSON backup and import */
function buildBackupPayload() {
  return {
    exportedAt: new Date().toISOString(),
    app: APP_ID,
    appName: APP_NAME,
    version: APP_VERSION,
    settings: sanitizeSettingsForBackup(),
    columns
  };
}

function buildBackupJsonText() {
  return JSON.stringify(buildBackupPayload(), null, 2);
}

function buildBackupFilename(prefix = "newtab-memo-backup") {
  return `${prefix}-${fileTimestamp()}.json`;
}

function scheduleBlobUrlRevoke(url, delayMs = 60_000) {
  globalThis.setTimeout(() => URL.revokeObjectURL(url), delayMs);
}

function triggerAnchorDownload(url, filename) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.documentElement.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function downloadJsonBackupViaBackground(jsonText, filename) {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    return { ok: false, error: "runtime unavailable" };
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "DOWNLOAD_JSON_BACKUP",
      jsonText,
      filename
    });
    return response || { ok: false, error: "no response" };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }
}

async function downloadJsonBackupViaSavePicker(jsonText, filename) {
  if (typeof window.showSaveFilePicker !== "function") {
    return { ok: false, skipped: true };
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: "JSON",
        accept: { "application/json": [".json"] }
      }]
    });
    const writable = await handle.createWritable();
    await writable.write(jsonText);
    await writable.close();
    return { ok: true, method: "savePicker" };
  } catch (error) {
    if (error?.name === "AbortError") {
      return { ok: false, cancelled: true };
    }
    return { ok: false, error: error?.message || String(error) };
  }
}

async function downloadJsonBackupViaBlob(jsonText, filename) {
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  if (typeof chrome !== "undefined" && chrome.downloads?.download) {
    const result = await new Promise((resolve) => {
      chrome.downloads.download({ url, filename, saveAs: false }, (downloadId) => {
        resolve({
          ok: Boolean(downloadId) && !chrome.runtime.lastError,
          error: chrome.runtime.lastError?.message || null,
          downloadId
        });
      });
    });
    scheduleBlobUrlRevoke(url);
    if (result.ok) {
      return { ok: true, method: "downloads" };
    }
  }

  triggerAnchorDownload(url, filename);
  scheduleBlobUrlRevoke(url);
  return { ok: true, method: "anchor" };
}

async function downloadJsonBackup(prefix = "newtab-memo-backup", options = {}) {
  const { interactive = prefix === "newtab-memo-backup" } = options;
  let jsonText;

  try {
    jsonText = buildBackupJsonText();
  } catch (error) {
    console.error("downloadJsonBackup failed:", error);
    alert(t("backup.exportFailed"));
    return { ok: false, error: "serialize failed" };
  }

  const filename = buildBackupFilename(prefix);

  if (interactive) {
    const pickerResult = await downloadJsonBackupViaSavePicker(jsonText, filename);
    if (pickerResult.ok) {
      alert(t("backup.exportDone"));
      return pickerResult;
    }
    if (pickerResult.cancelled) {
      return pickerResult;
    }
  }

  const backgroundResult = await downloadJsonBackupViaBackground(jsonText, filename);
  if (backgroundResult.ok) {
    if (interactive) {
      alert(t("backup.exportDone"));
    }
    return backgroundResult;
  }

  const blobResult = await downloadJsonBackupViaBlob(jsonText, filename);
  if (blobResult.ok) {
    if (interactive) {
      alert(t("backup.exportDone"));
    }
    return blobResult;
  }

  console.error("downloadJsonBackup failed:", backgroundResult.error || blobResult.error);
  alert(t("backup.exportFailed"));
  return { ok: false, error: backgroundResult.error || blobResult.error || "download failed" };
}

async function pickJsonBackupFile() {
  if (typeof window.showOpenFilePicker === "function") {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: "JSON",
          accept: { "application/json": [".json"] }
        }]
      });
      return await handle.getFile();
    } catch (error) {
      if (error?.name === "AbortError") {
        return null;
      }
      console.warn("showOpenFilePicker failed:", error);
    }
  }

  if (!jsonImportInput) {
    return null;
  }

  return new Promise((resolve) => {
    const input = jsonImportInput;

    const cleanup = () => {
      input.removeEventListener("change", onChange);
      input.removeEventListener("cancel", onCancel);
    };

    const onChange = () => {
      const file = input.files?.[0] || null;
      input.value = "";
      cleanup();
      resolve(file);
    };

    const onCancel = () => {
      input.value = "";
      cleanup();
      resolve(null);
    };

    input.addEventListener("change", onChange, { once: true });
    input.addEventListener("cancel", onCancel, { once: true });
    input.value = "";
    input.click();
  });
}

async function pickAndImportJsonBackup() {
  const file = await pickJsonBackupFile();
  if (!file) return;
  await importJsonBackup(file);
}

async function maybeAutoBackup() {
  if (!settings.autoBackupEnabled) return;
  const today = todayDateKey();
  if (settings.lastAutoBackupDate === today) return;

  settings.lastAutoBackupDate = today;
  await saveState();
  await downloadJsonBackup("newtab-memo-auto-backup", { interactive: false });
}

function validateImportedSettings(importedSettings = {}, currentSettings) {
  const next = { ...currentSettings };

  if (importedSettings.obsidianFolder) {
    next.obsidianFolder = sanitizeObsidianFolder(importedSettings.obsidianFolder);
  }

  if (importedSettings.obsidianEndpoint) {
    const validation = validateObsidianEndpoint(importedSettings.obsidianEndpoint);
    if (validation.ok) {
      next.obsidianEndpoint = validation.endpoint;
    }
  }

  if (typeof importedSettings.globalMarkdownPreview === "boolean") {
    next.globalMarkdownPreview = importedSettings.globalMarkdownPreview;
  }
  if (typeof importedSettings.sidebarCollapsed === "boolean") {
    next.sidebarCollapsed = importedSettings.sidebarCollapsed;
  }
  if (typeof importedSettings.tagFilterOpen === "boolean") {
    next.tagFilterOpen = importedSettings.tagFilterOpen;
  }
  if (typeof importedSettings.activeTagFilter === "string") {
    next.activeTagFilter = importedSettings.activeTagFilter;
  }
  if (typeof importedSettings.lastAutoBackupDate === "string") {
    next.lastAutoBackupDate = importedSettings.lastAutoBackupDate;
  }
  if (importedSettings.autoBackupEnabled !== undefined) {
    next.autoBackupEnabled = importedSettings.autoBackupEnabled !== false;
  }
  if (typeof importedSettings.openaiUserPromptUrl === "string") {
    next.openaiUserPromptUrl = importedSettings.openaiUserPromptUrl;
  }
  if (typeof importedSettings.openaiSystemPrompt === "string") {
    next.openaiSystemPrompt = importedSettings.openaiSystemPrompt;
  }
  if (typeof importedSettings.openaiUserPromptMemo === "string") {
    next.openaiUserPromptMemo = importedSettings.openaiUserPromptMemo;
  }
  if (importedSettings.autoPasteClipboardOnOpen !== undefined) {
    next.autoPasteClipboardOnOpen = importedSettings.autoPasteClipboardOnOpen === true;
  }
  if (typeof importedSettings.uiLocale === "string") {
    next.uiLocale = importedSettings.uiLocale;
  }
  if (typeof importedSettings.openaiGenerationModel === "string") {
    next.openaiGenerationModel = isValidOpenAiGenerationModel(importedSettings.openaiGenerationModel)
      ? importedSettings.openaiGenerationModel
      : "";
  }

  return next;
}

async function importJsonBackup(file) {
  if (!file) return;

  if (file.size > JSON_IMPORT_MAX_BYTES) {
    alert(t("backup.fileTooLarge", { max: Math.floor(JSON_IMPORT_MAX_BYTES / (1024 * 1024)) }));
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch (_) {
    alert(t("backup.readFailed"));
    return;
  }

  let validation = validateBackupPayload(parsed);
  if (!validation.ok && validation.foreignApp) {
    const proceed = confirm(t("backup.foreignAppConfirm", { message: validation.message }));
    if (!proceed) return;
    validation = validateBackupPayload(parsed, { allowForeignApp: true });
  }

  if (!validation.ok) {
    alert(validation.message || t("backup.invalidFormat"));
    return;
  }

  const ok = confirm(t("backup.replaceConfirm"));
  if (!ok) return;

  const preservedToken = settings.obsidianToken || "";
  const preservedOpenAiKey = settings.openaiApiKey || "";

  columns = normalizeColumns(parsed.columns);
  settings = validateImportedSettings(parsed.settings || {}, settings);
  settings.obsidianToken = preservedToken;
  settings.openaiApiKey = preservedOpenAiKey;
  markStructureDirty();

  await saveState();
  updateObsidianButtonStates();
  updateOpenAiButtonStates();
  applyLocale(settings.uiLocale);
  render();
  alert(t("backup.importDone"));
}
