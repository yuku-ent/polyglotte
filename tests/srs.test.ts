import { test } from "node:test";
import assert from "node:assert/strict";
import { formatInterval, mastery, schedule, type SrsState } from "../src/lib/srs";

const fresh: SrsState = { ease: 2.5, interval: 0, reps: 0, lapses: 0 };
const now = new Date("2026-01-10T12:00:00Z");
const DAY = 86_400_000;

test("une nouvelle carte notée « bien » revient le lendemain", () => {
  const r = schedule(fresh, 2, now);
  assert.equal(r.interval, 1);
  assert.equal(r.reps, 1);
  assert.equal(r.dueAt.getTime(), now.getTime() + DAY);
});

test("les intervalles grandissent : 1 j, 3 j, puis × facilité", () => {
  const a = schedule(fresh, 2, now);
  const b = schedule(a, 2, now);
  const c = schedule(b, 2, now);
  assert.equal(b.interval, 3);
  assert.equal(c.interval, Math.round(3 * 2.5));
});

test("« à revoir » remet la carte à zéro, compte un oubli et la ramène dans 10 min", () => {
  const learned: SrsState = { ease: 2.5, interval: 20, reps: 5, lapses: 0 };
  const r = schedule(learned, 0, now);
  assert.equal(r.reps, 0);
  assert.equal(r.interval, 0);
  assert.equal(r.lapses, 1);
  assert.equal(r.ease, 2.3);
  assert.equal(r.dueAt.getTime() - now.getTime(), 10 * 60 * 1000);
});

test("la facilité reste entre 1,3 et 3", () => {
  let state: SrsState = { ease: 1.35, interval: 5, reps: 3, lapses: 0 };
  state = schedule(state, 0, now);
  assert.equal(state.ease, 1.3);
  let easy: SrsState = { ease: 2.95, interval: 5, reps: 3, lapses: 0 };
  easy = schedule(easy, 3, now);
  assert.equal(easy.ease, 3);
});

test("« facile » va plus loin que « bien », qui va plus loin que « difficile »", () => {
  const s: SrsState = { ease: 2.5, interval: 10, reps: 4, lapses: 0 };
  const hard = schedule(s, 1, now).interval;
  const good = schedule(s, 2, now).interval;
  const easy = schedule(s, 3, now).interval;
  assert.ok(hard < good && good < easy, `${hard} < ${good} < ${easy}`);
});

test("l'intervalle est plafonné à un an", () => {
  const s: SrsState = { ease: 3, interval: 300, reps: 10, lapses: 0 };
  assert.equal(schedule(s, 3, now).interval, 365);
});

test("formatInterval et mastery", () => {
  assert.equal(formatInterval(schedule(fresh, 0, now), now), "10 min");
  assert.equal(formatInterval(schedule(fresh, 2, now), now), "1 j");
  assert.equal(mastery({ reps: 0, interval: 0 }), "nouveau");
  assert.equal(mastery({ reps: 2, interval: 1 }), "apprentissage");
  assert.equal(mastery({ reps: 3, interval: 7 }), "en cours");
  assert.equal(mastery({ reps: 6, interval: 30 }), "maîtrisé");
});
