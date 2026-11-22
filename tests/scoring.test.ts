import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, scorePronunciation } from "../src/lib/scoring";

test("phrase identique : 100 %", () => {
  const r = scorePronunciation("Nice to meet you.", "nice to meet you", "en");
  assert.equal(r.score, 100);
  assert.ok(r.words.every((w) => w.ok));
});

test("un mot manquant est signalé", () => {
  const r = scorePronunciation("How much is the rent per month?", "how much is rent per month", "en");
  assert.equal(r.words.find((w) => w.word === "the")?.ok, false);
  assert.ok(r.score >= 80 && r.score < 100, String(r.score));
});

test("accents et ponctuation espagnols ignorés", () => {
  assert.equal(normalize("¿Cuánto cuesta?", "es"), "cuanto cuesta");
  assert.equal(scorePronunciation("¿Qué me recomiendas?", "que me recomiendas", "es").score, 100);
});

test("arabe : voyelles courtes et formes de alif normalisées", () => {
  assert.equal(normalize("أَتَعَلَّمُ", "ar"), normalize("اتعلم", "ar"));
  const r = scorePronunciation("أتعلم العربية كل يوم", "اتعلم العربيه كل يوم", "ar");
  assert.equal(r.score, 100);
});

test("rien entendu : 0 %", () => {
  assert.equal(scorePronunciation("Mucho gusto.", "", "es").score, 0);
});

test("des mots en trop baissent un peu la note", () => {
  const r = scorePronunciation("Mucho gusto", "mucho mucho gusto señor", "es");
  assert.ok(r.score < 100 && r.score >= 80, String(r.score));
});
