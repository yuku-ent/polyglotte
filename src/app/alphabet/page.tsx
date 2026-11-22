"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProfile } from "@/components/providers";
import { SpeakButton } from "@/components/speech";
import { Button, PageHeader, Panel, cx } from "@/components/ui";
import { api } from "@/lib/api-client";
import { ARABIC_ALPHABET, HARAKAT, letterForms, type ArabicLetter } from "@/content/alphabet";

const QUIZ_LENGTH = 10;

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Question = { letter: ArabicLetter; options: ArabicLetter[] };

function buildQuiz(): Question[] {
  return shuffle(ARABIC_ALPHABET)
    .slice(0, QUIZ_LENGTH)
    .map((letter) => ({
      letter,
      options: shuffle([letter, ...shuffle(ARABIC_ALPHABET.filter((l) => l !== letter)).slice(0, 3)]),
    }));
}

export default function AlphabetPage() {
  const { lang, setLang } = useProfile();
  const [selected, setSelected] = useState<ArabicLetter>(ARABIC_ALPHABET[0]);
  const [mode, setMode] = useState<"learn" | "quiz">("learn");

  if (lang !== "ar") {
    return (
      <Panel className="text-center">
        <p className="font-semibold">L&apos;alphabet concerne l&apos;arabe.</p>
        <Button className="mt-4" onClick={() => void setLang("ar")}>
          Passer à l&apos;arabe
        </Button>
      </Panel>
    );
  }

  return (
    <div>
      <PageHeader
        title="Alphabet arabe"
        subtitle="28 lettres, écrites de droite à gauche. La plupart changent de forme selon leur place dans le mot."
        action={
          <div className="flex rounded-xl bg-stone-100 p-1">
            {(["learn", "quiz"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", mode === m ? "bg-white shadow-sm" : "text-stone-600")}
              >
                {m === "learn" ? "Apprendre" : "Quiz"}
              </button>
            ))}
          </div>
        }
      />

      {mode === "quiz" ? (
        <Quiz />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7" dir="rtl">
              {ARABIC_ALPHABET.map((l) => (
                <li key={l.letter}>
                  <button
                    onClick={() => setSelected(l)}
                    className={cx(
                      "flex w-full flex-col items-center rounded-xl border py-2 transition",
                      selected === l ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-stone-200 hover:border-stone-400",
                    )}
                  >
                    <span lang="ar" className="font-arabic text-3xl leading-tight">
                      {l.letter}
                    </span>
                    <span dir="ltr" className="text-xs text-stone-500">
                      {l.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <h2 className="font-semibold">Les voyelles courtes (harakat)</h2>
              <p className="text-sm text-stone-600">
                Elles s&apos;écrivent au-dessus ou en dessous des lettres. Souvent absentes dans les textes adultes, on les
                trouve dans le Coran, les livres d&apos;apprentissage et pour les enfants.
              </p>
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {HARAKAT.map((h) => (
                  <li key={h.name} className="rounded-xl border border-stone-200 p-2 text-center">
                    <span lang="ar" className="font-arabic text-3xl">
                      {h.mark}
                    </span>
                    <p className="text-xs font-semibold">{h.name}</p>
                    <p className="text-xs text-stone-500">{h.sound}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <LetterDetail letter={selected} />
        </div>
      )}
      <p className="mt-6 text-sm text-stone-500">
        Une fois les lettres reconnues, passe aux <Link href="/revisions" className="underline">révisions</Link> : les mots ont tous
        leur translittération.
      </p>
    </div>
  );
}

function LetterDetail({ letter }: { letter: ArabicLetter }) {
  const forms = letterForms(letter);
  return (
    <Panel className="h-fit text-center lg:sticky lg:top-36">
      <p lang="ar" className="font-arabic text-8xl leading-none">
        {letter.letter}
      </p>
      <p className="mt-3 text-xl font-bold">
        {letter.name} <span className="font-normal text-stone-500">· {letter.translit}</span>
      </p>
      <p className="mt-1 text-sm text-stone-600">{letter.sound}</p>
      <div className="mt-3 flex justify-center">
        <SpeakButton text={letter.example.word} label="Exemple" />
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2" dir="rtl">
        {(
          [
            ["isolee", "isolée"],
            ["initiale", "début"],
            ["mediane", "milieu"],
            ["finale", "fin"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="rounded-xl bg-stone-50 py-2">
            <span lang="ar" className="font-arabic text-3xl">
              {forms[key]}
            </span>
            <p dir="ltr" className="text-xs text-stone-500">
              {label}
            </p>
          </div>
        ))}
      </div>
      {!letter.connects && (
        <p className="mt-3 text-xs text-amber-800">Cette lettre ne s&apos;attache jamais à la lettre qui suit.</p>
      )}

      <div className="mt-6 rounded-xl border border-stone-200 p-3">
        <p lang="ar" dir="rtl" className="font-arabic text-3xl">
          {letter.example.word}
        </p>
        <p className="text-sm italic text-stone-500">{letter.example.translit}</p>
        <p className="text-sm">{letter.example.meaning}</p>
      </div>
    </Panel>
  );
}

function Quiz() {
  const { notifyXp } = useProfile();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuiz(), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<ArabicLetter | null>(null);
  const [correct, setCorrect] = useState(0);
  const [over, setOver] = useState(false);

  const q = questions[index];

  function answer(option: ArabicLetter) {
    if (chosen) return;
    setChosen(option);
    if (option === q.letter) setCorrect((c) => c + 1);
  }

  async function next() {
    if (index + 1 >= questions.length) {
      setOver(true);
      try {
        const res = await api<{ xp: number }>("/api/activity", { method: "POST", body: { kind: "alphabet", correct } });
        notifyXp(res.xp, "quiz alphabet");
      } catch {
        /* sans gravité */
      }
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
  }

  function restart() {
    setSeed((s) => s + 1);
    setIndex(0);
    setChosen(null);
    setCorrect(0);
    setOver(false);
  }

  if (over) {
    return (
      <Panel className="mx-auto max-w-md text-center">
        <p className="text-5xl font-extrabold text-[var(--accent-strong)]">
          {correct}/{questions.length}
        </p>
        <p className="mt-2">{correct >= 8 ? "Excellent, tu connais tes lettres !" : "Continue, ça rentre vite avec la répétition."}</p>
        <Button className="mt-4" onClick={restart}>
          Nouveau quiz
        </Button>
      </Panel>
    );
  }

  return (
    <Panel className="mx-auto max-w-md text-center">
      <p className="text-sm text-stone-500">
        Question {index + 1}/{questions.length} · {correct} bonne{correct > 1 ? "s" : ""} réponse{correct > 1 ? "s" : ""}
      </p>
      <p lang="ar" className="mt-4 font-arabic text-8xl leading-none">
        {q.letter.letter}
      </p>
      <p className="mt-4 font-medium">Quelle est cette lettre ?</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {q.options.map((o) => (
          <button
            key={o.letter}
            onClick={() => answer(o)}
            disabled={Boolean(chosen)}
            className={cx(
              "rounded-xl border px-3 py-3 font-semibold transition",
              !chosen && "border-stone-300 hover:border-[var(--accent)]",
              chosen && o === q.letter && "border-emerald-300 bg-emerald-50",
              chosen === o && o !== q.letter && "border-red-300 bg-red-50",
              chosen && chosen !== o && o !== q.letter && "border-stone-200 opacity-50",
            )}
          >
            {o.name} <span className="font-normal text-stone-500">({o.translit})</span>
          </button>
        ))}
      </div>
      {chosen && (
        <div className="mt-4">
          <p className="text-sm text-stone-600">{q.letter.sound}</p>
          <Button className="mt-3" onClick={() => void next()}>
            {index + 1 >= questions.length ? "Voir le résultat" : "Suivante"}
          </Button>
        </div>
      )}
    </Panel>
  );
}
