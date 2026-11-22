"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useProfile } from "@/components/providers";
import { LangText, SpeakButton } from "@/components/speech";
import { Badge, Button, EmptyState, ErrorBox, PageHeader, Panel, Spinner, cx } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { GRADES, GRADE_LABELS, formatInterval, mastery, schedule, type Grade } from "@/lib/srs";
import type { CardDTO, ReviewQueue } from "@/lib/types";

type Direction = "target" | "french";

const GRADE_STYLES: Record<Grade, string> = {
  0: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
  1: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  2: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  3: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
};

export default function RevisionsPage() {
  const { lang, notifyXp } = useProfile();
  const [queue, setQueue] = useState<CardDTO[] | null>(null);
  const [meta, setMeta] = useState<Omit<ReviewQueue, "cards"> | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [direction, setDirection] = useState<Direction>("target");
  const [done, setDone] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"review" | "words">("review");

  const load = useCallback(async () => {
    setError(null);
    setQueue(null);
    try {
      const data = await api<ReviewQueue>(`/api/cards?lang=${lang}`);
      setQueue(data.cards);
      setMeta({ dueCount: data.dueCount, newCount: data.newCount, newLimit: data.newLimit });
      setDone(0);
      setSessionXp(0);
      setRevealed(false);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const card = queue?.[0];

  const previews = useMemo(() => {
    if (!card) return null;
    const now = new Date();
    return Object.fromEntries(GRADES.map((g) => [g, formatInterval(schedule(card, g, now), now)])) as Record<Grade, string>;
  }, [card]);

  const grade = useCallback(
    async (g: Grade) => {
      if (!card || busy) return;
      setBusy(true);
      try {
        const res = await api<{ card: CardDTO; xp: number }>("/api/cards/review", {
          method: "POST",
          body: { cardId: card.id, grade: g },
        });
        const rest = (queue ?? []).slice(1);
        // Une carte ratée revient en fin de session.
        const next = g === 0 ? [...rest, res.card] : rest;
        setQueue(next);
        setDone((n) => n + 1);
        const total = sessionXp + res.xp;
        setSessionXp(total);
        setRevealed(false);
        if (next.length === 0) notifyXp(total, "session de révision");
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setBusy(false);
      }
    },
    [card, busy, queue, sessionXp, notifyXp],
  );

  // Raccourcis clavier : Espace pour retourner, 1 à 4 pour noter.
  useEffect(() => {
    if (tab !== "review") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        void grade((Number(e.key) - 1) as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, grade, tab]);

  const finished = queue !== null && queue.length === 0;

  return (
    <div>
      <PageHeader
        title="Réviser"
        subtitle="Répétition espacée : chaque mot revient juste avant que tu l'oublies. Plus tu le connais, plus il revient tard."
        action={
          <div className="flex rounded-xl bg-stone-100 p-1">
            {(["review", "words"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold",
                  tab === t ? "bg-white shadow-sm" : "text-stone-600",
                )}
              >
                {t === "review" ? "Session" : "Mes mots"}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBox message={error} onRetry={() => void load()} />
        </div>
      )}

      {tab === "words" ? (
        <WordList onChange={load} />
      ) : !queue ? (
        <Spinner label="Préparation de la session…" />
      ) : finished ? (
        <EmptyState
          title={done ? `Session terminée : ${done} carte${done > 1 ? "s" : ""} révisée${done > 1 ? "s" : ""} 💪` : "Rien à réviser pour l'instant"}
          text={
            done
              ? "Reviens demain : les mots reviendront au bon moment."
              : "Toutes tes cartes sont à jour. Ajoute des mots depuis les histoires ou dans « Mes mots »."
          }
          action={<Button onClick={() => void load()}>Vérifier à nouveau</Button>}
        />
      ) : (
        card && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
              <span>
                {queue.length} restante{queue.length > 1 ? "s" : ""} · {done} faite{done > 1 ? "s" : ""}
                {meta && ` · ${meta.newLimit} nouvelles max aujourd'hui`}
              </span>
              <label className="flex items-center gap-2">
                Sens
                <select
                  value={direction}
                  onChange={(e) => {
                    setDirection(e.target.value as Direction);
                    setRevealed(false);
                  }}
                  className="rounded-lg border border-stone-300 bg-white px-2 py-1"
                >
                  <option value="target">Langue → français</option>
                  <option value="french">Français → langue</option>
                </select>
              </label>
            </div>

            <Panel className="min-h-72 text-center">
              <div className="mb-4 flex justify-center">
                <Badge tone={card.reps === 0 ? "accent" : "neutral"}>{mastery(card)}</Badge>
              </div>

              {direction === "target" || revealed ? (
                <div className="space-y-2">
                  <LangText text={card.term} lang={lang} as="p" className="text-4xl font-bold text-stone-900" />
                  {card.translit && <p className="text-stone-500 italic">{card.translit}</p>}
                  <div className="flex justify-center gap-2 pt-1">
                    <SpeakButton text={card.term} />
                    <SpeakButton text={card.term} rate={0.7} label="Lent" />
                  </div>
                </div>
              ) : (
                <p className="text-3xl font-bold text-stone-900">{card.translation}</p>
              )}

              {revealed ? (
                <div className="mt-6 border-t border-stone-100 pt-6">
                  {direction === "target" ? (
                    <p className="text-2xl font-semibold text-stone-800">{card.translation}</p>
                  ) : (
                    <p className="text-sm text-stone-500">{card.translation}</p>
                  )}
                  {card.example && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-stone-600">
                      <LangText text={card.example} lang={lang} className="italic" />
                      <SpeakButton text={card.example} size="sm" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-8">
                  <Button size="lg" onClick={() => setRevealed(true)}>
                    Afficher la réponse <kbd className="rounded bg-white/20 px-1.5 text-xs">Espace</kbd>
                  </Button>
                </div>
              )}
            </Panel>

            {revealed && previews && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    disabled={busy}
                    onClick={() => void grade(g)}
                    className={cx("rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-50", GRADE_STYLES[g])}
                  >
                    <span className="block">
                      {GRADE_LABELS[g]} <kbd className="text-xs opacity-60">{g + 1}</kbd>
                    </span>
                    <span className="block text-xs font-normal opacity-80">{previews[g]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

function WordList({ onChange }: { onChange: () => void }) {
  const { lang } = useProfile();
  const [cards, setCards] = useState<CardDTO[] | null>(null);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ term: "", translation: "", translit: "", example: "" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ cards: CardDTO[] }>(`/api/cards?lang=${lang}&mode=all`);
      setCards(data.cards);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/cards", { method: "POST", body: { lang, ...form, source: "custom" } });
      setForm({ term: "", translation: "", translit: "", example: "" });
      await load();
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(id: string) {
    await api(`/api/cards?id=${id}`, { method: "DELETE" });
    setCards((list) => list?.filter((c) => c.id !== id) ?? null);
    onChange();
  }

  const shown = (cards ?? []).filter((c) => {
    const q = filter.trim().toLowerCase();
    return !q || c.term.toLowerCase().includes(q) || c.translation.toLowerCase().includes(q);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel>
        <h2 className="font-semibold">Ajouter un mot</h2>
        <form onSubmit={add} className="mt-3 space-y-3">
          <input
            required
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
            placeholder="Mot ou expression"
            dir="auto"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
          <input
            required
            value={form.translation}
            onChange={(e) => setForm({ ...form, translation: e.target.value })}
            placeholder="Traduction en français"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
          {lang === "ar" && (
            <input
              value={form.translit}
              onChange={(e) => setForm({ ...form, translit: e.target.value })}
              placeholder="Translittération (facultatif)"
              className="w-full rounded-xl border border-stone-300 px-3 py-2"
            />
          )}
          <input
            value={form.example}
            onChange={(e) => setForm({ ...form, example: e.target.value })}
            placeholder="Phrase d'exemple (facultatif)"
            dir="auto"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
          <Button type="submit" className="w-full">
            Ajouter
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </Panel>

      <Panel className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{cards ? `${cards.length} mots` : "Mots"}</h2>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Rechercher…"
            dir="auto"
            className="rounded-xl border border-stone-300 px-3 py-1.5 text-sm"
          />
        </div>
        {!cards ? (
          <div className="mt-4">
            <Spinner />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {shown.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <SpeakButton text={c.term} size="sm" />
                <div className="min-w-0 flex-1">
                  <LangText text={c.term} lang={lang} className="font-semibold" />
                  {c.translit && <span className="ml-2 text-sm italic text-stone-500">{c.translit}</span>}
                  <p className="truncate text-sm text-stone-600">{c.translation}</p>
                </div>
                <Badge tone={mastery(c) === "maîtrisé" ? "good" : "neutral"}>{mastery(c)}</Badge>
                {c.source !== "deck" && (
                  <Button variant="danger" size="sm" onClick={() => void remove(c.id)} aria-label={`Supprimer ${c.term}`}>
                    ✕
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
