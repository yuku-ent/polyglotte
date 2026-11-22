import { findLesson, allLessons } from "@/content/curriculum";
import { isLessonOpen, lessonContent } from "@/lib/course";
import { errorResponse, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/lessons?id=en-u1-l1 → plan + contenu (généré au premier accès). */
export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id") ?? "";
    const found = findLesson(id);
    if (!found) return json({ error: "Leçon introuvable." }, { status: 404 });
    const { lang, lesson } = found;

    if (!(await isLessonOpen(lang, id))) {
      return json(
        { error: "Cette leçon n'est pas encore ouverte : termine d'abord les précédentes, ou passe l'unité si tu la connais déjà.", code: "locked" },
        { status: 403 },
      );
    }

    const content = await lessonContent(id);
    const flat = allLessons(lang);
    return json({
      lang,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        goal: lesson.goal,
        unitTitle: lesson.unitTitle,
        level: lesson.level,
        review: Boolean(lesson.review),
        position: lesson.index + 1,
        total: flat.length,
      },
      content,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
