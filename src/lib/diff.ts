/**
 * Correction de dictée : aligne la phrase attendue et la phrase tapée mot à mot
 * (distance d'édition), en distinguant les vraies fautes des simples accents.
 * Fonctions pures, utilisables côté navigateur.
 */
import type { Lang } from "./languages";
import { normalize } from "./scoring";

export type DiffKind = "ok" | "accent" | "wrong" | "missing" | "extra";
export type DiffToken = { kind: DiffKind; expected?: string; typed?: string };

export type DictationResult = {
  tokens: DiffToken[];
  score: number; // 0 à 100
  counts: Record<Exclude<DiffKind, "ok">, number>;
  /** Mots de la phrase attendue mal écrits ou oubliés (pour les réviser). */
  mistakes: string[];
};

const ARABIC_DIACRITICS = /[ً-ٰٟـ]/g;

/** Comparaison stricte : on garde les accents, on ignore la casse et la ponctuation. */
function strict(word: string, lang: Lang): string {
  // Arabe : voyelles courtes et formes de hamza ne comptent pas (difficiles à taper).
  if (lang === "ar") return loose(word.replace(ARABIC_DIACRITICS, ""), lang);
  return word
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}']/gu, "");
}

/** Comparaison souple : sans accents (et formes d'alif unifiées pour l'arabe). */
function loose(word: string, lang: Lang): string {
  return normalize(word, lang).replace(/\s+/g, "");
}

function words(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w && /[\p{L}\p{N}]/u.test(w));
}

export function checkDictation(expected: string, typed: string, lang: Lang): DictationResult {
  const a = words(expected);
  const b = words(typed);
  const n = a.length;
  const m = b.length;

  const sub = (i: number, j: number) => {
    if (strict(a[i], lang) === strict(b[j], lang)) return 0;
    if (loose(a[i], lang) === loose(b[j], lang)) return 0.4; // faute d'accent
    return 1.01; // légèrement plus cher : en cas d'égalité, on préfère « oublié + en trop » bien placés
  };

  // Distance d'édition mot à mot.
  const dp: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = Math.min(dp[i - 1][j - 1] + sub(i - 1, j - 1), dp[i - 1][j] + 1, dp[i][j - 1] + 1);
    }
  }

  // Remontée pour reconstruire l'alignement.
  const tokens: DiffToken[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + sub(i - 1, j - 1)) {
      const cost = sub(i - 1, j - 1);
      tokens.push({ kind: cost === 0 ? "ok" : cost < 1 ? "accent" : "wrong", expected: a[i - 1], typed: b[j - 1] });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      tokens.push({ kind: "missing", expected: a[i - 1] });
      i--;
    } else {
      tokens.push({ kind: "extra", typed: b[j - 1] });
      j--;
    }
  }
  tokens.reverse();

  const counts = { accent: 0, wrong: 0, missing: 0, extra: 0 };
  for (const t of tokens) if (t.kind !== "ok") counts[t.kind]++;
  const penalty = counts.wrong + counts.missing + counts.extra + counts.accent * 0.5;
  const score = n ? Math.max(0, Math.round((1 - penalty / n) * 100)) : 0;
  const mistakes = tokens
    .filter((t) => t.expected && (t.kind === "wrong" || t.kind === "missing" || t.kind === "accent"))
    .map((t) => t.expected!.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""));

  return { tokens, score, counts, mistakes };
}

/** Indice : les premières lettres de chaque mot, le reste masqué. */
export function hint(expected: string, letters = 1): string {
  return words(expected)
    .map((w) => {
      const chars = [...w];
      return chars.map((c, k) => (k < letters || !/\p{L}/u.test(c) ? c : "·")).join("");
    })
    .join(" ");
}

/** Découpe une phrase longue en morceaux de quelques mots pour l'écoute. */
export function chunks(sentence: string, size = 4): string[] {
  const list = sentence.split(/\s+/).filter(Boolean);
  if (list.length <= size + 2) return [sentence];
  const out: string[] = [];
  for (let k = 0; k < list.length; k += size) {
    const part = list.slice(k, k + size);
    // Évite un dernier morceau d'un seul mot.
    if (list.length - (k + size) === 1) {
      out.push([...part, list[k + size]].join(" "));
      break;
    }
    out.push(part.join(" "));
  }
  return out;
}
