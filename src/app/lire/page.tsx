"use client";

import { useCallback, useEffect, useState } from "react";
import { useProfile, useTTS } from "@/components/providers";
import { LangText, SpeakButton } from "@/components/speech";
import { AiNotice, Badge, Button, EmptyState, ErrorBox, PageHeader, Panel, Spinner, cx } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { STORY_TOPICS } from "@/content/scenarios";
import type { StoryDTO, WordDTO } from "@/lib/types";

const LENGTHS = [
  { id: "court", label: "Courte" },
  { id: "moyen", label: "Moyenne" },
  { id: "long", label: "Longue" },
] as const;

export default function ReadPage() {
  const { lang, level } = useProfile();
  const [stories, setStories] = useState<StoryDTO[] | null>(null);
  const [current, setCurrent] = useState<StoryDTO | null>(null);
  const [topic, setTopic] = useState(STORY_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [length, setLength] = useState<(typeof LENGTHS)[number]["id"]>("court");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ stories: StoryDTO[] }>(`/api/stories?lang=${lang}`);
      setStories(data.stories);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [lang]);

  useEffect(() => {
    setCurrent(null);
    void load();
  }, [load]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const { story } = await api<{ story: StoryDTO }>("/api/stories", {
        method: "POST",
        body: { lang, topic: customTopic.trim() || topic, length },
      });
      setCurrent(story);
      setStories((list) => [story, ...(list ?? [])]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Lire & écouter"
        subtitle={`Des histoires écrites pour ton niveau (${level}) : tu comprends l'essentiel, tu apprends le reste en contexte.`}
      />
      <AiNotice />

      {current ? (
        <StoryReader
          story={current}
          onBack={() => setCurrent(null)}
          onCompleted={() => setStories((list) => list?.map((s) => (s.id === current.id ? { ...s, completed: true } : s)) ?? null)}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-1">
            <h2 className="font-semibold">Nouvelle histoire</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {STORY_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTopic(t);
                    setCustomTopic("");
                  }}
                  className={cx(
                    "rounded-full border px-3 py-1 text-sm",
                    topic === t && !customTopic
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "border-stone-300 text-stone-700 hover:border-stone-400",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Ou ton propre sujet…"
              className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLength(l.id)}
                  className={cx(
                    "flex-1 rounded-lg border px-2 py-1.5 text-sm",
                    length === l.id ? "border-[var(--accent)] font-semibold" : "border-stone-300",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => void generate()} disabled={generating}>
              {generating ? <Spinner label="Écriture en cours…" /> : "Créer l'histoire"}
            </Button>
            {error && (
              <div className="mt-3">
                <ErrorBox message={error} />
              </div>
            )}
          </Panel>

          <div className="lg:col-span-2">
            <h2 className="mb-3 font-semibold">Tes histoires</h2>
            {!stories ? (
              <Spinner />
            ) : stories.length === 0 ? (
              <EmptyState title="Aucune histoire pour l'instant" text="Choisis un sujet et crée ta première histoire." />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {stories.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setCurrent(s)}
                      className="h-full w-full rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-[var(--accent)]"
                    >
                      <LangText text={s.title} lang={s.lang} className="block font-semibold" />
                      {s.content.title_fr && <span className="block text-sm text-stone-500">{s.content.title_fr}</span>}
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        <Badge>{s.level}</Badge>
                        <Badge>{s.topic}</Badge>
                        {s.completed && <Badge tone="good">Lue</Badge>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StoryReader({ story, onBack, onCompleted }: { story: StoryDTO; onBack: () => void; onCompleted: () => void }) {
  const { speechCode, notifyXp } = useProfile();
  const { speak, stop, speakingId } = useTTS();
  const [showAll, setShowAll] = useState(false);
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(story.completed);
  const { content } = story;
  const readingId = `story-${story.id}`;
  const reading = speakingId === readingId;

  function toggle(i: number) {
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function readAll(rate: number) {
    if (reading) {
      stop();
      setActiveLine(null);
      return;
    }
    speak(
      content.sentences.map((s) => s.text),
      speechCode,
      { rate, id: readingId, onLine: setActiveLine, onEnd: () => setActiveLine(null) },
    );
  }

  async function addWord(word: WordDTO) {
    await api("/api/cards", {
      method: "POST",
      body: { lang: story.lang, term: word.term, translation: word.translation, translit: word.translit, source: "story" },
    });
    setAdded((prev) => new Set(prev).add(word.term));
  }

  const answeredAll = content.questions.length > 0 && Object.keys(answers).length === content.questions.length;
  const correct = content.questions.filter((q, i) => answers[i] === q.answer).length;

  async function finish() {
    const res = await api<{ xp: number }>("/api/stories", { method: "PATCH", body: { id: story.id, correct } });
    setFinished(true);
    onCompleted();
    notifyXp(res.xp, "histoire lue");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Toutes les histoires
        </Button>
        <Panel className="mt-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <LangText text={content.title} lang={story.lang} as="p" className="text-2xl font-bold" />
              {content.title_fr && <p className="text-stone-500">{content.title_fr}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => readAll(1)}>
                {reading ? "■ Stop" : "🔊 Tout écouter"}
              </Button>
              {!reading && (
                <Button variant="secondary" size="sm" onClick={() => readAll(0.75)}>
                  🐢 Lentement
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Masquer les traductions" : "Tout traduire"}
              </Button>
            </div>
          </div>

          <ol className="mt-6 space-y-3">
            {content.sentences.map((s, i) => (
              <li
                key={i}
                className={cx(
                  "flex gap-3 rounded-xl p-2 transition",
                  activeLine === i && reading && "bg-[var(--accent-soft)]",
                )}
              >
                <SpeakButton text={s.text} size="sm" />
                <div className="min-w-0 flex-1">
                  <button onClick={() => toggle(i)} className="text-left" title="Afficher la traduction">
                    <LangText text={s.text} lang={story.lang} className="text-lg text-stone-900" />
                  </button>
                  {s.translit && <p className="text-sm italic text-stone-500">{s.translit}</p>}
                  {(showAll || shown.has(i)) && <p className="mt-1 text-sm text-stone-600">{s.translation}</p>}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-stone-500">Astuce : clique sur une phrase pour voir sa traduction.</p>
          {content.questions.length === 0 && !finished && (
            <Button className="mt-4" onClick={() => void finish()}>
              Marquer comme lue
            </Button>
          )}
        </Panel>

        {content.questions.length > 0 && (
          <Panel className="mt-6">
            <h2 className="font-semibold">As-tu compris ?</h2>
            <ol className="mt-4 space-y-5">
              {content.questions.map((q, qi) => {
                const chosen = answers[qi];
                return (
                  <li key={qi}>
                    <p dir="auto" className="font-medium">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oi) => {
                        const isChosen = chosen === oi;
                        const reveal = chosen !== undefined;
                        return (
                          <button
                            key={oi}
                            dir="auto"
                            disabled={reveal}
                            onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                            className={cx(
                              "rounded-xl border px-3 py-2 text-left text-sm transition",
                              !reveal && "border-stone-300 hover:border-[var(--accent)]",
                              reveal && oi === q.answer && "border-emerald-300 bg-emerald-50",
                              reveal && isChosen && oi !== q.answer && "border-red-300 bg-red-50",
                              reveal && !isChosen && oi !== q.answer && "border-stone-200 opacity-60",
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {chosen !== undefined && q.explanation && (
                      <p className="mt-2 text-sm text-stone-600">{q.explanation}</p>
                    )}
                  </li>
                );
              })}
            </ol>
            {answeredAll && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 p-4">
                <p className="font-semibold">
                  {correct}/{content.questions.length} bonnes réponses
                </p>
                {finished ? (
                  <Badge tone="good">Histoire terminée</Badge>
                ) : (
                  <Button onClick={() => void finish()}>Terminer et gagner l&apos;XP</Button>
                )}
              </div>
            )}
          </Panel>
        )}
      </div>

      <Panel className="h-fit lg:sticky lg:top-36">
        <h2 className="font-semibold">Vocabulaire</h2>
        <p className="text-sm text-stone-500">Ajoute les mots que tu veux retenir à tes révisions.</p>
        <ul className="mt-4 space-y-3">
          {content.vocabulary.map((w) => (
            <li key={w.term} className="flex items-center gap-2">
              <SpeakButton text={w.term} size="sm" />
              <div className="min-w-0 flex-1">
                <LangText text={w.term} lang={story.lang} className="font-semibold" />
                {w.translit && <span className="ml-1 text-xs italic text-stone-500">{w.translit}</span>}
                <p className="text-sm text-stone-600">{w.translation}</p>
              </div>
              <Button
                size="sm"
                variant={added.has(w.term) ? "ghost" : "secondary"}
                disabled={added.has(w.term)}
                onClick={() => void addWord(w)}
              >
                {added.has(w.term) ? "✓" : "+"}
              </Button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
