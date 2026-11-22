import "server-only";
import { prisma } from "./db";
import { PROFILE_ID, getLanguage, getProfile } from "./profile";
import { isLang } from "./languages";
import { dayKey, displayedStreak, lastNDays } from "./dates";
import { aiConfigured } from "./ai";

export async function dashboard(langParam?: string | null) {
  const profile = await getProfile();
  const lang = isLang(langParam) ? langParam : isLang(profile.currentLang) ? profile.currentLang : "en";
  const language = await getLanguage(lang);
  const today = dayKey();
  const days = lastNDays(7, today);
  const now = new Date();

  const [activity, languages, total, due, newCount, inProgress, mastered, journal, stories] =
    await Promise.all([
      prisma.activityDay.findMany({ where: { profileId: PROFILE_ID, day: { in: days } } }),
      prisma.languageProgress.findMany({ where: { profileId: PROFILE_ID } }),
      prisma.card.count({ where: { profileId: PROFILE_ID, lang } }),
      prisma.card.count({ where: { profileId: PROFILE_ID, lang, reps: { gt: 0 }, dueAt: { lte: now } } }),
      prisma.card.count({ where: { profileId: PROFILE_ID, lang, reps: 0 } }),
      prisma.card.count({ where: { profileId: PROFILE_ID, lang, reps: { gt: 0 }, interval: { lt: 21 } } }),
      prisma.card.count({ where: { profileId: PROFILE_ID, lang, interval: { gte: 21 } } }),
      prisma.journalEntry.count({ where: { profileId: PROFILE_ID, lang } }),
      prisma.story.count({ where: { profileId: PROFILE_ID, lang } }),
    ]);

  const byDay = new Map(activity.map((a) => [a.day, a]));
  const todayRow = byDay.get(today);

  return {
    profile: {
      name: profile.name,
      currentLang: lang,
      dailyGoal: profile.dailyGoal,
      xp: profile.xp,
      streak: displayedStreak(profile.lastActiveDay, today, profile.streak),
      bestStreak: profile.bestStreak,
    },
    language: { lang, level: language.level, variety: language.variety },
    languages: languages.map((l) => ({ lang: l.lang, level: l.level, variety: l.variety })),
    today: {
      xp: todayRow?.xp ?? 0,
      reviews: todayRow?.reviews ?? 0,
      stories: todayRow?.stories ?? 0,
      speakTurns: todayRow?.speakTurns ?? 0,
      shadowing: todayRow?.shadowing ?? 0,
      writings: todayRow?.writings ?? 0,
      alphabet: todayRow?.alphabet ?? 0,
    },
    week: days.map((day) => ({ day, xp: byDay.get(day)?.xp ?? 0 })),
    stats: { total, due, newCount, inProgress, mastered, journal, stories },
    aiConfigured: aiConfigured(),
  };
}

export type DashboardData = Awaited<ReturnType<typeof dashboard>>;
