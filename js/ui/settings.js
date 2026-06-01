/* Settings dialog */
function getSupportStripePaymentUrl() {
  return String(typeof SUPPORT_STRIPE_PAYMENT_URL !== "undefined" ? SUPPORT_STRIPE_PAYMENT_URL : "").trim();
}

function isSupportPaymentConfigured() {
  const url = getSupportStripePaymentUrl();
  return Boolean(url && MemoBoardShared.isAllowedStripePaymentLinkUrl(url));
}

function updateSupportDevelopmentSectionVisibility() {
  if (!supportDevelopmentSection) return;
  supportDevelopmentSection.hidden = !isSupportPaymentConfigured();
}

function openSettings() {
  obsidianFolderInput.value = settings.obsidianFolder || "Inbox";
  if (obsidianEndpointInput) obsidianEndpointInput.value = settings.obsidianEndpoint || "http://127.0.0.1:27123";
  if (obsidianTokenInput) obsidianTokenInput.value = settings.obsidianToken || "";
  if (openaiApiKeyInput) openaiApiKeyInput.value = settings.openaiApiKey || "";
  populateOpenAiGenerationModelSelect(openaiGenerationModelSelect);
  syncOpenAiGenerationModelSelectFromSettings(openaiGenerationModelSelect);
  populateOpenAiPromptFields();
  autoBackupSelect.value = settings.autoBackupEnabled === false ? "off" : "on";
  if (autoPasteClipboardSelect) {
    autoPasteClipboardSelect.value = settings.autoPasteClipboardOnOpen === true ? "on" : "off";
  }
  if (settingsUiLocaleSelect) {
    settingsUiLocaleSelect.value = settings.uiLocale || "auto";
  }
  updateObsidianButtonStates();
  updateOpenAiButtonStates();
  updateSupportDevelopmentSectionVisibility();
  settingsDialog.showModal();
}

function openSupportPaymentPage() {
  const url = getSupportStripePaymentUrl();
  if (!isSupportPaymentConfigured()) {
    alert(t("support.notConfigured"));
    return;
  }

  chrome.tabs.create({ url });
}

async function saveSettings() {
  const endpoint = obsidianEndpointInput?.value?.trim() || settings.obsidianEndpoint || "http://127.0.0.1:27123";
  const validation = validateObsidianEndpoint(endpoint);

  if (!validation.ok) {
    alert(validation.message);
    return;
  }

  settings.obsidianFolder = sanitizeObsidianFolder(obsidianFolderInput.value.trim() || "Inbox");
  settings.obsidianEndpoint = validation.endpoint;
  settings.obsidianToken = obsidianTokenInput?.value?.trim() || "";
  settings.openaiApiKey = openaiApiKeyInput?.value?.trim() || "";
  settings.openaiGenerationModel = resolveOpenAiGenerationModel(
    openaiGenerationModelSelect?.value
  );
  persistOpenAiPromptFields();
  settings.autoBackupEnabled = autoBackupSelect.value === "on";
  settings.autoPasteClipboardOnOpen = autoPasteClipboardSelect?.value === "on";
  settings.uiLocale = settingsUiLocaleSelect?.value || "auto";
  await saveState();
  applyLocale(settings.uiLocale);
  updateObsidianButtonStates();
  updateOpenAiButtonStates();
  settingsDialog.close();
  alert(t("settings.saved"));
}
