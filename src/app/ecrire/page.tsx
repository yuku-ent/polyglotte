"use client";

import { useCallback, useEffect, useState } from "react";
import { useProfile } from "@/components/providers";
import { LangText, MicButton, SpeakButton } from "@/components/speech";
import { AiNotice, Badge, Button, EmptyState, ErrorBox, PageHeader, Panel, Spinner, cx } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { WRITING_PROMPTS } from "@/content/scenarios";
import type { JournalDTO } from "@/lib/types";

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function WritePage() {
  const { lang, level, notifyXp } = useProfile();
  const [prompt, setPrompt] = useState<string>(WRITING_PROMPTS[0]);
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<JournalDTO[] | null>(null);
  const [current, setCurrent] = useState<JournalDTO | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ entries: JournalDTO[] }>(`/api/writing?lang=${lang}`);
      setEntries(data.entries);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [lang]);

  useEffect(() => {
    setCurrent(null);
    void load();
  }, [load]);

  // Brouillon gardé dans le navigateur pour ne rien perdre.
  useEffect(() => {
    try {
      setText(localStorage.getItem(`polyglotte:draft:${lang}`) ?? "");
    } catch {
      /* stockage indisponible */
    }
  }, [lang]);
  function updateText(value: string) {
    setText(value);
    try {
      localStorage.setItem(`polyglotte:draft:${lang}`, value);
    } catch {
      /* stockage indisponible */
    }
  }

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const res = await api<{ entry: JournalDTO; xp: number }>("/api/writing", {
        method: "POST",
        body: { lang, text, prompt },
      });
      setCurrent(res.entry);
      setEntries((list) => [res.entry, ...(list ?? [])]);
      updateText("");
      notifyXp(res.xp, "texte corrigé");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div>
      <PageHeader
        title="Écrire"
        subtitle={`Ton journal dans la langue. Chaque texte est corrigé, expliqué et réécrit comme le ferait un natif (niveau ${level}).`}
      />
      <AiNotice />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {current ? (
            <Feedback entry={current} onNew={() => setCurrent(null)} />
          ) : (
            <Panel>
              <label className="text-sm font-medium text-stone-700" htmlFor="prompt">
                Sujet
              </label>
              <select
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              >
                {WRITING_PROMPTS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>

              <textarea
                value={text}
                onChange={(e) => updateText(e.target.value)}
                rows={10}
                dir="auto"
                lang={lang}
                placeholder="Écris ici, même avec des fautes : c'est fait pour ça."
                className={cx(
                  "mt-4 w-full rounded-xl border border-stone-300 px-4 py-3 leading-relaxed",
                  lang === "ar" && "font-arabic text-xl",
                )}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MicButton onText={(t) => updateText(text ? `${text} ${t}` : t)} />
                  <span className="text-sm text-stone-500">{words} mots · vise 40 à 120</span>
                </div>
                <Button onClick={() => void submit()} disabled={pending || words < 2}>
                  {pending ? <Spinner label="Correction…" /> : "Corriger mon texte"}
                </Button>
              </div>
              {error && (
                <div className="mt-3">
                  <ErrorBox message={error} />
                </div>
              )}
            </Panel>
          )}
        </div>

        <Panel className="h-fit">
          <h2 className="font-semibold">Ton journal</h2>
          {!entries ? (
            <div className="mt-3">
              <Spinner />
            </div>
          ) : entries.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="Pas encore de texte" text="Ton premier texte apparaîtra ici avec sa note." />
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {entries.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setCurrent(e)}
                    className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3 text-left hover:border-[var(--accent)]"
                  >
                    <span className={cx("text-lg font-bold", scoreTone(e.score))}>{e.score}</span>
                    <span className="min-w-0 flex-1">
                      <LangText text={e.text} lang={e.lang} className="block truncate text-sm" />
                      <span className="text-xs text-stone-500">
                        {new Date(e.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Feedback({ entry, onNew }: { entry: JournalDTO; onNew: () => void }) {
  const { feedback } = entry;
  return (
    <>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className={cx("text-5xl font-extrabold", scoreTone(entry.score))}>{entry.score}</span>
            <div>
              <p className="font-semibold">Note sur 100</p>
              {entry.prompt && <p className="text-sm text-stone-500">{entry.prompt}</p>}
            </div>
          </div>
          <Button variant="secondary" onClick={onNew}>
            Nouveau texte
          </Button>
        </div>
        {feedback.strengths && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">👍 {feedback.strengths}</p>}
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Ton texte</h3>
          <LangText text={entry.text} lang={entry.lang} as="p" className="mt-2 whitespace-pre-wrap text-stone-700" />
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Corrigé</h3>
            <SpeakButton text={entry.corrected} size="sm" />
          </div>
          <LangText text={entry.corrected} lang={entry.lang} as="p" className="mt-2 whitespace-pre-wrap text-stone-900" />
          {feedback.corrected_translit && <p className="mt-2 text-sm italic text-stone-500">{feedback.corrected_translit}</p>}
        </Panel>
      </div>

      {feedback.errors.length > 0 && (
        <Panel>
          <h3 className="font-semibold">Erreurs expliquées</h3>
          <ul className="mt-3 divide-y divide-stone-100">
            {feedback.errors.map((err, i) => (
              <li key={i} className="py-3">
                <p className="flex flex-wrap items-center gap-2">
                  <LangText text={err.original} lang={entry.lang} className="text-red-600 line-through" />
                  <span aria-hidden>→</span>
                  <LangText text={err.correction} lang={entry.lang} className="font-semibold text-emerald-700" />
                </p>
                <p className="mt-1 text-sm text-stone-600">{err.explanation}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {entry.natural && (
        <Panel>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Comme le dirait un natif</h3>
            <SpeakButton text={entry.natural} size="sm" />
          </div>
          <LangText text={entry.natural} lang={entry.lang} as="p" className="mt-2 whitespace-pre-wrap" />
        </Panel>
      )}

      {feedback.tip && (
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 text-sm">
          <Badge tone="accent">Conseil</Badge> <span className="ml-1">{feedback.tip}</span>
        </div>
      )}
    </>
  );
}
