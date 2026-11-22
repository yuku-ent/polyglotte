"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGS, LANGUAGES } from "@/lib/languages";
import { useProfile } from "./providers";
import { cx } from "./ui";
import { Logo } from "./logo";

const ARCADE_PATHS = ["/arcade", "/dictee", "/traduire", "/lire", "/parler", "/repeter", "/ecrire"];

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/parcours", label: "Parcours" },
  { href: "/revisions", label: "Réviser" },
  { href: "/arcade", label: "Arcade" },
  { href: "/alphabet", label: "Alphabet", onlyFor: "ar" as const },
  { href: "/methode", label: "La méthode" },
];

export function Nav() {
  const pathname = usePathname();
  const { data, lang, setLang, minutesToday } = useProfile();
  if (pathname === "/bienvenue") return null;
  const minReached = data ? minutesToday >= data.profile.minMinutes : false;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" aria-label="Polyglotte, accueil">
          <Logo />
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
          <span
            className={cx(
              "rounded-full px-3 py-1",
              minReached ? "bg-emerald-50 text-emerald-700" : "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
            )}
            title="Temps d'étude aujourd'hui / minimum fixé (aucun maximum)"
          >
            ⏱ {minutesToday}/{data?.profile.minMinutes ?? 15} min{minReached ? " ✓" : ""}
          </span>
        </div>

        <nav className="-mx-1 flex w-full gap-1 overflow-x-auto pb-1" aria-label="Navigation principale">
          {LINKS.filter((link) => !link.onlyFor || link.onlyFor === lang).map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/arcade"
                  ? ARCADE_PATHS.some((p) => pathname.startsWith(p))
                  : pathname.startsWith(link.href);
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
