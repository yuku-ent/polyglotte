"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProfile, useTTS } from "@/components/providers";
import { LangText, SpeakButton } from "@/components/speech";
import { ArabicKeyboard } from "@/components/arabic-keyboard";
import { PracticeTextPicker, type PracticeTextData } from "@/components/practice-text";
import { Badge, Button, PageHeader, Panel, cx } from "@/components/ui";
import { api } from "@/lib/api-client";
import { checkDictation, chunks, hint, type DictationResult } from "@/lib/diff";
import { getVariety } from "@/lib/languages";

type Mode = "dictee" | "recopie";
type SentenceResult = { result: DictationResult; score: number; hintUsed: boolean; seconds: number; words: number };

export default function DictationPage() {
  const { lang } = useProfile();
  const [mode, setMode] = useState<Mode>("dictee");
  const [text, setText] = useState<PracticeTextData | null>(null);

  useEffect(() => setText(null), [lang]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "recopie") setMode("recopie");
  }, []);

  return (
    <div>
      <PageHeader
        title={mode === "dictee" ? "Dictée" : "Recopie"}
        subtitle={
          mode === "dictee"
            ? "Écoute, écris, et vois tes fautes mot par mot : accents, mots oubliés, mots en trop."
            : "Le texte est sous tes yeux : recopie-le sans faute, le plus vite possible. Idéal pour l'orthographe et la mémoire visuelle."
        }
        action={
          <div className="flex rounded-xl bg-stone-100 p-1">
            {(["dictee", "recopie"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setText(null);
                }}
                className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", mode === m ? "bg-white shadow-sm" : "text-stone-600")}
              >
                {m === "dictee" ? "🎧 Dictée" : "⌨️ Recopie"}
              </button>
            ))}
          </div>
        }
      />

      {!text ? (
        <PracticeTextPicker
          purpose={mode === "dictee" ? "dictation" : "shadowing"}
          title={mode === "dictee" ? "Quel texte pour ta dictée ?" : "Quel texte veux-tu recopier ?"}
          description="Un petit texte suivi, à ton niveau, sur le thème de ton choix. Tu avances phrase par phrase."
          onReady={setText}
        />
      ) : (
        <Session key={`${mode}-${text.title}-${text.sentences.length}`} mode={mode} text={text} onNew={() => setText(null)} />
      )}
    </div>
  );
}

function Session({ mode, text, onNew }: { mode: Mode; text: PracticeTextData; onNew: () => void }) {
  const { notifyXp, variety } = useProfile();
  const { speak } = useTTS();
  const lang = text.sourceLang;
  const speechCode = getVariety(lang, variety).speechCode;
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState<SentenceResult | null>(null);
  const [results, setResults] = useState<SentenceResult[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [listens, setListens] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sentence = text.sentences[index];
  const parts = useMemo(() => chunks(sentence.text), [sentence.text]);
  const isArabic = lang === "ar";

  // Dictée : la phrase est lue automatiquement à son arrivée.
  useEffect(() => {
    if (mode === "dictee" && !finished) {
      void speak(sentence.text, speechCode, { id: `dictee-${index}` });
      setListens(1);
    }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished]);

  function check() {
    if (!input.trim() || checked) return;
    const result = checkDictation(sentence.text, input, lang);
    const seconds = startedAt ? (Date.now() - startedAt) / 1000 : 0;
    const score = Math.round(result.score * (hintUsed ? 0.85 : 1));
    const entry = { result, score, hintUsed, seconds, words: sentence.text.split(/\s+/).length };
    setChecked(entry);
    setResults((r) => [...r, entry]);
  }

  function next() {
    if (index + 1 >= text.sentences.length) {
      setFinished(true);
      const all = [...results];
      const avg = Math.round(all.reduce((s, r) => s + r.score, 0) / Math.max(1, all.length));
      void api<{ xp: number }>("/api/activity", {
        method: "POST",
        body: { kind: mode === "dictee" ? "dictation" : "shadowing_text", score: avg, sentences: all.length },
      })
        .then((res) => notifyXp(res.xp, mode === "dictee" ? "dictée" : "recopie"))
        .catch(() => {});
      return;
    }
    setIndex((i) => i + 1);
    setInput("");
    setChecked(null);
    setHintUsed(false);
    setStartedAt(null);
  }

  function onType(value: string) {
    if (!startedAt && value) setStartedAt(Date.now());
    setInput(value);
  }

  if (finished) return <Summary mode={mode} results={results} text={text} onNew={onNew} />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${((index + (checked ? 1 : 0)) / text.sentences.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-stone-500">
          {index + 1}/{text.sentences.length}
        </span>
      </div>

      {mode === "recopie" && (
        <Panel className="leading-relaxed text-stone-400">
          <p lang={lang} dir={isArabic ? "rtl" : "ltr"} className={cx(isArabic && "font-arabic text-lg")}>
            {text.sentences.map((s, i) => (
              <span key={i} className={cx(i === index && "font-medium text-stone-900", i < index && "text-emerald-700/70")}>
                {s.text}{" "}
              </span>
            ))}
          </p>
        </Panel>
      )}

      <Panel>
        {mode === "dictee" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  setListens((n) => n + 1);
                  void speak(sentence.text, speechCode, { id: `dictee-${index}` });
                }}
              >
                🔊 Réécouter
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setListens((n) => n + 1);
                  void speak(sentence.text, speechCode, { id: `dictee-slow-${index}`, rate: 0.7 });
                }}
              >
                🐢 Lentement
              </Button>
              {!hintUsed && !checked && (
                <Button variant="ghost" onClick={() => setHintUsed(true)} title="Coûte 15 % des points de la phrase">
                  💡 Indice
                </Button>
              )}
              <span className="ml-auto text-xs text-stone-500">
                {listens} écoute{listens > 1 ? "s" : ""}
              </span>
            </div>
            {parts.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-stone-500">Par morceaux :</span>
                {parts.map((p, k) => (
                  <button
                    key={k}
                    onClick={() => void speak(p, speechCode, { id: `chunk-${index}-${k}`, rate: 0.85 })}
                    className="rounded-full border border-stone-300 px-3 py-1 text-sm hover:border-[var(--accent)]"
                  >
                    🔊 {k + 1}
                  </button>
                ))}
              </div>
            )}
            {hintUsed && !checked && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 font-mono text-amber-900" dir={isArabic ? "rtl" : "ltr"}>
                {hint(sentence.text)}
              </p>
            )}
          </div>
        ) : (
          <LiveCopy target={sentence.text} typed={input} lang={lang} />
        )}

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (checked) next();
              else check();
            }
          }}
          readOnly={Boolean(checked)}
          rows={3}
          dir={isArabic ? "rtl" : "auto"}
          lang={lang}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={mode === "dictee" ? "Écris ce que tu entends…" : "Recopie la phrase en surbrillance…"}
          className={cx("mt-4 w-full rounded-xl border border-stone-300 px-4 py-3 text-lg", isArabic && "font-arabic text-xl")}
        />
        {isArabic && !checked && (
          <div>
            <button type="button" className="mt-2 text-sm text-[var(--accent-strong)] underline" onClick={() => setKeyboard((v) => !v)}>
              {keyboard ? "Masquer le clavier arabe" : "Afficher le clavier arabe"}
            </button>
            {keyboard && (
              <ArabicKeyboard onKey={(c) => onType(input + c)} onBackspace={() => setInput((v) => [...v].slice(0, -1).join(""))} />
            )}
          </div>
        )}

        {!checked ? (
          <div className="mt-4 flex justify-end">
            <Button onClick={check} disabled={!input.trim()}>
              Vérifier <kbd className="rounded bg-white/20 px-1.5 text-xs">Entrée</kbd>
            </Button>
          </div>
        ) : (
          <Correction entry={checked} sentence={sentence} lang={lang} onNext={next} last={index + 1 >= text.sentences.length} />
        )}
      </Panel>
      <p className="text-center text-xs text-stone-500">Majuscules et ponctuation ne comptent pas. Une faute d&apos;accent compte pour une demi-faute.</p>
    </div>
  );
}

/** Recopie : chaque lettre se colore en direct (vert juste, rouge faux). */
function LiveCopy({ target, typed, lang }: { target: string; typed: string; lang: PracticeTextData["sourceLang"] }) {
  const chars = [...target];
  const typedChars = [...typed];
  return (
    <p
      className={cx("text-2xl leading-relaxed tracking-wide", lang === "ar" && "font-arabic text-3xl")}
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {chars.map((c, i) => {
        const t = typedChars[i];
        const state = t === undefined ? "todo" : t === c ? "ok" : t.toLowerCase() === c.toLowerCase() ? "case" : "bad";
        return (
          <span
            key={i}
            className={cx(
              state === "todo" && "text-stone-400",
              state === "ok" && "text-emerald-700",
              state === "case" && "text-amber-600",
              state === "bad" && "rounded bg-red-100 text-red-600",
              i === typedChars.length && "border-b-2 border-[var(--accent)]",
            )}
          >
            {c}
          </span>
        );
      })}
    </p>
  );
}

function Correction({
  entry,
  sentence,
  lang,
  onNext,
  last,
}: {
  entry: SentenceResult;
  sentence: { text: string; translation: string; translit: string };
  lang: PracticeTextData["sourceLang"];
  onNext: () => void;
  last: boolean;
}) {
  const { result } = entry;
  const tone = entry.score >= 90 ? "text-emerald-600" : entry.score >= 60 ? "text-amber-600" : "text-red-600";
  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cx("text-4xl font-extrabold", tone)}>{entry.score} %</span>
        <div className="flex flex-wrap gap-1.5">
          {result.counts.wrong > 0 && <Badge tone="warn">{result.counts.wrong} mot(s) faux</Badge>}
          {result.counts.accent > 0 && <Badge tone="warn">{result.counts.accent} accent(s)</Badge>}
          {result.counts.missing > 0 && <Badge tone="warn">{result.counts.missing} oublié(s)</Badge>}
          {result.counts.extra > 0 && <Badge tone="warn">{result.counts.extra} en trop</Badge>}
          {entry.hintUsed && <Badge>indice utilisé</Badge>}
          {result.score === 100 && <Badge tone="good">Sans faute</Badge>}
        </div>
      </div>

      <p className={cx("text-xl leading-loose", lang === "ar" && "font-arabic text-2xl")} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
        {result.tokens.map((t, i) => {
          if (t.kind === "ok") return <span key={i} className="text-emerald-700">{t.expected} </span>;
          if (t.kind === "missing")
            return (
              <span key={i} className="rounded bg-stone-100 px-1 text-stone-500 underline decoration-dotted" title="Mot oublié">
                {t.expected}{" "}
              </span>
            );
          if (t.kind === "extra")
            return (
              <span key={i} className="text-red-500 line-through" title="Mot en trop">
                {t.typed}{" "}
              </span>
            );
          return (
            <span key={i} className="inline-flex flex-col items-center align-top leading-tight" title={t.kind === "accent" ? "Accent" : "Mot faux"}>
              <span className={cx("line-through", t.kind === "accent" ? "text-amber-600" : "text-red-500")}>{t.typed}</span>
              <span className="font-semibold text-emerald-700">{t.expected}</span>
              <span>&nbsp;</span>
            </span>
          );
        })}
      </p>

      <div className="flex items-start gap-2 rounded-xl bg-stone-50 p-3">
        <SpeakButton text={sentence.text} size="sm" />
        <div>
          <LangText text={sentence.text} lang={lang} as="p" className="font-medium" />
          {sentence.translit && <p className="text-sm italic text-stone-500">{sentence.translit}</p>}
          {sentence.translation && <p className="text-sm text-stone-600">{sentence.translation}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>
          {last ? "Voir le bilan" : "Phrase suivante"} <kbd className="rounded bg-white/20 px-1.5 text-xs">Entrée</kbd>
        </Button>
      </div>
    </div>
  );
}

function Summary({
  mode,
  results,
  text,
  onNew,
}: {
  mode: Mode;
  results: SentenceResult[];
  text: PracticeTextData;
  onNew: () => void;
}) {
  const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / Math.max(1, results.length));
  const perfect = results.filter((r) => r.result.score === 100).length;
  const totalWords = results.reduce((s, r) => s + r.words, 0);
  const totalSeconds = results.reduce((s, r) => s + r.seconds, 0);
  const wpm = totalSeconds > 0 ? Math.round((totalWords / totalSeconds) * 60) : 0;
  const mistakes = [...new Set(results.flatMap((r) => r.result.mistakes).filter(Boolean))];
  const lang = text.sourceLang;

  return (
    <Panel className="mx-auto max-w-2xl text-center">
      <p className="text-5xl">{avg >= 90 ? "🏆" : avg >= 70 ? "👏" : "💪"}</p>
      <h2 className="mt-2 text-2xl font-bold">{mode === "dictee" ? "Dictée terminée" : "Recopie terminée"}</h2>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-3xl font-extrabold text-[var(--accent-strong)]">{avg} %</p>
          <p className="text-xs text-stone-500">précision</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-3xl font-extrabold">
            {perfect}/{results.length}
          </p>
          <p className="text-xs text-stone-500">phrases sans faute</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-3xl font-extrabold">{wpm}</p>
          <p className="text-xs text-stone-500">mots / minute</p>
        </div>
      </div>

      {mistakes.length > 0 && (
        <div className="mt-6 text-left">
          <p className="font-semibold">Les mots à retravailler</p>
          <div className="mt-2 flex flex-wrap gap-2" dir={lang === "ar" ? "rtl" : "ltr"}>
            {mistakes.map((w) => (
              <span key={w} className="flex items-center gap-1 rounded-full border border-stone-200 bg-white py-1 pl-3 pr-1">
                <LangText text={w} lang={lang} className="font-medium" />
                <SpeakButton text={w} size="sm" />
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={onNew}>
          Nouveau texte
        </Button>
      </div>
      <p className="mt-4 text-xs text-stone-500">Rejoue autant que tu veux : pas de limite.</p>
    </Panel>
  );
}
