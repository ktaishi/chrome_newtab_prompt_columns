/* URL extraction and page context fetch */
function normalizeUrlFromText(rawUrl) {
  return String(rawUrl || "").replace(/[.,;:!?)]+$/g, "");
}

function extractUrlsFromText(text) {
  const matches = String(text || "").match(URL_IN_TEXT_REGEX) || [];
  const unique = [];
  const seen = new Set();

  for (const match of matches) {
    const url = normalizeUrlFromText(match);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    unique.push(url);
  }

  return unique;
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'");
}

function extractTitleFromHtml(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : "";
}

function extractMetaDescriptionFromHtml(html) {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }

  return "";
}

function extractTextPreviewFromHtml(html, maxLen = OPENAI_URL_TEXT_PREVIEW_MAX) {
  const cleaned = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.slice(0, maxLen);
}

function getTextareaLineBoundsAtCursor(textarea, position) {
  const value = String(textarea?.value ?? "");
  const pos = Math.max(0, Math.min(position ?? textarea?.selectionStart ?? 0, value.length));
  const lineStart = pos === 0 ? 0 : value.lastIndexOf("\n", pos - 1) + 1;
  const lineEndIndex = value.indexOf("\n", pos);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  return {
    lineStart,
    lineEnd,
    line: value.slice(lineStart, lineEnd),
    cursorInLine: pos - lineStart
  };
}

function getStandaloneUrlLineTarget(textarea) {
  const bounds = getTextareaLineBoundsAtCursor(textarea);
  const trimmed = bounds.line.trim();
  if (!isStandaloneUrlLine(trimmed)) return null;
  if (bounds.line.slice(bounds.cursorInLine).trim()) return null;

  return {
    ...bounds,
    url: normalizeUrlFromText(trimmed)
  };
}

function getContentAfterUrlLine(lines, urlLineIndex) {
  let index = urlLineIndex + 1;
  while (index < lines.length && !String(lines[index] || "").trim()) {
    index += 1;
  }
  return lines.slice(index).join("\n").trim();
}

function isUrlClipAlreadyApplied(textarea, target) {
  const lines = String(textarea?.value || "").split("\n");
  const lineIndex = String(textarea?.value || "").slice(0, target.lineStart).split("\n").length - 1;
  const previousLine = lines[lineIndex - 1]?.trim() || "";
  if (!/^#{1,6}\s+\S/.test(previousLine)) return false;

  const after = getContentAfterUrlLine(lines, lineIndex);
  return after.length >= 40;
}

function resolveUrlClipTitle(context) {
  if (!context?.ok) return "";
  return String(context.title || "").replace(/^#+\s*/, "").trim();
}

function resolveUrlClipBody(context) {
  if (!context?.ok) return "";

  if (context.isYouTube) {
    return String(context.description || "").trim().slice(0, URL_CLIP_BODY_MAX);
  }

  const preview = String(context.textPreview || "").trim();
  const description = String(context.description || "").trim();
  const body = preview.length >= description.length ? preview : (preview || description);
  return body.slice(0, URL_CLIP_BODY_MAX);
}

function composeUrlClipDocument(url, context) {
  const normalizedUrl = normalizeUrlFromText(url);
  const title = resolveUrlClipTitle(context);
  const body = resolveUrlClipBody(context);

  if (title) {
    const parts = [`# ${title}`, normalizedUrl];
    if (body) parts.push("", body);
    return parts.join("\n").trim();
  }

  if (body) {
    return `${normalizedUrl}\n\n${body}`.trim();
  }

  if (!context?.ok) {
    const error = String(context?.error || "").trim();
    if (error && typeof t === "function") {
      return `${normalizedUrl}\n\n${t("modal.urlClipFetchFailed", { error })}`.trim();
    }
    if (error) {
      return `${normalizedUrl}\n\n(${error})`.trim();
    }
  }

  return normalizedUrl;
}

function replaceTextareaRange(textarea, start, end, replacement) {
  const value = String(textarea.value || "");
  const safeStart = Math.max(0, Math.min(start, value.length));
  const safeEnd = Math.max(safeStart, Math.min(end, value.length));
  const before = value.slice(0, safeStart);
  const after = value.slice(safeEnd);
  const block = String(replacement || "");
  const needsTrailingNewline = after.length > 0 && !after.startsWith("\n");
  const insert = needsTrailingNewline && !block.endsWith("\n") ? `${block}\n` : block;

  textarea.value = before + insert + after;
  const cursor = before.length + insert.length;
  textarea.selectionStart = cursor;
  textarea.selectionEnd = cursor;
}

async function fetchUrlPageContext(url) {
  const validation = validateFetchableUrl(url);
  if (!validation.ok) {
    return { url, ok: false, error: validation.reason };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_URL_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(validation.url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      return { url, ok: false, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { url, ok: false, error: `${t("fetch.notHtml")} (${contentType || "unknown"})` };
    }

    const html = await response.text();
    return {
      url,
      ok: true,
      title: extractTitleFromHtml(html),
      description: extractMetaDescriptionFromHtml(html),
      textPreview: extractTextPreviewFromHtml(html)
    };
  } catch (error) {
    const message = error?.name === "AbortError"
      ? (typeof t === "function" ? t("fetch.timeout") : "タイムアウト")
      : (error?.message || (typeof t === "function" ? t("fetch.failed") : "取得失敗"));
    return { url, ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}
