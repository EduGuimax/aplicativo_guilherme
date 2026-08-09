// Wrapper simples para a Web Speech API (texto-para-voz), com voz em português.
import { getSettings } from "./storage.js";

let ptVoices = [];

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  const all = window.speechSynthesis.getVoices();
  ptVoices = all.filter((v) => v.lang && v.lang.toLowerCase().startsWith("pt"));
}

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice() {
  if (ptVoices.length === 0) return null;
  const brVoice = ptVoices.find((v) => v.lang.toLowerCase() === "pt-br");
  return brVoice || ptVoices[0];
}

export function isSupported() {
  return "speechSynthesis" in window;
}

// Fala um texto em voz alta. Cancela qualquer fala em andamento antes,
// para que um toque novo sempre responda imediatamente (sem fila de espera).
export function speak(text) {
  if (!isSupported()) return;

  window.speechSynthesis.cancel();

  const settings = getSettings();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;

  const voice = pickVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}
