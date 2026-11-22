"use client";

import { useSpeechRecognition } from "@/hooks/useSpeech";
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
  const { supported, speak, stop, speakingId } = useTTS();
  if (!supported) return null;
  const key = id ?? `${Array.isArray(text) ? text.join(" ") : text}@${rate}`;
  const speaking = speakingId === key;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(text, speechCode, { rate, id: key }))}
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
      <span aria-hidden>{speaking ? "■" : "🔊"}</span>
      {label && <span>{label}</span>}
    </button>
  );
}

export function MicButton({
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
        className={cx(
          "relative inline-flex items-center justify-center rounded-full font-semibold text-white shadow-md transition disabled:opacity-50",
          size === "lg" ? "h-16 w-16 text-2xl" : "h-11 w-11 text-lg",
          listening ? "bg-red-500" : "bg-[var(--accent)] hover:brightness-110",
        )}
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
