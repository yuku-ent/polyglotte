import { z } from "zod";
import { getLanguage } from "@/lib/profile";
import { LANGS, isLevel } from "@/lib/languages";
import { generateStructured } from "@/lib/ai";
import { phrasesPrompt, phrasesSchema, zPhrases } from "@/lib/prompts";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  lang: z.enum(LANGS),
  topic: z.string().trim().min(2).max(120),
});

export async function POST(req: Request) {
  try {
    const { lang, topic } = await parseBody(req, schema);
    const language = await getLanguage(lang);
    const level = isLevel(language.level) ? language.level : "A1";
    const { system, prompt } = phrasesPrompt({ lang, level, variety: language.variety }, topic);
    const result = await generateStructured({
      system,
      prompt,
      toolName: "donner_phrases",
      toolDescription: "Enregistre les phrases à répéter.",
      jsonSchema: phrasesSchema,
      validator: zPhrases,
      maxTokens: 1500,
    });
    return json({
      phrases: result.phrases.map((p) => ({
        text: p.text,
        translation: p.translation,
        translit: p.translit || undefined,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
