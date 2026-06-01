/* Markdown to HTML conversion */
function parseBulletLine(line) {
  const match = String(line || "").match(/^(\s*)-\s+(.*)$/);
  if (!match) return null;

  const indent = match[1].replace(/\t/g, "  ").length;
  return {
    level: Math.floor(indent / 2),
    content: match[2]
  };
}

function parseBlockquoteLine(line) {
  const match = String(line || "").match(/^(\s*)>\s?(.*)$/);
  if (!match) return null;
  return match[2];
}

function closeMarkdownBlockquote(state) {
  if (!state.inBlockquote) return;
  state.html += "</blockquote>";
  state.inBlockquote = false;
}

function closeMarkdownLists(state) {
  if (state.needCloseLi) {
    state.html += "</li>";
    state.needCloseLi = false;
  }

  while (state.listDepth > 0) {
    state.html += "</ul>";
    state.listDepth -= 1;
  }
}

function appendMarkdownBullet(state, line) {
  const item = parseBulletLine(line);
  if (!item) return false;

  const targetDepth = item.level + 1;

  while (state.listDepth > targetDepth) {
    if (state.needCloseLi) {
      state.html += "</li>";
    }
    state.html += "</ul>";
    state.listDepth -= 1;
    state.needCloseLi = state.listDepth > 0;
  }

  if (state.needCloseLi && state.listDepth === targetDepth) {
    state.html += "</li>";
    state.needCloseLi = false;
  }

  while (state.listDepth < targetDepth) {
    state.html += "<ul>";
    state.listDepth += 1;
  }

  state.html += `<li>${renderInlineMarkdown(item.content)}`;
  state.needCloseLi = true;
  return true;
}

function appendMarkdownBlockquoteLine(state, content) {
  closeMarkdownLists(state);

  if (!state.inBlockquote) {
    state.html += "<blockquote>";
    state.inBlockquote = true;
  } else if (content) {
    state.html += "<br>";
  }

  if (content) {
    state.html += renderInlineMarkdown(content);
  }
}

function parseTableCells(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed.includes("|")) return null;

  let row = trimmed;
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);

  const cells = row.split("|").map((cell) => cell.trim());
  if (!cells.length || cells.every((cell) => cell === "")) return null;
  return cells;
}

function isTableSeparatorRow(line) {
  const cells = parseTableCells(line);
  if (!cells) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderMarkdownTable(headerCells, bodyRows) {
  let html = '<div class="markdown-table-wrap"><table><thead><tr>';
  headerCells.forEach((cell) => {
    html += `<th>${renderInlineMarkdown(cell)}</th>`;
  });
  html += "</tr></thead><tbody>";
  bodyRows.forEach((row) => {
    html += "<tr>";
    row.forEach((cell) => {
      html += `<td>${renderInlineMarkdown(cell)}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table></div>";
  return html;
}

function tryParseMarkdownTable(lines, startIndex) {
  const headerCells = parseTableCells(lines[startIndex]);
  if (!headerCells || headerCells.length < 1) return null;
  if (!isTableSeparatorRow(lines[startIndex + 1])) return null;

  const bodyRows = [];
  let index = startIndex + 2;
  while (index < lines.length) {
    const rowCells = parseTableCells(lines[index]);
    if (!rowCells) break;

    const normalized = rowCells.slice(0, headerCells.length);
    while (normalized.length < headerCells.length) normalized.push("");
    bodyRows.push(normalized);
    index += 1;
  }

  return {
    html: renderMarkdownTable(headerCells, bodyRows),
    nextIndex: index
  };
}

function parseCodeFenceLine(line) {
  const trimmed = String(line || "").trim();
  const match = trimmed.match(/^(`{3,}|~{3,})(.*)$/);
  if (!match) return null;

  const marker = match[1][0];
  const info = (match[2] || "").trim();
  if (!info) {
    return { marker, lang: "", rest: "", isClosing: true };
  }

  const infoMatch = info.match(/^([\w.-]+)(?:\s+(.*))?$/s);
  if (!infoMatch) {
    return { marker, lang: "", rest: info, isClosing: false };
  }

  return {
    marker,
    lang: infoMatch[1].toLowerCase(),
    rest: (infoMatch[2] || "").trim(),
    isClosing: false
  };
}

function normalizeFenceRestAsCodeStart(lang, rest) {
  const normalizedLang = String(lang || "").trim().toLowerCase();
  const normalizedRest = String(rest || "").trim();
  if (!normalizedRest) return "";

  if (
    (normalizedLang === "graph" || normalizedLang === "flowchart") &&
    /^(TD|TB|BT|RL|LR|DT)$/i.test(normalizedRest)
  ) {
    return `${normalizedLang} ${normalizedRest.toUpperCase()}`;
  }

  return normalizedRest;
}

function appendMarkdownCodeBlock(state, codeText, _codeLang) {
  state.html += `<pre><code>${escapeHtml(codeText)}</code></pre>`;
}

function tryParseIndentedCodeBlock(lines, startIndex) {
  const first = lines[startIndex];
  if (!/^(\t| {4})/.test(first)) return null;

  const buffer = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "") break;
    const match = line.match(/^(\t| {4})(.*)$/);
    if (!match) break;
    buffer.push(match[2]);
    index += 1;
  }

  if (!buffer.length) return null;
  return { code: buffer.join("\n"), nextIndex: index };
}

function markdownToHtml(markdown) {
  const source = String(markdown || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<!--\s*newtab-memo-ai\s*-->\n?/g, "");
  const lines = source.split("\n");
  const state = {
    html: "",
    listDepth: 0,
    needCloseLi: false,
    inBlockquote: false
  };
  let inCode = false;
  let codeLang = "";
  let codeFenceMarker = "";
  let codeBuffer = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const fence = parseCodeFenceLine(line);

    if (fence) {
      if (!inCode) {
        closeMarkdownLists(state);
        closeMarkdownBlockquote(state);
        inCode = true;
        codeFenceMarker = fence.marker;
        codeLang = fence.lang;
        codeBuffer = [];
        if (fence.rest) {
          codeBuffer.push(normalizeFenceRestAsCodeStart(fence.lang, fence.rest));
        }
      } else if (fence.isClosing && fence.marker === codeFenceMarker) {
        appendMarkdownCodeBlock(state, codeBuffer.join("\n"), codeLang);
        inCode = false;
        codeLang = "";
        codeFenceMarker = "";
        codeBuffer = [];
      } else {
        codeBuffer.push(line);
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    const blockquoteContent = parseBlockquoteLine(line);
    if (blockquoteContent !== null) {
      appendMarkdownBlockquoteLine(state, blockquoteContent);
      continue;
    }

    closeMarkdownBlockquote(state);

    const tableBlock = tryParseMarkdownTable(lines, lineIndex);
    if (tableBlock) {
      closeMarkdownLists(state);
      state.html += tableBlock.html;
      lineIndex = tableBlock.nextIndex - 1;
      continue;
    }

    const indentedCode = tryParseIndentedCodeBlock(lines, lineIndex);
    if (indentedCode) {
      closeMarkdownLists(state);
      appendMarkdownCodeBlock(state, indentedCode.code, "");
      lineIndex = indentedCode.nextIndex - 1;
      continue;
    }

    if (appendMarkdownBullet(state, line)) {
      continue;
    }

    closeMarkdownLists(state);

    if (/^###\s+/.test(line)) {
      state.html += `<h3>${renderInlineMarkdown(line.replace(/^###\s+/, ""))}</h3>`;
    } else if (/^##\s+/.test(line)) {
      state.html += `<h2>${renderInlineMarkdown(line.replace(/^##\s+/, ""))}</h2>`;
    } else if (/^#\s+/.test(line)) {
      state.html += `<h1>${renderInlineMarkdown(line.replace(/^#\s+/, ""))}</h1>`;
    } else if (line.trim() === "") {
      // blank line
    } else {
      state.html += `<p>${renderInlineMarkdown(line)}</p>`;
    }
  }

  if (inCode) {
    appendMarkdownCodeBlock(state, codeBuffer.join("\n"), codeLang);
  }
  closeMarkdownBlockquote(state);
  closeMarkdownLists(state);
  return state.html;
}

function applyMarkdownBulletContinuation(textarea) {
  const { value, selectionStart, selectionEnd } = textarea;
  if (selectionStart !== selectionEnd) return false;

  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionStart);
  const lineEndPos = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, lineEndPos);
  const cursorInLine = selectionStart - lineStart;

  const emptyBulletMatch = line.match(/^(\s*)-\s*$/);
  if (emptyBulletMatch) {
    textarea.value = `${value.slice(0, lineStart)}\n${value.slice(lineEndPos)}`;
    textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
    return true;
  }

  const bulletMatch = line.match(/^(\s*)-\s+(.*)$/);
  if (!bulletMatch) return false;

  const indent = bulletMatch[1];

  if (cursorInLine < line.length) {
    const beforeCursor = line.slice(0, cursorInLine);
    const afterCursor = line.slice(cursorInLine).trimStart();
    const prefixMatch = beforeCursor.match(/^(\s*)-\s+(.*)$/);
    if (!prefixMatch || !afterCursor) return false;

    const newLine = `${prefixMatch[1]}- ${prefixMatch[2]}\n${indent}- ${afterCursor}`;
    textarea.value = `${value.slice(0, lineStart)}${newLine}${value.slice(lineEndPos)}`;
    textarea.selectionStart = textarea.selectionEnd =
      lineStart + beforeCursor.length + 1 + indent.length + 2;
    return true;
  }

  const insert = `\n${indent}- `;
  textarea.value = `${value.slice(0, selectionStart)}${insert}${value.slice(selectionStart)}`;
  textarea.selectionStart = textarea.selectionEnd = selectionStart + insert.length;
  return true;
}

const MARKDOWN_BULLET_LINE_RE = /^(\s*)-\s(.*)$|^(\s*)-\s*$/;

function isMarkdownBulletLine(line) {
  return MARKDOWN_BULLET_LINE_RE.test(String(line || ""));
}

function getTextareaLineBlock(textarea) {
  const { value, selectionStart, selectionEnd } = textarea;
  const start = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const endAnchor = Math.max(selectionStart, selectionEnd - 1);
  let end = value.indexOf("\n", endAnchor);
  if (end === -1) end = value.length;
  return {
    start,
    end,
    lines: value.slice(start, end).split("\n")
  };
}

function indentMarkdownBulletLine(line) {
  if (!isMarkdownBulletLine(line)) return { line, delta: 0 };
  return { line: `  ${line}`, delta: 2 };
}

function outdentMarkdownBulletLine(line) {
  const match = String(line || "").match(/^(\s*)-(.*)$/);
  if (!match || match[1].length === 0) return { line, delta: 0 };
  const remove = Math.min(2, match[1].length);
  return {
    line: `${match[1].slice(remove)}-${match[2]}`,
    delta: -remove
  };
}

function applyMarkdownBulletIndent(textarea, { outdent = false } = {}) {
  const { value, selectionStart, selectionEnd } = textarea;
  const { start, end, lines } = getTextareaLineBlock(textarea);

  const newLines = lines.map((line) => {
    if (!isMarkdownBulletLine(line)) return line;
    return outdent ? outdentMarkdownBulletLine(line).line : indentMarkdownBulletLine(line).line;
  });

  const deltas = lines.map((line, index) =>
    isMarkdownBulletLine(line) ? newLines[index].length - line.length : 0
  );
  if (!deltas.some((delta) => delta !== 0)) return false;

  textarea.value = `${value.slice(0, start)}${newLines.join("\n")}${value.slice(end)}`;

  const adjustPos = (pos) => {
    if (pos < start) return pos;
    let offset = start;
    let cumulative = 0;
    for (let index = 0; index < lines.length; index += 1) {
      const lineEnd = offset + lines[index].length;
      if (pos <= lineEnd) {
        return pos + cumulative + (isMarkdownBulletLine(lines[index]) ? deltas[index] : 0);
      }
      cumulative += deltas[index];
      offset = lineEnd + 1;
      if (pos < offset) return pos + cumulative;
    }
    return pos + cumulative;
  };

  textarea.selectionStart = adjustPos(selectionStart);
  textarea.selectionEnd = adjustPos(selectionEnd);
  return true;
}
