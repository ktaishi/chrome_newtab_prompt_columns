import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "js/services/speech-input.js"), "utf8");

function loadSpeechInputModule() {
  const context = vm.createContext({
    ...globalThis,
    modalSpeechButton: null,
    modalTextarea: { value: "", hidden: false },
    modalAiBusy: false,
    modalMarkdownEnabled: false,
    window: globalThis,
    navigator: { mediaDevices: null },
    alert: () => {},
    t: (key) => key,
    getDateTimeFormatLocale: () => "ja-JP",
    switchModalToEditMode: () => {}
  });
  vm.runInContext(source, context, { filename: "speech-input.js" });
  return context;
}

test("stripSpeechEndPhrase removes trailing おわり and marks end phrase", () => {
  const g = loadSpeechInputModule();
  const result = g.__testStripSpeechEndPhrase("今日は晴れ おわり");
  assert.equal(result.text, "今日は晴れ");
  assert.equal(result.hadEndPhrase, true);
});

test("stripSpeechEndPhrase handles standalone end phrase", () => {
  const g = loadSpeechInputModule();
  let result = g.__testStripSpeechEndPhrase("おわり");
  assert.equal(result.text, "");
  assert.equal(result.hadEndPhrase, true);

  result = g.__testStripSpeechEndPhrase("終わり。");
  assert.equal(result.text, "");
  assert.equal(result.hadEndPhrase, true);
});

test("stripSpeechEndPhrase leaves normal text unchanged", () => {
  const g = loadSpeechInputModule();
  let result = g.__testStripSpeechEndPhrase("終わりのない話");
  assert.equal(result.text, "終わりのない話");
  assert.equal(result.hadEndPhrase, false);

  result = g.__testStripSpeechEndPhrase("memo body");
  assert.equal(result.text, "memo body");
  assert.equal(result.hadEndPhrase, false);
});

test("applySpeechVoiceCommands converts まる to period", () => {
  const g = loadSpeechInputModule();
  assert.equal(g.__testApplySpeechVoiceCommands("まる"), "。");
  assert.equal(g.__testApplySpeechVoiceCommands("今日は晴れ まる"), "今日は晴れ。");
  assert.equal(g.__testApplySpeechVoiceCommands("丸"), "。");
});

test("applySpeechVoiceCommands converts 改行 to newline", () => {
  const g = loadSpeechInputModule();
  assert.equal(g.__testApplySpeechVoiceCommands("改行"), "\n");
  assert.equal(g.__testApplySpeechVoiceCommands("今日 改行 明日"), "今日\n明日");
});

test("applySpeechVoiceCommands converts misheard 開業 except business compound terms", () => {
  const g = loadSpeechInputModule();
  assert.equal(g.__testApplySpeechVoiceCommands("開業"), "\n");
  assert.equal(g.__testApplySpeechVoiceCommands("開業 開業"), "\n\n");
  assert.equal(g.__testApplySpeechVoiceCommands("開業　開業"), "\n\n");
  assert.equal(g.__testApplySpeechVoiceCommands("予定開業　面談会"), "予定\n面談会");
  assert.equal(g.__testApplySpeechVoiceCommands("一行 開業 二行"), "一行\n二行");
  assert.equal(g.__testApplySpeechVoiceCommands("開業準備"), "開業準備");
  assert.equal(g.__testApplySpeechVoiceCommands("開業中"), "開業中");
  assert.equal(g.__testApplySpeechVoiceCommands("開業しました"), "開業しました");
  assert.equal(g.__testApplySpeechVoiceCommands("開業 準備"), "開業 準備");
});

test("processSpeechFinalTranscript applies voice commands before end phrase handling", () => {
  const g = loadSpeechInputModule();
  let result = g.__testProcessSpeechFinalTranscript("今日 まる おわり");
  assert.equal(result.text, "今日。");
  assert.equal(result.hadEndPhrase, true);

  result = g.__testProcessSpeechFinalTranscript("一行 改行 二行");
  assert.equal(result.text, "一行\n二行");
  assert.equal(result.hadEndPhrase, false);

  result = g.__testProcessSpeechFinalTranscript("予定開業　面談会");
  assert.equal(result.text, "予定\n面談会");
  assert.equal(result.hadEndPhrase, false);
});
