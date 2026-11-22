import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, displayedStreak, lastNDays, nextStreak } from "../src/lib/dates";

test("addDays gère les fins de mois et d'année", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("la série augmente le lendemain, reste le même jour, repart sinon", () => {
  assert.equal(nextStreak(null, "2026-05-10", 0), 1);
  assert.equal(nextStreak("2026-05-10", "2026-05-10", 4), 4);
  assert.equal(nextStreak("2026-05-09", "2026-05-10", 4), 5);
  assert.equal(nextStreak("2026-05-07", "2026-05-10", 4), 1);
});

test("la série affichée tombe à 0 après un jour manqué", () => {
  assert.equal(displayedStreak("2026-05-09", "2026-05-10", 3), 3);
  assert.equal(displayedStreak("2026-05-08", "2026-05-10", 3), 0);
});

test("lastNDays renvoie les jours dans l'ordre", () => {
  assert.deepEqual(lastNDays(3, "2026-05-02"), ["2026-04-30", "2026-05-01", "2026-05-02"]);
});
