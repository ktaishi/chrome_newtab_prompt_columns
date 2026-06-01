/* Obsidian configuration UI state */
function isObsidianConfigured() {
  const token = settings.obsidianToken?.trim();
  if (!token) return false;

  const validation = validateObsidianEndpoint(settings.obsidianEndpoint || "http://127.0.0.1:27123");
  return validation.ok;
}

function updateObsidianButtonStates() {
  const configured = isObsidianConfigured();
  const disabledTitle = t("obsidian.notConfigured");

  for (const button of [obsidianSaveButton, sidebarObsidianSyncButton]) {
    if (!button) continue;
    button.disabled = !configured;
    if (configured) {
      button.removeAttribute("title");
    } else {
      button.title = disabledTitle;
    }
  }

  updateModalContentDependentButtons();
}
