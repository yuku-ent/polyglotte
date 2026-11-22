import "server-only";
import { prisma } from "./db";
import { dayKey, nextStreak } from "./dates";
import { PROFILE_ID, getProfile } from "./profile";

export const ACTIVITY_KINDS = [
  "reviews",
  "stories",
  "speakTurns",
  "shadowing",
  "writings",
  "alphabet",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const XP = {
  review: 2,
  storyRead: 10,
  quizCorrect: 5,
  speakTurn: 5,
  shadowing: 5, // + bonus selon la note
  writing: 20,
  alphabetCorrect: 2,
} as const;

/** Ajoute de l'XP, compte l'activité du jour et met à jour la série. */
export async function recordActivity(kind: ActivityKind, xp: number, count = 1) {
  const profile = await getProfile();
  const today = dayKey();
  const safeXp = Math.max(0, Math.min(200, Math.round(xp)));
  const streak = nextStreak(profile.lastActiveDay, today, profile.streak);

  const increment: Partial<Record<ActivityKind, { increment: number }>> = {
    [kind]: { increment: count },
  };
  const initial: Partial<Record<ActivityKind, number>> = { [kind]: count };

  const [day, updated] = await prisma.$transaction([
    prisma.activityDay.upsert({
      where: { profileId_day: { profileId: PROFILE_ID, day: today } },
      update: { xp: { increment: safeXp }, ...increment },
      create: { profileId: PROFILE_ID, day: today, xp: safeXp, ...initial },
    }),
    prisma.profile.update({
      where: { id: PROFILE_ID },
      data: {
        xp: { increment: safeXp },
        streak,
        bestStreak: Math.max(profile.bestStreak, streak),
        lastActiveDay: today,
      },
    }),
  ]);

  return { day, profile: updated, gained: safeXp };
}
