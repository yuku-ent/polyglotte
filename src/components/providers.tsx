"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardData } from "@/lib/dashboard";
import { api, errorMessage } from "@/lib/api-client";
import { LANGUAGES, getVariety, isLang, type Lang, type Level } from "@/lib/languages";
import { useVoicePlayer } from "@/hooks/useVoice";
import { Splash } from "./splash";

/* -------------------------------------------------------------------------- */
/* Profil, langue en cours, temps d'étude et notifications                    */
/* -------------------------------------------------------------------------- */

type ProfileContextValue = {
  data: DashboardData | null;
  error: string | null;
  lang: Lang;
  level: Level;
  variety: string;
  speechCode: string;
  /** Minutes étudiées aujourd'hui (mises à jour en direct). */
  minutesToday: number;
  refresh: () => Promise<void>;
  setLang: (lang: Lang) => Promise<void>;
  updateLanguage: (changes: { level?: Level; variety?: string }) => Promise<void>;
  updateProfile: (changes: { name?: string; minMinutes?: number; onboarded?: boolean; currentLang?: Lang }) => Promise<void>;
  notifyXp: (xp: number, label?: string) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const LANG_STORAGE_KEY = "polyglotte:lang";
const IDLE_AFTER_MS = 90_000; // sans interaction pendant 90 s, le temps ne compte plus
const FLUSH_EVERY_MS = 30_000;

type Toast = { id: number; text: string };

/**
 * Compte le temps d'étude actif (onglet visible et interaction récente)
 * et l'envoie au serveur par petits morceaux.
 */
function useStudyTimer(onFlushed: (seconds: number) => void) {
  const pending = useRef(0);
  const lastInteraction = useRef(Date.now());

  useEffect(() => {
    const touch = () => {
      lastInteraction.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));

    const flush = (keepalive = false) => {
      const seconds = Math.min(120, Math.floor(pending.current));
      if (seconds < 1) return;
      pending.current -= seconds;
      void fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "time", seconds }),
        keepalive,
      })
        .then((res) => {
          if (res.ok) onFlushed(seconds);
        })
        .catch(() => {
          pending.current += seconds;
        });
    };

    const tick = window.setInterval(() => {
      const active = document.visibilityState === "visible" && Date.now() - lastInteraction.current < IDLE_AFTER_MS;
      if (active) pending.current += 1;
    }, 1000);
    const flusher = window.setInterval(() => flush(), FLUSH_EVERY_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(tick);
      window.clearInterval(flusher);
      document.removeEventListener("visibilitychange", onHide);
      flush(true);
    };
  }, [onFlushed]);
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sentSeconds, setSentSeconds] = useState(0);
  const toastId = useRef(0);

  const load = useCallback(async (lang?: Lang) => {
    try {
      const query = lang ? `?lang=${lang}` : "";
      const next = await api<DashboardData>(`/api/profile${query}`);
      setData(next);
      setSentSeconds(0); // le serveur a déjà compté le temps envoyé
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    let stored: Lang | undefined;
    try {
      const value = localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(value)) stored = value;
    } catch {
      /* stockage indisponible */
    }
    void load(stored);
  }, [load]);

  const onFlushed = useCallback((seconds: number) => setSentSeconds((s) => s + seconds), []);
  useStudyTimer(onFlushed);

  const lang: Lang = data?.language.lang ?? "en";
  const level = (data?.language.level ?? "A1") as Level;
  const variety = data?.language.variety ?? LANGUAGES[lang].varieties[0].id;
  const minutesToday = (data?.today.minutes ?? 0) + Math.floor(sentSeconds / 60);

  const patch = useCallback(async (body: unknown) => {
    try {
      setData(await api<DashboardData>("/api/profile", { method: "PATCH", body }));
      setSentSeconds(0);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  const setLang = useCallback(
    async (next: Lang) => {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        /* stockage indisponible */
      }
      await patch({ currentLang: next });
    },
    [patch],
  );

  const updateLanguage = useCallback(
    (changes: { level?: Level; variety?: string }) => patch({ language: { lang, ...changes } }),
    [patch, lang],
  );

  const updateProfile = useCallback(
    (changes: { name?: string; minMinutes?: number; onboarded?: boolean; currentLang?: Lang }) => {
      if (changes.currentLang) {
        try {
          localStorage.setItem(LANG_STORAGE_KEY, changes.currentLang);
        } catch {
          /* stockage indisponible */
        }
      }
      return patch(changes);
    },
    [patch],
  );

  const refresh = useCallback(() => load(lang), [load, lang]);

  const notifyXp = useCallback(
    (xp: number, label?: string) => {
      if (xp <= 0) return;
      const id = ++toastId.current;
      setToasts((list) => [...list, { id, text: `+${xp} XP${label ? ` · ${label}` : ""}` }]);
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2500);
      void load(lang);
    },
    [load, lang],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      data,
      error,
      lang,
      level,
      variety,
      speechCode: getVariety(lang, variety).speechCode,
      minutesToday,
      refresh,
      setLang,
      updateLanguage,
      updateProfile,
      notifyXp,
    }),
    [data, error, lang, level, variety, minutesToday, refresh, setLang, updateLanguage, updateProfile, notifyXp],
  );

  return (
    <ProfileContext.Provider value={value}>
      <div data-lang={lang} className="min-h-dvh">
        {children}
        {!data && !error && <Splash />}
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-pop rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            {t.text}
          </div>
        ))}
      </div>
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile doit être utilisé dans <ProfileProvider>");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/* Voix partagée (un seul lecteur pour toute l'appli)                         */
/* -------------------------------------------------------------------------- */

type SpeechContextValue = ReturnType<typeof useVoicePlayer>;
const SpeechContext = createContext<SpeechContextValue | null>(null);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const { data } = useProfile();
  const voice = useVoicePlayer(Boolean(data?.voice.natural));
  return <SpeechContext.Provider value={voice}>{children}</SpeechContext.Provider>;
}

export function useTTS() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useTTS doit être utilisé dans <SpeechProvider>");
  return ctx;
}
