import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDomainModules } from "./helpers/load-modules.mjs";

loadDomainModules({ includeOpenAi: true });

test("buildSpeechPolishUserPrompt embeds speech body", () => {
  const prompt = buildSpeechPolishUserPrompt("今日は 改行 おわり みたいな");
  assert.match(prompt, /今日は 改行 おわり みたいな/);
  assert.match(prompt, /## サマリー.*出力しない/s);
  assert.doesNotMatch(prompt, /\{\{SPEECH_BODY\}\}/);
});

test("buildSpeechPolishSystemPrompt avoids genre summary rules", () => {
  const prompt = buildSpeechPolishSystemPrompt();
  assert.match(prompt, /voice-dictated|音声/i);
  assert.match(prompt, /not research|text cleanup only/i);
  assert.doesNotMatch(prompt, /Genre:/);
});

test("extractSpeechPolishSource keeps title and urls separate from body", () => {
  const text = "# 会議メモ\nhttps://example.com\n\nえーと今日の議題は三つです";
  const { title, urls, body } = extractSpeechPolishSource(text, null);
  assert.equal(title, "会議メモ");
  assert.equal(urls.length, 1);
  assert.equal(urls[0], "https://example.com");
  assert.match(body, /議題は三つ/);
  assert.doesNotMatch(body, /example\.com/);
});

test("composeSpeechPolishDocument rebuilds tile structure", () => {
  const doc = composeSpeechPolishDocument(
    "会議メモ",
    ["https://example.com"],
    "- 議題1\n- 議題2\n\n## サマリー\n要点"
  );
  assert.match(doc, /^# 会議メモ/);
  assert.match(doc, /https:\/\/example\.com/);
  assert.match(doc, /## サマリー/);
});

test("stripSpeechPolishSummarySection removes trailing summary section", () => {
  const input = "本文1\n\n- 箇条書き\n\n## サマリー\n要点1\n要点2";
  assert.equal(stripSpeechPolishSummarySection(input), "本文1\n\n- 箇条書き");
  assert.equal(stripSpeechPolishSummarySection("本文のみ"), "本文のみ");
});
