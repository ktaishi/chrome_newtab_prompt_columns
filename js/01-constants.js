/* Legacy keys and timing constants */
const LEGACY_COLUMN_KEYS = [
  "promptColumns.v19",
  "promptColumns.v18",
  "promptColumns.v17",
  "promptColumns.v16",
  "promptColumns.v15",
  "promptColumns.v14",
  "promptColumns.v13",
  "promptColumns.v12",
  "promptColumns.v11",
  "promptColumns.v10",
  "promptColumns.v9",
  "promptColumns.v8",
  "promptColumns.v7",
  "promptColumns.v6",
  "promptColumns.v5"
];
const LEGACY_TILE_KEYS = ["promptTiles.v4", "textTiles.v2", "textTiles.v1"];
const LEGACY_SETTINGS_KEYS = [
  "promptColumns.settings.v19",
  "promptColumns.settings.v18",
  "promptColumns.settings.v17",
  "promptColumns.settings.v16",
  "promptColumns.settings.v15",
  "promptColumns.settings.v14",
  "promptColumns.settings.v13",
  "promptColumns.settings.v12",
  "promptColumns.settings.v11",
  "promptColumns.settings.v10",
  "promptColumns.settings.v9",
  "promptColumns.settings.v8",
  "promptColumns.settings.v7",
  "promptColumns.settings.v6",
  "promptColumns.settings.v5"
];
const SAVE_DELAY_MS = 250;
const CLIPBOARD_MAX_AGE_MS = 60_000;
const CLIPBOARD_TRACK_KEY = "clipboardTrack.v1";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_DEFAULT_GENERATION_MODEL = "gpt-5.4-mini";
const OPENAI_DEFAULT_MODEL = OPENAI_DEFAULT_GENERATION_MODEL;
const OPENAI_CLASSIFICATION_MODEL = "gpt-4o-mini";
const OPENAI_GENERATION_MAX_TOKENS = 8192;
const OPENAI_URL_FETCH_TIMEOUT_MS = 8000;
const OPENAI_URL_TEXT_PREVIEW_MAX = 12000;
const URL_CLIP_BODY_MAX = 6000;
const AI_SUMMARY_SEPARATOR = "\n\n";
const AI_SUMMARY_LEGACY_SEPARATOR = "\n\n---\n\n";
const AI_BLOCK_MARKER = "<!-- newtab-memo-ai -->";
const URL_IN_TEXT_REGEX = /https?:\/\/[^\s<>"')\]}]+/gi;

/**
 * Stripe Payment Link for optional tips (Settings → Support development).
 * Create at Stripe Dashboard → Payment links, then paste the https URL here.
 * Leave empty to hide the support section. Rebuild ZIP after changing.
 *
 * @example "https://buy.stripe.com/xxxxxxxx"
 */
const SUPPORT_STRIPE_PAYMENT_URL = "";
