"use client";

import Link from "next/link";
import { useProfile } from "@/components/providers";
import { PageHeader } from "@/components/ui";

type Mode = { href: string; icon: string; title: string; text: string; skills: string; onlyFor?: "ar" };

const MODES: Mode[] = [
  { href: "/revisions", icon: "🧠", title: "Réviser", text: "Les mots reviennent juste avant que tu les oublies.", skills: "Vocabulaire" },
  { href: "/dictee", icon: "🎧", title: "Dictée", text: "Écoute, écris, et vois chaque faute mot par mot.", skills: "Écoute · Orthographe" },
  { href: "/dictee?mode=recopie", icon: "⌨️", title: "Recopie", text: "Recopie un texte sans faute, le plus vite possible.", skills: "Orthographe · Vitesse" },
  { href: "/traduire", icon: "🔁", title: "Traduire", text: "Un texte à traduire dans un sens ou dans l'autre, corrigé par l'IA.", skills: "Compréhension · Écrit" },
  { href: "/lire", icon: "📖", title: "Lire & écouter", text: "Une histoire à ton niveau, avec audio et quiz.", skills: "Compréhension" },
  { href: "/parler", icon: "💬", title: "Parler", text: "Jeux de rôle avec un tuteur qui corrige chaque phrase.", skills: "Oral" },
  { href: "/repeter", icon: "🎙", title: "Répéter", text: "Écoute une phrase, répète-la, obtiens une note.", skills: "Prononciation" },
  { href: "/ecrire", icon: "✍️", title: "Écrire", text: "Ton journal, corrigé et réécrit comme un natif.", skills: "Écrit" },
  { href: "/alphabet", icon: "ب", title: "Alphabet", text: "Les 28 lettres, leurs formes et un quiz.", skills: "Lecture", onlyFor: "ar" },
];

export default function ArcadePage() {
  const { lang } = useProfile();
  return (
    <div>
      <PageHeader
        title="Arcade"
        subtitle="Tous les modes d'entraînement libre. Pas de limite, pas de quota : tu joues tant que tu veux, tu arrêtes quand tu veux."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.filter((m) => !m.onlyFor || m.onlyFor === lang).map((m) => (
          <li key={m.href}>
            <Link
              href={m.href}
              className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-2xl" aria-hidden>
                {m.icon}
              </span>
              <span className="mt-4 text-lg font-bold">{m.title}</span>
              <span className="mt-1 flex-1 text-sm text-stone-600">{m.text}</span>
              <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)]">{m.skills}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
