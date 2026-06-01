/* OpenAI generation model options and settings helpers */
const OPENAI_GENERATION_MODEL_OPTIONS = [
  {
    id: "gpt-5.4-mini",
    labelKey: "openai.model.gpt54mini",
    descriptionKey: "openai.model.gpt54miniDesc"
  },
  {
    id: "gpt-5.3-chat-latest",
    labelKey: "openai.model.gpt53chat",
    descriptionKey: "openai.model.gpt53chatDesc"
  },
  {
    id: "gpt-5.4",
    labelKey: "openai.model.gpt54",
    descriptionKey: "openai.model.gpt54Desc"
  },
  {
    id: "gpt-5.5",
    labelKey: "openai.model.gpt55",
    descriptionKey: "openai.model.gpt55Desc"
  },
  {
    id: "o3-mini",
    labelKey: "openai.model.o3mini",
    descriptionKey: "openai.model.o3miniDesc"
  },
  {
    id: "gpt-4o",
    labelKey: "openai.model.gpt4o",
    descriptionKey: "openai.model.gpt4oDesc"
  }
];

const OPENAI_GENERATION_MODEL_IDS = new Set(
  OPENAI_GENERATION_MODEL_OPTIONS.map((option) => option.id)
);

function isValidOpenAiGenerationModel(modelId) {
  return OPENAI_GENERATION_MODEL_IDS.has(String(modelId || "").trim());
}

function resolveOpenAiGenerationModel(storedModel) {
  const trimmed = String(storedModel ?? "").trim();
  if (isValidOpenAiGenerationModel(trimmed)) return trimmed;
  return OPENAI_DEFAULT_GENERATION_MODEL;
}

function getOpenAiGenerationModelOption(modelId) {
  return OPENAI_GENERATION_MODEL_OPTIONS.find((option) => option.id === modelId) || null;
}

function populateOpenAiGenerationModelSelect(selectEl) {
  if (!selectEl) return;
  const current = resolveOpenAiGenerationModel(settings.openaiGenerationModel);
  selectEl.innerHTML = "";

  OPENAI_GENERATION_MODEL_OPTIONS.forEach((option) => {
    const node = document.createElement("option");
    node.value = option.id;
    node.textContent = typeof t === "function"
      ? t(option.labelKey)
      : option.id;
    if (option.id === current) node.selected = true;
    selectEl.appendChild(node);
  });
}

function syncOpenAiGenerationModelSelectFromSettings(selectEl) {
  if (!selectEl) return;
  selectEl.value = resolveOpenAiGenerationModel(settings.openaiGenerationModel);
}

function getOpenAiGenerationModelDescription(modelId) {
  const option = getOpenAiGenerationModelOption(resolveOpenAiGenerationModel(modelId));
  if (!option || typeof t !== "function") return "";
  return t(option.descriptionKey);
}

function usesOpenAiMaxCompletionTokens(model) {
  const id = String(model || "").trim().toLowerCase();
  if (!id) return true;
  if (id === "gpt-4o" || id.startsWith("gpt-4o-")) return false;
  return true;
}

function applyOpenAiOutputTokenLimit(body, maxTokens, model) {
  const limit = Number(maxTokens);
  if (!Number.isFinite(limit) || limit <= 0) return body;
  if (usesOpenAiMaxCompletionTokens(model)) {
    body.max_completion_tokens = limit;
  } else {
    body.max_tokens = limit;
  }
  return body;
}
