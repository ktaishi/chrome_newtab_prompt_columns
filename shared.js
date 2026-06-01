/**
 * New Tab Memo Board — shared constants & utilities
 * Loaded via importScripts (service worker) or <script> (newtab.html)
 */
var MemoBoardShared = globalThis.MemoBoardShared || (() => {
  const APP_VERSION = "1.25.1";
  const APP_NAME = "New Tab Memo Board";
  const APP_ID = "chrome-newtab-memo-board";

  const COLUMN_COUNT = 3;
  const MAX_COLUMN_COUNT = 8;
  const INITIAL_TILES_PER_COLUMN = 1;
  const STORAGE_KEY = "promptColumns.v20";
  const STORAGE_REVISION_KEY = "promptColumns.revision.v20";
  const STORAGE_WRITER_KEY = "promptColumns.writer.v20";
  const SETTINGS_KEY = "promptColumns.settings.v20";

  const CLIPPING_COLUMN_TITLE = "Clipping";
  const CLIPPING_COLUMN_INDEX = 2;
  const DEFAULT_COLUMN_TITLES = ["Inbox", "Memo", "Clipping"];
  const DEFAULT_TILE_COLORS = ["blue", "yellow", "purple"];
  const TILE_COLORS = new Set(["white", "blue", "green", "yellow", "pink", "purple", "gray"]);

  const JSON_IMPORT_MAX_BYTES = 10 * 1024 * 1024;
  const JSON_IMPORT_MAX_TILES = 500;
  const JSON_IMPORT_MAX_TEXT_LENGTH = 100_000;
  const STORAGE_UPDATE_MAX_RETRIES = 5;

  function uiText(key, jaFallback, params = {}) {
    if (typeof globalThis.t === "function") {
      return globalThis.t(key, params);
    }
    return String(jaFallback || "").replace(/\{(\w+)\}/g, (_, name) => {
      if (Object.prototype.hasOwnProperty.call(params, name)) {
        return String(params[name]);
      }
      return `{${name}}`;
    });
  }

  function id() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  }

  function normalizeColor(color, fallback = "white") {
    return TILE_COLORS.has(color) ? color : fallback;
  }

  function makeTile(colIndex = 0, index = 0, overrides = {}) {
    return {
      id: id(),
      title: overrides.title ?? "",
      text: overrides.text || "",
      color: normalizeColor(overrides.color, DEFAULT_TILE_COLORS[colIndex] || "white"),
      tags: Array.isArray(overrides.tags) ? overrides.tags : [],
      markdownPreview: false,
      starred: Boolean(overrides.starred),
      updatedAt: overrides.updatedAt || new Date().toISOString()
    };
  }

  function makeInitialColumns() {
    return Array.from({ length: COLUMN_COUNT }, (_, colIndex) => ({
      id: id(),
      title: DEFAULT_COLUMN_TITLES[colIndex] || `Column ${colIndex + 1}`,
      tiles: Array.from({ length: INITIAL_TILES_PER_COLUMN }, (_, tileIndex) =>
        makeTile(colIndex, tileIndex)
      )
    }));
  }

  function findClippingColumnIndex(columns) {
    const byTitle = columns.findIndex((column) => column?.title === CLIPPING_COLUMN_TITLE);
    if (byTitle !== -1) return byTitle;
    return Math.min(CLIPPING_COLUMN_INDEX, Math.max(0, columns.length - 1));
  }

  function isLegacyIdeaTitle(title) {
    return String(title || "").trim().toLowerCase() === "idea";
  }

  function isLegacyTodoTitle(title) {
    const trimmed = String(title || "").trim();
    // NOTE: 大文字小文字違いの "todo" はユーザー編集として扱う（ToDo のみ移行対象）
    return !trimmed || trimmed === "ToDo";
  }

  function normalizeLegacyTodoColumnTitle(title) {
    return isLegacyTodoTitle(title) ? DEFAULT_COLUMN_TITLES[0] : String(title || "").trim();
  }

  function isLegacyMemoTitle(title) {
    const trimmed = String(title || "").trim();
    // NOTE: 小文字 "memo" はユーザー編集として扱う（Memo のみ移行対象）
    return !trimmed || trimmed === "Memo";
  }

  function normalizeLegacyMemoColumnTitle(title) {
    return isLegacyMemoTitle(title) ? DEFAULT_COLUMN_TITLES[1] : String(title || "").trim();
  }

  function mergeColumnTiles(...sources) {
    return sources.flatMap((source) => (Array.isArray(source) ? source : []));
  }

  function migrateLegacyColumns(saved) {
    if (!Array.isArray(saved) || !saved.length) return saved;

    let columns = saved.slice();

    if (columns.length >= 4 && isLegacyIdeaTitle(columns[1]?.title)) {
      const [todo, idea, memo, clipping, ...extra] = columns;
      let clippingTiles = mergeColumnTiles(clipping?.tiles);
      extra.forEach((column) => {
        clippingTiles.push(...mergeColumnTiles(column?.tiles));
      });

      columns = [
        {
          ...(todo || {}),
          title: normalizeLegacyTodoColumnTitle(todo?.title)
        },
        {
          ...(memo || {}),
          title:
            memo?.title && !isLegacyIdeaTitle(memo.title)
              ? normalizeLegacyMemoColumnTitle(memo.title)
              : DEFAULT_COLUMN_TITLES[1],
          tiles: mergeColumnTiles(memo?.tiles, idea?.tiles)
        },
        {
          ...(clipping || {}),
          title: clipping?.title || CLIPPING_COLUMN_TITLE,
          tiles: clippingTiles.length ? clippingTiles : undefined
        }
      ];
    } else if (columns.length === 3 && isLegacyIdeaTitle(columns[1]?.title)) {
      const [todo, idea, third] = columns;
      const thirdIsClipping =
        String(third?.title || "").trim().toLowerCase() === CLIPPING_COLUMN_TITLE.toLowerCase();

      if (thirdIsClipping) {
        columns = [
          {
            ...(todo || {}),
            title: normalizeLegacyTodoColumnTitle(todo?.title)
          },
          {
            id: id(),
            title: DEFAULT_COLUMN_TITLES[1],
            tiles: mergeColumnTiles(idea?.tiles)
          },
          {
            ...third,
            tiles: mergeColumnTiles(third?.tiles)
          }
        ];
      } else {
        columns = [
          {
            ...(todo || {}),
            title: normalizeLegacyTodoColumnTitle(todo?.title)
          },
          {
            ...third,
            title: normalizeLegacyMemoColumnTitle(third?.title) || DEFAULT_COLUMN_TITLES[1],
            tiles: mergeColumnTiles(third?.tiles, idea?.tiles)
          },
          makeInitialColumns()[2]
        ];
      }
    }

    return columns.map((column, index) => {
      if (!column) return column;
      let title = column.title;
      if (index === 0) title = normalizeLegacyTodoColumnTitle(title);
      else if (index === 1) title = normalizeLegacyMemoColumnTitle(title);
      return { ...column, title };
    });
  }

  function truncateTitle(text, maxLength = 120) {
    const normalized = String(text || "").trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1)}…`;
  }

  function getTileFirstLine(text) {
    return String(text || "").split("\n")[0].trim();
  }

  function normalizeHeadingTitle(line) {
    return String(line || "").replace(/^#+\s*/, "").trim();
  }

  function shouldPrependTitleHeading(bodyText, tileTitle) {
    const title = String(tileTitle || "").trim();
    if (!title) return false;
    const firstLine = getTileFirstLine(bodyText);
    if (!firstLine) return true;
    return normalizeHeadingTitle(firstLine) !== title;
  }

  function formatClipText(bodyText) {
    return String(bodyText || "").trim();
  }

  function buildClipTileText({ bodyText, pageTitle, pageUrl, tileTitle, prependTitle = false }) {
    const body = String(bodyText || "").trim();
    const title = String(tileTitle || "").trim();
    let content = body;

    if (title && (prependTitle || !body) && shouldPrependTitleHeading(body, title)) {
      content = body ? `# ${title}\n\n${body}` : `# ${title}`;
    }

    return formatClipText(content);
  }

  function parseClipTags(value) {
    if (Array.isArray(value)) {
      return [...new Set(value.map((tag) => String(tag).trim().replace(/^#+/, "")).filter(Boolean))];
    }

    return [...new Set(
      String(value || "")
        .split(/[,、\uFF0C\s\u3000]+/)
        .map((tag) => tag.trim().replace(/^#+/, ""))
        .filter(Boolean)
    )];
  }

  function isClipSupportedUrl(url) {
    if (!url) return false;
    return !/^(chrome|chrome-extension|edge|about|devtools):/i.test(url);
  }

  function validateObsidianEndpoint(rawEndpoint) {
    let url;

    try {
      url = new URL(rawEndpoint || "http://127.0.0.1:27123");
    } catch (_) {
      return { ok: false, message: uiText("validation.obsidian.invalidUrl", "Obsidian API URLが不正です。") };
    }

    const allowedHosts = new Set(["localhost", "127.0.0.1"]);
    const allowedProtocols = new Set(["http:", "https:"]);
    const allowedPorts = new Set(["27123", "27124"]);

    if (!allowedProtocols.has(url.protocol)) {
      return { ok: false, message: uiText("validation.obsidian.protocol", "Obsidian API URLは http または https のみ対応です。") };
    }

    if (!allowedHosts.has(url.hostname)) {
      return { ok: false, message: uiText("validation.obsidian.host", "安全のため、Obsidian API URLは localhost または 127.0.0.1 のみに制限しています。") };
    }

    if (!allowedPorts.has(url.port)) {
      return { ok: false, message: uiText("validation.obsidian.port", "Obsidian API URLのポートは 27123 または 27124 のみに制限しています。") };
    }

    return { ok: true, endpoint: `${url.protocol}//${url.host}` };
  }

  function sanitizeObsidianFolder(folder) {
    const parts = String(folder || "Inbox")
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .map((part) => part.trim())
      .filter((part) => part && part !== "." && part !== "..");

    return parts.join("/") || "Inbox";
  }

  function yamlQuote(value) {
    const text = String(value ?? "");
    if (
      !text
      || /[\n\r:\[\]{}#&*!|>'"%@`]/.test(text)
      || /^\s|\s$/.test(text)
      || text.includes(": ")
    ) {
      return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return text;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isSafeLinkHref(href) {
    try {
      const url = new URL(href);
      return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:";
    } catch (_) {
      return false;
    }
  }

  function trimAutolinkUrl(raw) {
    let url = String(raw || "");
    let suffix = "";

    while (/[.,;:!?)]+$/.test(url)) {
      suffix = url.slice(-1) + suffix;
      url = url.slice(0, -1);
    }

    return { url, suffix };
  }

  function linkifyBareUrls(html) {
    const protectedPattern = /(<(?:a|code)\b[^>]*>[\s\S]*?<\/(?:a|code)>)/gi;

    return String(html || "").split(protectedPattern).map((part) => {
      if (/^<(?:a|code)\b/i.test(part)) return part;

      return part.replace(/https?:\/\/[^\s<>"')\]}]+/g, (raw) => {
        const decoded = raw.replace(/&amp;/g, "&");
        const { url, suffix } = trimAutolinkUrl(decoded);
        if (!url || !isSafeLinkHref(url)) return raw;

        const safeHref = escapeHtml(url);
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeHref}</a>${suffix}`;
      });
    }).join("");
  }

  function renderInlineMarkdown(text) {
    const codeTokens = [];
    let html = escapeHtml(text);

    html = html.replace(/`([^`\n]+)`/g, (_match, code) => {
      const token = `\x00CODE${codeTokens.length}\x00`;
      codeTokens.push(`<code>${code}</code>`);
      return token;
    });

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const decodedHref = href.replace(/&amp;/g, "&");
      if (!isSafeLinkHref(decodedHref)) {
        return `[${label}](${href})`;
      }
      return `<a href="${escapeHtml(decodedHref)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });

    html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_\n]+?)__/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
    html = html.replace(/(^|[\s([{"'])_([^_\n]+?)_($|[\s)\]}.,!?])/g, "$1<em>$2</em>$3");
    html = linkifyBareUrls(html);

    codeTokens.forEach((codeHtml, index) => {
      html = html.replace(`\x00CODE${index}\x00`, codeHtml);
    });

    return html;
  }

  function parseIpv4(hostname) {
    const parts = hostname.split(".").map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
      return null;
    }
    return parts;
  }

  function isPrivateIpv4(parts) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }

  function isBlockedFetchHostname(hostname) {
    const normalized = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");

    if (!normalized) return true;
    if (normalized === "localhost" || normalized.endsWith(".localhost")) return true;
    if (normalized.endsWith(".local") || normalized.endsWith(".internal") || normalized.endsWith(".lan")) return true;
    if (normalized === "127.0.0.1" || normalized.startsWith("127.")) return true;
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

    const ipv4 = parseIpv4(normalized);
    if (ipv4) return isPrivateIpv4(ipv4);

    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe80:")) return true;

    return false;
  }

  function isAllowedStripePaymentLinkUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "https:") {
        return false;
      }

      const host = url.hostname.toLowerCase();
      if (host === "buy.stripe.com" || host === "donate.stripe.com" || host === "checkout.stripe.com") {
        return true;
      }

      return host.endsWith(".stripe.com");
    } catch (_) {
      return false;
    }
  }

  function validateFetchableUrl(rawUrl) {
    let url;

    try {
      url = new URL(rawUrl);
    } catch (_) {
      return { ok: false, reason: uiText("validation.url.invalid", "不正なURL") };
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, reason: uiText("validation.url.protocol", "http/https のみ取得可能") };
    }

    if (isBlockedFetchHostname(url.hostname)) {
      return { ok: false, reason: uiText("validation.url.privateNetwork", "ローカル/プライベートネットワークのURLは取得できません") };
    }

    return { ok: true, url: url.href };
  }

  function collectAllTileIds(columns) {
    const ids = new Set();
    if (!Array.isArray(columns)) return ids;

    columns.forEach((column) => {
      if (!Array.isArray(column?.tiles)) return;
      column.tiles.forEach((tile) => {
        if (tile?.id) ids.add(tile.id);
      });
    });

    return ids;
  }

  function indexTilesById(columns) {
    const map = new Map();
    if (!Array.isArray(columns)) return map;

    columns.forEach((column) => {
      if (!Array.isArray(column?.tiles)) return;
      column.tiles.forEach((tile) => {
        if (tile?.id) map.set(tile.id, tile);
      });
    });

    return map;
  }

  function extractIncomingTiles(storedColumns, knownIds) {
    const incoming = [];
    if (!Array.isArray(storedColumns)) return incoming;

    storedColumns.forEach((column, colIndex) => {
      if (!Array.isArray(column?.tiles)) return;
      column.tiles.forEach((tile) => {
        if (!tile?.id || knownIds.has(tile.id)) return;
        incoming.push({
          colIndex,
          tile: structuredClone(tile)
        });
      });
    });

    return incoming;
  }

  function applyIncomingTiles(columns, incomingTiles) {
    const result = structuredClone(columns);
    const existingIds = collectAllTileIds(result);

    incomingTiles.forEach(({ colIndex, tile }) => {
      if (!tile?.id || existingIds.has(tile.id)) return;
      const targetCol = Math.min(Math.max(0, colIndex), result.length - 1);
      if (!Array.isArray(result[targetCol].tiles)) {
        result[targetCol].tiles = [];
      }
      result[targetCol].tiles.push(structuredClone(tile));
      existingIds.add(tile.id);
    });

    return result;
  }

  function applyLocalColumnTitles(storedColumns, localColumns) {
    const result = structuredClone(storedColumns);
    if (!Array.isArray(result) || !Array.isArray(localColumns)) return result;

    const count = Math.min(result.length, localColumns.length);
    for (let index = 0; index < count; index += 1) {
      const localColumn = localColumns[index];
      if (!localColumn || localColumn.title === undefined) continue;
      result[index].title = localColumn.title;
    }

    return result;
  }

  function mergeAppendStoredOnly(storedColumns, localColumns, localBaselineIds = null) {
    const localIds = collectAllTileIds(localColumns);
    const baselineIds = localBaselineIds instanceof Set ? localBaselineIds : localIds;
    const result = structuredClone(localColumns);

    if (!Array.isArray(storedColumns)) return result;

    storedColumns.forEach((column, colIndex) => {
      if (!Array.isArray(column?.tiles)) return;
      const targetCol = Math.min(Math.max(0, colIndex), result.length - 1);
      if (!Array.isArray(result[targetCol].tiles)) {
        result[targetCol].tiles = [];
      }

      column.tiles.forEach((tile) => {
        if (!tile?.id || localIds.has(tile.id)) return;
        // NOTE: baseline にあった ID はローカルで意図的に削除されたタイル。他タブ追加分のみマージする。
        if (baselineIds.has(tile.id)) return;
        result[targetCol].tiles.push(structuredClone(tile));
        localIds.add(tile.id);
      });
    });

    return result;
  }

  function mergeColumnsForSave(storedColumns, localColumns, dirtyTileIds, structureDirty, localBaselineIds = null) {
    if (structureDirty) {
      return mergeAppendStoredOnly(storedColumns, localColumns, localBaselineIds);
    }

    if (!dirtyTileIds || dirtyTileIds.size === 0) {
      return applyLocalColumnTitles(storedColumns, localColumns);
    }

    const localById = indexTilesById(localColumns);
    const result = structuredClone(storedColumns);

    result.forEach((column) => {
      if (!Array.isArray(column.tiles)) return;
      column.tiles = column.tiles.map((tile) => {
        if (dirtyTileIds.has(tile.id) && localById.has(tile.id)) {
          return structuredClone(localById.get(tile.id));
        }
        return tile;
      });
    });

    return mergeAppendStoredOnly(result, localColumns, localBaselineIds);
  }

  function countTiles(columns) {
    if (!Array.isArray(columns)) return 0;
    return columns.reduce((sum, column) => sum + (Array.isArray(column?.tiles) ? column.tiles.length : 0), 0);
  }

  function validateImportColumns(columns) {
    if (!Array.isArray(columns)) {
      return { ok: false, message: uiText("validation.import.noColumns", "columns 配列がありません。") };
    }

    let tileCount = 0;
    for (const column of columns) {
      if (!Array.isArray(column?.tiles)) continue;
      for (const tile of column.tiles) {
        tileCount += 1;
        if (tileCount > JSON_IMPORT_MAX_TILES) {
          return { ok: false, message: uiText("validation.import.tooManyTiles", "タイル数が上限 ({max}) を超えています。", { max: JSON_IMPORT_MAX_TILES }) };
        }
        if (String(tile?.text || "").length > JSON_IMPORT_MAX_TEXT_LENGTH) {
          return { ok: false, message: uiText("validation.import.textTooLong", "タイル本文が上限 ({max} 文字) を超えています。", { max: JSON_IMPORT_MAX_TEXT_LENGTH }) };
        }
      }
    }

    return { ok: true };
  }

  async function readStorageRevision() {
    const result = await chrome.storage.local.get(STORAGE_REVISION_KEY);
    return Number(result[STORAGE_REVISION_KEY]) || 0;
  }

  async function updateColumnsInStorage(mutator) {
    for (let attempt = 0; attempt < STORAGE_UPDATE_MAX_RETRIES; attempt += 1) {
      const result = await chrome.storage.local.get([STORAGE_KEY, STORAGE_REVISION_KEY, STORAGE_WRITER_KEY]);
      const currentColumns = Array.isArray(result[STORAGE_KEY]) && result[STORAGE_KEY].length
        ? result[STORAGE_KEY]
        : makeInitialColumns();
      const currentRevision = Number(result[STORAGE_REVISION_KEY]) || 0;
      const nextColumns = mutator(structuredClone(currentColumns), {
        revision: currentRevision,
        columns: currentColumns
      });
      const nextRevision = currentRevision + 1;
      const writerToken = crypto.randomUUID();

      await chrome.storage.local.set({
        [STORAGE_KEY]: nextColumns,
        [STORAGE_REVISION_KEY]: nextRevision,
        [STORAGE_WRITER_KEY]: writerToken
      });

      const verify = await chrome.storage.local.get([STORAGE_REVISION_KEY, STORAGE_WRITER_KEY]);
      if (
        Number(verify[STORAGE_REVISION_KEY]) === nextRevision
        && verify[STORAGE_WRITER_KEY] === writerToken
      ) {
        return { columns: nextColumns, revision: nextRevision };
      }
    }

    throw new Error(uiText("validation.storage.conflict", "ストレージの更新競合が解消できませんでした。"));
  }

  async function saveBoardState({
    columns,
    settings,
    dirtyTileIds,
    structureDirty,
    incomingTiles = [],
    localBaselineIds = null
  }) {
    const dirtyIds = dirtyTileIds instanceof Set ? dirtyTileIds : new Set();
    const incoming = Array.isArray(incomingTiles) ? incomingTiles : [];
    const baselineIds = localBaselineIds instanceof Set ? localBaselineIds : null;

    const { columns: savedColumns, revision } = await updateColumnsInStorage((stored) => {
      let merged = mergeColumnsForSave(stored, columns, dirtyIds, structureDirty, baselineIds);
      merged = applyIncomingTiles(merged, incoming);
      return merged;
    });

    if (settings !== undefined) {
      await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    }

    return { columns: savedColumns, revision };
  }

  async function appendClipToStorage(clipPayload) {
    return updateColumnsInStorage((columns) => {
      const colIndex = findClippingColumnIndex(columns);
      const column = columns[colIndex];
      if (!Array.isArray(column.tiles)) {
        column.tiles = [];
      }

      const resolvedPageTitle = String(clipPayload.pageTitle || "").trim();
      const resolvedTileTitle = truncateTitle(clipPayload.tileTitle)
        || truncateTitle(resolvedPageTitle)
        || "Web clip";
      const normalizedTags = parseClipTags(clipPayload.tags);

      column.tiles.push(
        makeTile(colIndex, column.tiles.length, {
          title: resolvedTileTitle,
          text: buildClipTileText({
            bodyText: clipPayload.bodyText,
            pageTitle: resolvedPageTitle,
            pageUrl: clipPayload.pageUrl,
            tileTitle: resolvedTileTitle,
            prependTitle: clipPayload.prependTitle
          }),
          tags: normalizedTags.length ? normalizedTags : ["clipping"]
        })
      );

      return columns;
    });
  }

  function validateBackupPayload(parsed, options = {}) {
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, message: uiText("validation.backup.notObject", "JSONオブジェクトではありません。") };
    }

    if (!Array.isArray(parsed.columns)) {
      return { ok: false, message: uiText("validation.import.noColumns", "columns 配列がありません。") };
    }

    const importColumnsValidation = validateImportColumns(parsed.columns);
    if (!importColumnsValidation.ok) {
      return importColumnsValidation;
    }

    if (parsed.app && parsed.app !== APP_ID && !options.allowForeignApp) {
      return {
        ok: false,
        message: uiText("validation.backup.foreignApp", "別アプリのバックアップです (app: {app})。", { app: parsed.app }),
        foreignApp: parsed.app
      };
    }

    return { ok: true };
  }

  return {
    APP_VERSION,
    APP_NAME,
    APP_ID,
    COLUMN_COUNT,
    MAX_COLUMN_COUNT,
    INITIAL_TILES_PER_COLUMN,
    STORAGE_KEY,
    STORAGE_REVISION_KEY,
    STORAGE_WRITER_KEY,
    SETTINGS_KEY,
    CLIPPING_COLUMN_TITLE,
    CLIPPING_COLUMN_INDEX,
    DEFAULT_COLUMN_TITLES,
    DEFAULT_TILE_COLORS,
    TILE_COLORS,
    JSON_IMPORT_MAX_BYTES,
    JSON_IMPORT_MAX_TILES,
    JSON_IMPORT_MAX_TEXT_LENGTH,
    id,
    normalizeColor,
    makeTile,
    makeInitialColumns,
    migrateLegacyColumns,
    normalizeLegacyTodoColumnTitle,
    normalizeLegacyMemoColumnTitle,
    findClippingColumnIndex,
    truncateTitle,
    getTileFirstLine,
    buildClipTileText,
    parseClipTags,
    isClipSupportedUrl,
    validateObsidianEndpoint,
    sanitizeObsidianFolder,
    yamlQuote,
    escapeHtml,
    isSafeLinkHref,
    renderInlineMarkdown,
    isAllowedStripePaymentLinkUrl,
    validateFetchableUrl,
    collectAllTileIds,
    extractIncomingTiles,
    applyIncomingTiles,
    mergeColumnsForSave,
    validateImportColumns,
    readStorageRevision,
    updateColumnsInStorage,
    saveBoardState,
    appendClipToStorage,
    validateBackupPayload
  };
})();

if (typeof globalThis !== "undefined") {
  globalThis.MemoBoardShared = MemoBoardShared;
}
