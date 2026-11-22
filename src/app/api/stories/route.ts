import { z } from "zod";
import { prisma } from "@/lib/db";
import { PROFILE_ID, getLanguage } from "@/lib/profile";
import { LANGS, isLang, isLevel } from "@/lib/languages";
import { generateStructured } from "@/lib/ai";
import { STORY_LENGTHS, storyPrompt, storySchema, zStory, type StoryLength } from "@/lib/prompts";
import { XP, recordActivity } from "@/lib/activity";
import { toStoryDTO } from "@/lib/serialize";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const lang = new URL(req.url).searchParams.get("lang");
    if (!isLang(lang)) return json({ error: "Langue inconnue." }, { status: 400 });
    const stories = await prisma.story.findMany({
      where: { profileId: PROFILE_ID, lang },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return json({ stories: stories.map(toStoryDTO) });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  lang: z.enum(LANGS),
  topic: z.string().trim().min(2).max(120),
  length: z.enum(Object.keys(STORY_LENGTHS) as [StoryLength, ...StoryLength[]]).default("court"),
});

export async function POST(req: Request) {
  try {
    const { lang, topic, length } = await parseBody(req, createSchema);
    const language = await getLanguage(lang);
    const level = isLevel(language.level) ? language.level : "A1";
    const { system, prompt } = storyPrompt({ lang, level, variety: language.variety }, topic, length);

    const content = await generateStructured({
      system,
      prompt,
      toolName: "ecrire_histoire",
      toolDescription: "Enregistre l'histoire, son vocabulaire et son quiz.",
      jsonSchema: storySchema,
      validator: zStory,
      maxTokens: 4000,
    });

    // On garde uniquement les questions dont la réponse pointe vers une option existante.
    content.questions = content.questions.filter((q) => q.answer < q.options.length);

    const story = await prisma.story.create({
      data: {
        profileId: PROFILE_ID,
        lang,
        level,
        topic,
        title: content.title,
        content: JSON.stringify(content),
      },
    });
    return json({ story: toStoryDTO(story) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

const completeSchema = z.object({
  id: z.string().min(1),
  correct: z.number().int().min(0).max(10),
});

/** Fin de lecture : XP pour l'histoire et pour chaque bonne réponse. */
export async function PATCH(req: Request) {
  try {
    const { id, correct } = await parseBody(req, completeSchema);
    const story = await prisma.story.findFirst({ where: { id, profileId: PROFILE_ID } });
    if (!story) return json({ error: "Histoire introuvable." }, { status: 404 });
    if (story.completed) return json({ xp: 0 });

    await prisma.story.update({ where: { id }, data: { completed: true } });
    const activity = await recordActivity("stories", XP.storyRead + correct * XP.quizCorrect);
    return json({ xp: activity.gained });
  } catch (error) {
    return errorResponse(error);
  }
}
