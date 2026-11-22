"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/providers";
import { LangText, SpeakButton } from "@/components/speech";
import { ArabicKeyboard } from "@/components/arabic-keyboard";
import { PracticeTextPicker, type PracticeTextData } from "@/components/practice-text";
import { AiNotice, Badge, Button, ErrorBox, PageHeader, Panel, Spinner, cx } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { LANGUAGES, type Lang } from "@/lib/languages";

type Direction = "to_target" | "to_french";
type Feedback = {
  score: number;
  corrected: string;
  corrected_translit: string;
  natural: string;
  errors: { original: string; correction: string; explanation: string }[];
  strengths: string;
  tip: string;
};

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function TranslatePage() {
  const { lang } = useProfile();
  const [direction, setDirection] = useState<Direction>("to_french");
  const [text, setText] = useState<PracticeTextData | null>(null);
  const improvement = lang === "fr";
  const effective: Direction = improvement ? "to_french" : direction;
  const name = LANGUAGES[lang].name.toLowerCase();

  useEffect(() => setText(null), [lang]);

  return (
    <div>
      <PageHeader
        title="Traduire"
        subtitle={
          improvement
            ? "Traduis un texte anglais en bon français : sens, tournures et orthographe sont corrigés."
            : "Passe d'une langue à l'autre : l'IA corrige le sens, la grammaire et te montre la version d'un natif."
        }
        action={
          !improvement && (
            <div className="flex rounded-xl bg-stone-100 p-1">
              {(
                [
                  ["to_french", `${LANGUAGES[lang].name} → français`],
                  ["to_target", `Français → ${name}`],
                ] as const
              ).map(([d, label]) => (
                <button
                  key={d}
                  onClick={() => {
                    setDirection(d);
                    setText(null);
                  }}
                  className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", direction === d ? "bg-white shadow-sm" : "text-stone-600")}
                >
                  {label}
                </button>
              ))}
            </div>
          )
        }
      />
      <AiNotice />

      {!text ? (
        <PracticeTextPicker
          purpose="translation"
          title="Quel texte veux-tu traduire ?"
          description={
            effective === "to_french"
              ? "Commence par comprendre et traduire vers le français (version) : c'est le plus accessible."
              : `Ensuite, entraîne-toi à écrire en ${name} (thème) : c'est là qu'on progresse le plus à l'écrit.`
          }
          onReady={setText}
        />
      ) : (
        <Session key={`${effective}-${text.title}`} text={text} direction={effective} onNew={() => setText(null)} />
      )}
    </div>
  );
}

function Session({ text, direction, onNew }: { text: PracticeTextData; direction: Direction; onNew: () => void }) {
  const { lang, notifyXp } = useProfile();
  const [attempt, setAttempt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [keyboard, setKeyboard] = useState(false);

  const targetLang: Lang = direction === "to_french" ? "fr" : lang;
  const sourceLang: Lang = direction === "to_french" ? text.sourceLang : "fr";
  const source = direction === "to_french" ? text.sentences.map((s) => s.text).join(" ") : text.sentences.map((s) => s.translation).join(" ");
  const reference = direction === "to_french" ? text.sentences.map((s) => s.translation).join(" ") : text.sentences.map((s) => s.text).join(" ");
  const writesArabic = targetLang === "ar";

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const res = await api<{ feedback: Feedback; xp: number }>("/api/translation", {
        method: "POST",
        body: { lang, direction, source, reference, attempt },
      });
      setFeedback(res.feedback);
      notifyXp(res.xp, "traduction");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Texte à traduire</h2>
          {sourceLang !== "fr" && <SpeakButton text={text.sentences.map((s) => s.text)} size="sm" />}
        </div>
        {text.title && direction === "to_french" && <LangText text={text.title} lang={sourceLang} as="p" className="mt-2 font-bold" />}
        <LangText text={source} lang={sourceLang} as="p" className="mt-2 text-lg leading-relaxed" />
        {direction === "to_french" && text.sentences.some((s) => s.translit) && (
          <p className="mt-2 text-sm italic text-stone-500">{text.sentences.map((s) => s.translit).join(" ")}</p>
        )}
      </Panel>

      <Panel>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Ta traduction en {LANGUAGES[targetLang].name.toLowerCase()}
        </h2>
        <textarea
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          readOnly={Boolean(feedback)}
          rows={8}
          dir={writesArabic ? "rtl" : "auto"}
          lang={targetLang}
          placeholder="Traduis le sens, pas mot à mot…"
          className={cx("mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 leading-relaxed", writesArabic && "font-arabic text-xl")}
        />
        {writesArabic && !feedback && (
          <div>
            <button type="button" className="mt-1 text-sm text-[var(--accent-strong)] underline" onClick={() => setKeyboard((v) => !v)}>
              {keyboard ? "Masquer le clavier arabe" : "Afficher le clavier arabe"}
            </button>
            {keyboard && <ArabicKeyboard onKey={(c) => setAttempt((v) => v + c)} onBackspace={() => setAttempt((v) => [...v].slice(0, -1).join(""))} />}
          </div>
        )}
        {!feedback && (
          <div className="mt-3 flex justify-end">
            <Button onClick={() => void submit()} disabled={pending || attempt.trim().length < 2}>
              {pending ? <Spinner label="Correction…" /> : "Corriger ma traduction"}
            </Button>
          </div>
        )}
        {error && (
          <div className="mt-3">
            <ErrorBox message={error} />
          </div>
        )}
      </Panel>

      {feedback && (
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className={cx("text-5xl font-extrabold", scoreTone(feedback.score))}>{feedback.score}</span>
                <p className="font-semibold">Note sur 100</p>
              </div>
              <Button variant="secondary" onClick={onNew}>
                Nouveau texte
              </Button>
            </div>
            {feedback.strengths && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">👍 {feedback.strengths}</p>}
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Ta traduction corrigée</h3>
                {targetLang !== "fr" && <SpeakButton text={feedback.corrected} size="sm" />}
              </div>
              <LangText text={feedback.corrected} lang={targetLang} as="p" className="mt-2 whitespace-pre-wrap" />
              {feedback.corrected_translit && <p className="mt-2 text-sm italic text-stone-500">{feedback.corrected_translit}</p>}
            </Panel>
            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Comme le dirait un natif</h3>
                {targetLang !== "fr" && feedback.natural && <SpeakButton text={feedback.natural} size="sm" />}
              </div>
              <LangText text={feedback.natural || reference} lang={targetLang} as="p" className="mt-2 whitespace-pre-wrap" />
            </Panel>
          </div>

          {feedback.errors.length > 0 && (
            <Panel>
              <h3 className="font-semibold">Erreurs expliquées</h3>
              <ul className="mt-3 divide-y divide-stone-100">
                {feedback.errors.map((err, i) => (
                  <li key={i} className="py-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <LangText text={err.original} lang={targetLang} className="text-red-600 line-through" />
                      <span aria-hidden>→</span>
                      <LangText text={err.correction} lang={targetLang} className="font-semibold text-emerald-700" />
                    </p>
                    <p className="mt-1 text-sm text-stone-600">{err.explanation}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {feedback.tip && (
            <div className="rounded-xl bg-[var(--accent-soft)] p-4 text-sm">
              <Badge tone="accent">Conseil</Badge> <span className="ml-1">{feedback.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
