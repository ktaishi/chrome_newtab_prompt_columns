/* Column defaults and prompt templates */
let dragged = null;
let tileDropTarget = null;
let suppressTileClick = false;
const TILE_INTERACTIVE_SELECTOR = "button, input, select, a, .color-palette, .color-chip";
let activeModal = null;
let modalSaveTimer = null;
let modalMarkdownEnabled = false;
let templateTarget = null;
let modalAiBusy = false;
let modalUrlClipBusy = false;
let modalUrlClipFetchSerial = 0;
const pendingAddedTileIds = new Set();

const DEFAULT_TILE_COLORS = ["blue", "green", "yellow", "purple"];
