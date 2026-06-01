/* Obsidian vault save */
async function saveMarkdownToObsidian(markdown, fileName) {
  const folder = sanitizeObsidianFolder(settings.obsidianFolder || "Inbox");
  const rawPath = `${folder}/${fileName}`;
  const encodedPath = rawPath.split("/").map((part) => encodeURIComponent(part)).join("/");

  const validation = validateObsidianEndpoint(settings.obsidianEndpoint || "http://127.0.0.1:27123");
  if (!validation.ok) return { ok: false, message: validation.message };

  const headers = { "Content-Type": "text/markdown" };
  if (settings.obsidianToken) headers.Authorization = `Bearer ${settings.obsidianToken}`;

  try {
    const response = await fetch(`${validation.endpoint}/vault/${encodedPath}`, {
      method: "PUT",
      headers,
      body: markdown
    });

    if (response.ok) return { ok: true, path: rawPath };

    const message = await response.text().catch(() => "");
    return { ok: false, status: response.status, message };
  } catch (error) {
    return { ok: false, error };
  }
}

async function saveTileToObsidian(tile, columnTitle) {
  if (!isObsidianConfigured()) {
    alert(t("obsidian.notConfiguredAlert"));
    return;
  }

  if (!tile?.text?.trim()) {
    alert(t("obsidian.noContent"));
    return;
  }

  const markdown = tileToMarkdown(tile, columnTitle);
  const fileName = `${fileTimestamp()}_${safeFileName(getTileDisplayTitle(tile, "Untitled"))}.md`;
  const result = await saveMarkdownToObsidian(markdown, fileName);

  if (result.ok) {
    alert(t("obsidian.saved", { path: result.path }));
  } else {
    const detail = result.status
      ? `HTTP ${result.status}${result.message ? ` / ${result.message}` : ""}`
      : (result.message || result.error?.message || t("obsidian.networkError"));
    alert(t("obsidian.saveFailed", { detail }));
  }
}

async function saveAllFilledTilesToObsidian() {
  if (!isObsidianConfigured()) {
    alert(t("obsidian.notConfiguredAlert"));
    return;
  }

  const filled = [];
  columns.forEach((column) => {
    column.tiles.forEach((tile) => {
      if (tile.text.trim()) filled.push({ column, tile });
    });
  });

  if (filled.length === 0) {
    alert(t("obsidian.noFilledTiles"));
    return;
  }

  const ok = confirm(t("obsidian.batchConfirm", { count: filled.length }));
  if (!ok) return;

  let success = 0;
  let lastError = "";

  for (const { column, tile } of filled) {
    const markdown = tileToMarkdown(tile, column.title);
    const fileName = `${fileTimestamp()}_${safeFileName(column.title)}_${safeFileName(getTileDisplayTitle(tile, "Untitled"))}.md`;
    const result = await saveMarkdownToObsidian(markdown, fileName);
    if (result.ok) {
      success += 1;
    } else {
      lastError = result.status
        ? `HTTP ${result.status}${result.message ? ` / ${result.message}` : ""}`
        : (result.message || result.error?.message || t("obsidian.networkError"));
    }
  }

  if (success === filled.length) {
    alert(t("obsidian.batchDone", { success, total: filled.length }));
  } else {
    alert(t("obsidian.batchDoneWithError", { success, total: filled.length, error: lastError }));
  }
}
