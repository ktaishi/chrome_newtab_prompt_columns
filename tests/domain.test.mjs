import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDomainModules } from "./helpers/load-modules.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const g = globalThis;
loadDomainModules({ includeModalEditor: true, includeBackup: true, includeOpenAi: true });

function expectArray(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

test("buildUrlTileDocument preserves existing title when URL context has no title", () => {
  const doc = g.buildUrlTileDocument(
    [{ url: "https://example.com/page", ok: false, error: "HTTP 403" }],
    "## Summary\nBody text",
    ["https://example.com/page"],
    "My Title"
  );
  assert.match(doc, /^# My Title/);
  assert.doesNotMatch(doc, /^# 無題/);
});

test("parseAiGeneratedTitle extracts title line and body", () => {
  const parsed = g.parseAiGeneratedTitle("%%TITLE%% Short title\n\n## Summary\nBody");
  assert.equal(parsed.title, "Short title");
  assert.match(parsed.body, /^## Summary/);
});

test("buildUrlTileDocument prefers AI title over long page title", () => {
  const doc = g.buildUrlTileDocument(
    [{ url: "https://example.com/page", ok: true, title: "Very Long Original Page Title From HTML Metadata Field" }],
    "## Summary\nBody text",
    ["https://example.com/page"],
    "",
    "Short AI Title"
  );
  assert.match(doc, /^# Short AI Title/);
  assert.doesNotMatch(doc, /Very Long Original Page Title/);
});

test("insertAiSummaryIntoText sets heading for memo tiles from AI title", () => {
  const text = g.insertAiSummaryIntoText(
    "",
    "%%TITLE%% Memo title\n\n## Section\nBody",
    "",
    {}
  );
  assert.match(text, /^# Memo title/);
  assert.match(text, /## Section/);
});

test("parseTags splits on spaces, commas, and Japanese delimiters", () => {
  expectArray(g.parseTags("foo bar"), ["foo", "bar"]);
  expectArray(g.parseTags("foo,bar、 baz"), ["foo", "bar", "baz"]);
  expectArray(g.parseTags(["#Alpha", " beta "]), ["Alpha", "beta"]);
});

test("formatTags and formatTagsForInput", () => {
  assert.equal(g.formatTags(["memo", "todo"]), "#memo #todo");
  assert.equal(g.formatTagsForInput(["memo", "todo"]), "memo todo");
});

test("getTileDisplayTitle strips markdown heading and prefers text over legacy title", () => {
  assert.equal(g.getTileDisplayTitle({ text: "# Project\nbody", title: "legacy" }), "Project");
  assert.equal(g.getTileDisplayTitle({ text: "", title: "Legacy" }), "Legacy");
  assert.equal(g.getTileDisplayTitle({ text: "", title: "" }), "無題");
  assert.equal(g.getTileDisplayTitle({ text: "", title: "Tile 1" }), "無題");
  assert.equal(g.getTileDisplayTitle({ text: "", title: "Tile 1" }, ""), "");
});

test("syncTileTitleFromText clears title when text is emptied", () => {
  const tile = { text: "# Old Title\nbody", title: "# Old Title" };
  tile.text = "";
  g.syncTileTitleFromText(tile);
  assert.equal(tile.title, "");
  assert.equal(g.getTileDisplayTitle(tile, "無題"), "無題");
});

test("isAutoMarkdownTile detects markdown-like first lines", () => {
  assert.equal(g.isAutoMarkdownTile("# Title"), false);
  assert.equal(g.isAutoMarkdownTile("- item"), true);
  assert.equal(g.isAutoMarkdownTile("> quote"), true);
  assert.equal(g.isAutoMarkdownTile("```js"), true);
  assert.equal(g.isAutoMarkdownTile("plain text"), false);
  assert.equal(g.isAutoMarkdownTile("Intro\n\n```\ncode\n```"), true);
  assert.equal(g.isAutoMarkdownTile("Note with **bold**"), true);
});

test("shouldShowMarkdownPreview respects tile flag and global setting", () => {
  g.settings.globalMarkdownPreview = false;
  assert.equal(g.shouldShowMarkdownPreview({ text: "plain", markdownPreview: false }), false);
  assert.equal(g.shouldShowMarkdownPreview({ text: "# md", markdownPreview: false }), false);
  assert.equal(g.shouldShowMarkdownPreview({ text: "plain", markdownPreview: true }), true);
  assert.equal(g.shouldShowMarkdownPreview({ text: "- list", markdownPreview: false }), true);

  g.settings.globalMarkdownPreview = true;
  assert.equal(g.shouldShowMarkdownPreview({ text: "plain", markdownPreview: false }), true);
});

test("normalizeColumns fills missing columns and parses tags", () => {
  const normalized = g.normalizeColumns([
    {
      title: "Custom",
      tiles: [{ text: "hello", tags: "a b", color: "invalid" }]
    }
  ]);

  assert.equal(normalized.length, 3);
  assert.equal(normalized[0].title, "Custom");
  expectArray(normalized[0].tiles[0].tags, ["a", "b"]);
  assert.equal(normalized[0].tiles[0].color, "blue");
  assert.equal(normalized[1].title, "Memo");
});

test("normalizeColumns preserves starred flag on tiles and migrates legacy column.starred", () => {
  const normalized = g.normalizeColumns([
    {
      title: "A",
      starred: true,
      tiles: [{ text: "a" }, { text: "b", starred: true }]
    },
    { title: "B", tiles: [{ text: "b" }] },
    { title: "C", tiles: [{ text: "c" }] }
  ]);

  assert.equal(normalized[0].starred, undefined);
  assert.equal(normalized[0].tiles[0].starred, false);
  assert.equal(normalized[0].tiles[1].starred, true);
});

test("getTilesInDisplayOrder puts starred tiles first within a column", () => {
  const column = {
    tiles: [
      { id: "a", text: "first", starred: false },
      { id: "b", text: "second", starred: true },
      { id: "c", text: "third", starred: false }
    ]
  };

  const ordered = g.getTilesInDisplayOrder(column);
  assert.equal(ordered[0].tile.id, "b");
  assert.equal(ordered[0].tileIndex, 1);
  assert.equal(ordered[1].tile.id, "a");
  assert.equal(ordered[2].tile.id, "c");
});

test("normalizeColumns preserves user-added columns beyond default count", () => {
  const normalized = g.normalizeColumns([
    { title: "メモ", tiles: [{ text: "a" }] },
    { title: "メモ", tiles: [{ text: "b" }] },
    { title: "Clipping", tiles: [{ text: "c" }] },
    { title: "Extra", tiles: [{ text: "d" }] }
  ]);

  assert.equal(normalized.length, 4);
  assert.equal(normalized[3].title, "Extra");
  assert.equal(normalized[3].tiles[0].text, "d");
});

test("migrateLegacyColumns merges legacy 4-column layout into 3 columns", () => {
  const migrated = g.MemoBoardShared.migrateLegacyColumns([
    { title: "ToDo", tiles: [{ text: "todo1" }] },
    { title: "Idea", tiles: [{ text: "idea1" }] },
    { title: "Memo", tiles: [{ text: "memo1" }] },
    { title: "Clipping", tiles: [{ text: "clip1" }] }
  ]);

  assert.equal(migrated.length, 3);
  assert.equal(migrated[0].title, "Inbox");
  assert.equal(migrated[1].title, "Memo");
  assert.equal(migrated[1].tiles.length, 2);
  assert.equal(migrated[1].tiles[0].text, "memo1");
  assert.equal(migrated[1].tiles[1].text, "idea1");
  assert.equal(migrated[2].title, "Clipping");
  assert.equal(migrated[2].tiles[0].text, "clip1");
});

test("normalizeColumns migrates legacy ToDo title to Inbox", () => {
  const normalized = g.normalizeColumns([
    { title: "ToDo", tiles: [{ text: "task" }] },
    { title: "Memo", tiles: [] },
    { title: "Clipping", tiles: [] }
  ]);

  assert.equal(normalized[0].title, "Inbox");
});

test("normalizeColumns preserves custom column titles on default columns", () => {
  const normalized = g.normalizeColumns([
    { title: "Tasks", tiles: [{ text: "a" }] },
    { title: "Notes", tiles: [{ text: "b" }] },
    { title: "Saved links", tiles: [{ text: "c" }] }
  ]);

  assert.equal(normalized[0].title, "Tasks");
  assert.equal(normalized[1].title, "Notes");
  assert.equal(normalized[2].title, "Saved links");
});

test("normalizeColumns preserves lowercase todo and memo as user-edited titles", () => {
  const normalized = g.normalizeColumns([
    { title: "todo", tiles: [{ text: "a" }] },
    { title: "memo", tiles: [{ text: "b" }] },
    { title: "Clipping", tiles: [{ text: "c" }] }
  ]);

  assert.equal(normalized[0].title, "todo");
  assert.equal(normalized[1].title, "memo");
});

test("normalizeColumns migrates saved 4-column data on load", () => {
  const normalized = g.normalizeColumns([
    { title: "ToDo", tiles: [{ text: "todo1" }] },
    { title: "Idea", tiles: [{ text: "idea1" }] },
    { title: "Memo", tiles: [{ text: "memo1" }] },
    { title: "Clipping", tiles: [{ text: "clip1" }] }
  ]);

  assert.equal(normalized.length, 3);
  assert.equal(normalized[1].tiles.length, 2);
  assert.equal(normalized[2].tiles[0].text, "clip1");
});

test("applyMarkdownBulletContinuation continues and exits bullet lists", () => {
  function mockTextarea(initial, cursor) {
    return {
      value: initial,
      selectionStart: cursor,
      selectionEnd: cursor
    };
  }

  const continueCase = mockTextarea("- item one", 10);
  assert.equal(g.applyMarkdownBulletContinuation(continueCase), true);
  assert.equal(continueCase.value, "- item one\n- ");
  assert.equal(continueCase.selectionStart, 13);
  assert.equal(continueCase.selectionEnd, 13);

  const splitCase = mockTextarea("- item one", 6);
  assert.equal(g.applyMarkdownBulletContinuation(splitCase), true);
  assert.equal(splitCase.value, "- item\n- one");
  assert.equal(splitCase.selectionStart, 9);

  const exitCase = mockTextarea("- ", 2);
  assert.equal(g.applyMarkdownBulletContinuation(exitCase), true);
  assert.equal(exitCase.value, "\n");
  assert.equal(exitCase.selectionStart, 1);

  const nestedCase = mockTextarea("  - nested", 11);
  assert.equal(g.applyMarkdownBulletContinuation(nestedCase), true);
  assert.equal(nestedCase.value, "  - nested\n  - ");

  const plainCase = mockTextarea("plain text", 5);
  assert.equal(g.applyMarkdownBulletContinuation(plainCase), false);
});

test("applyMarkdownBulletIndent indents and outdents bullet lines", () => {
  function mockTextarea(initial, selectionStart, selectionEnd = selectionStart) {
    return {
      value: initial,
      selectionStart,
      selectionEnd
    };
  }

  const indentCase = mockTextarea("- item one", 3);
  assert.equal(g.applyMarkdownBulletIndent(indentCase), true);
  assert.equal(indentCase.value, "  - item one");
  assert.equal(indentCase.selectionStart, 5);
  assert.equal(indentCase.selectionEnd, 5);

  const nestedCase = mockTextarea("  - nested", 5);
  assert.equal(g.applyMarkdownBulletIndent(nestedCase), true);
  assert.equal(nestedCase.value, "    - nested");

  const outdentCase = mockTextarea("  - nested", 7);
  assert.equal(g.applyMarkdownBulletIndent(outdentCase, { outdent: true }), true);
  assert.equal(outdentCase.value, "- nested");

  const multiLineCase = mockTextarea("- one\n- two\nplain", 0, 9);
  assert.equal(g.applyMarkdownBulletIndent(multiLineCase), true);
  assert.equal(multiLineCase.value, "  - one\n  - two\nplain");

  const plainCase = mockTextarea("plain text", 3);
  assert.equal(g.applyMarkdownBulletIndent(plainCase), false);
});

test("markdownToHtml renders headings, lists, code, and strips AI marker", () => {
  const html = g.markdownToHtml("<!-- newtab-memo-ai -->\n# Title\n\n- one\n\n```\ncode\n```");
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<pre><code>code<\/code><\/pre>/);
  assert.doesNotMatch(html, /newtab-memo-ai/);
});

test("markdownToHtml renders emphasis and inline code", () => {
  const html = g.markdownToHtml("This is **bold** and *italic* with `inline`");
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<code>inline<\/code>/);
});

test("markdownToHtml renders alternate emphasis markers and indented code blocks", () => {
  const html = g.markdownToHtml("Use __bold__ and _italic_\n\n    const x = 1;\n    return x;");
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<pre><code>const x = 1;\nreturn x;<\/code><\/pre>/);
});

test("markdownToHtml renders tilde fenced code blocks", () => {
  const html = g.markdownToHtml("~~~js\nconsole.log(1)\n~~~");
  assert.match(html, /<pre><code>console\.log\(1\)<\/code><\/pre>/);
});

test("markdownToHtml merges blockquote lines and supports indented quotes", () => {
  const html = g.markdownToHtml("  > indented\n> second line\n\nplain");
  assert.match(html, /<blockquote>indented<br>second line<\/blockquote>/);
  assert.match(html, /<p>plain<\/p>/);
  assert.doesNotMatch(html, /&gt;/);
});

test("markdownToHtml renders fenced code blocks as pre/code", () => {
  const html = g.markdownToHtml("```mermaid\ngraph LR\n  A-->B\n```");
  assert.match(html, /<pre><code>graph LR\n  A--&gt;B<\/code><\/pre>/);
});

test("markdownToHtml preserves AI-style fence lang in code body", () => {
  const graphLang = g.markdownToHtml("```graph LR\n  A-->B\n```");
  assert.match(graphLang, /<pre><code>graph LR\n  A--&gt;B<\/code><\/pre>/);

  const sequence = g.markdownToHtml("```sequenceDiagram\n  Alice->>Bob: hi\n```");
  assert.match(sequence, /<pre><code>\s*Alice-&gt;&gt;Bob: hi<\/code><\/pre>/);

  const tilde = g.markdownToHtml("~~~mermaid\npie title Pets\n  \"Dogs\": 4\n~~~");
  assert.match(tilde, /<pre><code>pie title Pets/);
});

test("markdownToHtml renders markdown tables", () => {
  const html = g.markdownToHtml("| Theme | Content |\n| --- | --- |\n| Alpha | One |\n| Beta | Two |");
  assert.match(html, /<table>/);
  assert.match(html, /<th>Theme<\/th>/);
  assert.match(html, /<th>Content<\/th>/);
  assert.match(html, /<td>Alpha<\/td>/);
  assert.match(html, /<td>Two<\/td>/);
  assert.doesNotMatch(html, /\| Theme \|/);
});

test("markdownToHtml leaves pipe-only lines as paragraphs without a separator row", () => {
  const html = g.markdownToHtml("a | b");
  assert.match(html, /<p>a \| b<\/p>/);
  assert.doesNotMatch(html, /<table>/);
});

test("extractUrlsFromText deduplicates and trims trailing punctuation", () => {
  const urls = g.extractUrlsFromText("See https://example.com/page. Also https://example.com/page and https://b.com/x");
  expectArray(urls, ["https://example.com/page", "https://b.com/x"]);
  assert.equal(g.extractUrlsFromText("no links").length, 0);
});

test("extractTitleFromHtml decodes entities", () => {
  const html = "<html><head><title>Foo &amp; Bar</title></head></html>";
  assert.equal(g.extractTitleFromHtml(html), "Foo & Bar");
});

test("extractYouTubeVideoId supports watch, youtu.be, shorts, and embed URLs", () => {
  const id = "dQw4w9WgXcQ";
  assert.equal(g.extractYouTubeVideoId(`https://www.youtube.com/watch?v=${id}`), id);
  assert.equal(g.extractYouTubeVideoId(`https://youtu.be/${id}`), id);
  assert.equal(g.extractYouTubeVideoId(`https://www.youtube.com/shorts/${id}`), id);
  assert.equal(g.extractYouTubeVideoId(`https://www.youtube.com/embed/${id}`), id);
  assert.equal(g.extractYouTubeVideoId("https://example.com"), null);
});

test("cleanYouTubePageTitle removes trailing YouTube suffix", () => {
  assert.equal(g.cleanYouTubePageTitle("Song Title - YouTube"), "Song Title");
  assert.equal(g.cleanYouTubePageTitle("Song Title | YouTube"), "Song Title");
});

test("sanitizeYouTubeDescriptionForSummary keeps artist lines and drops subscribe CTAs", () => {
  const raw = [
    "Main description line",
    "Subscribe to the official channel",
    "Composer: Jane Doe",
    "https://example.com"
  ].join("\n");

  const sanitized = g.sanitizeYouTubeDescriptionForSummary(raw);
  assert.match(sanitized, /Main description line/);
  assert.match(sanitized, /Composer: Jane Doe/);
  assert.doesNotMatch(sanitized, /Subscribe to the official/i);
});

test("getExistingHeadingTitleFromText reads heading and legacy title", () => {
  assert.equal(g.getExistingHeadingTitleFromText("# Memo\nbody", null), "Memo");
  assert.equal(g.getExistingHeadingTitleFromText("body only", { title: "Legacy" }), "Legacy");
  assert.equal(g.getExistingHeadingTitleFromText("body only", { title: "" }), "");
});

test("applyPageMetadataToTile keeps existing heading title", () => {
  const body = "# My Title\nhttps://example.com/page";
  const contexts = [{ url: "https://example.com/page", ok: true, title: "Fetched Page" }];
  const result = g.applyPageMetadataToTile(body, contexts, { title: "# My Title" });
  assert.equal(result, body);
});

test("setTileHeadingTitle replaces first line or prepends before standalone URL", () => {
  assert.equal(g.setTileHeadingTitle("intro\nmore", "Title"), "# Title\nmore");
  assert.equal(g.setTileHeadingTitle("# Old\nbody", "New"), "# New\nbody");
  assert.equal(
    g.setTileHeadingTitle(`https://youtu.be/dQw4w9WgXcQ\nnotes`, "Video"),
    "# Video\nhttps://youtu.be/dQw4w9WgXcQ\nnotes"
  );
});

test("isStandaloneUrlLine detects single URL lines", () => {
  assert.equal(g.isStandaloneUrlLine("https://example.com"), true);
  assert.equal(g.isStandaloneUrlLine("https://youtu.be/dQw4w9WgXcQ"), true);
  assert.equal(g.isStandaloneUrlLine("text https://example.com"), false);
});

test("composeUrlClipDocument builds title url and body", () => {
  const doc = g.composeUrlClipDocument("https://example.com/page", {
    ok: true,
    title: "Example Page",
    description: "Short desc",
    textPreview: "Longer article body text."
  });
  assert.equal(
    doc,
    "# Example Page\nhttps://example.com/page\n\nLonger article body text."
  );
});

test("composeUrlClipDocument keeps url when fetch fails", () => {
  const doc = g.composeUrlClipDocument("https://example.com/page", {
    ok: false,
    error: "HTTP 403"
  });
  assert.match(doc, /^https:\/\/example\.com\/page/);
  assert.match(doc, /HTTP 403/);
});

test("getStandaloneUrlLineTarget matches cursor at end of url-only line", () => {
  const value = "intro\nhttps://example.com";
  const urlLineEnd = value.length;
  const target = g.getStandaloneUrlLineTarget({
    value,
    selectionStart: urlLineEnd
  });
  assert.equal(target?.url, "https://example.com");
});

test("isUrlClipAlreadyApplied skips expanded url blocks", () => {
  const value = "# Title\nhttps://example.com\n\n" + "x".repeat(50);
  const urlStart = value.indexOf("https");
  const urlLineEnd = value.indexOf("\n", urlStart);
  const textarea = { value, selectionStart: urlLineEnd };
  const target = g.getStandaloneUrlLineTarget(textarea);
  assert.ok(target);
  assert.equal(g.isUrlClipAlreadyApplied(textarea, target), true);
});

test("addYouTubeTagToTile adds YouTube tag once", () => {
  const tile = { tags: ["memo"] };
  g.addYouTubeTagToTile(tile);
  expectArray(tile.tags, ["memo", "YouTube"]);

  g.addYouTubeTagToTile(tile);
  expectArray(tile.tags, ["memo", "YouTube"]);
});

test("syncYouTubeTagFromTile adds tag when text contains YouTube URL", () => {
  const tile = { tags: ["memo"], text: "" };
  assert.equal(
    g.syncYouTubeTagFromTile(tile, "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    true
  );
  expectArray(tile.tags, ["memo", "YouTube"]);
  assert.equal(
    g.syncYouTubeTagFromTile(tile, "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    false
  );
});

test("syncYouTubeTagFromTile ignores non-YouTube text", () => {
  const tile = { tags: [], text: "" };
  assert.equal(g.syncYouTubeTagFromTile(tile, "https://example.com"), false);
  expectArray(tile.tags, []);
});

test("safeFileName replaces unsafe characters", () => {
  assert.equal(g.safeFileName('foo/bar:baz'), "foo_bar_baz");
  assert.equal(g.safeFileName(""), "untitled");
});

test("tileToMarkdown includes front matter and body", () => {
  const md = g.tileToMarkdown(
    { text: "Body text", tags: ["memo"], title: "ignored" },
    "メモ"
  );
  assert.match(md, /^---\n/);
  assert.match(md, /column: メモ/);
  assert.match(md, /# Body text/);
  assert.match(md, /Body text/);
});

test("clipboard fresh text is insertable within 60 seconds", () => {
  g.__testResetClipboardTrack();
  g.markClipboardText("fresh clip");
  assert.equal(g.isClipboardTextFresh(), true);
  assert.equal(g.resolveInsertableClipboardText("fresh clip"), "fresh clip");
});

test("clipboard rejects text older than 60 seconds", () => {
  g.__testResetClipboardTrack();
  g.markClipboardText("stale clip");
  g.__testSetClipboardUpdatedAt(Date.now() - g.CLIPBOARD_MAX_AGE_MS - 1);

  assert.equal(g.isClipboardTextFresh(), false);
  assert.equal(g.resolveInsertableClipboardText("stale clip"), "");
});

test("clipboard rejects unknown-age text on first read", () => {
  g.__testResetClipboardTrack();

  assert.equal(g.resolveInsertableClipboardText("never tracked"), "");
  const stored = JSON.parse(g.sessionStorage.getItem("clipboardTrack.v1"));
  assert.equal(stored.text, "never tracked");
  assert.equal(stored.updatedAt, 0);
  assert.equal(g.isClipboardTextFresh(), false);
});

test("clipboard skips already inserted text", () => {
  g.__testResetClipboardTrack();
  g.markClipboardText("once");
  g.markClipboardInserted("once");
  assert.equal(g.resolveInsertableClipboardText("once"), "");
});

test("applyOpenAiPromptTemplate replaces placeholders", () => {
  const result = g.applyOpenAiPromptTemplate("Hello {{MEMO_BODY}}!", { MEMO_BODY: "world" });
  assert.equal(result, "Hello world!");
});

test("normalizeOpenAiPromptSetting stores empty when equal to default", () => {
  const def = g.getDefaultOpenAiUserPromptMemo();
  assert.equal(g.normalizeOpenAiPromptSetting(def, def), "");
  assert.equal(g.normalizeOpenAiPromptSetting("custom prompt", def), "custom prompt");
});

test("buildOpenAiSummaryPrompt uses genre template with classification", () => {
  g.settings.openaiUserPromptMemo = "";
  const prompt = g.buildOpenAiSummaryPrompt("memo body", [], "", {
    genreId: "life",
    subgenreId: "cooking-meals"
  });
  assert.match(prompt, /memo body/);
  assert.match(prompt, /料理・献立/);
});

test("usesOpenAiMaxCompletionTokens switches token param by model", () => {
  assert.equal(g.usesOpenAiMaxCompletionTokens("gpt-5.4-mini"), true);
  assert.equal(g.usesOpenAiMaxCompletionTokens("o3-mini"), true);
  assert.equal(g.usesOpenAiMaxCompletionTokens("gpt-4o"), false);
  assert.equal(g.usesOpenAiMaxCompletionTokens("gpt-4o-mini"), false);

  const nextGenBody = {};
  g.applyOpenAiOutputTokenLimit(nextGenBody, 8192, "gpt-5.4-mini");
  assert.equal(nextGenBody.max_completion_tokens, 8192);
  assert.equal(nextGenBody.max_tokens, undefined);

  const legacyBody = {};
  g.applyOpenAiOutputTokenLimit(legacyBody, 256, "gpt-4o-mini");
  assert.equal(legacyBody.max_tokens, 256);
  assert.equal(legacyBody.max_completion_tokens, undefined);
});

test("resolveOpenAiGenerationModel falls back to default for invalid values", () => {
  assert.equal(g.resolveOpenAiGenerationModel(""), "gpt-5.4-mini");
  assert.equal(g.resolveOpenAiGenerationModel("invalid-model"), "gpt-5.4-mini");
  assert.equal(g.resolveOpenAiGenerationModel("gpt-5.5"), "gpt-5.5");
});

test("validateImportedSettings accepts known generation model", () => {
  g.settings.openaiGenerationModel = "";
  const next = g.validateImportedSettings(
    { openaiGenerationModel: "gpt-5.3-chat-latest" },
    g.settings
  );
  assert.equal(next.openaiGenerationModel, "gpt-5.3-chat-latest");
});

test("validateImportedSettings ignores unknown generation model", () => {
  g.settings.openaiGenerationModel = "gpt-5.4";
  const next = g.validateImportedSettings(
    { openaiGenerationModel: "not-a-model" },
    g.settings
  );
  assert.equal(next.openaiGenerationModel, "");
});

test("buildOpenAiSystemPrompt injects output language from ui locale", () => {
  g.settings.openaiSystemPrompt = "";
  g.settings.uiLocale = "ja";
  const promptJa = g.buildOpenAiSystemPrompt({ hasYouTube: false, hasUrls: true });
  assert.match(promptJa, /日本語/);

  g.settings.uiLocale = "en";
  const promptEn = g.buildOpenAiSystemPrompt({ hasYouTube: false, hasUrls: true });
  assert.match(promptEn, /English/);
  const promptTech = g.buildOpenAiSystemPrompt({
    hasYouTube: false,
    hasUrls: false,
    genreId: "technology",
    subgenreId: "frameworks",
    tileText: "Hono framework",
    urlContexts: []
  });
  assert.match(promptTech, /キーワード拡張|keyword/i);
});

test("buildOpenAiGenreClassificationPrompt includes genre catalog and memo body", () => {
  g.settings.uiLocale = "ja";
  const prompt = g.buildOpenAiGenreClassificationPrompt("memo body", []);
  assert.match(prompt, /memo body/);
  assert.match(prompt, /life:/);
  assert.match(prompt, /learning:/);
  assert.doesNotMatch(prompt, /\{\{MEMO_BODY\}\}/);
});

test("buildOpenAiGenreSummaryPrompt uses subgenre script for classification", () => {
  g.settings.uiLocale = "ja";
  const prompt = g.buildOpenAiGenreSummaryPrompt("memo body", [], {
    genreId: "work",
    subgenreId: "meetings",
    reason: "議事録"
  });
  assert.match(prompt, /memo body/);
  assert.match(prompt, /議事録/);
  assert.match(prompt, /会議・議事/);
  assert.match(prompt, /blockquote/);
});

test("buildOpenAiGenreSummaryPrompt deep-dive uses keyword script with deep-dive preamble", () => {
  g.settings.uiLocale = "ja";
  g.settings.openaiUserPromptMemo = "";
  const prompt = g.buildOpenAiGenreSummaryPrompt(
    "memo body",
    [],
    { genreId: "learning", subgenreId: "research-notes", reason: "調査" },
    g.getOpenAiActionSupplement("deep-dive"),
    "deep-dive"
  );
  assert.match(prompt, /出力モード: 深く調べる/);
  assert.match(prompt, /キーワード拡張/);
  assert.match(prompt, /キーワード分析/);
});

test("parseOpenAiGenreClassification parses valid JSON", () => {
  const result = g.parseOpenAiGenreClassification(
    '{"genreId":"hobby","subgenreId":"games","confidence":0.9,"reason":"ゲーム攻略"}'
  );
  assert.equal(result.genreId, "hobby");
  assert.equal(result.subgenreId, "games");
  assert.equal(result.confidence, 0.9);
});

test("parseOpenAiGenreClassification falls back on invalid ids", () => {
  const result = g.parseOpenAiGenreClassification('{"genreId":"invalid","subgenreId":"nope"}');
  assert.equal(result.genreId, "learning");
  assert.equal(result.subgenreId, "knowledge-mgmt");
});

test("OPENAI_GENRE_TAXONOMY has 8 genres and 128 subgenres", () => {
  const genreIds = ["life", "work", "hobby", "learning", "health", "technology", "relationships", "creative"];
  let total = 0;
  for (const id of genreIds) {
    const genre = g.getOpenAiGenreById(id);
    assert.ok(genre, id);
    assert.equal(genre.subgenres.length, 16, `${id} subgenre count`);
    total += genre.subgenres.length;
  }
  assert.equal(total, 128);
});

test("buildOpenAiSummaryPrompt uses output language in default memo template", () => {
  g.settings.openaiUserPromptMemo = "";
  g.settings.uiLocale = "en";
  const prompt = g.buildOpenAiSummaryPrompt("memo body", []);
  assert.match(prompt, /English/);
  assert.match(prompt, /memo body/);
});

test("buildOpenAiSummaryPrompt appends user supplement instruction", () => {
  g.settings.openaiUserPromptMemo = "";
  g.settings.uiLocale = "ja";
  const prompt = g.buildOpenAiSummaryPrompt("memo body", [], "この内容をまとめる");
  assert.match(prompt, /memo body/);
  assert.match(prompt, /追加指示:/);
  assert.match(prompt, /この内容をまとめる/);
});

test("buildOpenAiSummaryPrompt uses keyword expansion for thin framework memo", () => {
  g.settings.uiLocale = "ja";
  g.settings.openaiUserPromptMemo = "";
  const prompt = g.buildOpenAiGenreSummaryPrompt(
    "Honoフレームワーク\n技術的な内容",
    [],
    { genreId: "technology", subgenreId: "frameworks", reason: "フレームワーク" }
  );
  assert.match(prompt, /キーワード拡張/);
  assert.match(prompt, /キーワード分析/);
  assert.match(prompt, /メタ説明/);
  assert.match(prompt, /構成・主要 API/);
});

test("buildOpenAiSummaryPrompt uses keyword expansion for thin non-tech memo", () => {
  g.settings.uiLocale = "ja";
  const prompt = g.buildOpenAiGenreSummaryPrompt(
    "京都 旅行 おすすめ",
    [],
    { genreId: "life", subgenreId: "travel", reason: "旅行" }
  );
  assert.match(prompt, /キーワード拡張/);
  assert.match(prompt, /このトピックとは/);
  assert.doesNotMatch(prompt, /構成・主要 API/);
});

test("buildOpenAiSummaryPrompt uses keyword expansion for empty body with title keywords", () => {
  g.settings.uiLocale = "ja";
  const prompt = g.buildOpenAiGenreSummaryPrompt(
  "# Honoフレームワーク",
    [],
    { genreId: "technology", subgenreId: "frameworks", reason: "技術" }
  );
  assert.match(prompt, /キーワード拡張/);
  assert.match(prompt, /キーワード分析/);
});

test("buildOpenAiSummaryPrompt stays grounded when URL excerpt is rich", () => {
  g.settings.uiLocale = "ja";
  const longBody = "x".repeat(600);
  const prompt = g.buildOpenAiGenreSummaryPrompt(
    "short memo",
    [{ ok: true, url: "https://example.com", textPreview: longBody, title: "Example" }],
    { genreId: "technology", subgenreId: "frameworks", reason: "記事" }
  );
  assert.match(prompt, /ソース整理/);
  assert.doesNotMatch(prompt, /キーワード拡張（重要）/);
});

test("buildOpenAiSummaryPrompt ignores empty supplement", () => {
  g.settings.openaiUserPromptMemo = "";
  const withEmpty = g.buildOpenAiSummaryPrompt("memo body", [], "   ");
  const without = g.buildOpenAiSummaryPrompt("memo body", []);
  assert.equal(withEmpty, without);
});

test("buildOpenAiSystemPrompt ignores custom settings while prompts are disabled", () => {
  g.settings.openaiSystemPrompt = "CUSTOM SYSTEM PROMPT ONLY";
  g.settings.uiLocale = "ja";
  const prompt = g.buildOpenAiSystemPrompt({ hasYouTube: false, hasUrls: false });
  assert.doesNotMatch(prompt, /CUSTOM SYSTEM PROMPT ONLY/);
  assert.match(prompt, /日本語/);
});

test("getOpenAiActionSupplement returns action-specific instruction", () => {
  g.settings.uiLocale = "ja";
  const supplement = g.getOpenAiActionSupplement("simple-list");
  assert.match(supplement, /箇条書き/);
});

test("setModalEditorPreviewContent keeps full markdown in textarea", () => {
  g.modalTitleSection = { removeAttribute() {}, setAttribute() {} };
  g.modalTextarea = { value: "" };
  g.modalYoutubeThumb = null;

  g.setModalEditorPreviewContent("# Heading\nbody");

  assert.equal(g.modalTextarea.value, "# Heading\nbody");
  assert.equal(g.getModalTextFromUi(), "# Heading\nbody");
});

test("setModalEditorContent keeps title and body in one textarea", () => {
  g.modalMarkdownEnabled = true;
  g.modalTitleSection = { removeAttribute() {}, setAttribute() {} };
  g.modalTextarea = { value: "" };
  g.modalYoutubeThumb = null;

  g.setModalEditorContent("# Heading\nbody");

  assert.equal(g.modalTextarea.value, "# Heading\nbody");
  assert.equal(g.getModalTextFromUi(), "# Heading\nbody");
});

test("updateModalYoutubeSection shows youtube section only for video urls", () => {
  let sectionHidden = true;
  g.modalTitleSection = {
    removeAttribute(name) {
      if (name === "hidden") sectionHidden = false;
    },
    setAttribute(name) {
      if (name === "hidden") sectionHidden = true;
    }
  };
  g.modalTextarea = { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
  g.modalYoutubeThumb = { hidden: true, removeAttribute() {}, setAttribute() {}, querySelector: () => null };

  g.updateModalYoutubeSection(g.getModalTextFromUi());
  assert.equal(sectionHidden, false);

  g.modalTextarea.value = "# Title only\nbody";
  g.updateModalYoutubeSection(g.getModalTextFromUi());
  assert.equal(sectionHidden, true);
});

test("switchModalToEditModeAfterTitleEnter places caret at body start in unified textarea", () => {
  g.modalMarkdownEnabled = true;
  g.modalTextarea = {
    value: "# Title\nBody line",
    hidden: false,
    focus() {},
    selectionStart: 0,
    selectionEnd: 0
  };
  g.__editModeCalled = false;
  g.switchModalToEditMode = () => {
    g.modalMarkdownEnabled = false;
    g.__editModeCalled = true;
  };

  g.switchModalToEditModeAfterTitleEnter();

  assert.equal(g.__editModeCalled, true);
  assert.equal(g.modalTextarea.selectionStart, 8);
  assert.equal(g.modalTextarea.selectionEnd, 8);
});

test("shouldOpenModalMarkdownPreview is true only when text exists", () => {
  assert.equal(g.shouldOpenModalMarkdownPreview(""), false);
  assert.equal(g.shouldOpenModalMarkdownPreview("   "), false);
  assert.equal(g.shouldOpenModalMarkdownPreview("# Title"), true);
});

test("getModalEditor split helpers separate heading and body", () => {
  const text = "# Heading\n\nBody";
  assert.equal(g.getModalHeadingLine(text), "# Heading");
  assert.equal(g.getModalTitlePlain(text), "Heading");
  assert.equal(g.getModalBodyText(text), "Body");
  assert.equal(g.getModalBodyText("plain only"), "plain only");
});

test("ensureFirstLineMarkdownHeading promotes plain first line for preview", () => {
  assert.equal(g.ensureFirstLineMarkdownHeading("My Title\nbody"), "# My Title\nbody");
  assert.equal(g.ensureFirstLineMarkdownHeading("My Title"), "# My Title");
  assert.equal(g.ensureFirstLineMarkdownHeading("# Already\nbody"), "# Already\nbody");
  assert.equal(g.ensureFirstLineMarkdownHeading("- list item"), "- list item");
});

test("getTileBoardPreviewBodyText omits title line used in tile header", () => {
  assert.equal(g.getTileBoardPreviewBodyText("My Title\n\nBody text"), "Body text");
  assert.equal(g.getTileBoardPreviewBodyText("# My Title\n\nBody text"), "Body text");
  assert.equal(g.getTileBoardPreviewBodyText("My Title"), "");
  assert.equal(g.getTileBoardPreviewBodyText("- list item\nbody"), "- list item\nbody");
});

test("buildTileBoardPreviewHtml renders body only without duplicate title", () => {
  const html = g.buildTileBoardPreviewHtml("My Title\n\nBody text");
  assert.doesNotMatch(html, /<h1>My Title<\/h1>/);
  assert.match(html, /Body text/);
});

test("buildModalMarkdownPreviewHtml renders plain first line as h1", () => {
  const html = g.buildModalMarkdownPreviewHtml("Memo title\nDetails");
  assert.match(html, /<h1>Memo title<\/h1>/);
  assert.match(html, /Details/);
});

test("isModalPreviewEditKeyTarget detects title and preview elements", () => {
  g.modalMarkdownPreview = {
    hidden: false,
    contains(node) {
      return node === this || node?.parent === this;
    }
  };
  g.modalEditorScroll = {
    contains(node) {
      return node?.tag === "title" || node?.tag === "textarea";
    }
  };
  const textarea = { tag: "textarea" };
  const previewChild = { parent: g.modalMarkdownPreview };
  g.modalTextarea = textarea;

  assert.equal(g.isModalPreviewEditKeyTarget(textarea), true);
  assert.equal(g.isModalPreviewEditKeyTarget(g.modalMarkdownPreview), true);
  assert.equal(g.isModalPreviewEditKeyTarget(previewChild), true);
  assert.equal(g.isModalPreviewEditKeyTarget({ tag: "other" }), false);
  assert.equal(g.isModalPreviewEditKeyTarget({ tag: "other", closest: () => null }), false);
});

test("handleModalPreviewEditKeydown switches to title-body edit when preview h1 is focused", () => {
  g.activeModal = { colIndex: 0, tileIndex: 0 };
  g.modalMarkdownEnabled = true;
  g.modalAiBusy = false;
  g.__titleEnterCalled = false;
  g.switchModalToEditModeAfterTitleEnter = () => {
    g.__titleEnterCalled = true;
  };

  const h1 = { contains: () => true };
  g.modalMarkdownPreview = {
    hidden: false,
    firstElementChild: h1,
    contains: () => true,
    querySelector: (sel) => (sel === "h1" ? h1 : null)
  };
  g.modalEditorScroll = { contains: () => false };

  const event = {
    key: "Enter",
    shiftKey: false,
    isComposing: false,
    target: g.modalMarkdownPreview,
    preventDefault() {}
  };

  g.document = { activeElement: g.modalMarkdownPreview };

  g.handleModalPreviewEditKeydown(event);
  assert.equal(g.__titleEnterCalled, true);
});

test("isModalPreviewTitleContext treats preview focus with leading h1 as title", () => {
  const h1 = { contains: () => false };
  g.modalMarkdownPreview = {
    hidden: false,
    firstElementChild: h1,
    contains: () => true,
    querySelector: (sel) => (sel === "h1" ? h1 : null)
  };

  const event = { target: g.modalMarkdownPreview };
  g.document = { activeElement: g.modalMarkdownPreview };

  assert.equal(g.isModalPreviewTitleContext(event), true);
});

test("validateImportedSettings preserves secrets and normalizes folder", () => {
  g.settings.obsidianToken = "keep-me";
  g.settings.openaiApiKey = "keep-key";

  const next = g.validateImportedSettings(
    {
      obsidianFolder: "../Inbox/",
      globalMarkdownPreview: false,
      autoBackupEnabled: false
    },
    g.settings
  );

  assert.equal(next.obsidianFolder, "Inbox");
  assert.equal(next.globalMarkdownPreview, false);
  assert.equal(next.autoBackupEnabled, false);
  assert.equal(g.settings.obsidianToken, "keep-me");
  assert.equal(g.settings.openaiApiKey, "keep-key");
});

test("getModalTextFromUi returns textarea value", () => {
  g.modalTextarea = { value: "Body text" };
  assert.equal(g.getModalTextFromUi(), "Body text");
});

test("setModalEditorContent replaces textarea when opening another tile", () => {
  g.modalTitleSection = { removeAttribute() {}, setAttribute() {} };
  g.modalTextarea = { value: "" };
  g.modalYoutubeThumb = null;

  g.setModalEditorContent("# Previous Tile Title\nbody");
  g.setModalEditorContent("Current tile body");

  assert.equal(g.modalTextarea.value, "Current tile body");
  assert.equal(g.getModalTextFromUi(), "Current tile body");
});

test("sanitizeSettingsForBackup strips API secrets", () => {
  g.settings.obsidianToken = "secret-token";
  g.settings.openaiApiKey = "secret-key";

  const sanitized = g.sanitizeSettingsForBackup();
  assert.equal(sanitized.obsidianToken, "");
  assert.equal(sanitized.openaiApiKey, "");
  assert.equal(sanitized.globalMarkdownPreview, g.settings.globalMarkdownPreview);
});

test("formatUpdatedDateTime uses locale-specific patterns", () => {
  const date = new Date("2026-05-26T14:30:00");

  g.settings.uiLocale = "ja";
  assert.equal(g.formatUpdatedDateTime(date), "2026/05/26 14:30");

  g.settings.uiLocale = "en";
  assert.equal(g.formatUpdatedDateTime(date), "05/26/2026, 02:30 PM");

  g.settings.uiLocale = "es";
  assert.equal(g.formatUpdatedDateTime(date), "26/05/2026, 14:30");
});

test("formatTileUpdatedLabel embeds locale-formatted datetime", () => {
  g.settings.uiLocale = "en";
  const tile = { updatedAt: "2026-05-26T14:30:00" };
  const label = g.formatTileUpdatedLabel(tile);
  assert.match(label, /05\/26\/2026, 02:30 PM/);
});

test("newtab.css preserves one-filled column-body grid split for add slot", () => {
  const css = readFileSync(join(repoRoot, "newtab.css"), "utf8");
  const primaryBlock = css.match(/\.column\.column-primary\s*\{[^}]+\}/s)?.[0] || "";
  assert.match(primaryBlock, /min-height:\s*var\(--board-column-height\)/);
  assert.doesNotMatch(primaryBlock, /min-height:\s*0\s*;/);
  assert.match(
    css,
    /\.column:not\(\.column-no-filled\)\.column-primary \.column-body\s*\{[^}]*gap:\s*var\(--column-body-gap\)/s
  );
  assert.match(
    css,
    /\.column\.column-primary\.column-one-filled \.column-body\s*\{[^}]*gap:\s*var\(--column-body-gap\)/s
  );
  assert.match(
    css,
    /\.column\.column-one-filled \.column-add-tile-slot\s*\{[^}]*height:\s*100%/s
  );
  assert.doesNotMatch(
    css,
    /\.column\.column-primary\.column-one-filled \.column-add-tile-slot\s*\{[^}]*flex:\s*0\s+0\s+auto/s
  );
});

test("newtab.css keeps column flex spec when sidebar is open or collapsed", () => {
  const css = readFileSync(join(repoRoot, "newtab.css"), "utf8");
  const columnBlock = css.match(/\.column\s*\{[^}]+\}/s)?.[0] || "";
  assert.match(columnBlock, /flex:\s*1\s+0\s+var\(--column-width\)/);
  assert.match(columnBlock, /min-width:\s*var\(--column-width\)/);
  assert.doesNotMatch(
    css,
    /body\.sidebar-collapsed \.column\s*\{[^}]*flex:\s*1\s+1/s
  );
});

test("newtab.css grows multi-filled add slot into remaining column space", () => {
  const css = readFileSync(join(repoRoot, "newtab.css"), "utf8");
  assert.match(
    css,
    /\.column\.column-primary\.column-multi-filled \.column-tiles\s*\{[^}]*flex:\s*0\s+1\s+auto/s
  );
  assert.match(
    css,
    /\.column\.column-primary\.column-multi-filled \.column-add-tile-slot\s*\{[^}]*flex:\s*1\s+1\s+0/s
  );
});

test("newtab.css uses wider clipping width for clipping and right-side columns", () => {
  const css = readFileSync(join(repoRoot, "newtab.css"), "utf8");
  assert.match(css, /--column-width-clipping:\s*calc\(var\(--column-width\)\s*\*\s*4\s*\/\s*5\)/);
  assert.match(
    css,
    /\.column\.column-clipping-width\s*\{[^}]*width:\s*var\(--column-width-clipping\)/s
  );
});

test("isTileFilled and getFilledTileCount drive column filled classes", () => {
  const column = {
    tiles: [
      { text: "" },
      { text: "  " },
      { text: "memo" }
    ]
  };
  assert.equal(g.isTileFilled(column.tiles[0]), false);
  assert.equal(g.isTileFilled(column.tiles[2]), true);
  assert.equal(g.getFilledTileCount(column), 1);
});
