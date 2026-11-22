import "server-only";
import { prisma } from "./db";
import { PROFILE_ID, getLanguage } from "./profile";
import { AiResponseError, generateStructured } from "./ai";
import { LESSON_VERSION, cleanExercises, lessonPrompt, lessonSchema, zLesson, type LessonContent } from "./prompts";
import { CURRICULUM, allLessons, findLesson, nextLessonId, unitsBelowLevel } from "@/content/curriculum";
import type { Lang, Level } from "./languages";

export type LessonStatus = "done" | "skipped" | "current" | "locked";

export async function finishedLessons(lang: Lang) {
  const rows = await prisma.lessonProgress.findMany({ where: { profileId: PROFILE_ID, lang } });
  return new Map(rows.map((r) => [r.lessonId, r]));
}

/** Le parcours d'une langue avec l'état de chaque leçon. */
export async function courseOverview(lang: Lang) {
  const language = await getLanguage(lang);
  const progress = await finishedLessons(lang);
  const finished = new Set(progress.keys());
  const next = nextLessonId(lang, finished);
  const flat = allLessons(lang);

  const units = CURRICULUM[lang].map((u) => ({
    id: u.id,
    title: u.title,
    level: u.level,
    description: u.description,
    lessons: u.lessons.map((l) => {
      const row = progress.get(l.id);
      const status: LessonStatus = row
        ? (row.status as "done" | "skipped")
        : l.id === next
          ? "current"
          : "locked";
      return { id: l.id, title: l.title, goal: l.goal, review: Boolean(l.review), status, bestScore: row?.bestScore ?? 0 };
    }),
  }));

  const nextLesson = flat.find((l) => l.id === next) ?? null;
  return {
    lang,
    placed: language.placed,
    units,
    next: nextLesson ? { id: nextLesson.id, title: nextLesson.title, unitTitle: nextLesson.unitTitle } : null,
    done: [...progress.values()].filter((p) => p.status === "done").length,
    total: flat.length,
  };
}

export type CourseOverview = Awaited<ReturnType<typeof courseOverview>>;

/** Point de départ : les unités sous le niveau choisi sont marquées comme passées. */
export async function placeLearner(lang: Lang, level: Level) {
  const language = await getLanguage(lang);
  const skipped = unitsBelowLevel(lang, level).flatMap((u) => u.lessons.map((l) => l.id));
  await prisma.$transaction([
    prisma.languageProgress.update({ where: { id: language.id }, data: { level, placed: true } }),
    ...skipped.map((lessonId) =>
      prisma.lessonProgress.upsert({
        where: { profileId_lang_lessonId: { profileId: PROFILE_ID, lang, lessonId } },
        update: {},
        create: { profileId: PROFILE_ID, lang, lessonId, status: "skipped" },
      }),
    ),
  ]);
}

export async function skipUnit(lang: Lang, unitId: string) {
  const unit = CURRICULUM[lang].find((u) => u.id === unitId);
  if (!unit) return;
  await prisma.$transaction(
    unit.lessons.map((l) =>
      prisma.lessonProgress.upsert({
        where: { profileId_lang_lessonId: { profileId: PROFILE_ID, lang, lessonId: l.id } },
        update: {},
        create: { profileId: PROFILE_ID, lang, lessonId: l.id, status: "skipped" },
      }),
    ),
  );
}

/** Contenu d'une leçon : généré une fois par variante de langue, puis lu depuis la base. */
export async function lessonContent(lessonId: string): Promise<LessonContent> {
  const found = findLesson(lessonId);
  if (!found) throw new Error("Leçon inconnue");
  const { lang, lesson } = found;
  const language = await getLanguage(lang);
  const cacheId = `${lang}:${language.variety}:${lessonId}:v${LESSON_VERSION}`;

  const cached = await prisma.lessonContent.findUnique({ where: { id: cacheId } });
  if (cached) {
    try {
      return JSON.parse(cached.content) as LessonContent;
    } catch {
      /* contenu abîmé : on régénère */
    }
  }

  const previousTitles = allLessons(lang)
    .filter((l) => l.index < lesson.index && !l.review)
    .slice(-12)
    .map((l) => l.title);
  const { system, prompt } = lessonPrompt(
    { lang, level: lesson.level, variety: language.variety },
    { ...lesson },
    previousTitles,
  );
  const generate = async () => {
    const result = await generateStructured({
      system,
      prompt,
      toolName: "creer_lecon",
      toolDescription: "Enregistre le contenu complet de la leçon.",
      jsonSchema: lessonSchema,
      validator: zLesson,
      maxTokens: 8000,
    });
    result.exercises = cleanExercises(result.exercises);
    if (result.exercises.length < 4) throw new AiResponseError("La leçon générée était incomplète. Réessaie.");
    return result;
  };

  let content: LessonContent;
  try {
    content = await generate();
  } catch (error) {
    // Une réponse ratée ou une surcharge passagère : on retente une fois.
    const status = (error as { status?: number }).status;
    if (!(error instanceof AiResponseError) && status !== 502 && status !== 503) throw error;
    content = await generate();
  }

  await prisma.lessonContent.upsert({
    where: { id: cacheId },
    update: { content: JSON.stringify(content) },
    create: { id: cacheId, content: JSON.stringify(content) },
  });
  return content;
}

/** Une leçon est ouverte si elle est terminée, passée, ou si c'est la suivante. */
export async function isLessonOpen(lang: Lang, lessonId: string) {
  const progress = await finishedLessons(lang);
  return progress.has(lessonId) || nextLessonId(lang, new Set(progress.keys())) === lessonId;
}
