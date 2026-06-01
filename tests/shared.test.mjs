import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = join(testDir, "..");
const sharedSource = readFileSync(join(root, "app/shared.js"), "utf8");
eval(sharedSource);
const S = globalThis.MemoBoardShared;

function makeSampleColumns(extraTile) {
  const columns = S.makeInitialColumns();
  if (extraTile) {
    const colIndex = S.findClippingColumnIndex(columns);
    columns[colIndex].tiles.push(extraTile);
  }
  return columns;
}

test("validateFetchableUrl blocks localhost and private IP", () => {
  assert.equal(S.validateFetchableUrl("http://127.0.0.1/page").ok, false);
  assert.equal(S.validateFetchableUrl("http://localhost/page").ok, false);
  assert.equal(S.validateFetchableUrl("http://192.168.1.1/page").ok, false);
  assert.equal(S.validateFetchableUrl("http://10.0.0.1/page").ok, false);
  assert.equal(S.validateFetchableUrl("http://example.internal/page").ok, false);
  assert.equal(S.validateFetchableUrl("https://example.com/page").ok, true);
});

test("isAllowedStripePaymentLinkUrl accepts Stripe Payment Link hosts only", () => {
  assert.equal(S.isAllowedStripePaymentLinkUrl("https://buy.stripe.com/test_abc"), true);
  assert.equal(S.isAllowedStripePaymentLinkUrl("https://donate.stripe.com/abc"), true);
  assert.equal(S.isAllowedStripePaymentLinkUrl("http://buy.stripe.com/x"), false);
  assert.equal(S.isAllowedStripePaymentLinkUrl("https://evil.com/"), false);
  assert.equal(S.isAllowedStripePaymentLinkUrl("javascript:alert(1)"), false);
});

test("validateObsidianEndpoint accepts only localhost ports 27123/27124", () => {
  assert.equal(S.validateObsidianEndpoint("http://127.0.0.1:27123").ok, true);
  assert.equal(S.validateObsidianEndpoint("http://127.0.0.1").ok, false);
  assert.equal(S.validateObsidianEndpoint("http://evil.com:27123").ok, false);
});

test("extractIncomingTiles finds only unknown tile ids", () => {
  const local = makeSampleColumns();
  const stored = structuredClone(local);
  const incomingTile = S.makeTile(2, 1, { title: "Clip", text: "clip body" });
  const colIndex = S.findClippingColumnIndex(stored);
  stored[colIndex].tiles.push(incomingTile);
  const known = S.collectAllTileIds(local);

  const incoming = S.extractIncomingTiles(stored, known);
  assert.equal(incoming.length, 1);
  assert.equal(incoming[0].tile.id, incomingTile.id);
});

test("mergeColumnsForSave keeps stored clips while applying dirty tile edits", () => {
  const stored = makeSampleColumns();
  const clipTile = S.makeTile(2, 1, { title: "Clip", text: "from web" });
  const colIndex = S.findClippingColumnIndex(stored);
  stored[colIndex].tiles.push(clipTile);

  const local = structuredClone(stored);
  local[colIndex].tiles = local[colIndex].tiles.filter((tile) => tile.id !== clipTile.id);

  const edited = local[0].tiles[0];
  const dirty = edited.id;
  edited.text = "edited todo";

  const merged = S.mergeColumnsForSave(stored, local, new Set([dirty]), false);
  const mergedIds = S.collectAllTileIds(merged);

  assert.equal(mergedIds.has(clipTile.id), true);
  assert.equal(merged[0].tiles[0].text, "edited todo");
});

test("mergeColumnsForSave preserves local column titles when structureDirty is false", () => {
  const stored = makeSampleColumns();
  stored[0].title = "Inbox";
  stored[1].title = "Memo";

  const local = structuredClone(stored);
  local[0].title = "Custom Inbox";
  local[1].title = "Custom Memo";

  const merged = S.mergeColumnsForSave(stored, local, new Set(), false);
  assert.equal(merged[0].title, "Custom Inbox");
  assert.equal(merged[1].title, "Custom Memo");
});

test("mergeColumnsForSave with structureDirty appends stored-only tiles to local layout", () => {
  const stored = makeSampleColumns();
  const clipTile = S.makeTile(2, 1, { title: "Clip", text: "clip" });
  stored[S.findClippingColumnIndex(stored)].tiles.push(clipTile);

  const local = S.makeInitialColumns();
  local[0].tiles[0].text = "local only";

  const merged = S.mergeColumnsForSave(stored, local, new Set(), true);
  assert.equal(S.collectAllTileIds(merged).has(clipTile.id), true);
  assert.equal(merged[0].tiles[0].text, "local only");
});

test("mergeColumnsForSave with structureDirty does not restore intentionally deleted tiles", () => {
  const stored = makeSampleColumns();
  const deletedTile = stored[0].tiles[0];
  const baseline = S.collectAllTileIds(stored);

  const local = structuredClone(stored);
  local[0].tiles.splice(0, 1);

  const merged = S.mergeColumnsForSave(stored, local, new Set(), true, baseline);
  assert.equal(merged[0].tiles.some((tile) => tile.id === deletedTile.id), false);
});

test("mergeColumnsForSave with structureDirty without baseline still restores deleted tiles (baseline required)", () => {
  const stored = makeSampleColumns();
  const deletedTile = stored[0].tiles[0];

  const local = structuredClone(stored);
  local[0].tiles.splice(0, 1);

  const merged = S.mergeColumnsForSave(stored, local, new Set(), true);
  assert.equal(merged[0].tiles.some((tile) => tile.id === deletedTile.id), true);
});

test("mergeColumnsForSave with structureDirty deletes one tile while keeping others", () => {
  const stored = makeSampleColumns();
  const baseline = S.collectAllTileIds(stored);
  stored[0].tiles.push(S.makeTile(0, 1, { text: "second tile" }));
  baseline.add(stored[0].tiles[1].id);

  const deletedTile = stored[0].tiles[0];
  const keptTile = stored[0].tiles[1];
  const local = structuredClone(stored);
  local[0].tiles.splice(0, 1);

  const merged = S.mergeColumnsForSave(stored, local, new Set(), true, baseline);
  assert.equal(merged[0].tiles.some((tile) => tile.id === deletedTile.id), false);
  assert.equal(merged[0].tiles.some((tile) => tile.id === keptTile.id), true);
});

test("mergeColumnsForSave with structureDirty keeps deleted tiles removed while appending other-tab clips", () => {
  const stored = makeSampleColumns();
  const baseline = S.collectAllTileIds(stored);
  const deletedTile = stored[0].tiles[0];
  const clipTile = S.makeTile(2, 1, { title: "Clip", text: "from other tab" });
  stored[S.findClippingColumnIndex(stored)].tiles.push(clipTile);

  const local = structuredClone(stored);
  local[0].tiles.splice(0, 1);

  const merged = S.mergeColumnsForSave(stored, local, new Set(), true, baseline);
  assert.equal(merged[0].tiles.some((tile) => tile.id === deletedTile.id), false);
  assert.equal(S.collectAllTileIds(merged).has(clipTile.id), true);
});

test("renderInlineMarkdown allows safe links and escapes HTML", () => {
  const html = S.renderInlineMarkdown("Visit [site](https://example.com) and <script>");
  assert.match(html, /<a href="https:\/\/example.com"/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test("renderInlineMarkdown rejects javascript links", () => {
  const html = S.renderInlineMarkdown("[x](javascript:alert(1))");
  assert.match(html, /\[x\]\(javascript:alert\(1\)\)/);
  assert.doesNotMatch(html, /<a href="javascript:/);
});

test("renderInlineMarkdown autolinks bare http(s) URLs", () => {
  const html = S.renderInlineMarkdown("See https://example.com/page.");
  assert.match(html, /<a href="https:\/\/example.com\/page" target="_blank" rel="noopener noreferrer">https:\/\/example.com\/page<\/a>\./);
});

test("renderInlineMarkdown does not autolink URLs inside inline code", () => {
  const html = S.renderInlineMarkdown("Use `https://example.com` here");
  assert.doesNotMatch(html, /<a href="https:\/\/example.com"/);
  assert.match(html, /<code>https:\/\/example.com<\/code>/);
});

test("renderInlineMarkdown renders bold, italic, and alternate markers", () => {
  const html = S.renderInlineMarkdown("**bold** *italic* __also__ and _em_");
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<strong>also<\/strong>/);
  assert.match(html, /<em>em<\/em>/);
});

test("validateImportColumns enforces tile count limit", () => {
  const columns = S.makeInitialColumns();
  columns[0].tiles = Array.from({ length: S.JSON_IMPORT_MAX_TILES + 1 }, (_, index) =>
    S.makeTile(0, index)
  );
  const result = S.validateImportColumns(columns);
  assert.equal(result.ok, false);
});

test("parseClipTags normalizes hash prefixes and delimiters", () => {
  assert.deepEqual(S.parseClipTags("clip, web、 test"), ["clip", "web", "test"]);
  assert.deepEqual(S.parseClipTags(["#foo", "bar"]), ["foo", "bar"]);
});

test("isClipSupportedUrl rejects browser internal schemes", () => {
  assert.equal(S.isClipSupportedUrl("chrome://settings"), false);
  assert.equal(S.isClipSupportedUrl("https://example.com"), true);
});

test("buildClipTileText prepends heading without source link", () => {
  const text = S.buildClipTileText({
    bodyText: "Selected text",
    pageTitle: "Example",
    pageUrl: "https://example.com/page",
    tileTitle: "Example",
    prependTitle: true
  });
  assert.match(text, /^# Example/);
  assert.doesNotMatch(text, /出典:/);
  assert.match(text, /Selected text/);
});

test("sanitizeObsidianFolder removes traversal segments", () => {
  assert.equal(S.sanitizeObsidianFolder("../Inbox/evil"), "Inbox/evil");
  assert.equal(S.sanitizeObsidianFolder(""), "Inbox");
});

test("validateBackupPayload rejects foreign app backups by default", () => {
  const columns = S.makeInitialColumns();
  const result = S.validateBackupPayload({ app: "other-app", columns });
  assert.equal(result.ok, false);
  assert.equal(result.foreignApp, "other-app");
});

test("applyIncomingTiles appends unknown tiles without duplicating ids", () => {
  const local = makeSampleColumns();
  const clipColIndex = S.CLIPPING_COLUMN_INDEX;
  const incomingTile = S.makeTile(clipColIndex, 9, { text: "incoming" });
  const merged = S.applyIncomingTiles(local, [{ colIndex: clipColIndex, tile: incomingTile }]);
  assert.equal(S.collectAllTileIds(merged).has(incomingTile.id), true);

  const again = S.applyIncomingTiles(merged, [{ colIndex: clipColIndex, tile: incomingTile }]);
  const count = again[clipColIndex].tiles.filter((tile) => tile.id === incomingTile.id).length;
  assert.equal(count, 1);
});
