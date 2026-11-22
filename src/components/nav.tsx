"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGS, LANGUAGES } from "@/lib/languages";
import { useProfile } from "./providers";
import { cx } from "./ui";

const LINKS = [
  { href: "/", label: "Aujourd'hui" },
  { href: "/revisions", label: "Réviser" },
  { href: "/lire", label: "Lire & écouter" },
  { href: "/parler", label: "Parler" },
  { href: "/repeter", label: "Répéter" },
  { href: "/ecrire", label: "Écrire" },
  { href: "/alphabet", label: "Alphabet", onlyFor: "ar" as const },
  { href: "/methode", label: "La méthode" },
];

export function Nav() {
  const pathname = usePathname();
  const { data, lang, setLang } = useProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-stone-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-sm text-white">P</span>
          Polyglotte
        </Link>

        <div className="flex rounded-xl bg-stone-100 p-1" role="radiogroup" aria-label="Langue étudiée">
          {LANGS.map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={lang === l}
              onClick={() => void setLang(l)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                lang === l ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900",
              )}
            >
              {LANGUAGES[l].name}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm font-semibold">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700" title="Jours d'affilée">
            🔥 {data?.profile.streak ?? 0}
          </span>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent-strong)]" title="XP aujourd'hui / objectif">
            {data?.today.xp ?? 0}/{data?.profile.dailyGoal ?? 50} XP
          </span>
        </div>

        <nav className="-mx-1 flex w-full gap-1 overflow-x-auto pb-1" aria-label="Navigation principale">
          {LINKS.filter((link) => !link.onlyFor || link.onlyFor === lang).map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  active ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-stone-600 hover:bg-stone-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
