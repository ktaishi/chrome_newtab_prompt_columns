importScripts("shared.js");

const {
  isClipSupportedUrl,
  appendClipToStorage,
  truncateTitle
} = MemoBoardShared;

const clipModalInjectedTabs = new Set();
const clipToastInjectedTabs = new Set();

async function getSelectionFromTab(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.getSelection()?.toString() || ""
  });
  return String(result || "").trim();
}

async function getPageMetaFromTab(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      title: document.title || "",
      url: location.href || ""
    })
  });

  return {
    pageTitle: String(result?.title || "").trim(),
    pageUrl: String(result?.url || "").trim()
  };
}

const PAGE_BODY_MAX_LENGTH = 100_000;

async function getPageBodyFromTab(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (maxLength) => {
      const MIN_MAIN_TEXT = 80;
      const contentSelectors = ["article", "main", '[role="main"]'];

      function normalizeBodyText(text) {
        return String(text || "")
          .replace(/\r\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
          .slice(0, maxLength);
      }

      function pickBestContentRoot() {
        let bestRoot = null;
        let bestLength = 0;

        for (const selector of contentSelectors) {
          for (const element of document.querySelectorAll(selector)) {
            const length = (element.innerText || "").trim().length;
            if (length > bestLength) {
              bestLength = length;
              bestRoot = element;
            }
          }
        }

        if (bestRoot && bestLength >= MIN_MAIN_TEXT) {
          return bestRoot;
        }

        return document.body || document.documentElement || null;
      }

      const root = pickBestContentRoot();
      if (!root) return "";

      return normalizeBodyText(root.innerText || root.textContent || "");
    },
    args: [PAGE_BODY_MAX_LENGTH]
  });

  return String(result || "").trim();
}

async function saveClipFromTab(selectionText, tab, pageUrl = "") {
  const text = selectionText?.trim();
  if (!text) return false;

  let pageTitle = tab?.title || "";
  let resolvedPageUrl = tab?.url || pageUrl || "";

  if (!pageTitle || !resolvedPageUrl) {
    try {
      const meta = await getPageMetaFromTab(tab.id);
      pageTitle = pageTitle || meta.pageTitle;
      resolvedPageUrl = resolvedPageUrl || meta.pageUrl;
    } catch (error) {
      // NOTE: scripting 不可ページでは tab 情報のみ使う
    }
  }

  await appendClipToStorage({
    bodyText: text,
    pageTitle,
    pageUrl: resolvedPageUrl
  });

  return {
    saved: true,
    pageTitle: pageTitle || truncateTitle(text) || "Web clip"
  };
}

async function injectClipSaveToast(tabId) {
  if (clipToastInjectedTabs.has(tabId)) return;

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["assets/clip/clip-save-toast.css"]
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["assets/clip/clip-save-toast.js"]
  });
  clipToastInjectedTabs.add(tabId);
}

async function showActionBadge(message, type = "success") {
  const text = type === "error" ? "!" : "✓";
  const color = type === "error" ? "#dc2626" : "#059669";

  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  await chrome.action.setTitle({ title: message });

  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setTitle({ title: "タブメモに保存" });
  }, 2200);
}

async function showClipSaveToast(tab, message, type = "success") {
  if (!tab?.id || !isClipSupportedUrl(tab.url)) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "PING_CLIP_SAVE_TOAST" });
  } catch (_) {
    try {
      await injectClipSaveToast(tab.id);
    } catch (error) {
      console.error("clip toast injection failed:", error);
      await showActionBadge(message, type);
      return;
    }
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_CLIP_SAVE_TOAST",
      payload: { message, type }
    });
  } catch (error) {
    console.error("SHOW_CLIP_SAVE_TOAST failed:", error);
    await showActionBadge(message, type);
  }
}

function buildClipSavedMessage(pageTitle = "") {
  const title = truncateTitle(pageTitle, 36);
  return title ? `「${title}」をタブメモに保存しました` : "タブメモに保存しました";
}

async function injectClipSaveModal(tabId) {
  if (clipModalInjectedTabs.has(tabId)) return;

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["assets/clip/clip-save-modal.css"]
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["assets/clip/clip-save-modal.js"]
  });
  clipModalInjectedTabs.add(tabId);
}

async function showClipSaveModal(tab, { pageBody = "" } = {}) {
  if (!tab?.id || !isClipSupportedUrl(tab.url)) return false;

  let pageTitle = tab.title || "";
  let pageUrl = tab.url || "";
  let resolvedPageBody = String(pageBody || "").trim();

  try {
    const meta = await getPageMetaFromTab(tab.id);
    pageTitle = meta.pageTitle || pageTitle;
    pageUrl = meta.pageUrl || pageUrl;
  } catch (error) {
    // NOTE: scripting 不可ページでは tab 情報のみ使う
  }

  if (!resolvedPageBody) {
    try {
      resolvedPageBody = await getPageBodyFromTab(tab.id);
    } catch (error) {
      // NOTE: scripting 不可ページでは本文なしのままモーダルを開く
    }
  }

  const payload = { pageTitle, pageUrl, pageBody: resolvedPageBody };

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "PING_CLIP_SAVE_MODAL" });
  } catch (_) {
    try {
      await injectClipSaveModal(tab.id);
    } catch (error) {
      console.error("clip modal injection failed:", error);
      return false;
    }
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_CLIP_SAVE_MODAL",
      payload
    });
    return true;
  } catch (error) {
    console.error("SHOW_CLIP_SAVE_MODAL failed:", error);
    return false;
  }
}

function isValidClipMessageSender(sender) {
  return Boolean(sender?.tab?.id) && isClipSupportedUrl(sender.tab.url);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save-to-tab-memo",
      title: "タブメモに保存",
      contexts: ["selection"]
    });
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clipModalInjectedTabs.delete(tabId);
  clipToastInjectedTabs.delete(tabId);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "save-to-tab-memo") return;
  if (!tab?.id || !isClipSupportedUrl(tab.url || info.pageUrl)) return;

  try {
    await saveClipFromTab(info.selectionText, tab, info.pageUrl || "");
  } catch (error) {
    console.error("saveClipToBoard failed:", error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "OPEN_EXTENSION_DETAILS") {
    chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type !== "SAVE_CLIP_FROM_MODAL") return;

  (async () => {
    try {
      if (!isValidClipMessageSender(sender)) {
        sendResponse({ ok: false, error: "このページからは保存できません。" });
        return;
      }

      const {
        title = "",
        text = "",
        tags = [],
        pageUrl = "",
        pageTitle: payloadPageTitle = ""
      } = message.payload || {};
      const pageTitle = payloadPageTitle || sender.tab?.title || title || "";

      await appendClipToStorage({
        bodyText: text,
        pageTitle,
        pageUrl: sender.tab?.url || pageUrl || "",
        tileTitle: title,
        tags,
        prependTitle: Boolean(String(title || "").trim())
      });
      sendResponse({ ok: true });
    } catch (error) {
      console.error("SAVE_CLIP_FROM_MODAL failed:", error);
      sendResponse({ ok: false, error: error?.message || "保存に失敗しました" });
    }
  })();

  return true;
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id || !isClipSupportedUrl(tab.url)) return;

  try {
    const selectionText = await getSelectionFromTab(tab.id);
    if (selectionText) {
      const result = await saveClipFromTab(selectionText, tab);
      if (result?.saved) {
        await showClipSaveToast(tab, buildClipSavedMessage(result.pageTitle));
      }
      return;
    }

    let pageBody = "";
    try {
      pageBody = await getPageBodyFromTab(tab.id);
    } catch (error) {
      // NOTE: scripting 不可ページではモーダルへフォールバック
    }

    if (pageBody) {
      const result = await saveClipFromTab(pageBody, tab);
      if (result?.saved) {
        await showClipSaveToast(tab, buildClipSavedMessage(result.pageTitle));
      }
      return;
    }

    await showClipSaveModal(tab);
  } catch (error) {
    console.error("action clip save failed:", error);
    await showClipSaveToast(tab, "保存に失敗しました", "error");
  }
});
