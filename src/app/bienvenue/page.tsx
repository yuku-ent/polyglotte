"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProfile } from "@/components/providers";
import { Button, ErrorBox, cx } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { LANGS, LANGUAGES, type Lang, type Level } from "@/lib/languages";

const LEVEL_CHOICES: { level: Level; title: string; text: string }[] = [
  { level: "A1", title: "Je débute", text: "Je ne connais presque rien. On commence par la base." },
  { level: "A2", title: "Je connais les bases", text: "Je comprends des phrases simples et je sais me présenter." },
  { level: "B1", title: "Je me débrouille", text: "Je tiens une conversation simple, avec des fautes." },
  { level: "B2", title: "Je suis à l'aise", text: "Je parle assez bien, je veux être précis et naturel." },
];

const MINUTES = [5, 10, 15, 20, 30, 45, 60];

const LANG_PITCH: Record<Lang, string> = {
  en: "La langue du business et d'internet.",
  es: "Proche du français : tu progresses vite.",
  ar: "Alphabet, lecture, standard ou dialecte.",
  fr: "Orthographe, conjugaison, écrit pro.",
};

export default function WelcomePage() {
  const router = useRouter();
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [level, setLevel] = useState<Level>("A1");
  const [minutes, setMinutes] = useState(15);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await api("/api/course/start", { method: "POST", body: { lang, level } });
      await updateProfile({ name: name.trim() || undefined, currentLang: lang, minMinutes: minutes, onboarded: true });
      router.push("/parcours");
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  const steps = [
    {
      title: "Bienvenue sur Polyglotte",
      body: (
        <div className="space-y-4">
          <p className="text-stone-600">
            Un vrai parcours de cours, leçon après leçon, et de l&apos;entraînement libre autant que tu veux. Quatre
            questions et on commence.
          </p>
          <label className="block text-sm font-medium" htmlFor="name">
            Comment tu t&apos;appelles ?
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton prénom (facultatif)"
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
            autoFocus
          />
        </div>
      ),
    },
    {
      title: "Quelle langue veux-tu travailler en premier ?",
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          {LANGS.map((l) => (
            <button
              key={l}
              data-lang={l}
              onClick={() => {
                setLang(l);
                if (l === "fr" && level === "A1") setLevel("B1");
              }}
              className={cx(
                "rounded-2xl border-2 p-4 text-left transition",
                lang === l ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-stone-200 hover:border-stone-400",
              )}
            >
              <span className="block text-lg font-bold">{LANGUAGES[l].name}</span>
              <span className="block text-sm text-stone-600">{LANG_PITCH[l]}</span>
            </button>
          ))}
          <p className="text-sm text-stone-500 sm:col-span-2">Tu pourras ajouter les autres langues quand tu veux.</p>
        </div>
      ),
    },
    {
      title: `Ton niveau en ${LANGUAGES[lang].name.toLowerCase()}`,
      body: (
        <div className="space-y-3">
          {LEVEL_CHOICES.filter((c) => lang !== "fr" || c.level !== "A1" && c.level !== "A2").map((c) => (
            <button
              key={c.level}
              onClick={() => setLevel(c.level)}
              className={cx(
                "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition",
                level === c.level ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-stone-200 hover:border-stone-400",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-bold shadow-sm">{c.level}</span>
              <span>
                <span className="block font-semibold">{c.title}</span>
                <span className="block text-sm text-stone-600">{c.text}</span>
              </span>
            </button>
          ))}
          <p className="text-sm text-stone-500">
            Les unités en dessous de ton niveau seront marquées comme acquises. Tu pourras toujours y revenir.
          </p>
        </div>
      ),
    },
    {
      title: "Combien de temps minimum par jour ?",
      body: (
        <div className="space-y-4">
          <p className="text-stone-600">
            C&apos;est un <strong>minimum</strong>, pas une limite : une fois atteint, tu continues autant que tu veux.
            Aucune leçon, aucun exercice n&apos;est bloqué par un quota.
          </p>
          <div className="flex flex-wrap gap-2">
            {MINUTES.map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={cx(
                  "rounded-xl border-2 px-4 py-2 font-semibold transition",
                  minutes === m ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-stone-200 hover:border-stone-400",
                )}
              >
                {m} min
              </button>
            ))}
          </div>
          <p className="text-sm text-stone-500">Conseil : 15 à 20 minutes chaque jour valent mieux que 3 heures le dimanche.</p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <div data-lang={lang} className="mx-auto max-w-xl py-6">
      <div className="mb-6 flex gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={cx("h-1.5 flex-1 rounded-full", i <= step ? "bg-[var(--accent)]" : "bg-stone-200")} />
        ))}
      </div>
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-5 text-2xl font-bold tracking-tight">{current.title}</h1>
        {current.body}
        {error && (
          <div className="mt-4">
            <ErrorBox message={error} />
          </div>
        )}
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || saving}>
            ← Retour
          </Button>
          {last ? (
            <Button size="lg" onClick={() => void finish()} disabled={saving}>
              {saving ? "Préparation…" : "Commencer le parcours"}
            </Button>
          ) : (
            <Button size="lg" onClick={() => setStep((s) => s + 1)}>
              Continuer →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
