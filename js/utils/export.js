/* Timestamp, markdown export, backup settings sanitize */
function nowString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fileTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function safeFileName(name) {
  return String(name || "untitled")
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function tileToMarkdown(tile, columnTitle) {
  const title = getTileDisplayTitle(tile, "Untitled");
  return `---
created: ${nowString()}
source: ${APP_ID}
column: ${yamlQuote(columnTitle || "")}
title: ${yamlQuote(title)}
tags: ${yamlQuote(formatTags(tile.tags))}
---

# ${title}

${tile.text || ""}
`;
}

function sanitizeSettingsForBackup() {
  return {
    ...settings,
    obsidianToken: "",
    openaiApiKey: ""
  };
}
