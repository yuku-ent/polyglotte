import { z } from "zod";
import { XP, recordActivity } from "@/lib/activity";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Activités notées côté navigateur (répétition, quiz de l'alphabet).
 * L'XP est calculée ici à partir du résultat, pas envoyée par le client.
 */
const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("shadowing"), score: z.number().min(0).max(100) }),
  z.object({ kind: z.literal("alphabet"), correct: z.number().int().min(0).max(50) }),
  // Temps d'étude actif, envoyé par petits morceaux (au plus 2 minutes par envoi).
  z.object({ kind: z.literal("time"), seconds: z.number().int().min(1).max(120) }),
  // Fin d'une dictée ou d'un texte en shadowing : note moyenne et nombre de phrases.
  z.object({ kind: z.literal("dictation"), score: z.number().min(0).max(100), sentences: z.number().int().min(1).max(30) }),
  z.object({ kind: z.literal("shadowing_text"), score: z.number().min(0).max(100), sentences: z.number().int().min(1).max(30) }),
]);

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, schema);
    if (body.kind === "shadowing") {
      const bonus = body.score >= 90 ? 5 : body.score >= 70 ? 3 : body.score >= 50 ? 1 : 0;
      const result = await recordActivity("shadowing", XP.shadowing + bonus);
      return json({ xp: result.gained });
    }
    if (body.kind === "dictation" || body.kind === "shadowing_text") {
      const xp = body.sentences * 2 + Math.round(body.score / 10);
      const result = await recordActivity(body.kind === "dictation" ? "dictations" : "shadowing", xp);
      return json({ xp: result.gained });
    }
    if (body.kind === "time") {
      await recordActivity("seconds", 0, body.seconds);
      return json({ xp: 0 });
    }
    const result = await recordActivity("alphabet", body.correct * XP.alphabetCorrect);
    return json({ xp: result.gained });
  } catch (error) {
    return errorResponse(error);
  }
}
