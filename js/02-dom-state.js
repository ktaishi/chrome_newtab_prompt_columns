/* DOM references and mutable app state */
const columnsRoot = document.querySelector("#columns");
const columnTemplate = document.querySelector("#columnTemplate");
const tileTemplate = document.querySelector("#tileTemplate");

const settingsButton = document.querySelector("#settingsButton");
const sidebarObsidianSyncButton = document.querySelector("#sidebarObsidianSyncButton");
const obsidianSaveButton = document.querySelector("#obsidianSaveButton");
const jsonBackupButton = document.querySelector("#jsonBackupButton");
const jsonImportButton = document.querySelector("#jsonImportButton");
const jsonImportInput = document.querySelector("#jsonImportInput");

const settingsDialog = document.querySelector("#settingsDialog");
const obsidianFolderInput = document.querySelector("#obsidianFolderInput");
const obsidianEndpointInput = document.querySelector("#obsidianEndpointInput");
const obsidianTokenInput = document.querySelector("#obsidianTokenInput");
const obsidianTokenHelpButton = document.querySelector("#obsidianTokenHelpButton");
const obsidianTokenHelpDialog = document.querySelector("#obsidianTokenHelpDialog");
const obsidianTokenHelpCloseButton = document.querySelector("#obsidianTokenHelpCloseButton");
const openaiApiKeyInput = document.querySelector("#openaiApiKeyInput");
const openaiGenerationModelSelect = document.querySelector("#openaiGenerationModelSelect");
const openaiSystemPromptInput = document.querySelector("#openaiSystemPromptInput");
const openaiUserPromptMemoInput = document.querySelector("#openaiUserPromptMemoInput");
const openaiUserPromptUrlInput = document.querySelector("#openaiUserPromptUrlInput");
const openaiPromptResetButton = document.querySelector("#openaiPromptResetButton");
const autoBackupSelect = document.querySelector("#autoBackupSelect");
const autoPasteClipboardSelect = document.querySelector("#autoPasteClipboardSelect");
const settingsUiLocaleSelect = document.querySelector("#settingsUiLocaleSelect");
const settingsSaveButton = document.querySelector("#settingsSaveButton");
const openExtensionDetailsButton = document.querySelector("#openExtensionDetailsButton");
const supportDevelopmentSection = document.querySelector("#supportDevelopmentSection");
const openSupportPaymentButton = document.querySelector("#openSupportPaymentButton");

const templateDialog = document.querySelector("#templateDialog");
const deleteConfirmDialog = document.querySelector("#deleteConfirmDialog");
const deleteConfirmMessage = document.querySelector("#deleteConfirmMessage");
const tagAddDialog = document.querySelector("#tagAddDialog");
const tagAddInput = document.querySelector("#tagAddInput");
const tagAddExistingList = document.querySelector("#tagAddExistingList");
const templateList = document.querySelector("#templateList");
const filledTileList = document.querySelector("#filledTileList");
const sidebarToggle = document.querySelector("#sidebarToggle");
const sidebarCollapsedTagButton = document.querySelector("#sidebarCollapsedTagButton");
const sidebarCollapsedSettingsButton = document.querySelector("#sidebarCollapsedSettingsButton");

const tagFilterToggle = document.querySelector("#tagFilterToggle");
const tagFilterIndicator = document.querySelector("#tagFilterIndicator");
const tagFilterPanel = document.querySelector("#tagFilterPanel");
const tagFilterList = document.querySelector("#tagFilterList");
const clearTagFilterButton = document.querySelector("#clearTagFilterButton");
const activeFilterLabel = document.querySelector("#activeFilterLabel");

const tileDialog = document.querySelector("#tileDialog");
const modalTagsList = document.querySelector("#modalTagsList");
const modalTagAddToggle = document.querySelector("#modalTagAddToggle");
const modalUpdatedLabel = document.querySelector("#modalUpdatedLabel");
const modalColorPalette = document.querySelector("#modalColorPalette");
const tileDialogPanel = document.querySelector(".tile-dialog-panel");
const modalEditorScroll = document.querySelector(".modal-editor-scroll");
const modalTextareaWrap = document.querySelector(".modal-textarea-wrap");
const modalTextarea = document.querySelector("#modalTextarea");
const modalMarkdownToggle = document.querySelector("#modalMarkdownToggle");
const modalTemplateButton = document.querySelector("#modalTemplateButton");
const modalSpeechButton = document.querySelector("#modalSpeechButton");
const modalAiButton = document.querySelector("#modalAiButton");
const modalAiSupplementPanel = document.querySelector("#modalAiSupplementPanel");
const modalAiSupplementField = document.querySelector("#modalAiSupplementField");
const modalAiSupplementInput = document.querySelector("#modalAiSupplementInput");
const modalAiSupplementSendButton = document.querySelector("#modalAiSupplementSendButton");
const modalAiActionButtons = document.querySelectorAll("#modalAiSupplementPanel [data-ai-action]");
const modalCopyButton = document.querySelector("#modalCopyButton");
const modalDeleteButton = document.querySelector("#modalDeleteButton");
const modalColumnStarButton = document.querySelector("#modalColumnStarButton");
const modalYoutubeThumb = document.querySelector("#modalYoutubeThumb");
const modalTitleSection = document.querySelector("#modalTitleSection");
const modalMarkdownPreview = document.querySelector("#modalMarkdownPreview");
const aiLoadingOverlay = document.querySelector("#aiLoadingOverlay");
const aiLoadingMessage = document.querySelector("#aiLoadingMessage");

const saveTimers = new Map();
let columns = [];
let lastAppliedRevision = 0;
let suppressStorageSync = false;
let localBaselineTileIds = new Set();
let dirtyTileIds = new Set();
let structureDirty = false;
let pendingIncomingTiles = [];
let hasUnsavedLocalEdits = () => Boolean(activeModal || modalSaveTimer || saveTimers.size > 0);
let settings = {
  globalMarkdownPreview: true,
  sidebarCollapsed: false,
  obsidianFolder: "Inbox",
  obsidianEndpoint: "http://127.0.0.1:27123",
  obsidianToken: "",
  openaiApiKey: "",
  openaiGenerationModel: "",
  openaiSystemPrompt: "",
  openaiUserPromptMemo: "",
  openaiUserPromptUrl: "",
  autoBackupEnabled: true,
  autoPasteClipboardOnOpen: false,
  lastAutoBackupDate: "",
  tagFilterOpen: false,
  activeTagFilter: "",
  uiLocale: "auto"
};
