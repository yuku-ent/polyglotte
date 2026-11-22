/** Formes des données échangées entre l'API et l'interface. */
import type { Lang } from "./languages";

export type CardDTO = {
  id: string;
  lang: Lang;
  term: string;
  translation: string;
  translit: string | null;
  example: string | null;
  source: string;
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  dueAt: string;
};

export type ReviewQueue = {
  cards: CardDTO[];
  dueCount: number;
  newCount: number;
};

export type WordDTO = { term: string; translation: string; translit: string };

export type StoryDTO = {
  id: string;
  lang: Lang;
  level: string;
  topic: string;
  title: string;
  completed: boolean;
  createdAt: string;
  content: {
    title: string;
    title_fr: string;
    sentences: { text: string; translation: string; translit: string }[];
    vocabulary: WordDTO[];
    questions: { question: string; options: string[]; answer: number; explanation: string }[];
  };
};

export type CorrectionDTO = { has_errors: boolean; corrected: string; explanation: string };

export type MessageDTO = {
  id: string;
  role: "user" | "tutor";
  content: string;
  translation: string | null;
  translit: string | null;
  correction: CorrectionDTO | null;
  suggestions: string[];
  newWords: WordDTO[];
};

export type JournalDTO = {
  id: string;
  lang: Lang;
  prompt: string | null;
  text: string;
  corrected: string;
  natural: string;
  score: number;
  createdAt: string;
  feedback: {
    corrected_translit: string;
    errors: { original: string; correction: string; explanation: string }[];
    strengths: string;
    tip: string;
  };
};

export type ApiError = { error: string; code?: string };
