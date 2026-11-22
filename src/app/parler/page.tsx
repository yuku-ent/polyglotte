"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile, useTTS } from "@/components/providers";
import { LangText, MicButton, SpeakButton } from "@/components/speech";
import { AiNotice, Button, ErrorBox, PageHeader, Panel, Spinner, cx } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { SCENARIOS, type Scenario } from "@/content/scenarios";
import type { MessageDTO, WordDTO } from "@/lib/types";

type TurnResponse = {
  conversationId: string;
  userMessage: MessageDTO | null;
  tutorMessage: MessageDTO;
  xp: number;
};

export default function SpeakPage() {
  const { lang, level, speechCode, notifyXp } = useProfile();
  const { speak } = useTTS();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [slow, setSlow] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Changer de langue ferme la conversation en cours.
  useEffect(() => {
    setScenario(null);
    setMessages([]);
    setConversationId(null);
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function send(text: string | null, chosen: Scenario = scenario!) {
    setPending(true);
    setError(null);
    const optimisticId = `local-${Date.now()}`;
    if (text) {
      setMessages((m) => [
        ...m,
        { id: optimisticId, role: "user", content: text, translation: null, translit: null, correction: null, suggestions: [], newWords: [] },
      ]);
    }
    try {
      const res = await api<TurnResponse>("/api/conversation", {
        method: "POST",
        body: { lang, scenarioId: chosen.id, conversationId, message: text },
      });
      setConversationId(res.conversationId);
      setMessages((m) => [
        ...m.filter((msg) => msg.id !== optimisticId),
        ...(res.userMessage ? [res.userMessage] : []),
        res.tutorMessage,
      ]);
      if (autoSpeak) speak(res.tutorMessage.content, speechCode, { rate: slow ? 0.75 : 1, id: res.tutorMessage.id });
      if (res.xp) notifyXp(res.xp);
    } catch (e) {
      setError(errorMessage(e));
      if (text) {
        setMessages((m) => m.filter((msg) => msg.id !== optimisticId));
        setInput(text);
      }
    } finally {
      setPending(false);
    }
  }

  function start(s: Scenario) {
    setScenario(s);
    setMessages([]);
    setConversationId(null);
    void send(null, s);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    void send(text);
  }

  async function addWord(word: WordDTO) {
    await api("/api/cards", {
      method: "POST",
      body: { lang, term: word.term, translation: word.translation, translit: word.translit, source: "conversation" },
    });
    setAdded((prev) => new Set(prev).add(word.term));
  }

  const lastTutor = [...messages].reverse().find((m) => m.role === "tutor");

  if (!scenario) {
    return (
      <div>
        <PageHeader
          title="Parler"
          subtitle={`Ton tuteur joue un rôle, tu réponds à voix haute ou par écrit. Chaque phrase est corrigée et expliquée en français. Niveau ${level}.`}
        />
        <AiNotice />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIOS.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => start(s)}
                className="h-full w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
              >
                <span className="block font-semibold">{s.title}</span>
                <span className="mt-1 block text-sm text-stone-600">{s.description}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-stone-500">
          Le micro fonctionne dans Chrome et Edge. Tu peux aussi écrire en français si tu bloques : le tuteur te
          montrera comment le dire.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex min-h-[70vh] flex-col lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setScenario(null)}>
              ← Scénarios
            </Button>
            <h1 className="mt-1 text-xl font-bold">{scenario.title}</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-stone-700">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} /> Lecture auto
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Lent
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showTranslations} onChange={(e) => setShowTranslations(e.target.checked)} />{" "}
              Traductions
            </label>
          </div>
        </div>

        <Panel className="flex-1 space-y-4 overflow-y-auto">
          {messages.map((m) =>
            m.role === "tutor" ? (
              <div key={m.id} className="flex max-w-[85%] gap-2">
                <SpeakButton text={m.content} rate={slow ? 0.75 : 1} size="sm" id={m.id} />
                <div className="rounded-2xl rounded-tl-sm bg-stone-100 px-4 py-3">
                  <LangText text={m.content} lang={lang} as="p" className="text-stone-900" />
                  {m.translit && <p className="mt-1 text-sm italic text-stone-500">{m.translit}</p>}
                  {showTranslations && m.translation && <p className="mt-1 text-sm text-stone-600">{m.translation}</p>}
                  {!showTranslations && m.translation && (
                    <details className="mt-1 text-sm text-stone-500">
                      <summary className="cursor-pointer select-none">Traduction</summary>
                      {m.translation}
                    </details>
                  )}
                </div>
              </div>
            ) : (
              <div key={m.id} className="ml-auto flex max-w-[85%] flex-col items-end gap-1.5">
                <div className="rounded-2xl rounded-tr-sm bg-[var(--accent)] px-4 py-3 text-white">
                  <LangText text={m.content} lang={lang} as="p" />
                </div>
                {m.correction &&
                  (m.correction.has_errors ? (
                    <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                      <p className="flex items-center gap-2 font-semibold">
                        <span>Plus correct :</span>
                        <LangText text={m.correction.corrected} lang={lang} />
                        <SpeakButton text={m.correction.corrected} size="sm" />
                      </p>
                      <p className="mt-1">{m.correction.explanation}</p>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-700">✓ Correct{m.correction.explanation ? ` · ${m.correction.explanation}` : ""}</p>
                  ))}
              </div>
            ),
          )}
          {pending && <Spinner label="Ton tuteur réfléchit…" />}
          <div ref={bottomRef} />
        </Panel>

        {error && (
          <div className="mt-3">
            <ErrorBox message={error} />
          </div>
        )}

        {lastTutor && lastTutor.suggestions.length > 0 && !pending && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Idées de réponse :</span>
            {lastTutor.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                dir="auto"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm hover:border-[var(--accent)]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-3 flex items-end gap-3">
          <MicButton disabled={pending} onText={(t) => setInput((v) => (v ? `${v} ${t}` : t))} />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            dir="auto"
            lang={lang}
            placeholder="Parle avec le micro ou écris ta réponse…"
            className={cx("min-h-11 flex-1 resize-none rounded-xl border border-stone-300 px-3 py-2", lang === "ar" && "font-arabic text-lg")}
          />
          <Button type="submit" disabled={pending || !input.trim()}>
            Envoyer
          </Button>
        </form>
      </div>

      <Panel className="h-fit lg:sticky lg:top-36">
        <h2 className="font-semibold">Mots de la conversation</h2>
        <p className="text-sm text-stone-500">Ajoute-les à tes révisions.</p>
        <ul className="mt-3 space-y-3">
          {messages
            .flatMap((m) => m.newWords)
            .filter((w, i, all) => all.findIndex((x) => x.term === w.term) === i)
            .map((w) => (
              <li key={w.term} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <LangText text={w.term} lang={lang} className="font-semibold" />
                  {w.translit && <span className="ml-1 text-xs italic text-stone-500">{w.translit}</span>}
                  <p className="text-sm text-stone-600">{w.translation}</p>
                </div>
                <Button size="sm" variant="secondary" disabled={added.has(w.term)} onClick={() => void addWord(w)}>
                  {added.has(w.term) ? "✓" : "+"}
                </Button>
              </li>
            ))}
        </ul>
        <div className="mt-6 rounded-xl bg-stone-50 p-3 text-sm text-stone-600">
          <p className="font-semibold text-stone-800">Conseils</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>Parle même si ce n&apos;est pas parfait : c&apos;est comme ça qu&apos;on progresse.</li>
            <li>Répète la version corrigée à voix haute avant de continuer.</li>
            <li>Bloqué ? Écris en français, le tuteur te donne la phrase.</li>
          </ul>
        </div>
      </Panel>
    </div>
  );
}
