"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./logo";
import { cx } from "./ui";

const GREETINGS = [
  { text: "Bonjour", lang: "fr" },
  { text: "Hello", lang: "en" },
  { text: "Hola", lang: "es" },
  { text: "مرحبا", lang: "ar" },
];

/**
 * Écran de chargement : le P se dessine d'un seul trait, pendant que
 * « bonjour » défile dans les quatre langues.
 */
export function Splash({ message, fullScreen = true }: { message?: string; fullScreen?: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % GREETINGS.length), 1400);
    return () => window.clearInterval(t);
  }, []);

  const greeting = GREETINGS[i];

  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-5 text-center",
        fullScreen ? "fixed inset-0 z-[60] bg-[#fafaf9]" : "py-20",
      )}
      role="status"
      aria-live="polite"
    >
      <LogoMark animated className="h-20 w-20 text-[var(--accent)]" title="Chargement" />
      <div className="h-9">
        <p
          key={greeting.text}
          lang={greeting.lang}
          dir={greeting.lang === "ar" ? "rtl" : "ltr"}
          className={cx("animate-greet text-2xl font-bold tracking-tight text-stone-900", greeting.lang === "ar" && "font-arabic")}
        >
          {greeting.text}
        </p>
      </div>
      {message && <p className="max-w-sm px-6 text-sm text-stone-500">{message}</p>}
    </div>
  );
}
