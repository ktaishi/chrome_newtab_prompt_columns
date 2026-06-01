/* Lazy loader for openai-genre-taxonomy.js (~110KB, AI summary only) */
let openAiGenreTaxonomyLoadPromise = null;

function isOpenAiGenreTaxonomyLoaded() {
  return typeof buildOpenAiGenreCatalogForClassification === "function";
}

function ensureOpenAiGenreTaxonomyLoaded() {
  if (isOpenAiGenreTaxonomyLoaded()) {
    return Promise.resolve();
  }

  if (!openAiGenreTaxonomyLoadPromise) {
    openAiGenreTaxonomyLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("js/services/openai-genre-taxonomy.js");
      script.onload = () => resolve();
      script.onerror = () => {
        openAiGenreTaxonomyLoadPromise = null;
        reject(new Error("Failed to load OpenAI genre taxonomy"));
      };
      document.head.appendChild(script);
    });
  }

  return openAiGenreTaxonomyLoadPromise;
}

function scheduleOpenAiGenreTaxonomyPrefetch() {
  if (isOpenAiGenreTaxonomyLoaded() || openAiGenreTaxonomyLoadPromise) return;

  const prefetch = () => {
    ensureOpenAiGenreTaxonomyLoaded().catch((error) => {
      console.warn("OpenAI genre taxonomy prefetch failed:", error);
    });
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(prefetch, { timeout: 8000 });
  } else {
    setTimeout(prefetch, 3000);
  }
}
