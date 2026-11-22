"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/providers";
import { LangText, MicButton, SpeakButton } from "@/components/speech";
import { Badge, Button, ErrorBox, PageHeader, Panel, Spinner, cx } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { STARTER_PHRASES, type Phrase } from "@/content/phrases";
import { STORY_TOPICS } from "@/content/scenarios";
import { scoreMessage, scorePronunciation, type PronunciationScore } from "@/lib/scoring";

export default function ShadowingPage() {
  const { lang, data, notifyXp } = useProfile();
  const [phrases, setPhrases] = useState<Phrase[]>(STARTER_PHRASES[lang]);
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<PronunciationScore | null>(null);
  const [best, setBest] = useState<Record<number, number>>({});
  const [topic, setTopic] = useState(STORY_TOPICS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPhrases(STARTER_PHRASES[lang]);
    setIndex(0);
    setBest({});
    setResult(null);
    setHeard("");
  }, [lang]);

  const phrase = phrases[index];

  async function evaluate(text: string) {
    setHeard(text);
    const score = scorePronunciation(phrase.text, text, lang);
    setResult(score);
    const previous = best[index];
    setBest((b) => ({ ...b, [index]: Math.max(b[index] ?? 0, score.score) }));
    // XP seulement au premier essai réussi de chaque phrase.
    if (previous === undefined && score.score >= 50) {
      try {
        const res = await api<{ xp: number }>("/api/activity", {
          method: "POST",
          body: { kind: "shadowing", score: score.score },
        });
        notifyXp(res.xp);
      } catch {
        /* l'exercice continue même hors ligne */
      }
    }
  }

  function go(delta: number) {
    setIndex((i) => (i + delta + phrases.length) % phrases.length);
    setResult(null);
    setHeard("");
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ phrases: Phrase[] }>("/api/phrases", { method: "POST", body: { lang, topic } });
      setPhrases(res.phrases);
      setIndex(0);
      setBest({});
      setResult(null);
      setHeard("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Répéter"
        subtitle="Écoute, répète, compare. La méthode des interprètes (shadowing) pour l'accent, le rythme et la fluidité."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel className="text-center">
            <div className="flex items-center justify-between text-sm text-stone-500">
              <Button variant="ghost" size="sm" onClick={() => go(-1)} aria-label="Phrase précédente">
                ←
              </Button>
              <span>
                Phrase {index + 1} / {phrases.length}
              </span>
              <Button variant="ghost" size="sm" onClick={() => go(1)} aria-label="Phrase suivante">
                →
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              {result ? (
                <p className="text-3xl font-bold leading-relaxed" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
                  {result.words.map((w, i) => (
                    <span
                      key={i}
                      className={cx(
                        lang === "ar" && "font-arabic",
                        w.ok ? "text-emerald-700" : "text-red-600 underline decoration-wavy decoration-2 underline-offset-8",
                      )}
                    >
                      {w.word}{" "}
                    </span>
                  ))}
                </p>
              ) : (
                <LangText text={phrase.text} lang={lang} as="p" className="text-3xl font-bold text-stone-900" />
              )}
              {phrase.translit && <p className="text-stone-500 italic">{phrase.translit}</p>}
              <p className="text-stone-600">{phrase.translation}</p>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <SpeakButton text={phrase.text} label="Écouter" />
              <SpeakButton text={phrase.text} rate={0.65} label="Lentement" />
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <MicButton size="lg" onText={(t) => void evaluate(t)} />
              <p className="text-sm text-stone-500">Appuie, puis lis la phrase à voix haute.</p>
            </div>

            {result && (
              <div className="mt-6 rounded-xl bg-stone-50 p-4">
                <p className="text-4xl font-extrabold text-[var(--accent-strong)]">{result.score}%</p>
                <p className="mt-1 font-medium">{scoreMessage(result.score)}</p>
                <p className="mt-2 text-sm text-stone-500" dir="auto">
                  Entendu : « {heard} »
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <Button variant="secondary" onClick={() => setResult(null)}>
                    Recommencer
                  </Button>
                  <Button onClick={() => go(1)}>Phrase suivante</Button>
                </div>
              </div>
            )}
          </Panel>
          <p className="mt-3 text-xs text-stone-500">
            La note vient de la reconnaissance vocale du navigateur : elle indique si tes mots sont compris, pas un
            jugement parfait de l&apos;accent.
            {lang === "ar" && " Pour l'arabe, Chrome donne les meilleurs résultats."}
          </p>
        </div>

        <div className="space-y-6">
          <Panel>
            <h2 className="font-semibold">Tes phrases</h2>
            <ul className="mt-3 space-y-1">
              {phrases.map((p, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      setIndex(i);
                      setResult(null);
                    }}
                    className={cx(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                      i === index ? "bg-[var(--accent-soft)]" : "hover:bg-stone-50",
                    )}
                  >
                    <LangText text={p.text} lang={lang} className="truncate" />
                    {best[i] !== undefined && <Badge tone={best[i] >= 80 ? "good" : "warn"}>{best[i]}%</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <h2 className="font-semibold">Nouvelles phrases</h2>
            <p className="text-sm text-stone-500">Générées par l&apos;IA à ton niveau.</p>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              {STORY_TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={() => void generate()}
              disabled={loading || data?.aiConfigured === false}
            >
              {loading ? <Spinner label="Création…" /> : "Générer 8 phrases"}
            </Button>
            {data?.aiConfigured === false && (
              <p className="mt-2 text-xs text-stone-500">Nécessite une clé IA (GEMINI_API_KEY, gratuite).</p>
            )}
            {error && (
              <div className="mt-3">
                <ErrorBox message={error} />
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
