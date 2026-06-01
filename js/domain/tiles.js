/* Tile model, normalization, display helpers */
function normalizeTagToken(tag) {
  return String(tag).trim().replace(/^#+/, "");
}

function splitTagInput(value) {
  return String(value || "").split(/[,、\uFF0C\s\u3000]+/);
}

function parseTags(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(normalizeTagToken).filter(Boolean))];
  }

  return [...new Set(splitTagInput(value)
    .map(normalizeTagToken)
    .filter(Boolean))];
}

function formatTags(tags) {
  return parseTags(tags).map((tag) => `#${tag}`).join(" ");
}

function formatTagsForInput(tags) {
  return parseTags(tags).join(" ");
}

function getTileFirstLine(text) {
  return String(text || "").split("\n")[0].trim();
}

function isTileFilled(tile) {
  return Boolean(String(tile?.text || "").trim());
}

function getFilledTileCount(column) {
  return column.tiles.filter(isTileFilled).length;
}

function isPlaceholderTileTitle(title) {
  return /^Tile \d+$/i.test(String(title || "").trim());
}

function getTileDisplayTitle(tile, fallback) {
  const resolvedFallback = fallback ?? (typeof t === "function" ? t("tile.untitled") : "無題");
  const firstLine = getTileFirstLine(tile?.text);
  if (firstLine && firstLine !== "---") {
    const withoutHeading = firstLine.replace(/^#+\s*/, "").trim();
    return withoutHeading || firstLine;
  }
  const legacyTitle = String(tile?.title || "").trim();
  if (legacyTitle && !isPlaceholderTileTitle(legacyTitle)) return legacyTitle;
  return resolvedFallback;
}

function stripHashFromTitle(text) {
  return String(text || "").replace(/#/g, "").replace(/\s{2,}/g, " ").trim();
}

function getTileSidebarTitle(tile, fallback) {
  const resolvedFallback = fallback ?? (typeof t === "function" ? t("tile.untitled") : "無題");
  const cleaned = stripHashFromTitle(getTileDisplayTitle(tile, ""));
  return cleaned || resolvedFallback;
}

function isAutoMarkdownTile(text) {
  const normalized = String(text || "");
  const firstLine = getTileFirstLine(normalized);
  if (!firstLine) return false;
  if (/^-\s+\S/.test(firstLine)) return true;
  if (/^>\s+\S/.test(firstLine)) return true;
  if (/^```/.test(firstLine)) return true;
  if (/```/.test(normalized)) return true;
  if (/\*\*[^*\n]+\*\*/.test(normalized)) return true;
  if (/__[^_\n]+__/.test(normalized)) return true;
  return false;
}

function shouldShowMarkdownPreview(tile) {
  const text = String(tile?.text || "").trim();
  if (!text) return false;
  return (
    tile.markdownPreview ||
    isAutoMarkdownTile(tile.text) ||
    settings.globalMarkdownPreview
  );
}

function syncTileTitleFromText(tile) {
  if (!tile) return;
  tile.title = getTileFirstLine(tile.text) || "";
}

function getExistingHeadingTitleFromText(text, tile) {
  const firstLine = getTileFirstLine(text);
  if (/^#{1,6}\s+\S/.test(firstLine)) {
    return firstLine.replace(/^#+\s*/, "").trim();
  }

  const legacyTitle = String(tile?.title || "").trim();
  if (legacyTitle && !isPlaceholderTileTitle(legacyTitle)) {
    return legacyTitle.replace(/^#+\s*/, "").trim();
  }

  return "";
}

function updateTileTitleDisplay(tileElement, tile, tileIndex = 0) {
  const titleDisplay = tileElement.querySelector(".tile-title-display");
  if (!titleDisplay) return;
  const title = getTileDisplayTitle(tile, "");
  titleDisplay.textContent = title;
  titleDisplay.title = title;
  titleDisplay.classList.toggle("is-empty", !getTileDisplayTitle(tile, "").trim());
}

function todayDateKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatUpdatedDateTime(date = new Date()) {
  const locale = typeof getDateTimeFormatLocale === "function"
    ? getDateTimeFormatLocale()
    : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function touchTileUpdated(tile) {
  if (!tile) return;
  tile.updatedAt = new Date().toISOString();
}

function formatTileUpdatedLabel(tile) {
  if (!tile?.updatedAt) return "";
  const date = new Date(tile.updatedAt);
  if (Number.isNaN(date.getTime())) return "";
  return formatUpdatedDateTime(date);
}

function id() {
  return MemoBoardShared.id();
}

function makeTile(colIndex = 0, index = 0, overrides = {}) {
  return sharedMakeTile(colIndex, index, overrides);
}

function makeInitialColumns() {
  return sharedMakeInitialColumns();
}

function normalizeTile(item, colIndex = 0, fallbackIndex = 0) {
  const defaults = makeTile(colIndex, fallbackIndex);
  if (typeof item === "string") {
    return { ...defaults, text: item };
  }

  return {
    ...defaults,
    id: item?.id || id(),
    title: (() => {
      const storedTitle = String(item?.title ?? defaults.title ?? "").trim();
      const text = String(item?.text || "").trim();
      if (!text && isPlaceholderTileTitle(storedTitle)) return "";
      return storedTitle || defaults.title;
    })(),
    text: item?.text || "",
    color: normalizeColor(item?.color, defaults.color),
    tags: parseTags(item?.tags || []),
    markdownPreview: Boolean(item?.markdownPreview),
    starred: Boolean(item?.starred),
    updatedAt: item?.updatedAt || ""
  };
}

function normalizeColumns(saved) {
  if (!Array.isArray(saved)) return makeInitialColumns();

  const migrated = migrateLegacyColumns(saved);
  const initial = makeInitialColumns();

  const columnCount = Math.max(migrated.length, COLUMN_COUNT);

  return Array.from({ length: columnCount }, (_, colIndex) => {
    const column = migrated[colIndex];
    const fallback = initial[colIndex];

    const tiles = Array.isArray(column?.tiles)
      ? column.tiles.map((tile, tileIndex) => normalizeTile(tile, colIndex, tileIndex))
      : fallback?.tiles || [makeTile(colIndex, 0)];

    if (Boolean(column?.starred) && tiles.length && !tiles.some((tile) => tile.starred)) {
      const firstFilled = tiles.findIndex((tile) => String(tile.text || "").trim());
      tiles[firstFilled !== -1 ? firstFilled : 0].starred = true;
    }

    return {
      id: column?.id || id(),
      title: column?.title || fallback?.title || `Column ${colIndex + 1}`,
      tiles
    };
  });
}

function getTilesInDisplayOrder(column) {
  return column.tiles
    .map((tile, tileIndex) => ({ tile, tileIndex }))
    .sort((a, b) => {
      const aStarred = Boolean(a.tile.starred);
      const bStarred = Boolean(b.tile.starred);
      if (aStarred !== bStarred) return aStarred ? -1 : 1;
      return a.tileIndex - b.tileIndex;
    });
}

function legacyTilesToColumns(legacyTiles) {
  const normalized = Array.isArray(legacyTiles)
    ? legacyTiles.map((tile, index) => normalizeTile(tile, index % COLUMN_COUNT, index))
    : [];

  const next = makeInitialColumns();
  next.forEach((column) => { column.tiles = []; });

  normalized.forEach((tile, index) => {
    next[index % COLUMN_COUNT].tiles.push(tile);
  });

  next.forEach((column, colIndex) => {
    while (column.tiles.length < INITIAL_TILES_PER_COLUMN) {
      column.tiles.push(makeTile(colIndex, column.tiles.length));
    }
  });

  return next;
}
