/* Tag parsing and formatting */
function normalizeTagToken(tag) {
  return String(tag).trim().replace(/^#+/, "");
}

function splitTagInput(value) {
  return String(value || "").split(/[,、\uFF0C\s\u3000]+/);
}

function parseTags(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(normalizeTagToken).filter(Boolean))];
  }

  return [...new Set(splitTagInput(value)
    .map(normalizeTagToken)
    .filter(Boolean))];
}
