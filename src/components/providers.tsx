"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardData } from "@/lib/dashboard";
import { api, errorMessage } from "@/lib/api-client";
import { LANGUAGES, getVariety, type Lang, type Level } from "@/lib/languages";
import { useSpeechSynthesis } from "@/hooks/useSpeech";

/* -------------------------------------------------------------------------- */
/* Profil, langue en cours et notifications d'XP                              */
/* -------------------------------------------------------------------------- */

type ProfileContextValue = {
  data: DashboardData | null;
  error: string | null;
  lang: Lang;
  level: Level;
  variety: string;
  speechCode: string;
  refresh: () => Promise<void>;
  setLang: (lang: Lang) => Promise<void>;
  updateLanguage: (changes: { level?: Level; variety?: string }) => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
  notifyXp: (xp: number, label?: string) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const LANG_STORAGE_KEY = "polyglotte:lang";

type Toast = { id: number; text: string };

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const load = useCallback(async (lang?: Lang) => {
    try {
      const query = lang ? `?lang=${lang}` : "";
      setData(await api<DashboardData>(`/api/profile${query}`));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    let stored: Lang | undefined;
    try {
      const value = localStorage.getItem(LANG_STORAGE_KEY);
      if (value === "en" || value === "es" || value === "ar") stored = value;
    } catch {
      /* stockage indisponible */
    }
    void load(stored);
  }, [load]);

  const lang: Lang = data?.language.lang ?? "en";
  const level = (data?.language.level ?? "A1") as Level;
  const variety = data?.language.variety ?? LANGUAGES[lang].varieties[0].id;

  const setLang = useCallback(async (next: Lang) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* stockage indisponible */
    }
    try {
      setData(await api<DashboardData>("/api/profile", { method: "PATCH", body: { currentLang: next } }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  const updateLanguage = useCallback(
    async (changes: { level?: Level; variety?: string }) => {
      try {
        setData(
          await api<DashboardData>("/api/profile", {
            method: "PATCH",
            body: { language: { lang, ...changes } },
          }),
        );
      } catch (e) {
        setError(errorMessage(e));
      }
    },
    [lang],
  );

  const setDailyGoal = useCallback(async (goal: number) => {
    try {
      setData(await api<DashboardData>("/api/profile", { method: "PATCH", body: { dailyGoal: goal } }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

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
      refresh,
      setLang,
      updateLanguage,
      setDailyGoal,
      notifyXp,
    }),
    [data, error, lang, level, variety, refresh, setLang, updateLanguage, setDailyGoal, notifyXp],
  );

  return (
    <ProfileContext.Provider value={value}>
      <div data-lang={lang} className="min-h-dvh">
        {children}
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
/* Synthèse vocale partagée (un seul lecteur pour toute l'appli)              */
/* -------------------------------------------------------------------------- */

type SpeechContextValue = ReturnType<typeof useSpeechSynthesis>;
const SpeechContext = createContext<SpeechContextValue | null>(null);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const speech = useSpeechSynthesis();
  return <SpeechContext.Provider value={speech}>{children}</SpeechContext.Provider>;
}

export function useTTS() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useTTS doit être utilisé dans <SpeechProvider>");
  return ctx;
}
