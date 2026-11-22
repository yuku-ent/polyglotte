import { z } from "zod";
import { getLanguage } from "@/lib/profile";
import { LANGS, isLevel } from "@/lib/languages";
import { generateStructured } from "@/lib/ai";
import { translationCheckPrompt, writingSchema, zWriting } from "@/lib/prompts";
import { recordActivity } from "@/lib/activity";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  lang: z.enum(LANGS),
  direction: z.enum(["to_target", "to_french"]),
  source: z.string().trim().min(2).max(4000),
  reference: z.string().trim().max(4000).default(""),
  attempt: z.string().trim().min(2).max(4000),
});

/** Corrige une traduction : note, version corrigée, version naturelle, erreurs expliquées. */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, schema);
    // En français (perfectionnement), on traduit de l'anglais vers le français.
    const lang = body.lang === "fr" ? "fr" : body.lang;
    const language = await getLanguage(lang);
    const level = isLevel(language.level) ? language.level : "A1";
    const { system, prompt } = translationCheckPrompt(
      { lang, level, variety: language.variety },
      body.lang === "fr" ? "to_french" : body.direction,
      body.source,
      body.reference,
      body.attempt,
    );
    const feedback = await generateStructured({
      system,
      prompt,
      toolName: "corriger_traduction",
      toolDescription: "Enregistre la correction détaillée de la traduction.",
      jsonSchema: writingSchema,
      validator: zWriting,
      maxTokens: 3000,
    });
    const activity = await recordActivity("translations", 10 + Math.round(feedback.score / 10));
    return json({ feedback, xp: activity.gained });
  } catch (error) {
    return errorResponse(error);
  }
}
