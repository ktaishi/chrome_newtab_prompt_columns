/* YouTube URL, metadata, and thumbnails */
function extractYouTubeVideoId(text) {
  if (!text) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?[^ \n\r\t]*v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function youtubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function youtubeThumbUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function isYouTubeUrl(url) {
  return Boolean(extractYouTubeVideoId(url));
}

function cleanYouTubePageTitle(title) {
  return String(title || "")
    .replace(/\s*[-–|｜]\s*YouTube\s*$/i, "")
    .trim();
}

async function fetchYouTubeVideoTitle(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeWatchUrl(videoId))}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;

    const data = await response.json();
    return data?.title?.trim() || null;
  } catch (_) {
    return null;
  }
}

async function resolveYouTubeVideoTitle(url, urlContext) {
  const oembedTitle = await fetchYouTubeVideoTitle(url);
  if (oembedTitle) return oembedTitle;

  if (urlContext?.ok && urlContext.title) {
    const cleaned = cleanYouTubePageTitle(urlContext.title);
    if (cleaned) return cleaned;
  }

  return null;
}

function decodeYouTubeJsonString(raw) {
  return String(raw || "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function extractYouTubeShortDescriptionFromHtml(html) {
  const match = String(html || "").match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
  if (!match?.[1]) return "";
  return decodeYouTubeJsonString(match[1]).trim();
}

const YOUTUBE_DESCRIPTION_SKIP_PATTERNS = [
  /^subscribe to the official/i,
  /^subscribe\b/i,
  /^subscr/i,
  /チャンネル登録/i,
  /^listen on\b/i,
  /^stream on\b/i,
  /^watch on\b/i,
  /^listen\b/i,
  /^stream\b/i,
  /^watch\b/i,
  /^視聴/i,
  /視聴方法/i,
  /^配信先/i,
  /subscribe to/i,
  /^\-\s*$/,
  /playlist/i,
  /^\u2014+\s*$/,
  /^─+$/
];

function isYouTubeArtistReferenceLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed) return false;

  return (
    /^(website|homepage|official site|公式)/i.test(trimmed)
    || /^(facebook|twitter|x|instagram|tiktok)\b/i.test(trimmed)
    || /\b(facebook|twitter|instagram|tiktok|x)\.com\//i.test(trimmed)
    || /メンバー|member/i.test(trimmed)
    || /(produc|振付|choreograph|composer|作詞|作曲|編曲|ディレクター|プロデューサー|arranger|編曲|振り付け)/i.test(trimmed)
  );
}

function extractYouTubeArtistReferenceText(rawDescription) {
  const lines = String(rawDescription || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .filter(isYouTubeArtistReferenceLine)
    .join("\n")
    .trim()
    .slice(0, 1500);
}

function sanitizeYouTubeDescriptionForSummary(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const kept = lines.filter((line) => {
    if (isYouTubeArtistReferenceLine(line)) return true;
    if (YOUTUBE_DESCRIPTION_SKIP_PATTERNS.some((pattern) => pattern.test(line))) return false;
    if (/^https?:\/\//i.test(line) && line.replace(/https?:\/\/\S+/g, "").trim().length < 4) {
      return false;
    }
    return true;
  });

  return kept.join("\n").trim().slice(0, OPENAI_URL_TEXT_PREVIEW_MAX);
}

async function fetchYouTubeUrlPageContext(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return fetchUrlPageContext(url);

  const watchUrl = youtubeWatchUrl(videoId);
  const validation = validateFetchableUrl(watchUrl);
  if (!validation.ok) {
    return { url, ok: false, error: validation.reason, isYouTube: true };
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
      return { url, ok: false, error: `HTTP ${response.status}`, isYouTube: true };
    }

    const html = await response.text();
    const pageTitle = cleanYouTubePageTitle(extractTitleFromHtml(html));
    const oembedTitle = await fetchYouTubeVideoTitle(url);
    const rawDescription = extractYouTubeShortDescriptionFromHtml(html);
    const shortDescription = sanitizeYouTubeDescriptionForSummary(rawDescription);
    const artistReference = extractYouTubeArtistReferenceText(rawDescription);

    return {
      url,
      ok: true,
      isYouTube: true,
      title: oembedTitle || pageTitle || "",
      description: shortDescription,
      artistReference,
      textPreview: ""
    };
  } catch (error) {
    const message = error?.name === "AbortError" ? "タイムアウト" : (error?.message || "取得失敗");
    return { url, ok: false, error: message, isYouTube: true };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchUrlPageContextForAi(url) {
  if (isYouTubeUrl(url)) return fetchYouTubeUrlPageContext(url);
  return fetchUrlPageContext(url);
}

function urlContextsIncludeYouTube(contexts) {
  return Array.isArray(contexts) && contexts.some((item) => item?.isYouTube || isYouTubeUrl(item?.url));
}

function setTileHeadingTitle(text, headingTitle) {
  const trimmedTitle = String(headingTitle || "").trim();
  if (!trimmedTitle) return String(text || "");

  const heading = `# ${trimmedTitle}`;
  const lines = String(text || "").split("\n");
  const firstLine = lines[0]?.trim() || "";

  if (firstLine === heading) return lines.join("\n");

  if (isStandaloneUrlLine(firstLine)) {
    return [heading, ...lines].join("\n");
  }

  lines[0] = heading;
  return lines.join("\n");
}

function isStandaloneUrlLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed) return false;
  if (isYouTubeUrl(trimmed)) return true;

  const urls = extractUrlsFromText(trimmed);
  return urls.length === 1 && urls[0] === normalizeUrlFromText(trimmed);
}

function addYouTubeTagToTile(tile) {
  const tags = parseTags(tile.tags);
  const hasYouTube = tags.some((tag) => tag.toLowerCase() === "youtube");
  if (!hasYouTube) tags.push("YouTube");
  tile.tags = tags;
}

function syncYouTubeTagFromTile(tile, text) {
  const urls = extractUrlsFromText(text);
  const hasYouTube = urls.some(isYouTubeUrl);
  if (!hasYouTube) return false;

  const tags = parseTags(tile.tags);
  const hadYouTube = tags.some((tag) => tag.toLowerCase() === "youtube");
  addYouTubeTagToTile(tile);
  return !hadYouTube;
}

async function applyYouTubeMetadataToTile(tile, bodyText, urlContexts) {
  const youtubeUrls = extractUrlsFromText(bodyText).filter(isYouTubeUrl);
  if (!youtubeUrls.length) return bodyText;

  addYouTubeTagToTile(tile);

  if (getExistingHeadingTitleFromText(bodyText, tile)) return bodyText;

  const firstUrl = youtubeUrls[0];
  const context = urlContexts.find((item) => normalizeUrlFromText(item.url) === firstUrl);
  const videoTitle = await resolveYouTubeVideoTitle(firstUrl, context);
  if (!videoTitle) return bodyText;

  return setTileHeadingTitle(bodyText, videoTitle);
}

function resolvePageTitle(urlContext) {
  if (!urlContext?.ok) return null;
  const title = String(urlContext.title || "").trim();
  return title || null;
}

function applyPageMetadataToTile(bodyText, urlContexts, tile) {
  if (getExistingHeadingTitleFromText(bodyText, tile)) return bodyText;

  const pageUrls = extractUrlsFromText(bodyText).filter((url) => !isYouTubeUrl(url));
  if (!pageUrls.length) return bodyText;

  const firstUrl = pageUrls[0];
  const context = urlContexts.find((item) => normalizeUrlFromText(item.url) === firstUrl);
  const pageTitle = resolvePageTitle(context);
  if (!pageTitle) return bodyText;

  return setTileHeadingTitle(bodyText, pageTitle);
}
