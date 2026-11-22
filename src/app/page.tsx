"use client";

import Link from "next/link";
import { useProfile } from "@/components/providers";
import { Badge, ErrorBox, Panel, Spinner, cx } from "@/components/ui";
import { LANGUAGES, LEVELS, LEVEL_DESCRIPTIONS, type Level } from "@/lib/languages";

const GOALS = [
  { xp: 30, label: "Détente · ~10 min" },
  { xp: 50, label: "Régulier · ~20 min" },
  { xp: 100, label: "Sérieux · ~40 min" },
  { xp: 200, label: "Intensif · 1 h et +" },
];

const WEEKDAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

function ProgressRing({ value, max }: { value: number; max: number }) {
  const pct = Math.min(1, max ? value / max : 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={`${value} XP sur ${max}`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e7e5e4" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 60 60)"
        className="transition-[stroke-dashoffset] duration-700"
      />
      <text x="60" y="58" textAnchor="middle" className="fill-stone-900 text-2xl font-bold">
        {value}
      </text>
      <text x="60" y="78" textAnchor="middle" className="fill-stone-500 text-[11px]">
        / {max} XP
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const { data, error, refresh, lang, level, variety, updateLanguage, setDailyGoal } = useProfile();

  if (error && !data) return <ErrorBox message={error} onRetry={() => void refresh()} />;
  if (!data) return <Spinner label="Chargement…" />;

  const info = LANGUAGES[lang];
  const { today, stats, profile, week } = data;
  const goalReached = today.xp >= profile.dailyGoal;
  const maxWeek = Math.max(profile.dailyGoal, ...week.map((d) => d.xp));

  const missions = [
    {
      href: "/revisions",
      title: "Réviser tes mots",
      detail: stats.due ? `${stats.due} carte${stats.due > 1 ? "s" : ""} à revoir` : "Apprends de nouveaux mots",
      done: today.reviews >= 10,
      progress: `${Math.min(today.reviews, 10)}/10`,
    },
    {
      href: "/lire",
      title: "Lire et écouter une histoire",
      detail: "À ton niveau, sur un sujet qui te plaît",
      done: today.stories >= 1,
      progress: `${Math.min(today.stories, 1)}/1`,
    },
    {
      href: "/parler",
      title: "Parler avec ton tuteur",
      detail: "5 échanges à l'oral",
      done: today.speakTurns >= 5,
      progress: `${Math.min(today.speakTurns, 5)}/5`,
    },
    {
      href: "/ecrire",
      title: "Écrire quelques phrases",
      detail: "Corrigées et expliquées",
      done: today.writings >= 1,
      progress: `${Math.min(today.writings, 1)}/1`,
    },
  ];
  if (lang === "ar") {
    missions.splice(1, 0, {
      href: "/alphabet",
      title: "Travailler l'alphabet",
      detail: "Quiz des lettres et de leurs sons",
      done: today.alphabet >= 1,
      progress: `${Math.min(today.alphabet, 1)}/1`,
    });
  }
  const doneCount = missions.filter((m) => m.done).length;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-6">
          <ProgressRing value={today.xp} max={profile.dailyGoal} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-500">
              {info.name} · {info.nativeName}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {goalReached ? "Objectif du jour atteint 🎉" : "On continue aujourd'hui ?"}
            </h1>
            <p className="mt-2 text-stone-600">
              {profile.streak > 0
                ? `Série de ${profile.streak} jour${profile.streak > 1 ? "s" : ""}. Record : ${profile.bestStreak}.`
                : "Fais une activité pour lancer ta série de jours."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="accent">Niveau {level}</Badge>
              <Badge>{stats.mastered} mots maîtrisés</Badge>
              <Badge>{stats.inProgress} en cours</Badge>
              <Badge>{profile.xp} XP au total</Badge>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <h2 className="font-semibold">Cette semaine</h2>
        <div className="mt-4 flex h-32 items-end justify-between gap-2">
          {week.map((d) => {
            const [y, m, dd] = d.day.split("-").map(Number);
            const weekday = WEEKDAYS[new Date(y, m - 1, dd).getDay()];
            const height = maxWeek ? Math.max(4, (d.xp / maxWeek) * 100) : 4;
            return (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end">
                  <div
                    className={cx(
                      "w-full rounded-md",
                      d.xp >= profile.dailyGoal ? "bg-[var(--accent)]" : d.xp > 0 ? "bg-[var(--accent)]/40" : "bg-stone-200",
                    )}
                    style={{ height: `${height}%` }}
                    title={`${d.xp} XP`}
                  />
                </div>
                <span className="text-[11px] text-stone-500">{weekday}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Missions du jour</h2>
          <span className="text-sm text-stone-500">
            {doneCount}/{missions.length} faites
          </span>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {missions.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className={cx(
                  "flex h-full items-start gap-3 rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
                  m.done ? "border-emerald-200 bg-emerald-50/60" : "border-stone-200 hover:border-[var(--accent)]",
                )}
              >
                <span
                  className={cx(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                    m.done ? "bg-emerald-500 text-white" : "border-2 border-stone-300 text-transparent",
                  )}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-stone-900">{m.title}</span>
                  <span className="block text-sm text-stone-600">{m.detail}</span>
                </span>
                <span className="text-xs font-semibold text-stone-500">{m.progress}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <h2 className="font-semibold">Réglages · {info.name}</h2>
        <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="level">
          Ton niveau
        </label>
        <select
          id="level"
          value={level}
          onChange={(e) => void updateLanguage({ level: e.target.value as Level })}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-stone-500">{LEVEL_DESCRIPTIONS[level]}</p>

        <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="variety">
          Variante
        </label>
        <select
          id="variety"
          value={variety}
          onChange={(e) => void updateLanguage({ variety: e.target.value })}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
        >
          {info.varieties.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        {lang === "ar" && (
          <p className="mt-1 text-xs text-stone-500">
            Le standard sert pour lire, les médias et les textes religieux ; un dialecte, pour parler au quotidien.
          </p>
        )}

        <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="goal">
          Objectif quotidien
        </label>
        <select
          id="goal"
          value={profile.dailyGoal}
          onChange={(e) => void setDailyGoal(Number(e.target.value))}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
        >
          {GOALS.map((g) => (
            <option key={g.xp} value={g.xp}>
              {g.xp} XP — {g.label}
            </option>
          ))}
        </select>
      </Panel>

      {!data.aiConfigured && (
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Le tuteur IA n&apos;est pas encore configuré. Ajoute une clé <code>GEMINI_API_KEY</code> (gratuite sur
            aistudio.google.com) pour débloquer les histoires, la conversation et la correction de l&apos;écrit.
          </div>
        </div>
      )}
    </div>
  );
}
