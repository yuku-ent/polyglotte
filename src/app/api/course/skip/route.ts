import { z } from "zod";
import { LANGS } from "@/lib/languages";
import { courseOverview, skipUnit } from "@/lib/course";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";

/** « Je connais déjà cette unité » : débloque la suite sans la faire. */
export async function POST(req: Request) {
  try {
    const { lang, unitId } = await parseBody(req, z.object({ lang: z.enum(LANGS), unitId: z.string().min(1) }));
    await skipUnit(lang, unitId);
    return json(await courseOverview(lang));
  } catch (error) {
    return errorResponse(error);
  }
}
