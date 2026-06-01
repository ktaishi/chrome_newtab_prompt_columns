/* Modal speech input: Web Speech API (real-time) */
let modalSpeechRecognition = null;
let modalSpeechListening = false;
let modalSpeechTarget = null;
let modalSpeechInsertStart = 0;
let modalSpeechSuffixAfter = "";
let modalSpeechHadInput = false;
let modalSpeechMicStream = null;
let modalSpeechRestartTimer = null;
let modalSpeechInterimDispatchTimer = null;
let modalSpeechResultIndex = 0;
let modalSpeechCommittedText = "";
let modalSpeechLastFinalAt = 0;

/** Pause longer than this inserts a newline before the next final segment. */
const SPEECH_PAUSE_NEWLINE_MS = 700;
const SPEECH_INTERIM_DEBOUNCE_MS = 60;
/** Silence after the end phrase before stopping recording. */
const SPEECH_END_SILENCE_MS = 1000;
const SPEECH_END_PHRASE_PATTERN = /(?:^|[\s、,。．.!！?？]+)(おわり|終わり)[\s、,。．.!！?？]*$/u;
const SPEECH_END_PHRASE_ONLY_PATTERN = /^(?:おわり|終わり)[\s、,。．.!！?？]*$/u;
const SPEECH_COMMAND_BOUNDARY = String.raw`(?:^|[\s、,]+)`;
const SPEECH_COMMAND_TAIL = String.raw`(?=$|[\s、,。．.!！?？])`;
const SPEECH_COMMAND_GYOUKO_PATTERN = new RegExp(
  `${SPEECH_COMMAND_BOUNDARY}改行(?:[\\s、,]+|$)`,
  "gu"
);
/** 改行の誤認識「開業」。ビジネス用語としてそのまま残すパターン */
const SPEECH_KAIKEI_LITERAL_PATTERN =
  /開業(?:準備|中|しました|日|式|祝|延期|告知|案内)|開業[\s　]+準備/gu;
/** 連続する 開業（改行×N の明示指示） */
const SPEECH_COMMAND_KAIKEI_REPEAT_PATTERN = new RegExp(
  `${SPEECH_COMMAND_BOUNDARY}開業(?:[\\s、,。．.!！?？]*開業)+(?:[\\s、,。．.!！?？]*)`,
  "gu"
);
const SPEECH_COMMAND_MARU_PATTERN = new RegExp(
  `${SPEECH_COMMAND_BOUNDARY}(?:まる|丸)${SPEECH_COMMAND_TAIL}`,
  "gu"
);

let modalSpeechPendingStopTimer = null;

function isWebSpeechInputSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function isSpeechInputSupported() {
  return isWebSpeechInputSupported();
}

function getSpeechRecognitionLang() {
  const locale = String(getDateTimeFormatLocale() || "ja-JP");
  if (/^[a-z]{2}$/i.test(locale)) {
    const shortMap = {
      ja: "ja-JP",
      en: "en-US",
      ko: "ko-KR",
      zh: "zh-CN",
      es: "es-ES",
      bn: "bn-BD"
    };
    return shortMap[locale.toLowerCase()] || locale;
  }
  return locale;
}

function getModalSpeechTargetElement() {
  if (modalTextarea && !modalTextarea.hidden) return modalTextarea;
  return modalTextarea;
}

function ensureModalEditModeForSpeech() {
  if (modalMarkdownEnabled) {
    switchModalToEditMode();
  }
}

function prepareModalSpeechTarget() {
  ensureModalEditModeForSpeech();
  modalSpeechTarget = getModalSpeechTargetElement();
  if (!modalSpeechTarget) return false;

  modalSpeechTarget.focus();
  modalSpeechInsertStart = modalSpeechTarget.selectionStart ?? modalSpeechTarget.value.length;
  const insertEnd = modalSpeechTarget.selectionEnd ?? modalSpeechInsertStart;
  modalSpeechSuffixAfter = modalSpeechTarget.value.slice(insertEnd);
  modalSpeechHadInput = false;
  modalSpeechResultIndex = 0;
  modalSpeechCommittedText = "";
  modalSpeechLastFinalAt = 0;
  return true;
}

function applySpeechTranscriptToTarget(finalText, interimText = "") {
  if (!modalSpeechTarget) return;
  const before = modalSpeechTarget.value.slice(0, modalSpeechInsertStart);
  const inserted = finalText + interimText;
  modalSpeechTarget.value = before + inserted + modalSpeechSuffixAfter;
  const cursorPos = modalSpeechInsertStart + inserted.length;
  modalSpeechTarget.selectionStart = cursorPos;
  modalSpeechTarget.selectionEnd = cursorPos;
  if (inserted) modalSpeechHadInput = true;
}

function dispatchSpeechTargetInput() {
  if (!modalSpeechTarget) return;
  modalSpeechTarget.dispatchEvent(new Event("input", { bubbles: true }));
}

function dispatchSpeechTargetInputDebounced() {
  if (modalSpeechInterimDispatchTimer) clearTimeout(modalSpeechInterimDispatchTimer);
  modalSpeechInterimDispatchTimer = setTimeout(() => {
    modalSpeechInterimDispatchTimer = null;
    dispatchSpeechTargetInput();
  }, SPEECH_INTERIM_DEBOUNCE_MS);
}

function appendFinalSpeechSegment(segment) {
  const text = String(segment ?? "");
  if (!text || (!text.trim() && !/\n/.test(text))) return;

  const now = Date.now();
  if (modalSpeechCommittedText) {
    if (modalSpeechLastFinalAt && now - modalSpeechLastFinalAt >= SPEECH_PAUSE_NEWLINE_MS) {
      if (!modalSpeechCommittedText.endsWith("\n")) {
        modalSpeechCommittedText += "\n";
      }
    }
  }

  modalSpeechCommittedText += text;
  modalSpeechLastFinalAt = now;
  modalSpeechHadInput = true;
}

function clearModalSpeechPendingStopTimer() {
  if (!modalSpeechPendingStopTimer) return;
  clearTimeout(modalSpeechPendingStopTimer);
  modalSpeechPendingStopTimer = null;
}

function scheduleSpeechStopAfterSilence() {
  clearModalSpeechPendingStopTimer();
  modalSpeechPendingStopTimer = setTimeout(() => {
    modalSpeechPendingStopTimer = null;
    if (modalSpeechListening) stopModalSpeechInput();
  }, SPEECH_END_SILENCE_MS);
}

function stripSpeechEndPhrase(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { text: "", hadEndPhrase: false };

  if (SPEECH_END_PHRASE_ONLY_PATTERN.test(trimmed)) {
    return { text: "", hadEndPhrase: true };
  }

  if (SPEECH_END_PHRASE_PATTERN.test(trimmed)) {
    const stripped = trimmed.replace(SPEECH_END_PHRASE_PATTERN, "").trim();
    return { text: stripped, hadEndPhrase: true };
  }

  return { text: trimmed, hadEndPhrase: false };
}

function applyKaikeiMisheardNewlineCommands(text) {
  let output = String(text ?? "");
  if (!output) return "";

  const literals = [];
  output = output.replace(SPEECH_KAIKEI_LITERAL_PATTERN, (match) => {
    literals.push(match);
    return `\x00KAIKEI${literals.length - 1}\x00`;
  });

  output = output.replace(SPEECH_COMMAND_KAIKEI_REPEAT_PATTERN, (match) => {
    const count = (match.match(/開業/g) || []).length;
    return "\n".repeat(count);
  });

  output = output.replace(/[\s　]*開業[\s　]*/gu, "\n");

  literals.forEach((literal, index) => {
    output = output.replace(`\x00KAIKEI${index}\x00`, literal);
  });
  return output;
}

function applySpeechVoiceCommands(text) {
  let output = String(text ?? "");
  if (!output) return "";

  output = applyKaikeiMisheardNewlineCommands(output);
  output = output.replace(SPEECH_COMMAND_GYOUKO_PATTERN, "\n");
  output = output.replace(SPEECH_COMMAND_MARU_PATTERN, "。");
  return output;
}

function processSpeechFinalTranscript(transcript) {
  const { text, hadEndPhrase } = stripSpeechEndPhrase(transcript);
  return {
    text: applySpeechVoiceCommands(text),
    hadEndPhrase
  };
}

function clearModalSpeechRestartTimer() {
  if (!modalSpeechRestartTimer) return;
  clearTimeout(modalSpeechRestartTimer);
  modalSpeechRestartTimer = null;
}

function releaseModalSpeechMicStream() {
  modalSpeechMicStream?.getTracks().forEach((track) => track.stop());
  modalSpeechMicStream = null;
}

function isLikelyVirtualMicLabel(label) {
  return /virtual|blackhole|loopback|background music|soundflower|aggregate device|multi[- ]output|vb-audio|cable output/i.test(
    String(label || "").toLowerCase()
  );
}

async function listSpeechInputDevices() {
  let devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput");
  if (devices.some((device) => device.label)) return devices;

  const temp = await navigator.mediaDevices.getUserMedia({ audio: true });
  temp.getTracks().forEach((track) => track.stop());
  return (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput");
}

function pickPreferredSpeechInputDevice(devices) {
  const realDevices = devices.filter((device) => !isLikelyVirtualMicLabel(device.label));
  if (realDevices.length) return realDevices[0];
  return devices[0] || null;
}

function buildSpeechAudioConstraints(deviceId = "") {
  const base = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: true,
    channelCount: 1
  };
  if (!deviceId) return { audio: base };
  return { audio: { ...base, deviceId: { ideal: deviceId } } };
}

async function acquireModalSpeechMicStream() {
  if (modalSpeechMicStream) return modalSpeechMicStream;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia unavailable");
  }

  let preferredDevice = null;
  try {
    const devices = await listSpeechInputDevices();
    preferredDevice = pickPreferredSpeechInputDevice(devices);
  } catch (_) {
    /* fall back to browser default */
  }

  modalSpeechMicStream = await navigator.mediaDevices.getUserMedia(
    buildSpeechAudioConstraints(preferredDevice?.deviceId)
  );

  const track = modalSpeechMicStream.getAudioTracks()[0];
  if (!track || track.readyState !== "live") {
    releaseModalSpeechMicStream();
    throw new Error("microphone track unavailable");
  }

  if (isLikelyVirtualMicLabel(track.label)) {
    console.warn("[speech] virtual microphone selected:", track.label);
  }

  return modalSpeechMicStream;
}

function updateModalSpeechButtonState() {
  if (!modalSpeechButton) return;
  if (!isSpeechInputSupported()) {
    modalSpeechButton.hidden = true;
    return;
  }

  modalSpeechButton.hidden = false;
  modalSpeechButton.classList.toggle("speech-listening", modalSpeechListening);
  modalSpeechButton.setAttribute("aria-pressed", modalSpeechListening ? "true" : "false");
  modalSpeechButton.disabled = Boolean(modalAiBusy);

  const titleKey = modalSpeechListening ? "modal.speechInputStop" : "modal.speechInput";
  modalSpeechButton.title = t(titleKey);
  modalSpeechButton.setAttribute("aria-label", t(titleKey));
}

function showSpeechInputError(errorCode) {
  const keyMap = {
    "not-allowed": "modal.speechErrorNotAllowed",
    "no-speech": "modal.speechErrorNoSpeech",
    network: "modal.speechErrorNetwork",
    "service-not-allowed": "modal.speechErrorNotAllowed",
    "audio-capture": "modal.speechErrorNotAllowed"
  };
  const key = keyMap[errorCode];
  if (key) alert(t(key));
}

function createModalSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = getSpeechRecognitionLang();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interimText = "";
    for (let i = modalSpeechResultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0]?.transcript || "";
      if (result.isFinal) {
        const { text, hadEndPhrase } = processSpeechFinalTranscript(transcript);
        if (text) {
          clearModalSpeechPendingStopTimer();
          appendFinalSpeechSegment(text);
        }
        if (hadEndPhrase) {
          scheduleSpeechStopAfterSilence();
        }
        modalSpeechResultIndex = i + 1;
      } else {
        if (transcript.trim()) clearModalSpeechPendingStopTimer();
        interimText += transcript;
      }
    }

    applySpeechTranscriptToTarget(modalSpeechCommittedText, interimText);
    if (modalSpeechCommittedText || interimText) {
      dispatchSpeechTargetInputDebounced();
    }
  };

  recognition.onerror = (event) => {
    if (event.error === "aborted" || event.error === "no-speech") return;
    showSpeechInputError(event.error);
    stopModalSpeechInput();
  };

  recognition.onend = () => {
    if (!modalSpeechListening || modalSpeechRecognition !== recognition) return;
    clearModalSpeechRestartTimer();
    modalSpeechRestartTimer = setTimeout(() => {
      if (!modalSpeechListening || modalSpeechRecognition !== recognition) return;
      try {
        recognition.start();
      } catch (error) {
        console.error("modal speech recognition restart failed:", error);
        stopModalSpeechInput();
      }
    }, 150);
  };

  return recognition;
}

function stopModalSpeechInput() {
  const wasListening = modalSpeechListening;
  modalSpeechListening = false;
  clearModalSpeechRestartTimer();
  clearModalSpeechPendingStopTimer();

  if (modalSpeechInterimDispatchTimer) {
    clearTimeout(modalSpeechInterimDispatchTimer);
    modalSpeechInterimDispatchTimer = null;
  }

  if (modalSpeechRecognition) {
    const recognition = modalSpeechRecognition;
    modalSpeechRecognition = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch (_) {
      /* ignore */
    }
  }

  if (wasListening && modalSpeechHadInput) {
    dispatchSpeechTargetInput();
    scheduleModalSpeechPolishAfterInput();
  }

  releaseModalSpeechMicStream();
  modalSpeechTarget = null;
  modalSpeechHadInput = false;
  modalSpeechResultIndex = 0;
  modalSpeechCommittedText = "";
  modalSpeechLastFinalAt = 0;
  updateModalSpeechButtonState();
}

function tryStartModalSpeechRecognition(recognition) {
  try {
    recognition.start();
    modalSpeechListening = true;
    updateModalSpeechButtonState();
    return true;
  } catch (error) {
    console.error("recognition.start failed:", error);
    return false;
  }
}

async function startWebSpeechInput() {
  if (!prepareModalSpeechTarget()) return;

  try {
    await acquireModalSpeechMicStream();
  } catch (error) {
    console.error("acquireModalSpeechMicStream failed:", error);
    alert(t("modal.speechErrorNotAllowed"));
    return;
  }

  const recognition = createModalSpeechRecognition();
  modalSpeechRecognition = recognition;

  if (!tryStartModalSpeechRecognition(recognition)) {
    stopModalSpeechInput();
    alert(t("modal.speechErrorGeneric"));
  }
}

function scheduleModalSpeechPolishAfterInput() {
  if (typeof handleModalSpeechPolish !== "function") return;
  window.setTimeout(() => {
    handleModalSpeechPolish().catch((error) => {
      console.error("handleModalSpeechPolish failed:", error);
    });
  }, 0);
}

async function toggleModalSpeechInput() {
  if (modalSpeechListening) {
    stopModalSpeechInput();
    return;
  }

  if (!isSpeechInputSupported()) return;
  await startWebSpeechInput();
}

function __testStripSpeechEndPhrase(text) {
  return stripSpeechEndPhrase(text);
}

function __testApplySpeechVoiceCommands(text) {
  return applySpeechVoiceCommands(text);
}

function __testProcessSpeechFinalTranscript(text) {
  return processSpeechFinalTranscript(text);
}
