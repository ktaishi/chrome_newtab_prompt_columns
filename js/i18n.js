/* i18n core: locale resolution, t(), static UI refresh */
const SUPPORTED_UI_LOCALES = new Set(["ja", "en", "zh", "ko", "es", "bn"]);

const BROWSER_LOCALE_PREFIXES = [
  ["ja", "ja"],
  ["ko", "ko"],
  ["zh", "zh"],
  ["es", "es"],
  ["bn", "bn"]
];

/** BCP 47 tags for Intl when the user picks a fixed UI language. */
const UI_LOCALE_BCP47 = {
  ja: "ja-JP",
  en: "en-US",
  zh: "zh-CN",
  ko: "ko-KR",
  es: "es-ES",
  bn: "bn-BD"
};

function resolveUiLocale(preferred) {
  if (preferred && preferred !== "auto" && SUPPORTED_UI_LOCALES.has(preferred)) {
    return preferred;
  }

  const browser = String(navigator.language || "en").toLowerCase();
  for (const [prefix, locale] of BROWSER_LOCALE_PREFIXES) {
    if (browser.startsWith(prefix)) {
      return locale;
    }
  }
  return "en";
}

function getUiLocale() {
  return resolveUiLocale(settings?.uiLocale);
}

function getDateTimeFormatLocale() {
  const preferred = settings?.uiLocale;
  if (!preferred || preferred === "auto") {
    return String(navigator.language || "en-US");
  }
  return UI_LOCALE_BCP47[preferred] || preferred;
}

function interpolate(template, params = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return `{${key}}`;
  });
}

function t(key, params = {}) {
  const locale = getUiLocale();
  const localized = I18N_MESSAGES[locale]?.[key];
  const fallback = I18N_MESSAGES.ja?.[key];
  const template = localized ?? fallback ?? key;
  return interpolate(template, params);
}

function getDefaultColumnTitles() {
  const locale = getUiLocale();
  return I18N_LOCALE_DATA[locale]?.columnTitles || I18N_LOCALE_DATA.ja.columnTitles;
}

function getPromptTemplates() {
  const locale = getUiLocale();
  return I18N_LOCALE_DATA[locale]?.promptTemplates || I18N_LOCALE_DATA.ja.promptTemplates;
}

function applyI18nToRoot(root) {
  if (!root) return;

  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.getAttribute("data-i18n"));
  });

  root.querySelectorAll("option[data-i18n]").forEach((element) => {
    element.textContent = t(element.getAttribute("data-i18n"));
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.getAttribute("data-i18n-placeholder"));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.getAttribute("data-i18n-aria-label")));
  });

  root.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.title = t(element.getAttribute("data-i18n-title"));
  });

  root.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = t(element.getAttribute("data-i18n-html"));
  });
}

function applyStaticTranslations() {
  applyI18nToRoot(document);
  document.querySelectorAll("template").forEach((template) => {
    applyI18nToRoot(template.content);
  });
  document.documentElement.lang = getUiLocale();
  document.title = t("app.title");
}

const MOBILE_LAYOUT_BREAKPOINT = 760;

function isMobileLayout() {
  return window.matchMedia(`(max-width: ${MOBILE_LAYOUT_BREAKPOINT}px)`).matches;
}

function updateSidebarToggleIcon() {
  if (!sidebarToggle) return;
  const collapsed = document.body.classList.contains("sidebar-collapsed");
  if (isMobileLayout()) {
    sidebarToggle.textContent = collapsed ? "▾" : "▴";
  } else {
    sidebarToggle.textContent = collapsed ? "›" : "‹";
  }
}

function updateSidebarToggleLabel() {
  if (!sidebarToggle) return;
  const collapsed = document.body.classList.contains("sidebar-collapsed");
  sidebarToggle.setAttribute("aria-label", t(collapsed ? "sidebar.expand" : "sidebar.collapse"));
  updateSidebarToggleIcon();
}

function applyLocale(preferredLocale) {
  if (settings && preferredLocale !== undefined) {
    settings.uiLocale = preferredLocale;
  }

  applyStaticTranslations();
  updateSidebarToggleLabel();

  if (typeof render === "function") render();
  if (typeof renderSidePanels === "function") renderSidePanels();
  if (typeof updateObsidianButtonStates === "function") updateObsidianButtonStates();
  if (typeof updateOpenAiButtonStates === "function") updateOpenAiButtonStates();
  if (typeof updateSupportDevelopmentSectionVisibility === "function") {
    updateSupportDevelopmentSectionVisibility();
  }
  if (typeof updateModalSpeechButtonState === "function") updateModalSpeechButtonState();
  if (activeModal && typeof updateModalContentDependentButtons === "function") {
    updateModalContentDependentButtons();
  }
  if (activeModal && typeof updateModalUpdatedLabel === "function") {
    updateModalUpdatedLabel();
  }
}

globalThis.t = t;
globalThis.getDateTimeFormatLocale = getDateTimeFormatLocale;
