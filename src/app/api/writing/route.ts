import { z } from "zod";
import { prisma } from "@/lib/db";
import { PROFILE_ID, getLanguage } from "@/lib/profile";
import { LANGS, isLang, isLevel } from "@/lib/languages";
import { generateStructured } from "@/lib/ai";
import { writingPrompt, writingSchema, zWriting } from "@/lib/prompts";
import { XP, recordActivity } from "@/lib/activity";
import { toJournalDTO } from "@/lib/serialize";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const lang = new URL(req.url).searchParams.get("lang");
    if (!isLang(lang)) return json({ error: "Langue inconnue." }, { status: 400 });
    const entries = await prisma.journalEntry.findMany({
      where: { profileId: PROFILE_ID, lang },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return json({ entries: entries.map(toJournalDTO) });
  } catch (error) {
    return errorResponse(error);
  }
}

const submitSchema = z.object({
  lang: z.enum(LANGS),
  text: z.string().trim().min(3).max(4000),
  prompt: z.string().trim().max(300).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, submitSchema);
    const language = await getLanguage(body.lang);
    const level = isLevel(language.level) ? language.level : "A1";
    const { system, prompt } = writingPrompt(
      { lang: body.lang, level, variety: language.variety },
      body.text,
      body.prompt ?? null,
    );

    const feedback = await generateStructured({
      system,
      prompt,
      toolName: "corriger_texte",
      toolDescription: "Enregistre la correction détaillée du texte de l'élève.",
      jsonSchema: writingSchema,
      validator: zWriting,
      maxTokens: 3000,
    });

    const entry = await prisma.journalEntry.create({
      data: {
        profileId: PROFILE_ID,
        lang: body.lang,
        prompt: body.prompt || null,
        text: body.text,
        corrected: feedback.corrected,
        natural: feedback.natural,
        score: feedback.score,
        feedback: JSON.stringify({
          corrected_translit: feedback.corrected_translit,
          errors: feedback.errors,
          strengths: feedback.strengths,
          tip: feedback.tip,
        }),
      },
    });
    const activity = await recordActivity("writings", XP.writing);

    return json({ entry: toJournalDTO(entry), xp: activity.gained }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
