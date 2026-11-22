import { z } from "zod";
import { prisma } from "@/lib/db";
import { PROFILE_ID, getLanguage } from "@/lib/profile";
import { LANGS, isLang } from "@/lib/languages";
import { toCardDTO } from "@/lib/serialize";
import { errorResponse, json, parseBody } from "@/lib/http";
import type { ReviewQueue } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Nouvelles cartes par série. Pas de limite par jour : l'élève continue tant qu'il veut. */
const NEW_BATCH = 10;

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const lang = params.get("lang");
    if (!isLang(lang)) return json({ error: "Langue inconnue." }, { status: 400 });
    await getLanguage(lang);

    if (params.get("mode") === "all") {
      const cards = await prisma.card.findMany({
        where: { profileId: PROFILE_ID, lang },
        orderBy: { createdAt: "desc" },
      });
      return json({ cards: cards.map(toCardDTO) });
    }

    const now = new Date();
    const newLimit = Math.min(50, Math.max(0, Number(params.get("new") ?? NEW_BATCH) || 0));

    const [due, fresh, dueCount, newCount] = await Promise.all([
      prisma.card.findMany({
        where: { profileId: PROFILE_ID, lang, reps: { gt: 0 }, dueAt: { lte: now } },
        orderBy: { dueAt: "asc" },
        take: 100,
      }),
      prisma.card.findMany({
        where: { profileId: PROFILE_ID, lang, reps: 0, lapses: 0 },
        orderBy: { createdAt: "asc" },
        take: newLimit,
      }),
      prisma.card.count({ where: { profileId: PROFILE_ID, lang, reps: { gt: 0 }, dueAt: { lte: now } } }),
      prisma.card.count({ where: { profileId: PROFILE_ID, lang, reps: 0, lapses: 0 } }),
    ]);

    // Cartes ratées (reps = 0 mais lapses > 0) : elles reviennent comme des cartes à revoir.
    const relearn = await prisma.card.findMany({
      where: { profileId: PROFILE_ID, lang, reps: 0, lapses: { gt: 0 }, dueAt: { lte: now } },
      orderBy: { dueAt: "asc" },
      take: 50,
    });

    const queue: ReviewQueue = {
      cards: [...relearn, ...due, ...fresh].map(toCardDTO),
      dueCount: dueCount + relearn.length,
      newCount,
    };
    return json(queue);
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  lang: z.enum(LANGS),
  term: z.string().trim().min(1).max(200),
  translation: z.string().trim().min(1).max(300),
  translit: z.string().trim().max(200).optional().nullable(),
  example: z.string().trim().max(400).optional().nullable(),
  source: z.enum(["custom", "story", "conversation", "deck", "lesson"]).default("custom"),
});

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, createSchema);
    await getLanguage(body.lang);
    const existing = await prisma.card.findUnique({
      where: { profileId_lang_term: { profileId: PROFILE_ID, lang: body.lang, term: body.term } },
    });
    if (existing) return json({ card: toCardDTO(existing), created: false });

    const card = await prisma.card.create({
      data: {
        profileId: PROFILE_ID,
        lang: body.lang,
        term: body.term,
        translation: body.translation,
        translit: body.translit || null,
        example: body.example || null,
        source: body.source,
      },
    });
    return json({ card: toCardDTO(card), created: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return json({ error: "Identifiant manquant." }, { status: 400 });
    await prisma.card.deleteMany({ where: { id, profileId: PROFILE_ID } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
