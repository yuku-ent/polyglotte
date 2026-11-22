"use client";

import { useState } from "react";
import { useProfile } from "./providers";
import { Button, ErrorBox, Panel, Spinner, cx } from "./ui";
import { api, errorMessage } from "@/lib/api-client";
import { STORY_TOPICS } from "@/content/scenarios";
import { STARTER_PHRASES } from "@/content/phrases";
import type { Lang } from "@/lib/languages";

export type PracticeSentence = { text: string; translation: string; translit: string };
export type PracticeTextData = { title: string; sentences: PracticeSentence[]; sourceLang: Lang };

const LENGTHS = [
  { id: "court", label: "Court" },
  { id: "moyen", label: "Moyen" },
  { id: "long", label: "Long" },
] as const;

/**
 * Choix du texte d'entraînement : généré par l'IA sur un thème,
 * ou phrases de départ (sans IA, instantané).
 */
export function PracticeTextPicker({
  purpose,
  onReady,
  title,
  description,
}: {
  purpose: "dictation" | "shadowing" | "translation";
  onReady: (text: PracticeTextData) => void;
  title: string;
  description: string;
}) {
  const { lang, data } = useProfile();
  const [topic, setTopic] = useState(STORY_TOPICS[0]);
  const [custom, setCustom] = useState("");
  const [length, setLength] = useState<(typeof LENGTHS)[number]["id"]>("court");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiReady = data?.aiConfigured !== false;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ text: { title: string; sentences: PracticeSentence[] }; sourceLang: Lang }>("/api/texts", {
        method: "POST",
        body: { lang, purpose, topic: custom.trim() || topic, length },
      });
      onReady({ ...res.text, sourceLang: res.sourceLang });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function useStarter() {
    const source: Lang = lang === "fr" && purpose === "translation" ? "en" : lang;
    onReady({
      title: "Phrases de départ",
      sourceLang: source,
      sentences: STARTER_PHRASES[source].map((p) => ({ text: p.text, translation: p.translation, translit: p.translit ?? "" })),
    });
  }

  return (
    <Panel className="mx-auto max-w-2xl">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-stone-600">{description}</p>

      <p className="mt-5 text-sm font-medium text-stone-700">Thème</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STORY_TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTopic(t);
              setCustom("");
            }}
            className={cx(
              "rounded-full border px-3 py-1 text-sm",
              topic === t && !custom
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                : "border-stone-300 text-stone-700 hover:border-stone-400",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Ou ton propre thème…"
        className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
      />

      <div className="mt-4 flex gap-2">
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

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => void generate()} disabled={loading || !aiReady}>
          {loading ? <Spinner label="Écriture du texte…" /> : "Créer un texte"}
        </Button>
        <Button variant="secondary" onClick={useStarter} disabled={loading}>
          Phrases de départ (sans attendre)
        </Button>
      </div>
      {!aiReady && <p className="mt-2 text-xs text-stone-500">Les textes sur mesure demandent la clé IA. Les phrases de départ marchent sans.</p>}
      {error && (
        <div className="mt-4">
          <ErrorBox message={error} />
        </div>
      )}
    </Panel>
  );
}
