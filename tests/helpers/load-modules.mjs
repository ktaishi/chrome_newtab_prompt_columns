import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
let testContext = null;

export function getTestContext() {
  if (!testContext) {
    testContext = vm.createContext(globalThis);
  }
  return testContext;
}

function loadScripts(relativePaths) {
  const combined = relativePaths
    .map((relativePath) => readFileSync(join(root, relativePath), "utf8"))
    .join("\n\n");
  vm.runInContext(combined, getTestContext(), {
    filename: join(root, relativePaths[relativePaths.length - 1])
  });
}

function installSessionStorageMock() {
  const store = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
  return store;
}

export function installChromeStorageMock(initial = {}) {
  const store = new Map();
  Object.entries(initial).forEach(([key, value]) => {
    store.set(key, structuredClone(value));
  });

  if (!globalThis.crypto?.randomUUID) {
    globalThis.crypto = {
      randomUUID: () => `test-${Math.random().toString(36).slice(2)}`
    };
  }

  globalThis.chrome = {
    storage: {
      local: {
        get: async (keys) => {
          const keyList = Array.isArray(keys)
            ? keys
            : typeof keys === "string"
              ? [keys]
              : Object.keys(keys || {});
          const result = {};
          keyList.forEach((key) => {
            if (store.has(key)) result[key] = structuredClone(store.get(key));
          });
          return result;
        },
        set: async (items) => {
          Object.entries(items).forEach(([key, value]) => {
            store.set(key, structuredClone(value));
          });
        }
      },
      onChanged: { addListener: () => {} }
    }
  };

  return store;
}

function installDomStubs() {
  const tileDialogStub = {
    open: false,
    close() {
      this.open = false;
    }
  };

  globalThis.document = {
    querySelector: (selector) => {
      if (selector === "#tileDialog") return tileDialogStub;
      return null;
    },
    querySelectorAll: () => []
  };

  return { tileDialogStub };
}

let deleteFlowLoaded = false;

/**
 * Load board storage + tile-ops for delete/save integration tests.
 */
export function loadDeleteFlowModules() {
  if (deleteFlowLoaded) {
    return { shared: globalThis.MemoBoardShared, root };
  }
  deleteFlowLoaded = true;

  installDomStubs();
  installSessionStorageMock();

  globalThis.settings = {
    globalMarkdownPreview: true,
    sidebarCollapsed: false,
    obsidianFolder: "Inbox",
    obsidianEndpoint: "http://127.0.0.1:27123",
    obsidianToken: "",
    openaiApiKey: "",
    autoBackupEnabled: true,
    lastAutoBackupDate: "",
    tagFilterOpen: false,
    activeTagFilter: ""
  };
  globalThis.render = () => {};
  globalThis.alert = () => {};

  loadScripts([
    "app/shared.js",
    "js/01-constants.js",
    "js/00-shared-import.js",
    "js/domain/tags.js",
    "js/domain/tiles.js",
    "js/02-dom-state.js",
    "js/03-templates.js",
    "js/storage/board.js",
    "js/ui/tile-ops.js"
  ]);

  vm.runInContext(
    `
function __testSeedBoard(stored) {
  columns = normalizeColumns(stored);
  resetDirtyTracking(columns);
  structureDirty = false;
}
function __testReadColumns() {
  return structuredClone(columns);
}
function __testRestoreSaveState() {
  saveState = __realSaveState;
}
__realSaveState = saveState;
`,
    getTestContext()
  );

  return {
    shared: globalThis.MemoBoardShared,
    root,
    seedTestBoard(stored) {
      getTestContext().__testSeedBoard(stored);
    },
    readColumns() {
      return getTestContext().__testReadColumns();
    },
    restoreSaveState() {
      getTestContext().__testRestoreSaveState();
    }
  };
}

/**
 * Load shared.js and domain modules for unit tests (excludes OpenAI/Obsidian services).
 */
export function loadDomainModules(options = {}) {
  const { includeModalEditor = false, includeBackup = false, includeOpenAi = false } = options;

  installSessionStorageMock();

  globalThis.settings = {
    globalMarkdownPreview: true,
    sidebarCollapsed: false,
    obsidianFolder: "Inbox",
    obsidianEndpoint: "http://127.0.0.1:27123",
    obsidianToken: "",
    openaiApiKey: "",
    autoBackupEnabled: true,
    lastAutoBackupDate: "",
    tagFilterOpen: false,
    activeTagFilter: "",
    uiLocale: "ja"
  };

  loadScripts(["js/i18n.messages.js", "js/i18n.messages.locales.js", "js/i18n.js"]);

  const scripts = [
    "app/shared.js",
    "js/01-constants.js",
    "js/00-shared-import.js",
    "js/domain/tags.js",
    "js/domain/tiles.js",
    "js/services/url-fetch-permissions.js",
    "js/domain/urls.js",
    "js/domain/markdown.js",
    "js/domain/youtube.js",
    "js/utils/export.js",
    "js/services/openai-prompt-defaults.js",
    "js/services/openai-models.js",
    "js/services/openai-genre-taxonomy.js",
    "js/services/openai-prompts.js",
    "js/services/clipboard.js"
  ];

  loadScripts(scripts);

  if (includeModalEditor) {
    if (!globalThis.document?.querySelector) {
      globalThis.document = {
        activeElement: null,
        querySelector: () => null,
        querySelectorAll: () => []
      };
    }
    globalThis.tileDialog = null;
    globalThis.modalEditorScroll = null;
    globalThis.modalMarkdownPreview = null;
    globalThis.modalTitleSection = null;
    globalThis.modalTextarea = { value: "" };
    globalThis.modalMarkdownEnabled = false;
    globalThis.modalYoutubeThumb = null;
    loadScripts(["js/ui/modal-editor.js"]);
  }

  if (includeBackup) {
    globalThis.columns = [];
    globalThis.jsonImportInput = null;
    globalThis.saveState = async () => {};
    globalThis.normalizeColumns = globalThis.normalizeColumns;
    globalThis.markStructureDirty = () => {};
    globalThis.updateObsidianButtonStates = () => {};
    globalThis.updateOpenAiButtonStates = () => {};
    globalThis.render = () => {};
    loadScripts(["js/services/backup.js"]);
  }

  if (includeOpenAi) {
    globalThis.columns = globalThis.columns || [];
    globalThis.activeModal = null;
    loadScripts(["js/services/openai.js"]);
  }

  vm.runInContext(
    `
function __testSetClipboardUpdatedAt(updatedAt) {
  clipboardTrack.updatedAt = updatedAt;
  saveClipboardTrack();
}
function __testResetClipboardTrack() {
  clipboardTrack = { text: "", updatedAt: 0, insertedText: "" };
  sessionStorage.clear();
}
function __testReadClipboardTrackFromStorage() {
  loadClipboardTrack();
}
`,
    getTestContext()
  );

  return {
    shared: globalThis.MemoBoardShared,
    root
  };
}

export { root };
