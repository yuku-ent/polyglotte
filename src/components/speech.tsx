"use client";

import { useSpeechRecognition } from "@/hooks/useSpeech";
import { useRecorder } from "@/hooks/useRecorder";
import { api, errorMessage } from "@/lib/api-client";
import { useProfile, useTTS } from "./providers";
import { cx } from "./ui";
import type { Lang } from "@/lib/languages";

/** Texte dans la langue cible : direction, police et attribut lang corrects (arabe compris). */
export function LangText({
  text,
  lang,
  className,
  as: Tag = "span",
}: {
  text: string;
  lang: Lang;
  className?: string;
  as?: "span" | "p" | "div";
}) {
  const isArabic = lang === "ar";
  return (
    <Tag lang={lang} dir={isArabic ? "rtl" : "ltr"} className={cx(isArabic && "font-arabic text-[1.2em] leading-loose", className)}>
      {text}
    </Tag>
  );
}

export function SpeakButton({
  text,
  rate = 1,
  label,
  size = "md",
  id,
}: {
  text: string | string[];
  rate?: number;
  label?: string;
  size?: "sm" | "md";
  id?: string;
}) {
  const { speechCode } = useProfile();
  const { supported, speak, stop, speakingId, loadingId } = useTTS();
  if (!supported) return null;
  const key = id ?? `${Array.isArray(text) ? text.join(" ") : text}@${rate}`;
  const speaking = speakingId === key;
  const loading = loadingId === key;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : void speak(text, speechCode, { rate, id: key }))}
      aria-label={speaking ? "Arrêter la lecture" : label ?? "Écouter"}
      title={label ?? "Écouter"}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-medium transition",
        size === "sm" ? "h-8 min-w-8 px-2 text-xs" : "h-10 min-w-10 px-3 text-sm",
        speaking
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-stone-300 bg-white text-stone-700 hover:border-[var(--accent)] hover:text-[var(--accent-strong)]",
      )}
    >
      <span aria-hidden className={cx(loading && "animate-pulse")}>{loading ? "…" : speaking ? "■" : "🔊"}</span>
      {label && <span>{label}</span>}
    </button>
  );
}

/**
 * Bouton micro.
 * Avec une clé Gemini : enregistrement puis transcription par l'IA (fiable dans toutes les langues).
 * Sinon : reconnaissance vocale du navigateur.
 */
export function MicButton(props: { onText: (text: string) => void; disabled?: boolean; size?: "md" | "lg" }) {
  const { data } = useProfile();
  return data?.voice.stt ? <RecorderMic {...props} /> : <BrowserMic {...props} />;
}

function micClasses(size: "md" | "lg", active: boolean) {
  return cx(
    "relative inline-flex items-center justify-center rounded-full font-semibold text-white shadow-md transition disabled:opacity-50",
    size === "lg" ? "h-16 w-16 text-2xl" : "h-11 w-11 text-lg",
    active ? "bg-red-500" : "bg-[var(--accent)] hover:brightness-110",
  );
}

function RecorderMic({
  onText,
  disabled,
  size = "md",
}: {
  onText: (text: string) => void;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const { lang } = useProfile();
  const { stop: stopSpeaking } = useTTS();
  const recorder = useRecorder();
  const recording = recorder.state === "recording";
  const processing = recorder.state === "processing";

  async function begin() {
    stopSpeaking();
    const audio = await recorder.start();
    if (!audio) {
      recorder.done();
      return;
    }
    try {
      const { text } = await api<{ text: string }>("/api/transcribe", { method: "POST", body: { lang, audio } });
      if (text) onText(text);
      else recorder.setError("Je n'ai rien entendu. Parle un peu plus fort et réessaie.");
    } catch (e) {
      recorder.setError(errorMessage(e));
    } finally {
      recorder.done();
    }
  }

  if (!recorder.supported) {
    return <p className="text-xs text-stone-500">Micro indisponible dans ce navigateur : tape ta réponse.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled || processing}
        onClick={() => (recording ? recorder.stop() : void begin())}
        aria-pressed={recording}
        aria-label={recording ? "Arrêter et envoyer" : "Parler"}
        className={micClasses(size, recording)}
      >
        {recording && <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />}
        <span aria-hidden className="relative">
          {processing ? "…" : recording ? "■" : "🎙"}
        </span>
      </button>
      {recording && <p className="text-xs font-medium text-red-600">Parle… puis appuie sur ■ ({recorder.seconds} s)</p>}
      {processing && <p className="text-xs text-stone-500">Transcription…</p>}
      {recorder.error && <p className="max-w-xs text-center text-xs text-red-600">{recorder.error}</p>}
    </div>
  );
}

function BrowserMic({
  onText,
  disabled,
  size = "md",
}: {
  onText: (text: string) => void;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const { speechCode } = useProfile();
  const { supported, listening, interim, error, start, stop } = useSpeechRecognition(speechCode);
  const { stop: stopSpeaking } = useTTS();

  if (!supported) {
    return (
      <p className="text-xs text-stone-500">
        Micro indisponible dans ce navigateur : utilise Chrome ou Edge, ou tape ta réponse.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (listening) return stop();
          stopSpeaking();
          start(onText);
        }}
        aria-pressed={listening}
        aria-label={listening ? "Arrêter l'enregistrement" : "Parler"}
        className={micClasses(size, listening)}
      >
        {listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />}
        <span aria-hidden className="relative">
          {listening ? "■" : "🎙"}
        </span>
      </button>
      {interim && <p className="max-w-xs text-center text-xs italic text-stone-500">{interim}…</p>}
      {error && <p className="max-w-xs text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
