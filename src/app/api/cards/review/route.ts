import { z } from "zod";
import { prisma } from "@/lib/db";
import { PROFILE_ID } from "@/lib/profile";
import { schedule, type Grade } from "@/lib/srs";
import { XP, recordActivity } from "@/lib/activity";
import { toCardDTO } from "@/lib/serialize";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  cardId: z.string().min(1),
  grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

export async function POST(req: Request) {
  try {
    const { cardId, grade } = await parseBody(req, reviewSchema);
    const card = await prisma.card.findFirst({ where: { id: cardId, profileId: PROFILE_ID } });
    if (!card) return json({ error: "Carte introuvable." }, { status: 404 });

    const next = schedule(card, grade as Grade);
    const wasNew = card.reps === 0 && card.lapses === 0;

    const [updated] = await prisma.$transaction([
      prisma.card.update({ where: { id: card.id }, data: next }),
      prisma.reviewLog.create({ data: { cardId: card.id, grade, wasNew } }),
    ]);
    const activity = await recordActivity("reviews", XP.review);

    return json({ card: toCardDTO(updated), xp: activity.gained });
  } catch (error) {
    return errorResponse(error);
  }
}
