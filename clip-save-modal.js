(function initClipSaveModal() {
  if (globalThis.__clipSaveModalLoaded) return;
  globalThis.__clipSaveModalLoaded = true;

  const MESSAGE_SHOW = "SHOW_CLIP_SAVE_MODAL";
  const MESSAGE_SAVE = "SAVE_CLIP_FROM_MODAL";

  let host = null;
  let titleInput = null;
  let bodyInput = null;
  let tagsInput = null;
  let saveButton = null;
  let statusEl = null;
  let pageUrl = "";
  let pageTitle = "";

  function parseTags(value) {
    return [...new Set(
      String(value || "")
        .split(/[,、\uFF0C\s\u3000]+/)
        .map((tag) => tag.trim().replace(/^#+/, ""))
        .filter(Boolean)
    )];
  }

  function setStatus(message, type = "") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `clip-save-status${type ? ` is-${type}` : ""}`;
  }

  function closeModal() {
    if (!host) return;
    document.removeEventListener("keydown", onKeydown);
    host.remove();
    host = null;
    titleInput = null;
    bodyInput = null;
    tagsInput = null;
    saveButton = null;
    statusEl = null;
    pageUrl = "";
    pageTitle = "";
  }

  function onKeydown(event) {
    if (!host) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
  }

  function createModal() {
    host = document.createElement("div");
    host.id = "clip-save-modal-host";
    host.innerHTML = `
      <div class="clip-save-backdrop" data-action="close"></div>
      <div class="clip-save-panel" role="dialog" aria-modal="true" aria-labelledby="clip-save-modal-title">
        <div class="clip-save-header">
          <h2 id="clip-save-modal-title" class="clip-save-title">タブメモに保存</h2>
          <button type="button" class="clip-save-close" data-action="close" aria-label="閉じる">×</button>
        </div>
        <form class="clip-save-body">
          <label class="clip-save-field">
            <span class="clip-save-label">タイトル</span>
            <input class="clip-save-input" name="title" type="text" autocomplete="off" />
          </label>
          <label class="clip-save-field">
            <span class="clip-save-label">本文</span>
            <textarea class="clip-save-textarea" name="body" rows="4" spellcheck="false"></textarea>
          </label>
          <label class="clip-save-field">
            <span class="clip-save-label">タグ</span>
            <input class="clip-save-input" name="tags" type="text" autocomplete="off" placeholder="clipping, memo" />
          </label>
          <div class="clip-save-status" aria-live="polite"></div>
          <div class="clip-save-footer">
            <button type="button" class="clip-save-button clip-save-button-secondary" data-action="close">キャンセル</button>
            <button type="submit" class="clip-save-button clip-save-button-primary">保存</button>
          </div>
        </form>
      </div>
    `;

    document.documentElement.appendChild(host);

    titleInput = host.querySelector('input[name="title"]');
    bodyInput = host.querySelector('textarea[name="body"]');
    tagsInput = host.querySelector('input[name="tags"]');
    saveButton = host.querySelector(".clip-save-button-primary");
    statusEl = host.querySelector(".clip-save-status");

    host.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "close") {
        event.preventDefault();
        closeModal();
      }
    });

    host.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitModal();
    });

    document.addEventListener("keydown", onKeydown);
  }

  async function submitModal() {
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    const tags = parseTags(tagsInput.value);

    if (!title && !body) {
      setStatus("タイトルか本文を入力してください", "error");
      return;
    }

    saveButton.disabled = true;
    setStatus("保存中…");

    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_SAVE,
        payload: {
          title,
          text: body,
          tags,
          pageUrl,
          pageTitle: pageTitle || title
        }
      });

      if (!response?.ok) {
        throw new Error(response?.error || "保存に失敗しました");
      }

      setStatus("保存しました", "success");
      setTimeout(closeModal, 450);
    } catch (error) {
      console.error("clip save modal failed:", error);
      setStatus(error?.message || "保存に失敗しました", "error");
      saveButton.disabled = false;
    }
  }

  function resolvePageTitle(preferredTitle = "") {
    return String(preferredTitle || document.title || "").trim();
  }

  function openModal({ pageTitle: incomingTitle = "", pageUrl: url = "", pageBody = "" }) {
    pageUrl = url;
    pageTitle = resolvePageTitle(incomingTitle);
    if (!host) createModal();

    titleInput.value = pageTitle;
    bodyInput.value = String(pageBody || "").trim();
    tagsInput.value = "clipping";
    saveButton.disabled = false;
    setStatus("");

    setTimeout(() => titleInput.focus(), 0);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "PING_CLIP_SAVE_MODAL") {
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type !== MESSAGE_SHOW) return;

    openModal(message.payload || {});
    sendResponse({ ok: true });
    return false;
  });
})();
