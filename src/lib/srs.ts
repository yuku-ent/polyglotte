/**
 * Répétition espacée, variante de l'algorithme SM-2 (celui d'Anki / SuperMemo).
 * Fonctions pures : utilisables côté serveur et côté client (aperçu des intervalles).
 */

export const GRADES = [0, 1, 2, 3] as const;
export type Grade = (typeof GRADES)[number];

export const GRADE_LABELS: Record<Grade, string> = {
  0: "À revoir",
  1: "Difficile",
  2: "Bien",
  3: "Facile",
};

export type SrsState = {
  ease: number;
  interval: number; // jours
  reps: number;
  lapses: number;
};

export type SrsResult = SrsState & { dueAt: Date };

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DAY_MS = 24 * 60 * 60 * 1000;
const RELEARN_MS = 10 * 60 * 1000; // une carte ratée revient dans 10 minutes

export function isGrade(value: unknown): value is Grade {
  return typeof value === "number" && (GRADES as readonly number[]).includes(value);
}

function clampEase(ease: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, Math.round(ease * 100) / 100));
}

export function schedule(state: SrsState, grade: Grade, now: Date = new Date()): SrsResult {
  const { ease, interval, reps, lapses } = state;

  if (grade === 0) {
    return {
      ease: clampEase(ease - 0.2),
      interval: 0,
      reps: 0,
      lapses: lapses + 1,
      dueAt: new Date(now.getTime() + RELEARN_MS),
    };
  }

  let nextInterval: number;
  let nextEase = ease;

  if (grade === 1) {
    nextInterval = reps === 0 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2));
    nextEase = ease - 0.15;
  } else if (grade === 2) {
    if (reps === 0) nextInterval = 1;
    else if (reps === 1) nextInterval = 3;
    else nextInterval = Math.max(interval + 1, Math.round(interval * ease));
  } else {
    nextInterval = reps === 0 ? 4 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
    nextEase = ease + 0.15;
  }

  nextInterval = Math.min(nextInterval, 365);

  return {
    ease: clampEase(nextEase),
    interval: nextInterval,
    reps: reps + 1,
    lapses,
    dueAt: new Date(now.getTime() + nextInterval * DAY_MS),
  };
}

/** Texte court pour afficher le prochain intervalle sur un bouton. */
export function formatInterval(result: SrsResult, now: Date = new Date()): string {
  const ms = result.dueAt.getTime() - now.getTime();
  if (ms < 60 * 60 * 1000) return `${Math.max(1, Math.round(ms / 60000))} min`;
  const days = Math.round(ms / DAY_MS);
  if (days < 30) return `${days} j`;
  if (days < 365) return `${Math.round(days / 30)} mois`;
  return "1 an";
}

export type Mastery = "nouveau" | "apprentissage" | "en cours" | "maîtrisé";

export function mastery(state: Pick<SrsState, "reps" | "interval">): Mastery {
  if (state.reps === 0) return "nouveau";
  if (state.interval < 3) return "apprentissage";
  if (state.interval < 21) return "en cours";
  return "maîtrisé";
}
