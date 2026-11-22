/** Clé de jour "YYYY-MM-DD" dans le fuseau local de la machine. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Nouvelle série après une activité aujourd'hui.
 * Même jour : inchangée. Lendemain du dernier jour actif : +1. Sinon : on repart à 1.
 */
export function nextStreak(lastActiveDay: string | null, today: string, streak: number): number {
  if (lastActiveDay === today) return Math.max(1, streak);
  if (lastActiveDay && addDays(lastActiveDay, 1) === today) return streak + 1;
  return 1;
}

/** Série à afficher : elle tombe à 0 si on a sauté plus d'un jour. */
export function displayedStreak(lastActiveDay: string | null, today: string, streak: number): number {
  if (!lastActiveDay) return 0;
  if (lastActiveDay === today || addDays(lastActiveDay, 1) === today) return streak;
  return 0;
}

export function lastNDays(n: number, today: string = dayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}
