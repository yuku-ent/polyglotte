import { z } from "zod";
import { prisma } from "@/lib/db";
import { PROFILE_ID } from "@/lib/profile";
import { findLesson, nextLessonId } from "@/content/curriculum";
import { finishedLessons, lessonContent } from "@/lib/course";
import { recordActivity } from "@/lib/activity";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().min(1),
  correct: z.number().int().min(0).max(50),
  total: z.number().int().min(1).max(50),
});

/** Fin de leçon : enregistre le score, ajoute les mots aux révisions, renvoie la leçon suivante. */
export async function POST(req: Request) {
  try {
    const { id, correct, total } = await parseBody(req, schema);
    const found = findLesson(id);
    if (!found) return json({ error: "Leçon introuvable." }, { status: 404 });
    const { lang } = found;
    const score = Math.round((Math.min(correct, total) / total) * 100);

    await prisma.lessonProgress.upsert({
      where: { profileId_lang_lessonId: { profileId: PROFILE_ID, lang, lessonId: id } },
      update: { status: "done", attempts: { increment: 1 }, completedAt: new Date() },
      create: { profileId: PROFILE_ID, lang, lessonId: id, status: "done", bestScore: score, attempts: 1 },
    });
    await prisma.lessonProgress.updateMany({
      where: { profileId: PROFILE_ID, lang, lessonId: id, bestScore: { lt: score } },
      data: { bestScore: score },
    });

    // Les mots de la leçon rejoignent les révisions (répétition espacée).
    const content = await lessonContent(id);
    await prisma.card.createMany({
      data: content.words.map((w) => ({
        profileId: PROFILE_ID,
        lang,
        term: w.term,
        translation: w.translation,
        translit: w.translit || null,
        example: w.example || null,
        source: "lesson",
      })),
      skipDuplicates: true,
    });

    const activity = await recordActivity("lessons", 15 + Math.min(correct, total) * 2);
    const progress = await finishedLessons(lang);
    return json({ xp: activity.gained, score, next: nextLessonId(lang, new Set(progress.keys())) });
  } catch (error) {
    return errorResponse(error);
  }
}
