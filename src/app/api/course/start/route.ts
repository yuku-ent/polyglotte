import { z } from "zod";
import { LANGS, LEVELS } from "@/lib/languages";
import { courseOverview, placeLearner } from "@/lib/course";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Choix du niveau de départ pour une langue : place l'élève dans le parcours. */
export async function POST(req: Request) {
  try {
    const { lang, level } = await parseBody(req, z.object({ lang: z.enum(LANGS), level: z.enum(LEVELS) }));
    await placeLearner(lang, level);
    return json(await courseOverview(lang));
  } catch (error) {
    return errorResponse(error);
  }
}
