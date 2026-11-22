import "server-only";
import { prisma } from "./db";
import { PROFILE_ID, getLanguage, getProfile } from "./profile";
import { isLang } from "./languages";
import { dayKey, displayedStreak, lastNDays } from "./dates";
import { aiConfigured, geminiConfigured, groqConfigured } from "./ai";
import { courseOverview } from "./course";

export async function dashboard(langParam?: string | null) {
  const profile = await getProfile();
  const lang = isLang(langParam) ? langParam : isLang(profile.currentLang) ? profile.currentLang : "en";
  const language = await getLanguage(lang);
  const today = dayKey();
  const days = lastNDays(7, today);
  const now = new Date();

  const [activity, languages, total, due, newCount, inProgress, mastered, course] = await Promise.all([
    prisma.activityDay.findMany({ where: { profileId: PROFILE_ID, day: { in: days } } }),
    prisma.languageProgress.findMany({ where: { profileId: PROFILE_ID } }),
    prisma.card.count({ where: { profileId: PROFILE_ID, lang } }),
    prisma.card.count({ where: { profileId: PROFILE_ID, lang, reps: { gt: 0 }, dueAt: { lte: now } } }),
    prisma.card.count({ where: { profileId: PROFILE_ID, lang, reps: 0 } }),
    prisma.card.count({ where: { profileId: PROFILE_ID, lang, reps: { gt: 0 }, interval: { lt: 21 } } }),
    prisma.card.count({ where: { profileId: PROFILE_ID, lang, interval: { gte: 21 } } }),
    courseOverview(lang),
  ]);

  const byDay = new Map(activity.map((a) => [a.day, a]));
  const todayRow = byDay.get(today);

  return {
    profile: {
      name: profile.name,
      currentLang: lang,
      minMinutes: profile.minMinutes,
      onboarded: profile.onboarded,
      xp: profile.xp,
      streak: displayedStreak(profile.lastActiveDay, today, profile.streak),
      bestStreak: profile.bestStreak,
    },
    language: { lang, level: language.level, variety: language.variety, placed: language.placed },
    languages: languages.map((l) => ({ lang: l.lang, level: l.level, variety: l.variety })),
    today: {
      xp: todayRow?.xp ?? 0,
      minutes: Math.floor((todayRow?.seconds ?? 0) / 60),
      lessons: todayRow?.lessons ?? 0,
      reviews: todayRow?.reviews ?? 0,
    },
    week: days.map((day) => ({ day, minutes: Math.floor((byDay.get(day)?.seconds ?? 0) / 60) })),
    stats: { total, due, newCount, inProgress, mastered },
    course: { next: course.next, done: course.done, total: course.total },
    aiConfigured: aiConfigured(),
    voice: { natural: geminiConfigured(), stt: geminiConfigured() || groqConfigured() },
  };
}

export type DashboardData = Awaited<ReturnType<typeof dashboard>>;
