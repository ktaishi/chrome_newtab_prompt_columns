(function initClipSaveToast() {
  if (globalThis.__clipSaveToastLoaded) return;
  globalThis.__clipSaveToastLoaded = true;

  const MESSAGE_SHOW = "SHOW_CLIP_SAVE_TOAST";
  const MESSAGE_PING = "PING_CLIP_SAVE_TOAST";
  const DEFAULT_DURATION_MS = 2200;

  let hideTimer = null;

  function showToast(message, type = "success", durationMs = DEFAULT_DURATION_MS) {
    let host = document.getElementById("clip-save-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "clip-save-toast-host";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      document.documentElement.appendChild(host);
    }

    host.textContent = String(message || "保存しました");
    host.className = `is-visible is-${type === "error" ? "error" : "success"}`;

    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      host.classList.remove("is-visible");
      hideTimer = null;
    }, durationMs);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === MESSAGE_PING) {
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type !== MESSAGE_SHOW) return;

    const payload = message.payload || {};
    showToast(payload.message, payload.type, payload.durationMs);
    sendResponse({ ok: true });
    return false;
  });
})();
