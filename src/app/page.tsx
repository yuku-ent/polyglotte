"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/components/providers";
import { Badge, ErrorBox, Panel, Spinner, cx } from "@/components/ui";
import { LANGUAGES, LEVELS, LEVEL_DESCRIPTIONS, type Level } from "@/lib/languages";

const MINUTES = [5, 10, 15, 20, 30, 45, 60];
const WEEKDAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

function MinutesRing({ value, min }: { value: number; min: number }) {
  const pct = Math.min(1, min ? value / min : 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  const reached = value >= min;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label={`${value} minutes sur ${min} minimum`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e7e5e4" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={reached ? "#10b981" : "var(--accent)"}
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
        min · minimum {min}
      </text>
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const { data, error, refresh, lang, level, variety, minutesToday, updateLanguage, updateProfile } = useProfile();

  useEffect(() => {
    if (data && !data.profile.onboarded) router.replace("/bienvenue");
  }, [data, router]);

  if (error && !data) return <ErrorBox message={error} onRetry={() => void refresh()} />;
  if (!data || !data.profile.onboarded) return <Spinner label="Chargement…" />;

  const info = LANGUAGES[lang];
  const { profile, stats, course, week } = data;
  const reached = minutesToday >= profile.minMinutes;
  const remaining = Math.max(0, profile.minMinutes - minutesToday);
  const maxWeek = Math.max(profile.minMinutes, ...week.map((d) => d.minutes), 1);
  const coursePct = course.total ? Math.round((course.done / course.total) * 100) : 0;

  const practice = [
    { href: "/revisions", title: "Réviser", text: stats.due ? `${stats.due} mot${stats.due > 1 ? "s" : ""} à revoir` : "Apprendre de nouveaux mots", icon: "🧠" },
    { href: "/lire", title: "Lire & écouter", text: "Une histoire à ton niveau", icon: "📖" },
    { href: "/parler", title: "Parler", text: "Jeux de rôle avec le tuteur", icon: "💬" },
    { href: "/repeter", title: "Répéter", text: "Prononciation au micro", icon: "🎙" },
    { href: "/ecrire", title: "Écrire", text: "Texte corrigé et expliqué", icon: "✍️" },
    ...(lang === "ar" ? [{ href: "/alphabet", title: "Alphabet", text: "Lettres, sons et quiz", icon: "ب" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Le parcours : l'action principale */}
        <Panel className="lg:col-span-2">
          <p className="text-sm font-medium text-stone-500">
            {profile.name ? `Salut ${profile.name} · ` : ""}
            {info.name} · niveau {level}
          </p>
          {!data.language.placed ? (
            <>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Commence ton parcours en {info.name.toLowerCase()}</h1>
              <p className="mt-2 text-stone-600">Choisis ton niveau de départ et ta première leçon t&apos;attend.</p>
              <Link
                href="/parcours"
                className="mt-5 inline-flex rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-sm hover:brightness-110"
              >
                Choisir mon point de départ →
              </Link>
            </>
          ) : course.next ? (
            <>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Continue ton parcours</h1>
              <div className="mt-4 rounded-2xl bg-[var(--accent-soft)] p-4">
                <p className="text-sm font-medium text-[var(--accent-strong)]">{course.next.unitTitle}</p>
                <p className="text-xl font-bold text-stone-900">{course.next.title}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link
                  href={`/parcours/${course.next.id}`}
                  className="inline-flex rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-sm hover:brightness-110"
                >
                  Commencer la leçon →
                </Link>
                <Link href="/parcours" className="text-sm font-medium text-stone-600 hover:underline">
                  Voir tout le parcours
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Parcours terminé 🎉</h1>
              <p className="mt-2 text-stone-600">
                Bravo ! Continue avec l&apos;entraînement libre ci-dessous, ou refais une leçon depuis le parcours.
              </p>
            </>
          )}
          {data.language.placed && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-stone-500">
                <span>Progression du parcours</span>
                <span>
                  {course.done}/{course.total} leçons
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${coursePct}%` }} />
              </div>
            </div>
          )}
        </Panel>

        {/* Temps du jour : un minimum, jamais de maximum */}
        <Panel className="flex flex-col items-center text-center">
          <MinutesRing value={minutesToday} min={profile.minMinutes} />
          <p className="mt-3 font-semibold">
            {reached ? "Minimum atteint ✓" : `Encore ${remaining} min pour ton minimum`}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            {reached ? "Continue tant que tu en as envie : il n'y a aucune limite." : "Ensuite, tu continues autant que tu veux."}
          </p>
          <p className="mt-3 text-sm text-orange-700">
            🔥 {profile.streak} jour{profile.streak > 1 ? "s" : ""} d&apos;affilée · record {profile.bestStreak}
          </p>
        </Panel>
      </div>

      {/* Entraînement libre : mode arcade */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold">Entraînement libre</h2>
          <p className="text-sm text-stone-600">Comme une borne d&apos;arcade : tu joues tant que tu veux, tu arrêtes quand tu veux.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {practice.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="flex h-full items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-xl" aria-hidden>
                  {p.icon}
                </span>
                <span>
                  <span className="block font-semibold">{p.title}</span>
                  <span className="block text-sm text-stone-600">{p.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Temps d&apos;étude sur 7 jours</h2>
            <div className="flex flex-wrap gap-2">
              <Badge>{stats.mastered} mots maîtrisés</Badge>
              <Badge>{stats.inProgress} en cours</Badge>
            </div>
          </div>
          <div className="mt-4 flex h-36 items-end justify-between gap-2">
            {week.map((d) => {
              const [y, m, dd] = d.day.split("-").map(Number);
              const weekday = WEEKDAYS[new Date(y, m - 1, dd).getDay()];
              const height = Math.max(3, (d.minutes / maxWeek) * 100);
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="h-4 text-[11px] text-stone-500">{d.minutes ? `${d.minutes}` : ""}</span>
                  <div className="flex h-24 w-full items-end">
                    <div
                      className={cx(
                        "w-full rounded-md",
                        d.minutes >= profile.minMinutes ? "bg-emerald-500" : d.minutes > 0 ? "bg-[var(--accent)]/50" : "bg-stone-200",
                      )}
                      style={{ height: `${height}%` }}
                      title={`${d.minutes} min`}
                    />
                  </div>
                  <span className="text-[11px] text-stone-500">{weekday}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-stone-500">En vert : jours où ton minimum de {profile.minMinutes} min est atteint.</p>
        </Panel>

        <Panel>
          <h2 className="font-semibold">Réglages · {info.name}</h2>
          <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="level">
            Niveau
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
          <p className="mt-1 text-xs text-stone-500">{LEVEL_DESCRIPTIONS[level]} Sert aux histoires, au tuteur et à l&apos;écrit.</p>

          {info.varieties.length > 1 && (
            <>
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
            </>
          )}

          <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="minutes">
            Temps minimum par jour
          </label>
          <select
            id="minutes"
            value={profile.minMinutes}
            onChange={(e) => void updateProfile({ minMinutes: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m} min (minimum, sans maximum)
              </option>
            ))}
          </select>
        </Panel>
      </div>

      {!data.aiConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          L&apos;IA n&apos;est pas configurée : ajoute <code>GEMINI_API_KEY</code> (gratuite sur aistudio.google.com) pour
          les leçons du parcours, le tuteur, les histoires et la correction de l&apos;écrit.
        </div>
      )}
    </div>
  );
}
