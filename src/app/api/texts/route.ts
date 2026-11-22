import { z } from "zod";
import { getLanguage } from "@/lib/profile";
import { LANGS, isLevel } from "@/lib/languages";
import { generateStructured } from "@/lib/ai";
import {
  TEXT_LENGTHS,
  TEXT_PURPOSES,
  practiceTextPrompt,
  practiceTextSchema,
  zPracticeText,
  type TextLength,
} from "@/lib/prompts";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  lang: z.enum(LANGS),
  purpose: z.enum(TEXT_PURPOSES),
  topic: z.string().trim().min(2).max(120),
  length: z.enum(Object.keys(TEXT_LENGTHS) as [TextLength, ...TextLength[]]).default("court"),
});

/** Génère un court texte suivi pour la dictée, le shadowing ou la traduction. */
export async function POST(req: Request) {
  try {
    const { lang, purpose, topic, length } = await parseBody(req, schema);
    // Traduction en français (perfectionnement) : on traduit depuis l'anglais.
    const sourceLang = lang === "fr" && purpose === "translation" ? "en" : lang;
    const language = await getLanguage(sourceLang);
    const level = sourceLang !== lang ? "B1" : isLevel(language.level) ? language.level : "A1";
    const { system, prompt } = practiceTextPrompt(
      { lang: sourceLang, level, variety: language.variety },
      purpose,
      topic,
      length,
    );
    const text = await generateStructured({
      system,
      prompt,
      toolName: "ecrire_texte",
      toolDescription: "Enregistre le texte d'entraînement, phrase par phrase.",
      jsonSchema: practiceTextSchema,
      validator: zPracticeText,
      maxTokens: 2500,
    });
    return json({ text, sourceLang });
  } catch (error) {
    return errorResponse(error);
  }
}
