import type { Card, JournalEntry, Story } from "@prisma/client";
import type { CardDTO, JournalDTO, StoryDTO } from "./types";
import type { Lang } from "./languages";

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export { parseJson };

export function toCardDTO(card: Card): CardDTO {
  return {
    id: card.id,
    lang: card.lang as Lang,
    term: card.term,
    translation: card.translation,
    translit: card.translit,
    example: card.example,
    source: card.source,
    ease: card.ease,
    interval: card.interval,
    reps: card.reps,
    lapses: card.lapses,
    dueAt: card.dueAt.toISOString(),
  };
}

export function toStoryDTO(story: Story): StoryDTO {
  return {
    id: story.id,
    lang: story.lang as Lang,
    level: story.level,
    topic: story.topic,
    title: story.title,
    completed: story.completed,
    createdAt: story.createdAt.toISOString(),
    content: parseJson<StoryDTO["content"]>(story.content, {
      title: story.title,
      title_fr: "",
      sentences: [],
      vocabulary: [],
      questions: [],
    }),
  };
}

export function toJournalDTO(entry: JournalEntry): JournalDTO {
  return {
    id: entry.id,
    lang: entry.lang as Lang,
    prompt: entry.prompt,
    text: entry.text,
    corrected: entry.corrected,
    natural: entry.natural,
    score: entry.score,
    createdAt: entry.createdAt.toISOString(),
    feedback: parseJson<JournalDTO["feedback"]>(entry.feedback, {
      corrected_translit: "",
      errors: [],
      strengths: "",
      tip: "",
    }),
  };
}
