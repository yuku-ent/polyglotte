/**
 * Compare la phrase attendue avec ce que la reconnaissance vocale a entendu.
 * Alignement mot à mot par plus longue sous-séquence commune (LCS).
 */
import type { Lang } from "./languages";

const ARABIC_DIACRITICS = /[ً-ٰٟۖ-ۭـ]/g;

export function normalize(text: string, lang: Lang): string {
  let t = text.toLowerCase();
  if (lang === "ar") {
    t = t
      .replace(ARABIC_DIACRITICS, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي");
  } else {
    t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
    t = t.replace(/[’']/g, "'");
  }
  return t
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string, lang: Lang): string[] {
  const n = normalize(text, lang);
  return n ? n.split(" ") : [];
}

export type WordResult = { word: string; ok: boolean };

export type PronunciationScore = {
  score: number; // 0 à 100
  words: WordResult[]; // mots de la phrase attendue, dans l'ordre
  extra: number; // mots prononcés en trop
};

function lcsMatches(a: string[], b: string[]): boolean[] {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const matched = new Array(a.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      matched[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return matched;
}

export function scorePronunciation(expected: string, heard: string, lang: Lang): PronunciationScore {
  const displayWords = expected.split(/\s+/).filter(Boolean);
  const target = displayWords.map((w) => normalize(w, lang));
  const spoken = tokenize(heard, lang);

  // On ignore les "mots" vides (ponctuation isolée).
  const indexes = target.map((w, i) => (w ? i : -1)).filter((i) => i >= 0);
  const compact = indexes.map((i) => target[i]);
  const matches = lcsMatches(compact, spoken);

  const okByIndex = new Map<number, boolean>();
  indexes.forEach((originalIndex, k) => okByIndex.set(originalIndex, matches[k]));

  const words = displayWords.map((word, i) => ({ word, ok: okByIndex.get(i) ?? true }));
  const matchedCount = matches.filter(Boolean).length;
  const extra = Math.max(0, spoken.length - matchedCount);
  const total = compact.length || 1;
  const raw = matchedCount / total - Math.min(0.2, extra * 0.05);
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)));

  return { score, words, extra };
}

export function scoreMessage(score: number): string {
  if (score >= 95) return "Parfait, on dirait un natif.";
  if (score >= 80) return "Très bien, presque tout est clair.";
  if (score >= 60) return "Pas mal. Réécoute les mots en rouge et recommence.";
  if (score >= 30) return "On y est presque. Écoute en vitesse lente puis répète.";
  return "Recommence : écoute d'abord la phrase en entier.";
}
