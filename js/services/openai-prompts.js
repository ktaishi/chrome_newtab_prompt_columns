/* OpenAI prompt defaults and template helpers */
// NOTE: 設定画面のカスタムプロンプトは一時無効（組み込みデフォルトのみ使用）
const OPENAI_CUSTOM_PROMPTS_FROM_SETTINGS_ENABLED = false;

const OPENAI_AI_ACTION_SUPPLEMENT_KEYS = {
  summary: "openai.action.summary",
  "deep-dive": "openai.action.deepDive",
  "simple-list": "openai.action.simpleList",
  "try-it": "openai.action.tryIt"
};

const OPENAI_OUTPUT_LANGUAGES = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
  ko: "한국어",
  es: "español",
  bn: "বাংলা"
};

function getOpenAiOutputLanguage(locale) {
  const code = locale && OPENAI_OUTPUT_LANGUAGES[locale]
    ? locale
    : (typeof getUiLocale === "function" ? getUiLocale() : "ja");
  return OPENAI_OUTPUT_LANGUAGES[code] || OPENAI_OUTPUT_LANGUAGES.en;
}

function getOpenAiPromptLocaleVariables(locale) {
  const uiLocale = locale && OPENAI_OUTPUT_LANGUAGES[locale]
    ? locale
    : (typeof getUiLocale === "function" ? getUiLocale() : "ja");
  return {
    OUTPUT_LANGUAGE: getOpenAiOutputLanguage(uiLocale),
    UI_LOCALE: uiLocale
  };
}

function withOpenAiPromptLocale(template, locale) {
  return applyOpenAiPromptTemplate(template, getOpenAiPromptLocaleVariables(locale));
}

function formatUrlContextsForPrompt(contexts) {
  if (!contexts.length) return "（本文中にURLはありません）";

  return contexts.map((item, index) => {
    if (!item.ok) {
      return `${index + 1}. URL: ${item.url}\n   取得結果: 失敗 (${item.error})`;
    }

    const parts = [`${index + 1}. URL: ${item.url}`];
    if (item.isYouTube) parts.push("   種別: YouTube動画");
    if (item.title) parts.push(`   タイトル: ${item.title}`);
    if (item.isYouTube) {
      if (item.description) parts.push(`   動画内容（説明欄抜粋）: ${item.description}`);
      if (item.artistReference) {
        parts.push(
          "   アーティスト関連情報（説明欄抜粋）:\n"
          + item.artistReference.split("\n").map((line) => `     ${line}`).join("\n")
        );
      }
    } else {
      if (item.description) parts.push(`   説明: ${item.description}`);
      if (item.textPreview) parts.push(`   本文抜粋: ${item.textPreview}`);
    }
    return parts.join("\n");
  }).join("\n\n");
}

function getDefaultOpenAiSystemPrompt(locale) {
  return withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("aiInquirySystem"), locale);
}

function getDefaultOpenAiUserPromptMemo(locale) {
  return withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("aiInquiryUser"), locale);
}

function getDefaultOpenAiGenreClassificationSystem(locale) {
  return withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("genreClassificationSystem"), locale);
}

function getDefaultOpenAiGenreClassificationUser(locale) {
  return withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("genreClassificationUser"), locale);
}

function getDefaultOpenAiUserPromptUrl(locale) {
  return withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("aiInquiryUser"), locale);
}

function applyOpenAiPromptTemplate(template, variables = {}) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return String(variables[key] ?? "");
    }
    return `{{${key}}}`;
  });
}

function resolveOpenAiPrompt(stored, defaultValue) {
  const value = String(stored ?? "").trim();
  return value || defaultValue;
}

function resolveOpenAiPromptForExecution(stored, defaultValue) {
  if (!OPENAI_CUSTOM_PROMPTS_FROM_SETTINGS_ENABLED) {
    return defaultValue;
  }
  return resolveOpenAiPrompt(stored, defaultValue);
}

function getOpenAiActionSupplement(actionId) {
  const key = OPENAI_AI_ACTION_SUPPLEMENT_KEYS[actionId];
  if (!key || typeof t !== "function") return "";
  return t(key);
}

function isValidOpenAiActionId(actionId) {
  return Object.prototype.hasOwnProperty.call(OPENAI_AI_ACTION_SUPPLEMENT_KEYS, actionId);
}

function normalizeOpenAiPromptSetting(value, defaultValue) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (trimmed === String(defaultValue ?? "").trim()) return "";
  return trimmed;
}

function getOpenAiVerbatimQuoteRules(locale) {
  return withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("verbatimQuoteRules"), locale);
}

function getOpenAiTitleRule(locale) {
  return withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("aiTitleRule"), locale);
}

const OPENAI_THIN_URL_SOURCE_MIN_CHARS = 200;

function countOpenAiUrlSourceChars(urlContexts) {
  if (!Array.isArray(urlContexts)) return 0;
  let total = 0;
  for (const ctx of urlContexts) {
    if (!ctx?.ok) continue;
    total += String(ctx.textPreview || "").length;
    total += String(ctx.description || "").length;
  }
  return total;
}

function isRichOpenAiSourceInput(tileText, urlContexts) {
  const memo = String(tileText || "").trim();
  if (countOpenAiUrlSourceChars(urlContexts) >= 500) return true;
  if (memo.length >= 550) return true;
  if (memo.split("\n").filter((line) => line.trim()).length >= 10) return true;
  return false;
}

/** 本文が空/薄いときはジャンル不問でキーワード分析→内容構築 */
function shouldUseOpenAiKeywordExpansion(tileText, urlContexts) {
  return !isRichOpenAiSourceInput(tileText, urlContexts);
}

function buildOpenAiInputModeRules(tileText, urlContexts) {
  const localeVars = getOpenAiPromptLocaleVariables();
  const key = shouldUseOpenAiKeywordExpansion(tileText, urlContexts)
    ? "inputModeKeyword"
    : "inputModeGrounded";
  return withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate(key), localeVars.UI_LOCALE);
}

function pickOpenAiKeywordExpansionSectionsKey(genre) {
  if (genre?.id === "technology") return "technicalGeneralSections";
  return "keywordExpansionSections";
}

function buildOpenAiKeywordExpansionScript(genre, subgenre, tileText, options = {}) {
  if (isOpenAiSimpleListAction(options.actionId) && genre && subgenre) {
    return buildOpenAiSubgenreScriptMarkdown(genre, subgenre, options);
  }

  const deepDive = isOpenAiDeepDiveAction(options.actionId);
  const memoSnippet = String(tileText || "").trim() || "（空）";
  const localeVars = getOpenAiPromptLocaleVariables();
  const analysisBlock = applyOpenAiPromptTemplate(
    withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("keywordAnalysisSteps"), localeVars.UI_LOCALE),
    { MEMO_SNIPPET: memoSnippet.slice(0, 800) }
  );

  const sectionsKey =
    subgenre?.id === "frameworks" ? "technicalFrameworkSections" : pickOpenAiKeywordExpansionSectionsKey(genre);
  const sections = withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate(sectionsKey), localeVars.UI_LOCALE);

  const genreLine =
    genre && subgenre
      ? `分類ヒント: ${genre.label} / ${subgenre.label}${subgenre.scene ? `（${subgenre.scene}）` : ""}`
      : "分類ヒント: 未指定 — キーワードから主題の種類を推定する";

  return [
    deepDive ? OPENAI_DEEP_DIVE_SCRIPT_PREAMBLE : "",
    analysisBlock,
    genreLine,
    "",
    sections
  ]
    .filter(Boolean)
    .join("\n");
}

function buildOpenAiInquirySystemPrompt() {
  const localeVars = getOpenAiPromptLocaleVariables();
  const template = resolveOpenAiPromptForExecution(
    settings.openaiSystemPrompt,
    getDefaultOpenAiSystemPrompt(localeVars.UI_LOCALE)
  );
  return applyOpenAiPromptTemplate(template, localeVars);
}

function buildOpenAiInquiryPrompt(documentText, urlContexts, inquiry) {
  const localeVars = getOpenAiPromptLocaleVariables();
  const template = resolveOpenAiPromptForExecution(
    settings.openaiUserPromptMemo,
    withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("aiInquiryUser"), localeVars.UI_LOCALE)
  );
  return applyOpenAiPromptTemplate(template, {
    ...localeVars,
    DOCUMENT: String(documentText || "").trim() || "（空）",
    INQUIRY: String(inquiry || "").trim() || "（なし）",
    URL_CONTEXTS: formatUrlContextsForPrompt(urlContexts || [])
  });
}

function buildOpenAiSystemPrompt({
  hasYouTube = false,
  hasUrls = false,
  genreId = "",
  subgenreId = "",
  tileText = "",
  urlContexts = []
} = {}) {
  const localeVars = getOpenAiPromptLocaleVariables();

  const youtubeSystemRule = hasYouTube
    ? " For YouTube videos, never describe how to watch, subscribe, or streaming platform CTAs. If the subject is an artist, add official website/SNS/members/credits sections when relevant."
    : "";

  const urlTileRule = hasUrls
    ? " Body must not repeat the title line or URL line."
    : "";

  const genreHint = genreId && subgenreId ? ` Genre: ${genreId}/${subgenreId}.` : "";
  const sectionLimitRule = `${genreHint} Follow the genre-specific section order and headings in the user message exactly.`;

  const template = resolveOpenAiPromptForExecution(
    settings.openaiSystemPrompt,
    getDefaultOpenAiSystemPrompt()
  );
  return applyOpenAiPromptTemplate(template, {
    ...localeVars,
    INPUT_MODE_RULES: buildOpenAiInputModeRules(tileText, urlContexts),
    AI_TITLE_RULE: getOpenAiTitleRule(localeVars.UI_LOCALE),
    URL_TILE_RULE: urlTileRule,
    SECTION_LIMIT_RULE: sectionLimitRule,
    YOUTUBE_SYSTEM_RULE: youtubeSystemRule
  });
}

function buildOpenAiGenreClassificationSystemPrompt() {
  const localeVars = getOpenAiPromptLocaleVariables();
  const template = getDefaultOpenAiGenreClassificationSystem(localeVars.UI_LOCALE);
  return applyOpenAiPromptTemplate(template, localeVars);
}

function buildOpenAiGenreClassificationPrompt(tileText, urlContexts) {
  const localeVars = getOpenAiPromptLocaleVariables();
  const template = getDefaultOpenAiGenreClassificationUser(localeVars.UI_LOCALE);
  return applyOpenAiPromptTemplate(template, {
    ...localeVars,
    GENRE_CATALOG: buildOpenAiGenreCatalogForClassification(),
    MEMO_BODY: tileText || "（空）",
    URL_CONTEXTS: formatUrlContextsForPrompt(urlContexts || [])
  });
}

function buildOpenAiUrlArticleScriptMarkdown(genre, subgenre, options = {}) {
  const deepDive = isOpenAiDeepDiveAction(options.actionId);
  const localeVars = getOpenAiPromptLocaleVariables();
  const script = withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("urlArticleScript"), localeVars.UI_LOCALE);
  const modeBlock = deepDive
    ? `${OPENAI_DEEP_DIVE_SCRIPT_PREAMBLE}\n\n`
    : `${OPENAI_STANDARD_SCRIPT_PREAMBLE}\n\n`;
  const scene = subgenre?.scene || "";
  const genreLine = genre && subgenre
    ? `ジャンル参考: ${genre.label} / ${subgenre.label}（${scene}）\n`
    : "";
  return `${modeBlock}${genreLine}${script}`;
}

function shouldUseOpenAiUrlArticleScript(urlContexts, actionId) {
  if (isOpenAiSimpleListAction(actionId)) return false;
  if (!Array.isArray(urlContexts) || urlContexts.length === 0) return false;
  return countOpenAiUrlSourceChars(urlContexts) >= OPENAI_THIN_URL_SOURCE_MIN_CHARS;
}

function buildOpenAiGenreSummaryPrompt(tileText, urlContexts, classification, supplement, actionId) {
  const localeVars = getOpenAiPromptLocaleVariables();
  const resolved = resolveOpenAiSubgenreEntry(
    classification?.genreId,
    classification?.subgenreId
  );
  const { genre, subgenre } = resolved;
  const hasYouTube = urlContextsIncludeYouTube(urlContexts);
  const youtubeExtraRules = hasYouTube
    ? `\n${withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("youtubeExtraRules"))}`
    : "";
  const useUrlArticleScript = shouldUseOpenAiUrlArticleScript(urlContexts, actionId);
  const keywordMode = shouldUseOpenAiKeywordExpansion(tileText, urlContexts);
  const genreScript = useUrlArticleScript
    ? buildOpenAiUrlArticleScriptMarkdown(genre, subgenre, { actionId })
    : keywordMode
      ? buildOpenAiKeywordExpansionScript(genre, subgenre, tileText, { actionId })
      : buildOpenAiSubgenreScriptMarkdown(genre, subgenre, { actionId });
  const reason = String(classification?.reason || "").trim();
  const genreMeta = reason
    ? `分類: ${genre.label} / ${subgenre.label}（${reason}）${useUrlArticleScript ? " — URL記事向け" : keywordMode ? " — キーワード拡張" : ""}`
    : `分類: ${genre.label} / ${subgenre.label}${useUrlArticleScript ? " — URL記事向け" : keywordMode ? " — キーワード拡張" : ""}`;

  const template = resolveOpenAiPromptForExecution(
    settings.openaiUserPromptMemo,
    withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("genreSummaryUser"))
  );

  const basePrompt = applyOpenAiPromptTemplate(template, {
    ...localeVars,
    INPUT_MODE_RULES: buildOpenAiInputModeRules(tileText, urlContexts),
    AI_TITLE_RULE: getOpenAiTitleRule(localeVars.UI_LOCALE),
    GENRE_SCRIPT: genreScript,
    GENRE_META: genreMeta,
    MEMO_BODY: tileText || "（空）",
    URL_CONTEXTS: formatUrlContextsForPrompt(urlContexts || []),
    YOUTUBE_EXTRA_RULES: youtubeExtraRules,
    VERBATIM_QUOTE_RULES: getOpenAiVerbatimQuoteRules(localeVars.UI_LOCALE)
  });

  return appendOpenAiSupplementToPrompt(basePrompt, supplement);
}

function buildOpenAiUserPromptMemo(tileText) {
  const localeVars = getOpenAiPromptLocaleVariables();
  const fallback = resolveOpenAiSubgenreEntry(
    OPENAI_GENRE_FALLBACK.genreId,
    OPENAI_GENRE_FALLBACK.subgenreId
  );
  const keywordMode = shouldUseOpenAiKeywordExpansion(tileText, []);
  const template = resolveOpenAiPromptForExecution(
    settings.openaiUserPromptMemo,
    withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("genreSummaryUser"))
  );
  return applyOpenAiPromptTemplate(template, {
    ...localeVars,
    INPUT_MODE_RULES: buildOpenAiInputModeRules(tileText, []),
    AI_TITLE_RULE: getOpenAiTitleRule(localeVars.UI_LOCALE),
    GENRE_SCRIPT: keywordMode
      ? buildOpenAiKeywordExpansionScript(fallback.genre, fallback.subgenre, tileText, {})
      : buildOpenAiSubgenreScriptMarkdown(fallback.genre, fallback.subgenre),
    GENRE_META: `分類: ${fallback.genre.label} / ${fallback.subgenre.label}${keywordMode ? " — キーワード拡張" : ""}`,
    MEMO_BODY: tileText || "（空）",
    URL_CONTEXTS: formatUrlContextsForPrompt([]),
    YOUTUBE_EXTRA_RULES: "",
    VERBATIM_QUOTE_RULES: getOpenAiVerbatimQuoteRules(localeVars.UI_LOCALE)
  });
}

function buildOpenAiUserPromptUrl(tileText, urlContexts) {
  const localeVars = getOpenAiPromptLocaleVariables();
  const hasYouTube = urlContextsIncludeYouTube(urlContexts);
  const youtubeExtraRules = hasYouTube
    ? `\n${withOpenAiPromptLocale(getOpenAiPromptDefaultTemplate("youtubeExtraRules"))}`
    : "";
  const template = resolveOpenAiPromptForExecution(
    settings.openaiUserPromptUrl,
    getDefaultOpenAiUserPromptUrl()
  );

  const keywordMode = shouldUseOpenAiKeywordExpansion(tileText, urlContexts);
  const keywordScript = keywordMode
    ? buildOpenAiKeywordExpansionScript(null, null, tileText, {})
    : "";

  return applyOpenAiPromptTemplate(template, {
    ...localeVars,
    INPUT_MODE_RULES: buildOpenAiInputModeRules(tileText, urlContexts),
    KEYWORD_SCRIPT: keywordScript,
    AI_TITLE_RULE: getOpenAiTitleRule(localeVars.UI_LOCALE),
    MEMO_BODY: tileText || "（空）",
    URL_CONTEXTS: formatUrlContextsForPrompt(urlContexts),
    YOUTUBE_EXTRA_RULES: youtubeExtraRules,
    VERBATIM_QUOTE_RULES: getOpenAiVerbatimQuoteRules(localeVars.UI_LOCALE)
  });
}

function buildSpeechPolishSystemPrompt() {
  const localeVars = getOpenAiPromptLocaleVariables();
  const template = withOpenAiPromptLocale(
    getOpenAiPromptDefaultTemplate("speechPolishSystem"),
    localeVars.UI_LOCALE
  );
  return applyOpenAiPromptTemplate(template, localeVars);
}

function buildSpeechPolishUserPrompt(speechBody) {
  const localeVars = getOpenAiPromptLocaleVariables();
  const template = withOpenAiPromptLocale(
    getOpenAiPromptDefaultTemplate("speechPolishUser"),
    localeVars.UI_LOCALE
  );
  return applyOpenAiPromptTemplate(template, {
    ...localeVars,
    SPEECH_BODY: String(speechBody || "").trim() || "（空）"
  });
}

function buildOpenAiSummaryPrompt(documentText, urlContexts, inquiry) {
  return buildOpenAiInquiryPrompt(documentText, urlContexts, inquiry);
}

function appendOpenAiSupplementToPrompt(prompt, supplement) {
  const text = String(supplement ?? "").trim();
  if (!text) return prompt;
  return `${prompt}\n\n---\n${t("openai.supplementSection")}:\n${text}`;
}

function resetOpenAiPromptFieldsToDefaults() {
  if (openaiSystemPromptInput) {
    openaiSystemPromptInput.value = getDefaultOpenAiSystemPrompt();
  }
  if (openaiUserPromptMemoInput) {
    openaiUserPromptMemoInput.value = getDefaultOpenAiUserPromptMemo();
  }
  if (openaiUserPromptUrlInput) {
    openaiUserPromptUrlInput.value = getDefaultOpenAiUserPromptUrl();
  }
}

function populateOpenAiPromptFields() {
  if (openaiSystemPromptInput) {
    openaiSystemPromptInput.value = resolveOpenAiPrompt(
      settings.openaiSystemPrompt,
      getDefaultOpenAiSystemPrompt()
    );
  }
  if (openaiUserPromptMemoInput) {
    openaiUserPromptMemoInput.value = resolveOpenAiPrompt(
      settings.openaiUserPromptMemo,
      getDefaultOpenAiUserPromptMemo()
    );
  }
  if (openaiUserPromptUrlInput) {
    openaiUserPromptUrlInput.value = resolveOpenAiPrompt(
      settings.openaiUserPromptUrl,
      getDefaultOpenAiUserPromptUrl()
    );
  }
}

function persistOpenAiPromptFields() {
  settings.openaiSystemPrompt = normalizeOpenAiPromptSetting(
    openaiSystemPromptInput?.value,
    getDefaultOpenAiSystemPrompt()
  );
  settings.openaiUserPromptMemo = normalizeOpenAiPromptSetting(
    openaiUserPromptMemoInput?.value,
    getDefaultOpenAiUserPromptMemo()
  );
  settings.openaiUserPromptUrl = normalizeOpenAiPromptSetting(
    openaiUserPromptUrlInput?.value,
    getDefaultOpenAiUserPromptUrl()
  );
}
