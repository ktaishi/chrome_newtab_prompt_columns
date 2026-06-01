/* JSON backup and import */
function downloadJsonBackup(prefix = "newtab-memo-backup") {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: APP_ID,
    appName: APP_NAME,
    version: APP_VERSION,
    settings: sanitizeSettingsForBackup(),
    columns
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${prefix}-${fileTimestamp()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function maybeAutoBackup() {
  if (!settings.autoBackupEnabled) return;
  const today = todayDateKey();
  if (settings.lastAutoBackupDate === today) return;

  settings.lastAutoBackupDate = today;
  await saveState();
  downloadJsonBackup("newtab-memo-auto-backup");
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
