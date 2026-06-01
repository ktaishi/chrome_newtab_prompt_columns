/* Clipboard tracking and insert */
let clipboardTrack = { text: "", updatedAt: 0, insertedText: "" };
let clipboardReadPromise = null;

function prefetchClipboardText() {
  if (clipboardReadPromise) return;
  clipboardReadPromise = navigator.clipboard.readText().catch(() => null);
}

async function readClipboardTextForInsert() {
  const pending = clipboardReadPromise;
  clipboardReadPromise = null;
  if (pending) {
    const prefetched = await pending;
    if (typeof prefetched === "string") return prefetched;
  }
  try {
    return await navigator.clipboard.readText();
  } catch (_) {
    return null;
  }
}

function noteObservedClipboardText(text) {
  const normalized = String(text || "");
  if (normalized === clipboardTrack.text) return;
  clipboardTrack = {
    text: normalized,
    updatedAt: 0,
    insertedText: ""
  };
  saveClipboardTrack();
}

function resolveInsertableClipboardText(text) {
  if (!String(text || "").trim()) return "";
  if (isClipboardAlreadyInserted(text)) return "";

  if (text !== clipboardTrack.text) {
    noteObservedClipboardText(text);
    return "";
  }

  return isClipboardTextFresh() ? text : "";
}

function loadClipboardTrack() {
  try {
    const stored = sessionStorage.getItem(CLIPBOARD_TRACK_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (typeof parsed.text === "string" && Number.isFinite(parsed.updatedAt)) {
      clipboardTrack = {
        text: parsed.text,
        updatedAt: parsed.updatedAt,
        insertedText: typeof parsed.insertedText === "string" ? parsed.insertedText : ""
      };
    }
  } catch (_) {}
}

function saveClipboardTrack() {
  try {
    sessionStorage.setItem(CLIPBOARD_TRACK_KEY, JSON.stringify(clipboardTrack));
  } catch (_) {}
}

function markClipboardText(text, { clearInserted = false } = {}) {
  const normalized = String(text || "");
  if (!normalized.trim()) return;
  const changed = normalized !== clipboardTrack.text;
  clipboardTrack = {
    text: normalized,
    updatedAt: Date.now(),
    insertedText: clearInserted || changed ? "" : clipboardTrack.insertedText
  };
  saveClipboardTrack();
}

function markClipboardInserted(text) {
  const normalized = String(text || "");
  if (!normalized.trim()) return;
  clipboardTrack.insertedText = normalized;
  saveClipboardTrack();
}

function isClipboardAlreadyInserted(text) {
  return Boolean(text) && text === clipboardTrack.insertedText;
}

function isClipboardTextFresh() {
  if (!clipboardTrack.text.trim()) return false;
  if (!clipboardTrack.updatedAt) return false;
  return Date.now() - clipboardTrack.updatedAt <= CLIPBOARD_MAX_AGE_MS;
}

async function syncClipboardTrack({ markChangedAsFresh = false } = {}) {
  let text = "";
  try {
    text = await navigator.clipboard.readText();
  } catch (_) {
    return;
  }

  if (text !== clipboardTrack.text) {
    clipboardTrack = {
      text,
      updatedAt: markChangedAsFresh && text.trim() ? Date.now() : 0,
      insertedText: ""
    };
    saveClipboardTrack();
  }
}

function noteClipboardWriteFromEvent(event) {
  const text = event.clipboardData?.getData("text/plain") || "";
  if (text.trim()) markClipboardText(text, { clearInserted: true });
}

async function getInsertableClipboardText() {
  if (settings.autoPasteClipboardOnOpen !== true) return "";

  const text = await readClipboardTextForInsert();
  if (text != null) return resolveInsertableClipboardText(text);

  if (!isClipboardTextFresh() || isClipboardAlreadyInserted(clipboardTrack.text)) return "";
  return clipboardTrack.text;
}

function initClipboardTracking() {
  loadClipboardTrack();
  syncClipboardTrack().catch(() => {});

  document.addEventListener("copy", noteClipboardWriteFromEvent);
  document.addEventListener("cut", noteClipboardWriteFromEvent);
  window.addEventListener("focus", () => {
    syncClipboardTrack({ markChangedAsFresh: true }).catch(() => {});
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    syncClipboardTrack({ markChangedAsFresh: true }).catch(() => {});
  });
}

async function copyPlainText(text, setMessage) {
  if (!String(text || "").trim()) {
    setMessage(t("clipboard.nothingToCopy"));
    return;
  }

  await navigator.clipboard.writeText(text);
  markClipboardText(text, { clearInserted: true });
  setMessage(t("clipboard.copied"));
}
