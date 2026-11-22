import "server-only";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { LANGUAGES, LEVEL_DESCRIPTIONS, getVariety, type Lang, type Level } from "./languages";
import type { Scenario } from "@/content/scenarios";

type Schema = Anthropic.Tool["input_schema"];

export type LearnerContext = { lang: Lang; level: Level; variety: string };

function describeLearner({ lang, level, variety }: LearnerContext): string {
  const v = getVariety(lang, variety);
  const translit =
    lang === "ar"
      ? "Pour chaque texte en arabe, fournis aussi une translittération latine simple et lisible (ex. « marḥaban, kayfa ḥāluk? »)."
      : "Les champs de translittération restent des chaînes vides.";
  return [
    `Langue cible : ${v.promptName}.`,
    `Niveau de l'élève : ${level} — ${LEVEL_DESCRIPTIONS[level]}`,
    "L'élève est francophone : toutes les explications et traductions sont en français, simples et concrètes.",
    translit,
  ].join("\n");
}

const str = { type: "string" } as const;
const wordItem = {
  type: "object",
  properties: { term: str, translation: str, translit: str },
  required: ["term", "translation", "translit"],
} as const;

const zWord = z.object({
  term: z.string().min(1),
  translation: z.string().min(1),
  translit: z.string().default(""),
});

/* ------------------------------------------------------------------ */
/* Conversation avec le tuteur                                         */
/* ------------------------------------------------------------------ */

export const conversationSchema: Schema = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Réplique du tuteur, uniquement dans la langue cible." },
    reply_fr: { type: "string", description: "Traduction française de la réplique." },
    reply_translit: { type: "string", description: "Translittération (arabe uniquement), sinon vide." },
    correction: {
      type: "object",
      description: "Analyse du DERNIER message de l'élève. Si aucun message élève : has_errors=false.",
      properties: {
        has_errors: { type: "boolean" },
        corrected: { type: "string", description: "Version corrigée du message de l'élève." },
        explanation: { type: "string", description: "Explication courte en français." },
      },
      required: ["has_errors", "corrected", "explanation"],
    },
    suggestions: {
      type: "array",
      description: "3 réponses courtes que l'élève pourrait dire ensuite, dans la langue cible.",
      items: str,
    },
    new_words: {
      type: "array",
      description: "0 à 3 mots utiles de ta réplique que l'élève ne connaît sans doute pas.",
      items: wordItem,
    },
  },
  required: ["reply", "reply_fr", "reply_translit", "correction", "suggestions", "new_words"],
};

export const zConversation = z.object({
  reply: z.string().min(1),
  reply_fr: z.string().default(""),
  reply_translit: z.string().default(""),
  correction: z.object({
    has_errors: z.boolean(),
    corrected: z.string().default(""),
    explanation: z.string().default(""),
  }),
  suggestions: z.array(z.string()).max(5).default([]),
  new_words: z.array(zWord).max(5).default([]),
});
export type ConversationTurn = z.infer<typeof zConversation>;

export function conversationPrompt(
  ctx: LearnerContext,
  scenario: Scenario,
  history: { role: "user" | "tutor"; content: string }[],
  userMessage: string | null,
) {
  const lang = LANGUAGES[ctx.lang].name.toLowerCase();
  const system = [
    `Tu es un tuteur de ${lang} chaleureux, patient et exigeant. Tu joues le rôle suivant : ${scenario.tutorRole}.`,
    describeLearner(ctx),
    "Règles :",
    "- Ta réplique est UNIQUEMENT dans la langue cible, adaptée au niveau (A1 : phrases de 3 à 8 mots).",
    "- 1 à 3 phrases maximum, puis relance souvent avec une question pour faire parler l'élève.",
    "- Reste dans le rôle et dans le scénario.",
    "- Corrige le dernier message de l'élève : grammaire, vocabulaire, tournures peu naturelles. Ignore la ponctuation et les majuscules (le texte vient souvent d'un micro).",
    "- Si l'élève écrit en français, aide-le : donne dans « corrected » la phrase en langue cible et réponds-lui comme s'il l'avait dite.",
    "- Sois encourageant dans les explications, sans en faire trop.",
  ].join("\n");

  const transcript = history.length
    ? history.map((m) => `${m.role === "user" ? "ÉLÈVE" : "TUTEUR"} : ${m.content}`).join("\n")
    : "(La conversation n'a pas encore commencé.)";

  const prompt = userMessage
    ? `Scénario : ${scenario.title} — ${scenario.description}\n\nConversation jusqu'ici :\n${transcript}\n\nNouveau message de l'élève :\n${userMessage}\n\nAnalyse ce message, puis réponds-lui.`
    : `Scénario : ${scenario.title} — ${scenario.description}\n\nOuvre la conversation avec une première réplique simple qui pose le décor et invite l'élève à répondre. Pas de correction (has_errors = false, corrected et explanation vides).`;

  return { system, prompt };
}

/* ------------------------------------------------------------------ */
/* Histoires à lire et écouter                                         */
/* ------------------------------------------------------------------ */

export const storySchema: Schema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Titre dans la langue cible." },
    title_fr: str,
    sentences: {
      type: "array",
      items: {
        type: "object",
        properties: { text: str, translation: str, translit: str },
        required: ["text", "translation", "translit"],
      },
    },
    vocabulary: { type: "array", description: "6 à 10 mots clés de l'histoire.", items: wordItem },
    questions: {
      type: "array",
      description: "3 questions de compréhension à choix multiple.",
      items: {
        type: "object",
        properties: {
          question: str,
          options: { type: "array", items: str, description: "4 options." },
          answer: { type: "integer", description: "Index (0 à 3) de la bonne option." },
          explanation: { type: "string", description: "En français." },
        },
        required: ["question", "options", "answer", "explanation"],
      },
    },
  },
  required: ["title", "title_fr", "sentences", "vocabulary", "questions"],
};

export const zStory = z.object({
  title: z.string().min(1),
  title_fr: z.string().default(""),
  sentences: z
    .array(
      z.object({
        text: z.string().min(1),
        translation: z.string().default(""),
        translit: z.string().default(""),
      }),
    )
    .min(2),
  vocabulary: z.array(zWord).default([]),
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).min(2).max(6),
        answer: z.number().int().min(0),
        explanation: z.string().default(""),
      }),
    )
    .default([]),
});
export type StoryContent = z.infer<typeof zStory>;

export const STORY_LENGTHS = { court: "6 à 8 phrases", moyen: "10 à 14 phrases", long: "16 à 22 phrases" } as const;
export type StoryLength = keyof typeof STORY_LENGTHS;

export function storyPrompt(ctx: LearnerContext, topic: string, length: StoryLength) {
  const system = [
    "Tu écris des histoires courtes pour apprendre une langue par la lecture et l'écoute (input compréhensible).",
    describeLearner(ctx),
    "L'élève doit comprendre 80 à 90 % du texte : vocabulaire fréquent, réutilisé plusieurs fois, quelques mots nouveaux seulement.",
    "Histoire vivante avec des personnages et un petit enjeu, ancrée dans la vie réelle.",
    ctx.level === "A1" || ctx.level === "A2"
      ? "Les questions et les options du quiz sont en français."
      : "Les questions et les options du quiz sont dans la langue cible.",
  ].join("\n");
  const prompt = `Écris une histoire sur le thème : « ${topic} ». Longueur : ${STORY_LENGTHS[length]}. Une phrase par élément de « sentences ».`;
  return { system, prompt };
}

/* ------------------------------------------------------------------ */
/* Correction de l'écrit                                               */
/* ------------------------------------------------------------------ */

export const writingSchema: Schema = {
  type: "object",
  properties: {
    score: { type: "integer", description: "Note de 0 à 100 par rapport au niveau visé." },
    corrected: { type: "string", description: "Texte corrigé en gardant les idées et le style de l'élève." },
    corrected_translit: { type: "string", description: "Translittération du texte corrigé (arabe), sinon vide." },
    natural: { type: "string", description: "Version qu'écrirait un natif, au même niveau." },
    errors: {
      type: "array",
      description: "Les erreurs principales (8 maximum).",
      items: {
        type: "object",
        properties: {
          original: str,
          correction: str,
          explanation: { type: "string", description: "Règle expliquée simplement en français." },
        },
        required: ["original", "correction", "explanation"],
      },
    },
    strengths: { type: "string", description: "Ce qui est réussi, en français, 1 à 2 phrases." },
    tip: { type: "string", description: "Un conseil concret pour progresser, en français." },
  },
  required: ["score", "corrected", "corrected_translit", "natural", "errors", "strengths", "tip"],
};

export const zWriting = z.object({
  score: z.number().int().min(0).max(100),
  corrected: z.string(),
  corrected_translit: z.string().default(""),
  natural: z.string().default(""),
  errors: z
    .array(z.object({ original: z.string(), correction: z.string(), explanation: z.string() }))
    .default([]),
  strengths: z.string().default(""),
  tip: z.string().default(""),
});
export type WritingFeedback = z.infer<typeof zWriting>;

export function writingPrompt(ctx: LearnerContext, text: string, topic: string | null) {
  const system = [
    "Tu es un professeur qui corrige le journal d'un élève, avec précision et bienveillance.",
    describeLearner(ctx),
    "Si le texte contient du français, propose la traduction dans « corrected » et signale-le dans les erreurs.",
  ].join("\n");
  const prompt = `${topic ? `Sujet : ${topic}\n\n` : ""}Texte de l'élève :\n"""\n${text}\n"""`;
  return { system, prompt };
}

/* ------------------------------------------------------------------ */
/* Phrases à répéter                                                   */
/* ------------------------------------------------------------------ */

export const phrasesSchema: Schema = {
  type: "object",
  properties: {
    phrases: {
      type: "array",
      items: {
        type: "object",
        properties: { text: str, translation: str, translit: str },
        required: ["text", "translation", "translit"],
      },
    },
  },
  required: ["phrases"],
};

export const zPhrases = z.object({
  phrases: z
    .array(
      z.object({
        text: z.string().min(1),
        translation: z.string().default(""),
        translit: z.string().default(""),
      }),
    )
    .min(1),
});

export function phrasesPrompt(ctx: LearnerContext, topic: string) {
  const system = [
    "Tu prépares des phrases à écouter puis répéter à voix haute (shadowing).",
    describeLearner(ctx),
    "Phrases naturelles et vraiment utiles à l'oral, de longueur adaptée au niveau.",
  ].join("\n");
  const prompt = `Donne 8 phrases sur le thème : « ${topic} ».`;
  return { system, prompt };
}
