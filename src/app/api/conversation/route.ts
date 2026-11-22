import { z } from "zod";
import type { Message } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PROFILE_ID, getLanguage } from "@/lib/profile";
import { LANGS, isLevel } from "@/lib/languages";
import { generateStructured } from "@/lib/ai";
import { conversationPrompt, conversationSchema, zConversation } from "@/lib/prompts";
import { getScenario } from "@/content/scenarios";
import { XP, recordActivity } from "@/lib/activity";
import { parseJson } from "@/lib/serialize";
import { errorResponse, json, parseBody } from "@/lib/http";
import type { CorrectionDTO, MessageDTO, WordDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Nombre de messages précédents envoyés au modèle. */
const HISTORY_WINDOW = 20;

function toMessageDTO(m: Message): MessageDTO {
  const extra = parseJson<{ suggestions?: string[]; newWords?: WordDTO[] }>(m.suggestions, {});
  return {
    id: m.id,
    role: m.role === "user" ? "user" : "tutor",
    content: m.content,
    translation: m.translation,
    translit: m.translit,
    correction: parseJson<CorrectionDTO | null>(m.correction, null),
    suggestions: extra.suggestions ?? [],
    newWords: extra.newWords ?? [],
  };
}

const turnSchema = z.object({
  lang: z.enum(LANGS),
  scenarioId: z.string().min(1),
  conversationId: z.string().optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, turnSchema);
    const language = await getLanguage(body.lang);
    const level = isLevel(language.level) ? language.level : "A1";
    const scenario = getScenario(body.scenarioId);

    let conversation = body.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: body.conversationId, profileId: PROFILE_ID, lang: body.lang },
        })
      : null;
    conversation ??= await prisma.conversation.create({
      data: { profileId: PROFILE_ID, lang: body.lang, scenario: scenario.id },
    });

    const previous = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_WINDOW,
    });
    const history = previous
      .reverse()
      .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("tutor" as const), content: m.content }));

    const userText = body.message?.trim() || null;
    const { system, prompt } = conversationPrompt(
      { lang: body.lang, level, variety: language.variety },
      scenario,
      history,
      userText,
    );

    const turn = await generateStructured({
      system,
      prompt,
      toolName: "repondre_eleve",
      toolDescription: "Envoie la réplique du tuteur et la correction du message de l'élève.",
      jsonSchema: conversationSchema,
      validator: zConversation,
      maxTokens: 1500,
    });

    let userMessage: Message | null = null;
    if (userText) {
      userMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: userText,
          correction: JSON.stringify(turn.correction),
        },
      });
    }

    const tutorMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "tutor",
        content: turn.reply,
        translation: turn.reply_fr || null,
        translit: turn.reply_translit || null,
        suggestions: JSON.stringify({ suggestions: turn.suggestions.slice(0, 3), newWords: turn.new_words }),
      },
    });

    const xp = userText ? (await recordActivity("speakTurns", XP.speakTurn)).gained : 0;

    return json({
      conversationId: conversation.id,
      userMessage: userMessage ? toMessageDTO(userMessage) : null,
      tutorMessage: toMessageDTO(tutorMessage),
      xp,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
