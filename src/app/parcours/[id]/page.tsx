"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProfile, useTTS } from "@/components/providers";
import { LangText, MicButton, SpeakButton } from "@/components/speech";
import { Button, ErrorBox, Panel, Spinner, cx } from "@/components/ui";
import { Splash } from "@/components/splash";
import { api, errorMessage } from "@/lib/api-client";
import { normalize, scorePronunciation, type PronunciationScore } from "@/lib/scoring";
import { isImprovement, type Lang } from "@/lib/languages";
import type { Exercise, LessonContent } from "@/lib/prompts";

type LessonResponse = {
  lang: Lang;
  lesson: {
    id: string;
    title: string;
    goal: string;
    unitTitle: string;
    level: string;
    review: boolean;
    position: number;
    total: number;
  };
  content: LessonContent;
};

type Phase = "intro" | "words" | "grammar" | "dialogue" | "exercises" | "done";
type Status = "answering" | "correct" | "wrong";

const LOADING_TIPS = [
  "Préparation de ta leçon…",
  "Choix des mots les plus utiles…",
  "Rédaction de l'explication…",
  "Création des exercices…",
  "Presque prêt…",
];

function shuffle<T>(list: T[], seed: number): T[] {
  const copy = [...list];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { notifyXp } = useProfile();
  const [data, setData] = useState<LessonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [wordIndex, setWordIndex] = useState(0);

  // Exercices : file d'attente, les erreurs reviennent à la fin.
  const [queue, setQueue] = useState<number[]>([]);
  const [firstTry, setFirstTry] = useState<Record<number, boolean>>({});
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<Status>("answering");
  const [result, setResult] = useState<{ xp: number; score: number; next: string | null } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setData(null);
    try {
      const res = await api<LessonResponse>(`/api/lessons?id=${encodeURIComponent(id)}`);
      setData(res);
      setPhase("intro");
      setWordIndex(0);
      setQueue(res.content.exercises.map((_, i) => i));
      setFirstTry({});
      setSkipped(new Set());
      setStatus("answering");
      setResult(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (data || error) return;
    const t = window.setInterval(() => setTip((i) => Math.min(i + 1, LOADING_TIPS.length - 1)), 6000);
    return () => window.clearInterval(t);
  }, [data, error]);

  const finish = useCallback(
    async (correct: number, total: number) => {
      setPhase("done");
      try {
        const res = await api<{ xp: number; score: number; next: string | null }>("/api/lessons/complete", {
          method: "POST",
          body: { id, correct, total: Math.max(1, total) },
        });
        setResult(res);
        notifyXp(res.xp, "leçon terminée");
      } catch (e) {
        setError(errorMessage(e));
      }
    },
    [id, notifyXp],
  );

  if (error && !data) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <ErrorBox message={error} onRetry={() => void load()} />
        <Link href="/parcours" className="text-sm underline">
          ← Retour au parcours
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <Splash
        fullScreen={false}
        message={`${LOADING_TIPS[tip]} La première ouverture d'une leçon peut prendre jusqu'à une minute, ensuite elle s'ouvre instantanément.`}
      />
    );
  }

  const { lesson, content, lang } = data;
  const exercises = content.exercises;
  const doneCount = exercises.length - queue.length;
  const steps = ["intro", "words", "grammar", "dialogue", "exercises", "done"] as Phase[];
  const progress =
    phase === "exercises"
      ? 0.4 + 0.6 * (doneCount / Math.max(1, exercises.length))
      : phase === "done"
        ? 1
        : (steps.indexOf(phase) / 4) * 0.4;

  function nextPhase(from: Phase) {
    const order: Phase[] = ["intro", "words", "grammar", "dialogue", "exercises"];
    let i = order.indexOf(from) + 1;
    // On saute les étapes vides (ex. pas de dialogue).
    while (i < order.length) {
      const p = order[i];
      if (p === "words" && !content.words.length) i++;
      else if (p === "grammar" && !content.grammar.explanation) i++;
      else if (p === "dialogue" && !content.dialogue.length) i++;
      else break;
    }
    setPhase(order[i] ?? "exercises");
    window.scrollTo({ top: 0 });
  }

  function answer(correct: boolean) {
    const current = queue[0];
    setStatus(correct ? "correct" : "wrong");
    setFirstTry((f) => (current in f ? f : { ...f, [current]: correct }));
  }

  function continueExercise() {
    const [current, ...rest] = queue;
    const nextQueue = status === "wrong" ? [...rest, current] : rest;
    setQueue(nextQueue);
    setStatus("answering");
    if (nextQueue.length === 0) {
      const counted = exercises.map((_, i) => i).filter((i) => !skipped.has(i));
      const correct = counted.filter((i) => firstTry[i] ?? false).length;
      void finish(correct, counted.length);
    }
  }

  function skipCurrent() {
    const [current, ...rest] = queue;
    setSkipped((s) => new Set(s).add(current));
    setQueue(rest);
    setStatus("answering");
    if (rest.length === 0) {
      const counted = exercises.map((_, i) => i).filter((i) => i !== current && !skipped.has(i));
      const correct = counted.filter((i) => firstTry[i] ?? false).length;
      void finish(correct, counted.length);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* En-tête de la leçon */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/parcours" className="text-stone-400 hover:text-stone-700" aria-label="Quitter la leçon">
          ✕
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="text-xs text-stone-500">
          {lesson.position}/{lesson.total}
        </span>
      </div>

      {phase === "intro" && (
        <Panel className="text-center">
          <p className="text-sm font-medium text-[var(--accent-strong)]">
            {lesson.unitTitle} · {lesson.level}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{lesson.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-stone-600">{lesson.goal}</p>
          {content.intro && <p className="mx-auto mt-4 max-w-md rounded-xl bg-stone-50 p-4 text-sm text-stone-700">{content.intro}</p>}
          <ul className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-2 text-xs text-stone-500">
            {content.words.length > 0 && <li className="rounded-full bg-stone-100 px-3 py-1">{content.words.length} mots</li>}
            {content.grammar.explanation && <li className="rounded-full bg-stone-100 px-3 py-1">1 règle</li>}
            {content.dialogue.length > 0 && <li className="rounded-full bg-stone-100 px-3 py-1">1 dialogue</li>}
            <li className="rounded-full bg-stone-100 px-3 py-1">{exercises.length} exercices</li>
          </ul>
          <Button size="lg" className="mt-8" onClick={() => nextPhase("intro")}>
            C&apos;est parti
          </Button>
        </Panel>
      )}

      {phase === "words" && (
        <WordStep
          lang={lang}
          content={content}
          index={wordIndex}
          onPrev={() => setWordIndex((i) => Math.max(0, i - 1))}
          onNext={() => {
            if (wordIndex + 1 < content.words.length) setWordIndex((i) => i + 1);
            else nextPhase("words");
          }}
        />
      )}

      {phase === "grammar" && (
        <Panel>
          <p className="text-sm font-medium text-[var(--accent-strong)]">La règle</p>
          <h2 className="mt-1 text-2xl font-bold">{content.grammar.title}</h2>
          <div className="mt-4 space-y-3 leading-relaxed text-stone-700">
            {content.grammar.explanation.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {content.grammar.examples.length > 0 && (
            <ul className="mt-6 space-y-3">
              {content.grammar.examples.map((ex, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-stone-50 p-3">
                  <SpeakButton text={ex.text} size="sm" />
                  <div>
                    <LangText text={ex.text} lang={lang} as="p" className="font-semibold" />
                    {ex.translit && <p className="text-sm italic text-stone-500">{ex.translit}</p>}
                    <p className="text-sm text-stone-600">{ex.translation}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex justify-end">
            <Button size="lg" onClick={() => nextPhase("grammar")}>
              J&apos;ai compris →
            </Button>
          </div>
        </Panel>
      )}

      {phase === "dialogue" && <DialogueStep lang={lang} content={content} onNext={() => nextPhase("dialogue")} />}

      {phase === "exercises" && queue.length > 0 && (
        <ExerciseStep
          key={`${queue[0]}-${doneCount}-${queue.length}`}
          lang={lang}
          exercise={exercises[queue[0]]}
          seed={queue[0] + 1}
          status={status}
          retry={queue[0] in firstTry}
          onAnswer={answer}
          onContinue={continueExercise}
          onSkip={skipCurrent}
        />
      )}

      {phase === "done" && (
        <Panel className="text-center">
          <p className="text-5xl">🎉</p>
          <h2 className="mt-3 text-2xl font-bold">Leçon terminée !</h2>
          {result ? (
            <>
              <p className="mt-2 text-4xl font-extrabold text-[var(--accent-strong)]">{result.score} %</p>
              <p className="text-sm text-stone-500">de bonnes réponses du premier coup · +{result.xp} XP</p>
              <p className="mx-auto mt-4 max-w-sm text-sm text-stone-600">
                Les {content.words.length} mots de la leçon ont rejoint tes révisions : ils reviendront au bon moment pour que
                tu ne les oublies pas.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {result.next ? (
                  <Button size="lg" onClick={() => router.push(`/parcours/${result.next}`)}>
                    Leçon suivante →
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => router.push("/")}>
                    Retour à l&apos;accueil
                  </Button>
                )}
                <Button variant="secondary" size="lg" onClick={() => router.push("/parcours")}>
                  Voir le parcours
                </Button>
                <Button variant="ghost" size="lg" onClick={() => void load()}>
                  Refaire
                </Button>
              </div>
              <p className="mt-6 text-xs text-stone-500">Tu peux enchaîner autant de leçons que tu veux.</p>
            </>
          ) : error ? (
            <div className="mt-4">
              <ErrorBox message={error} />
            </div>
          ) : (
            <div className="mt-4">
              <Spinner label="Enregistrement…" />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Étapes                                                                     */
/* -------------------------------------------------------------------------- */

function WordStep({
  lang,
  content,
  index,
  onPrev,
  onNext,
}: {
  lang: Lang;
  content: LessonContent;
  index: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { speechCode } = useProfile();
  const { speak } = useTTS();
  const word = content.words[index];

  useEffect(() => {
    void speak(word.term, speechCode, { id: `word-${index}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <Panel className="text-center">
      <p className="text-sm font-medium text-[var(--accent-strong)]">
        Nouveau mot {index + 1}/{content.words.length}
      </p>
      <div className="mt-6 space-y-2">
        <LangText text={word.term} lang={lang} as="p" className="text-4xl font-bold" />
        {word.translit && <p className="italic text-stone-500">{word.translit}</p>}
        <div className="flex justify-center gap-2 pt-2">
          <SpeakButton text={word.term} id={`word-${index}`} />
          <SpeakButton text={word.term} rate={0.7} label="Lent" />
        </div>
        <p className="pt-3 text-2xl font-semibold text-stone-800">{word.translation}</p>
      </div>
      {word.example && (
        <div className="mx-auto mt-6 max-w-md rounded-xl bg-stone-50 p-4 text-left">
          <div className="flex items-start gap-2">
            <SpeakButton text={word.example} size="sm" />
            <div>
              <LangText text={word.example} lang={lang} as="p" className="font-medium" />
              {word.example_translation && <p className="text-sm text-stone-600">{word.example_translation}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onPrev} disabled={index === 0}>
          ←
        </Button>
        <Button size="lg" onClick={onNext}>
          {index + 1 < content.words.length ? "Mot suivant →" : "Continuer →"}
        </Button>
      </div>
    </Panel>
  );
}

function DialogueStep({ lang, content, onNext }: { lang: Lang; content: LessonContent; onNext: () => void }) {
  const { speechCode } = useProfile();
  const { speak, stop, speakingId } = useTTS();
  const [active, setActive] = useState<number | null>(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const playing = speakingId === "dialogue";

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--accent-strong)]">Dans la vraie vie</p>
          <h2 className="text-2xl font-bold">Le dialogue</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              playing
                ? stop()
                : void speak(
                    content.dialogue.map((d) => d.text),
                    speechCode,
                    { id: "dialogue", onLine: setActive, onEnd: () => setActive(null) },
                  )
            }
          >
            {playing ? "■ Stop" : "🔊 Écouter"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowTranslations((v) => !v)}>
            {showTranslations ? "Masquer" : "Traduire"}
          </Button>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {content.dialogue.map((line, i) => (
          <li key={i} className={cx("flex", line.speaker === "B" && "justify-end")}>
            <div
              className={cx(
                "max-w-[85%] rounded-2xl px-4 py-3 transition",
                line.speaker === "B" ? "rounded-tr-sm bg-[var(--accent-soft)]" : "rounded-tl-sm bg-stone-100",
                active === i && "ring-2 ring-[var(--accent)]",
              )}
            >
              <LangText text={line.text} lang={lang} as="p" className="font-medium" />
              {line.translit && <p className="text-sm italic text-stone-500">{line.translit}</p>}
              {showTranslations && <p className="mt-1 text-sm text-stone-600">{line.translation}</p>}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={onNext}>
          Aux exercices →
        </Button>
      </div>
    </Panel>
  );
}

function ExerciseStep({
  lang,
  exercise,
  seed,
  status,
  retry,
  onAnswer,
  onContinue,
  onSkip,
}: {
  lang: Lang;
  exercise: Exercise;
  seed: number;
  status: Status;
  retry: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { speechCode } = useProfile();
  const { speak } = useTTS();
  const [chosen, setChosen] = useState<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [spoken, setSpoken] = useState<PronunciationScore | null>(null);
  const answered = status !== "answering";
  const improvement = isImprovement(lang);

  const tokens = useMemo(() => exercise.text.trim().split(/\s+/), [exercise.text]);
  const bank = useMemo(() => shuffle(tokens.map((_, i) => i), seed), [tokens, seed]);

  useEffect(() => {
    if (exercise.type === "listen") void speak(exercise.text, speechCode, { id: "exercise" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entrée pour continuer.
  useEffect(() => {
    if (!answered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, onContinue]);

  function choose(i: number) {
    if (answered) return;
    setChosen(i);
    onAnswer(i === exercise.answer);
  }

  function checkOrder() {
    const attempt = picked.map((i) => tokens[i]).join(" ");
    onAnswer(normalize(attempt, lang) === normalize(exercise.text, lang));
  }

  function onSpoken(text: string) {
    const score = scorePronunciation(exercise.text, text, lang);
    setSpoken(score);
    if (score.score >= 70) onAnswer(true);
  }

  const defaultPrompt: Record<Exercise["type"], string> = {
    choice: "Choisis la bonne réponse",
    listen: improvement ? "Écoute et choisis la phrase écrite sans faute" : "Écoute et choisis la bonne traduction",
    order: "Remets les mots dans l'ordre",
    fill: "Complète la phrase",
    speak: "Dis cette phrase à voix haute",
  };

  const options = exercise.options;

  return (
    <div>
      <Panel>
        {retry && !answered && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Deuxième chance</p>}
        <h2 className="text-xl font-bold">{exercise.prompt || defaultPrompt[exercise.type]}</h2>

        {/* Choix multiple : phrase éventuelle */}
        {exercise.type === "choice" && exercise.text && (
          <div className="mt-4 flex items-center gap-2">
            <SpeakButton text={exercise.text} size="sm" />
            <LangText text={exercise.text} lang={lang} className="text-lg" />
          </div>
        )}

        {/* Écoute */}
        {exercise.type === "listen" && (
          <div className="mt-6 flex justify-center gap-3">
            <SpeakButton text={exercise.text} label="Réécouter" />
            <SpeakButton text={exercise.text} rate={0.7} label="Lentement" />
          </div>
        )}

        {/* Phrase à trou */}
        {exercise.type === "fill" && (
          <div className="mt-6 text-center">
            <p className="text-2xl" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
              {exercise.text.split("___").map((part, i, all) => (
                <span key={i} className={cx(lang === "ar" && "font-arabic")}>
                  {part}
                  {i < all.length - 1 && (
                    <span
                      className={cx(
                        "mx-1 inline-block min-w-16 border-b-2 px-2 font-semibold",
                        chosen === null ? "border-stone-400 text-stone-400" : status === "correct" ? "border-emerald-500 text-emerald-700" : "border-red-500 text-red-600",
                      )}
                    >
                      {chosen === null ? "?" : options[chosen]}
                    </span>
                  )}
                </span>
              ))}
            </p>
            {exercise.translation && <p className="mt-2 text-sm text-stone-500">{exercise.translation}</p>}
          </div>
        )}

        {/* Options (choix, écoute, trou) */}
        {(exercise.type === "choice" || exercise.type === "listen" || exercise.type === "fill") && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {options.map((opt, i) => (
              <button
                key={i}
                disabled={answered}
                onClick={() => choose(i)}
                dir="auto"
                className={cx(
                  "rounded-xl border-2 px-4 py-3 text-left font-medium transition",
                  !answered && "border-stone-200 hover:border-[var(--accent)]",
                  answered && i === exercise.answer && "border-emerald-400 bg-emerald-50",
                  answered && chosen === i && i !== exercise.answer && "border-red-400 bg-red-50",
                  answered && chosen !== i && i !== exercise.answer && "border-stone-200 opacity-50",
                  lang === "ar" && exercise.type !== "listen" && "font-arabic text-lg",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Remettre dans l'ordre */}
        {exercise.type === "order" && (
          <div className="mt-4">
            {exercise.translation && <p className="text-stone-600">« {exercise.translation} »</p>}
            <div
              className="mt-4 flex min-h-14 flex-wrap gap-2 rounded-xl border-2 border-dashed border-stone-300 p-3"
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              {picked.map((i, pos) => (
                <button
                  key={`${i}-${pos}`}
                  disabled={answered}
                  onClick={() => setPicked((p) => p.filter((_, k) => k !== pos))}
                  className={cx("rounded-lg bg-[var(--accent-soft)] px-3 py-1.5 font-medium", lang === "ar" && "font-arabic text-lg")}
                >
                  {tokens[i]}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2" dir={lang === "ar" ? "rtl" : "ltr"}>
              {bank.map((i) => (
                <button
                  key={i}
                  disabled={answered || picked.includes(i)}
                  onClick={() => setPicked((p) => [...p, i])}
                  className={cx(
                    "rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium shadow-sm transition disabled:opacity-30",
                    lang === "ar" && "font-arabic text-lg",
                  )}
                >
                  {tokens[i]}
                </button>
              ))}
            </div>
            {!answered && (
              <div className="mt-6 flex justify-end">
                <Button onClick={checkOrder} disabled={picked.length !== tokens.length}>
                  Vérifier
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Parler */}
        {exercise.type === "speak" && (
          <div className="mt-6 text-center">
            {spoken ? (
              <p className="text-2xl font-semibold" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
                {spoken.words.map((w, i) => (
                  <span key={i} className={cx(lang === "ar" && "font-arabic", w.ok ? "text-emerald-700" : "text-red-600 underline decoration-wavy")}>
                    {w.word}{" "}
                  </span>
                ))}
              </p>
            ) : (
              <LangText text={exercise.text} lang={lang} as="p" className="text-2xl font-semibold" />
            )}
            {exercise.translit && <p className="mt-1 italic text-stone-500">{exercise.translit}</p>}
            {exercise.translation && <p className="mt-1 text-stone-600">{exercise.translation}</p>}
            <div className="mt-4 flex justify-center gap-2">
              <SpeakButton text={exercise.text} label="Écouter" />
              <SpeakButton text={exercise.text} rate={0.7} label="Lent" />
            </div>
            {!answered && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <MicButton size="lg" onText={onSpoken} />
                {spoken && spoken.score < 70 && (
                  <p className="text-sm text-amber-700">{spoken.score} % : réécoute et recommence, tu y es presque.</p>
                )}
                <div className="flex gap-3">
                  {spoken && spoken.score < 70 && (
                    <Button variant="secondary" size="sm" onClick={() => onAnswer(false)}>
                      Passer à la suite
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={onSkip}>
                    Je ne peux pas parler maintenant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Retour immédiat */}
      {answered && (
        <div
          className={cx(
            "mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4",
            status === "correct" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900",
          )}
          role="status"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold">{status === "correct" ? "Bravo !" : "Pas tout à fait."}</p>
            {status === "wrong" && (exercise.type === "order" || exercise.type === "speak") && (
              <p className="mt-1">
                Réponse : <LangText text={exercise.text} lang={lang} className="font-semibold" />
              </p>
            )}
            {status === "wrong" && exercise.type === "listen" && (
              <p className="mt-1">
                Phrase entendue : <LangText text={exercise.text} lang={lang} className="font-semibold" />
              </p>
            )}
            {exercise.explanation && <p className="mt-1 text-sm">{exercise.explanation}</p>}
            {status === "wrong" && <p className="mt-1 text-xs opacity-70">Tu reverras cet exercice à la fin.</p>}
          </div>
          <Button onClick={onContinue}>Continuer</Button>
        </div>
      )}
    </div>
  );
}
