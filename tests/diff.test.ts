import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDictation, chunks, hint } from "../src/lib/diff";

test("dictée parfaite : 100 %, ponctuation et majuscules ignorées", () => {
  const r = checkDictation("Je vous remercie pour votre retour.", "je vous remercie pour votre retour", "fr");
  assert.equal(r.score, 100);
  assert.ok(r.tokens.every((t) => t.kind === "ok"));
});

test("une faute d'accent compte pour une demi-faute", () => {
  const r = checkDictation("Il était déjà là", "Il etait déjà là", "fr");
  assert.equal(r.counts.accent, 1);
  assert.equal(r.score, Math.round((1 - 0.5 / 4) * 100));
  assert.deepEqual(r.mistakes, ["était"]);
});

test("mot faux, mot oublié et mot en trop sont détectés", () => {
  const r = checkDictation("I want to learn English", "I want learn the Englsh", "en");
  assert.equal(r.counts.missing, 1);
  assert.equal(r.counts.extra, 1);
  assert.equal(r.counts.wrong, 1);
  assert.ok(r.mistakes.includes("to") && r.mistakes.includes("English"));
});

test("arabe : voyelles courtes ignorées", () => {
  const r = checkDictation("أَتَعَلَّمُ العربية", "اتعلم العربية", "ar");
  assert.equal(r.score, 100);
});

test("rien tapé : 0 %", () => {
  assert.equal(checkDictation("Hola amigo", "", "es").score, 0);
});

test("indice et découpage", () => {
  assert.equal(hint("Hola amigo"), "H··· a····");
  assert.deepEqual(chunks("Le chat dort"), ["Le chat dort"]);
  assert.deepEqual(chunks("un deux trois quatre cinq six sept huit neuf"), ["un deux trois quatre", "cinq six sept huit neuf"]);
});
