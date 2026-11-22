"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/* Reconnaissance vocale (Web Speech API : Chrome, Edge, Safari récents)       */
/* -------------------------------------------------------------------------- */

type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; length: number; [index: number]: RecognitionAlternative };
type RecognitionEvent = { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } };

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const RECOGNITION_ERRORS: Record<string, string> = {
  "not-allowed": "Autorise l'accès au micro dans ton navigateur.",
  "service-not-allowed": "Autorise l'accès au micro dans ton navigateur.",
  "no-speech": "Je n'ai rien entendu. Réessaie en parlant plus près du micro.",
  "audio-capture": "Aucun micro détecté.",
  network: "La reconnaissance vocale a besoin d'une connexion internet.",
  "language-not-supported": "Ton navigateur ne reconnaît pas cette langue. Essaie Chrome.",
};

export function useSpeechRecognition(langCode: string) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const onFinalRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    return () => recognitionRef.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(
    (onFinal: (text: string) => void) => {
      const Ctor = getRecognition();
      if (!Ctor) {
        setError("La reconnaissance vocale n'est pas disponible ici. Utilise Chrome ou Edge.");
        return;
      }
      recognitionRef.current?.abort();
      onFinalRef.current = onFinal;

      const recognition = new Ctor();
      recognition.lang = langCode;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let pending = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) onFinalRef.current(text.trim());
          else pending += text;
        }
        setInterim(pending);
      };
      recognition.onerror = (event) => {
        if (event.error !== "aborted") {
          setError(RECOGNITION_ERRORS[event.error] ?? "Le micro a rencontré un problème.");
        }
      };
      recognition.onend = () => {
        setListening(false);
        setInterim("");
      };

      setError(null);
      setListening(true);
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setListening(false);
      }
    },
    [langCode],
  );

  return { supported, listening, interim, error, start, stop };
}

/* -------------------------------------------------------------------------- */
/* Synthèse vocale                                                            */
/* -------------------------------------------------------------------------- */

function pickVoice(voices: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice | undefined {
  const code = langCode.toLowerCase();
  const prefix = code.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === code) ??
    voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix))
  );
}

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  /** Lit un ou plusieurs textes à la suite. */
  const speak = useCallback(
    (
      texts: string | string[],
      langCode: string,
      options: { rate?: number; id?: string; onLine?: (index: number) => void; onEnd?: () => void } = {},
    ) => {
      if (!("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const list = (Array.isArray(texts) ? texts : [texts]).filter((t) => t.trim());
      if (!list.length) return;
      const voice = pickVoice(synth.getVoices(), langCode);
      const id = options.id ?? list.join(" ");
      setSpeakingId(id);

      list.forEach((text, index) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice?.lang ?? langCode;
        if (voice) utterance.voice = voice;
        utterance.rate = options.rate ?? 1;
        utterance.onstart = () => options.onLine?.(index);
        if (index === list.length - 1) {
          utterance.onend = () => {
            setSpeakingId((current) => (current === id ? null : current));
            options.onEnd?.();
          };
          utterance.onerror = () => setSpeakingId((current) => (current === id ? null : current));
        }
        synth.speak(utterance);
      });
    },
    [],
  );

  const hasVoiceFor = useCallback(
    (langCode: string) => Boolean(pickVoice(voices, langCode)),
    [voices],
  );

  return { supported, speak, stop, speakingId, hasVoiceFor, voicesLoaded: voices.length > 0 };
}
