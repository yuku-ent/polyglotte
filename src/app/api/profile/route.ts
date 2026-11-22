import { z } from "zod";
import { prisma } from "@/lib/db";
import { PROFILE_ID, getLanguage, getProfile } from "@/lib/profile";
import { LANGS, LANGUAGES, LEVELS } from "@/lib/languages";
import { dashboard } from "@/lib/dashboard";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const lang = new URL(req.url).searchParams.get("lang");
    return json(await dashboard(lang));
  } catch (error) {
    return errorResponse(error);
  }
}

const patchSchema = z.object({
  name: z.string().trim().max(60).optional(),
  currentLang: z.enum(LANGS).optional(),
  minMinutes: z.number().int().min(5).max(180).optional(),
  onboarded: z.boolean().optional(),
  language: z
    .object({
      lang: z.enum(LANGS),
      level: z.enum(LEVELS).optional(),
      variety: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(req: Request) {
  try {
    const body = await parseBody(req, patchSchema);
    await getProfile();

    if (body.name !== undefined || body.currentLang || body.minMinutes || body.onboarded !== undefined) {
      await prisma.profile.update({
        where: { id: PROFILE_ID },
        data: {
          name: body.name,
          currentLang: body.currentLang,
          minMinutes: body.minMinutes,
          onboarded: body.onboarded,
        },
      });
    }

    if (body.language) {
      const { lang, level, variety } = body.language;
      const valid = LANGUAGES[lang].varieties.some((v) => v.id === variety);
      const progress = await getLanguage(lang);
      await prisma.languageProgress.update({
        where: { id: progress.id },
        data: { level, variety: valid ? variety : undefined },
      });
    }

    return json(await dashboard(body.currentLang ?? body.language?.lang));
  } catch (error) {
    return errorResponse(error);
  }
}
