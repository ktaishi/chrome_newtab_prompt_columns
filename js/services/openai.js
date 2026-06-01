/* OpenAI summary integration */
const AI_TITLE_MAX_LENGTH = 60;
const AI_TITLE_LINE_PATTERN = /^%%TITLE%%\s*(.+)$/i;

function sanitizeAiGeneratedTitle(title) {
  return String(title || "")
    .replace(/^#+\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, AI_TITLE_MAX_LENGTH);
}

function parseAiGeneratedTitle(markdown) {
  const raw = String(markdown || "");
  const lines = raw.split("\n");

  for (let i = 0; i < Math.min(lines.length, 5); i += 1) {
    const match = lines[i].trim().match(AI_TITLE_LINE_PATTERN);
    if (!match) continue;

    const title = sanitizeAiGeneratedTitle(match[1]);
    let bodyStart = i + 1;
    while (bodyStart < lines.length && !lines[bodyStart].trim()) {
      bodyStart += 1;
    }

    return {
      title,
      body: lines.slice(bodyStart).join("\n").trim()
    };
  }

  return { title: "", body: raw.trim() };
}

function resolveAiSummaryTitle(aiTitle, existingTitle, contextTitle) {
  const normalizedAiTitle = sanitizeAiGeneratedTitle(aiTitle);
  if (normalizedAiTitle) return normalizedAiTitle;

  const preservedTitle = String(existingTitle || "").replace(/^#+\s*/, "").trim();
  if (preservedTitle) return preservedTitle.slice(0, AI_TITLE_MAX_LENGTH);

  const normalizedContextTitle = String(contextTitle || "").replace(/^#+\s*/, "").trim();
  if (normalizedContextTitle) return normalizedContextTitle.slice(0, AI_TITLE_MAX_LENGTH);

  return typeof t === "function" ? t("tile.untitled") : "無題";
}

function composeTileDocumentWithTitle(title, body) {
  const normalizedTitle = sanitizeAiGeneratedTitle(title);
  const normalizedBody = String(body || "").trim();
  if (!normalizedTitle) return normalizedBody;
  const heading = `# ${normalizedTitle}`;
  if (!normalizedBody) return heading;
  return `${heading}\n${normalizedBody}`;
}

function buildUrlTileAiPrompt(tileText, urlContexts) {
  return buildOpenAiUserPromptUrl(tileText, urlContexts);
}

function isNoiseAiOutputLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed) return false;
  if (trimmed === "---") return true;
  return /^\d+\.?$/.test(trimmed);
}

function isMarkdownFenceLine(line) {
  return Boolean(typeof parseCodeFenceLine === "function" && parseCodeFenceLine(line));
}

function sanitizeAiOutputLines(markdown) {
  const lines = String(markdown || "").split("\n");
  const kept = [];
  let inFence = false;

  lines.forEach((line) => {
    if (isMarkdownFenceLine(line)) {
      inFence = !inFence;
      kept.push(line);
      return;
    }
    if (inFence || !isNoiseAiOutputLine(line)) {
      kept.push(line);
    }
  });

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeAiMarkdown(markdown) {
  return sanitizeAiOutputLines(
    String(markdown || "")
      .replace(/^##\s*AIサマリー\s*\n+/i, "")
      .replace(/^##\s*URLサマリー\s*\n+/im, "")
      .replace(/\n##\s*URLサマリー\s*\n+/gi, "\n")
      .replace(/(?:^|\n)---(?:\n|$)/g, "\n")
  );
}

function resolvePrimaryUrlContext(urlContexts, urls) {
  const contexts = Array.isArray(urlContexts) ? urlContexts : [];

  for (const url of urls) {
    const normalized = normalizeUrlFromText(url);
    if (!normalized) continue;
    const found = contexts.find((item) => normalizeUrlFromText(item.url) === normalized);
    if (found) return { context: found, url: normalized };
    return { context: { url: normalized, title: "" }, url: normalized };
  }

  const first = contexts[0];
  if (!first) return null;
  return { context: first, url: normalizeUrlFromText(first.url) };
}

function stripLeadingTitleAndUrlFromAiBody(body, title, url) {
  let lines = String(body || "").split("\n");
  const plainTitle = String(title || "").replace(/^#+\s*/, "").trim();

  while (lines.length) {
    const line = lines[0].trim();
    if (!line) {
      lines.shift();
      continue;
    }
    if (/^#+\s/.test(line)) {
      lines.shift();
      continue;
    }
    if (url && normalizeUrlFromText(line) === url) {
      lines.shift();
      continue;
    }
    if (plainTitle && line.replace(/^#+\s*/, "").trim() === plainTitle) {
      lines.shift();
      continue;
    }
    break;
  }

  return lines.join("\n").trim();
}

function resolveAiExistingTitle(text, tile) {
  return getExistingHeadingTitleFromText(text, tile);
}

const SPEECH_POLISH_MIN_BODY_CHARS = 8;

function extractSpeechPolishSource(text, tile) {
  const stripped = stripExistingAiSummary(String(text || "")).trim();
  const title = resolveAiExistingTitle(stripped, tile);
  const urls = extractUrlsFromText(stripped);
  const primaryUrl = urls[0] || "";
  let body = stripped;

  if (title || primaryUrl) {
    body = stripLeadingTitleAndUrlFromAiBody(body, title, primaryUrl);
  }

  return { title, urls, body: body.trim() };
}

function composeSpeechPolishDocument(title, urls, polishedBody) {
  const normalizedBody = normalizeAiMarkdown(polishedBody);
  const normalizedTitle = sanitizeAiGeneratedTitle(title);
  const urlLines = (Array.isArray(urls) ? urls : [])
    .map((url) => normalizeUrlFromText(url))
    .filter(Boolean);

  const parts = [];
  if (normalizedTitle) parts.push(`# ${normalizedTitle}`);
  urlLines.forEach((url) => {
    if (!parts.includes(url)) parts.push(url);
  });

  if (!normalizedBody) {
    return parts.join("\n").trim();
  }
  if (!parts.length) return normalizedBody;
  return `${parts.join("\n")}\n\n${normalizedBody}`.trim();
}

function stripSpeechPolishSummarySection(markdown) {
  const text = String(markdown || "").trim();
  if (!text) return "";

  const lines = text.split("\n");
  const summaryIndex = lines.findIndex((line) => /^##\s*(サマリー|Summary)\s*$/i.test(line.trim()));
  if (summaryIndex === -1) return text;
  return lines.slice(0, summaryIndex).join("\n").trim();
}

function buildUrlTileDocument(urlContexts, aiMarkdown, urls, existingTitle = "", aiTitle = "") {
  const primary = resolvePrimaryUrlContext(urlContexts, urls);
  const aiBlock = normalizeAiMarkdown(aiMarkdown);
  if (!primary) {
    const title = resolveAiSummaryTitle(aiTitle, existingTitle, "");
    if (sanitizeAiGeneratedTitle(aiTitle) || String(existingTitle || "").trim()) {
      return composeTileDocumentWithTitle(title, aiBlock);
    }
    return aiBlock;
  }

  const contextTitle = String(primary.context?.title || "").replace(/^#+\s*/, "").trim();
  const title = resolveAiSummaryTitle(aiTitle, existingTitle, contextTitle);
  const urlLine = primary.url || "";
  const body = stripLeadingTitleAndUrlFromAiBody(aiBlock, title, urlLine);
  const parts = [`# ${title}`];

  if (urlLine) parts.push(urlLine);
  if (body) parts.push("", body);
  return parts.join("\n").trim();
}

async function callOpenAiChat(apiKey, userPrompt, options = {}) {
  const {
    hasYouTube = false,
    hasUrls = false,
    systemPrompt = null,
    jsonMode = false,
    temperature = 0.5,
    maxTokens = OPENAI_GENERATION_MAX_TOKENS,
    model = OPENAI_DEFAULT_MODEL,
    genreId = "",
    subgenreId = "",
    tileText = "",
    urlContexts = []
  } = options;

  const body = {
    model,
    temperature,
    messages: [
      {
        role: "system",
        content:
          systemPrompt
          || buildOpenAiSystemPrompt({
            hasYouTube,
            hasUrls,
            genreId,
            subgenreId,
            tileText,
            urlContexts
          })
      },
      {
        role: "user",
        content: userPrompt
      }
    ]
  };
  applyOpenAiOutputTokenLimit(body, maxTokens, model);

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(detail);
  }

  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI応答が空でした。");
  return content;
}

async function classifyTileContentGenre(apiKey, bodyText, urlContexts) {
  await ensureOpenAiGenreTaxonomyLoaded();
  const prompt = buildOpenAiGenreClassificationPrompt(bodyText, urlContexts);
  const systemPrompt = buildOpenAiGenreClassificationSystemPrompt();
  const raw = await callOpenAiChat(apiKey, prompt, {
    systemPrompt,
    jsonMode: true,
    temperature: 0.1,
    maxTokens: 256,
    model: OPENAI_CLASSIFICATION_MODEL
  });
  return parseOpenAiGenreClassification(raw);
}

function findAiSummaryBlockStart(text) {
  const content = String(text || "");
  const markers = [
    `${AI_SUMMARY_LEGACY_SEPARATOR}## AIサマリー`,
    `${AI_SUMMARY_SEPARATOR}## AIサマリー`,
    `${AI_SUMMARY_SEPARATOR}${AI_BLOCK_MARKER}`,
    AI_BLOCK_MARKER
  ];

  let index = -1;
  for (const marker of markers) {
    const found = content.lastIndexOf(marker);
    if (found > index) index = found;
  }

  return index;
}

function stripExistingAiSummary(text) {
  const index = findAiSummaryBlockStart(text);
  if (index === -1) return String(text || "");
  return text.slice(0, index);
}

function insertAiSummaryIntoText(tileText, aiMarkdown, urlSourceText, options = {}) {
  const allUrls = options.urls?.length
    ? options.urls
    : extractUrlsFromText(urlSourceText ?? tileText);
  const parsed = parseAiGeneratedTitle(aiMarkdown);
  const aiBlock = normalizeAiMarkdown(parsed.body);

  if (allUrls.length) {
    return buildUrlTileDocument(
      options.urlContexts || [],
      aiBlock,
      allUrls,
      options.existingTitle,
      parsed.title
    );
  }

  if (parsed.title) {
    return composeTileDocumentWithTitle(parsed.title, aiBlock);
  }

  return aiBlock;
}

function applyAiSummaryToModal(aiMarkdown, baseText, urlContexts = [], preservedUrls = [], existingTitle = "") {
  if (!activeModal) return;

  const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
  if (!tile) return;

  const sourceText = baseText ?? getModalTextFromUi();
  const urlSourceText = getModalTextFromUi() || sourceText;
  const resolvedExistingTitle = existingTitle || resolveAiExistingTitle(urlSourceText, tile);
  const allUrls = preservedUrls.length
    ? preservedUrls
    : extractUrlsFromText(urlSourceText || sourceText);
  const nextText = insertAiSummaryIntoText(sourceText, aiMarkdown, urlSourceText, {
    urlContexts,
    urls: allUrls,
    existingTitle: resolvedExistingTitle
  });
  tile.text = nextText;
  markTileDirty(tile.id);
  syncTileTitleFromText(tile);
  setModalEditorContent(nextText);
  modalMarkdownEnabled = shouldOpenModalMarkdownPreview(nextText);
  updateModalMarkdownView();
  updateModalTemplateButtonVisibility(tile);
  renderModalTags();
  touchTileUpdated(tile);
  scheduleModalSave();
  syncBoardTileById(tile.id);
}

async function runTileAiSummary(bodyText, urlContexts, supplement, onProgress, actionId) {
  const apiKey = settings.openaiApiKey?.trim();
  if (!apiKey) throw new Error("OpenAI API Keyが未設定です。");

  const normalizedBody = stripExistingAiSummary(bodyText).trim();
  if (!normalizedBody) throw new Error("サマリー対象の本文がありません。");

  const contexts = urlContexts || await Promise.all(
    extractUrlsFromText(normalizedBody).map((url) => fetchUrlPageContextForAi(url))
  );
  const hasUrls = contexts.length > 0;
  const hasYouTube = urlContextsIncludeYouTube(contexts);

  if (typeof onProgress === "function") {
    onProgress("classifying");
  }
  const classification = await classifyTileContentGenre(apiKey, normalizedBody, contexts);

  if (typeof onProgress === "function") {
    onProgress("generating");
  }
  const prompt = buildOpenAiGenreSummaryPrompt(
    normalizedBody,
    contexts,
    classification,
    supplement,
    actionId
  );
  const aiMarkdown = await callOpenAiChat(apiKey, prompt, {
    hasYouTube,
    hasUrls,
    genreId: classification.genreId,
    subgenreId: classification.subgenreId,
    tileText: normalizedBody,
    urlContexts: contexts,
    model: resolveOpenAiGenerationModel(settings.openaiGenerationModel)
  });

  return { aiMarkdown, classification };
}

async function prepareUrlMetadataForAi(tile, sourceText) {
  const bodyText = stripExistingAiSummary(sourceText).trim();
  const urls = extractUrlsFromText(bodyText);
  const urlContexts = await Promise.all(urls.map((url) => fetchUrlPageContextForAi(url)));
  const hasYouTube = urls.some(isYouTubeUrl);

  let nextBodyText = bodyText;
  if (hasYouTube) {
    nextBodyText = await applyYouTubeMetadataToTile(tile, bodyText, urlContexts);
  } else {
    nextBodyText = applyPageMetadataToTile(bodyText, urlContexts, tile);
  }

  if (tile && nextBodyText !== bodyText) {
    tile.text = nextBodyText;
    setModalEditorContent(nextBodyText);
    syncTileTitleFromText(tile);
    updateModalTemplateButtonVisibility(tile);
  }

  if (tile && hasYouTube) {
    renderModalTags();
  }

  return { bodyText: nextBodyText, urlContexts };
}

async function runSpeechPolishAi(bodyText) {
  const apiKey = settings.openaiApiKey?.trim();
  if (!apiKey) throw new Error("OpenAI API Keyが未設定です。");

  const normalizedBody = String(bodyText || "").trim();
  if (!normalizedBody) throw new Error("整理対象の本文がありません。");

  const systemPrompt = buildSpeechPolishSystemPrompt();
  const userPrompt = buildSpeechPolishUserPrompt(normalizedBody);
  const aiMarkdown = await callOpenAiChat(apiKey, userPrompt, {
    systemPrompt,
    temperature: 0.3,
    maxTokens: OPENAI_GENERATION_MAX_TOKENS,
    tileText: normalizedBody,
    hasUrls: false,
    hasYouTube: false,
    model: resolveOpenAiGenerationModel(settings.openaiGenerationModel)
  });

  return normalizeAiMarkdown(aiMarkdown);
}

function applySpeechPolishToModal(polishedMarkdown, sourceText) {
  if (!activeModal) return;

  const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
  if (!tile) return;

  const urlSourceText = getModalTextFromUi() || sourceText;
  const { title, urls, body } = extractSpeechPolishSource(urlSourceText, tile);
  const polishedBody = stripSpeechPolishSummarySection(stripLeadingTitleAndUrlFromAiBody(
    normalizeAiMarkdown(polishedMarkdown),
    title,
    urls[0] || ""
  ));
  const nextText = composeSpeechPolishDocument(title, urls, polishedBody || body);
  tile.text = nextText;
  markTileDirty(tile.id);
  syncTileTitleFromText(tile);
  setModalEditorContent(nextText);
  modalMarkdownEnabled = shouldOpenModalMarkdownPreview(nextText);
  updateModalMarkdownView();
  updateModalTemplateButtonVisibility(tile);
  renderModalTags();
  touchTileUpdated(tile);
  scheduleModalSave();
  syncBoardTileById(tile.id);
}

async function handleModalSpeechPolish() {
  if (!activeModal || modalAiBusy) return;
  if (!isOpenAiConfigured()) return;

  const sourceText = getModalTextFromUi() || "";
  const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
  const { body } = extractSpeechPolishSource(sourceText, tile);
  if (body.length < SPEECH_POLISH_MIN_BODY_CHARS) return;

  modalAiBusy = true;
  showAiLoadingOverlay(t("modal.aiSpeechPolishing"));
  if (modalAiButton) {
    modalAiButton.disabled = true;
    modalAiButton.classList.add("ai-busy");
    modalAiButton.title = t("modal.aiBusy");
  }

  try {
    setAiLoadingMessage(t("modal.aiSpeechPolishGenerating"));
    const polished = await runSpeechPolishAi(body);
    applySpeechPolishToModal(polished, sourceText);
  } catch (error) {
    alert(t("openai.failed", { error: error?.message || t("openai.unknownError") }));
  } finally {
    modalAiBusy = false;
    hideAiLoadingOverlay();
    updateOpenAiButtonStates();
  }
}

async function handleModalAiSummary(actionId, options = {}) {
  if (!activeModal || modalAiBusy) return;
  if (!isOpenAiConfigured()) {
    alert(t("openai.notConfigured"));
    return;
  }

  const sourceText = getModalTextFromUi() || "";
  if (!stripExistingAiSummary(sourceText).trim()) {
    alert(t("openai.noContent"));
    return;
  }

  if (!actionId) {
    if (!isModalAiSupplementPanelVisible()) {
      showModalAiSupplementPanel();
    }
    return;
  }

  if (!isValidOpenAiActionId(actionId)) return;

  const supplement = options.userSupplementOnly
    ? getModalAiUserSupplement()
    : buildModalAiSupplement(actionId);
  if (options.userSupplementOnly && !supplement) return;
  const fetchUrls = extractUrlsFromText(stripExistingAiSummary(sourceText));

  modalAiBusy = true;
  stopModalSpeechInput();
  showAiLoadingOverlay(t("modal.aiStarting"));
  if (modalAiButton) {
    modalAiButton.disabled = true;
    modalAiButton.classList.add("ai-busy");
    modalAiButton.title = t("modal.aiBusy");
  }

  try {
    const tile = columns[activeModal.colIndex]?.tiles[activeModal.tileIndex];
    const existingTitle = resolveAiExistingTitle(sourceText, tile);
    setAiLoadingMessage(t("modal.aiFetchingUrls"));
    const { bodyText, urlContexts } = await prepareUrlMetadataForAi(tile, sourceText);
    setAiLoadingMessage(t("modal.aiClassifyingGenre"));
    const { aiMarkdown } = await runTileAiSummary(
      bodyText,
      urlContexts,
      supplement,
      (phase) => {
        if (phase === "generating") {
          setAiLoadingMessage(t("modal.aiGenerating"));
        }
      },
      actionId
    );
    applyAiSummaryToModal(aiMarkdown, bodyText, urlContexts, fetchUrls, existingTitle);
    resetModalAiSupplementPanel();
  } catch (error) {
    alert(t("openai.failed", { error: error?.message || t("openai.unknownError") }));
  } finally {
    modalAiBusy = false;
    hideAiLoadingOverlay();
    updateOpenAiButtonStates();
  }
}
