/* OpenAI button and loading overlay UI */
function isOpenAiConfigured() {
  return Boolean(settings.openaiApiKey?.trim());
}

function getModalAiUserSupplement() {
  return String(modalAiSupplementInput?.value || "").trim();
}

function resetModalAiUserSupplement() {
  if (modalAiSupplementInput) modalAiSupplementInput.value = "";
}

function buildModalAiSupplement(actionId) {
  const parts = [];
  const actionSupplement = getOpenAiActionSupplement(actionId);
  if (actionSupplement) parts.push(actionSupplement);
  const userSupplement = getModalAiUserSupplement();
  if (userSupplement) parts.push(userSupplement);
  return parts.join("\n\n");
}

function modalHasAiSourceContent() {
  if (typeof getModalTextFromUi !== "function") return false;
  const sourceText = getModalTextFromUi() || "";
  if (typeof stripExistingAiSummary === "function") {
    return Boolean(stripExistingAiSummary(sourceText).trim());
  }
  return Boolean(sourceText.trim());
}

function updateModalAiSupplementFieldState() {
  const configured = isOpenAiConfigured();
  const hasContent = modalHasAiSourceContent();
  const hasUserSupplement = Boolean(getModalAiUserSupplement());

  if (modalAiSupplementField) {
    modalAiSupplementField.hidden = !configured;
  }
  if (modalAiSupplementInput) {
    modalAiSupplementInput.disabled = Boolean(modalAiBusy);
  }
  if (modalAiSupplementSendButton) {
    modalAiSupplementSendButton.disabled =
      Boolean(modalAiBusy) || !hasContent || !hasUserSupplement;
  }
}

function hideModalAiActionButtons() {
  if (modalAiSupplementPanel) modalAiSupplementPanel.hidden = true;
}

async function submitModalAiSupplement() {
  if (!activeModal || modalAiBusy || !isOpenAiConfigured()) return;

  const userSupplement = getModalAiUserSupplement();
  if (!userSupplement) {
    modalAiSupplementInput?.focus();
    return;
  }

  const sourceText = getModalTextFromUi() || "";
  if (!stripExistingAiSummary(sourceText).trim()) {
    alert(t("openai.noContent"));
    return;
  }

  hideModalAiActionButtons();
  await handleModalAiSummary("summary", { userSupplementOnly: true });
}

function isModalAiSupplementPanelVisible() {
  return Boolean(modalAiSupplementPanel && !modalAiSupplementPanel.hidden);
}

function setModalAiActionButtonsDisabled(disabled) {
  modalAiActionButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

function resetModalAiSupplementPanel() {
  hideModalAiActionButtons();
  setModalAiActionButtonsDisabled(false);
  resetModalAiUserSupplement();
}

function showModalAiSupplementPanel() {
  if (!modalAiSupplementPanel) return;
  modalAiSupplementPanel.hidden = false;
  setModalAiActionButtonsDisabled(false);
  const firstButton = modalAiActionButtons[0];
  firstButton?.focus();
  updateOpenAiButtonStates();
}

function dismissModalAiActionOverlay() {
  if (!isModalAiSupplementPanelVisible() || modalAiBusy) return;
  hideModalAiActionButtons();
  updateOpenAiButtonStates();
}

function updateOpenAiButtonStates() {
  if (!modalAiButton) return;
  modalAiButton.hidden = !isOpenAiConfigured();
  if (!modalAiBusy) {
    modalAiButton.classList.remove("ai-busy");
  }
  setModalAiActionButtonsDisabled(modalAiBusy);
  updateModalAiSupplementFieldState();
  updateModalContentDependentButtons();
}

function showAiLoadingOverlay(message = t("modal.aiLoading")) {
  if (aiLoadingMessage) aiLoadingMessage.textContent = message;
  aiLoadingOverlay?.removeAttribute("hidden");
}

function setAiLoadingMessage(message) {
  if (aiLoadingMessage) aiLoadingMessage.textContent = message;
}

function hideAiLoadingOverlay() {
  aiLoadingOverlay?.setAttribute("hidden", "");
}
