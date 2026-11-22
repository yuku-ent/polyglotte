import { test } from "node:test";
import assert from "node:assert/strict";
import { CURRICULUM, allLessons, findLesson, nextLessonId, unitsBelowLevel } from "../src/content/curriculum";
import { LANGS } from "../src/lib/languages";

test("chaque langue a un parcours avec des identifiants uniques", () => {
  const ids = new Set<string>();
  for (const lang of LANGS) {
    const lessons = allLessons(lang);
    assert.ok(lessons.length >= 20, `${lang} : ${lessons.length} leçons`);
    for (const l of lessons) {
      assert.ok(!ids.has(l.id), `doublon ${l.id}`);
      ids.add(l.id);
      assert.ok(l.title && l.goal && l.vocab && l.grammar, `plan incomplet : ${l.id}`);
    }
  }
});

test("chaque unité se termine par une révision", () => {
  for (const lang of LANGS) {
    for (const unit of CURRICULUM[lang]) {
      assert.equal(unit.lessons.at(-1)?.review, true, unit.id);
    }
  }
});

test("la leçon suivante est la première non terminée", () => {
  const lessons = allLessons("en");
  assert.equal(nextLessonId("en", new Set()), lessons[0].id);
  assert.equal(nextLessonId("en", new Set([lessons[0].id, lessons[1].id])), lessons[2].id);
  assert.equal(nextLessonId("en", new Set(lessons.map((l) => l.id))), null);
});

test("le placement saute les unités sous le niveau choisi", () => {
  assert.equal(unitsBelowLevel("en", "A1").length, 0);
  assert.ok(unitsBelowLevel("en", "A2").every((u) => u.level === "A1"));
  assert.ok(unitsBelowLevel("en", "B1").length >= 4);
});

test("findLesson retrouve la langue d'une leçon", () => {
  assert.equal(findLesson("ar-u0-l1")?.lang, "ar");
  assert.equal(findLesson("fr-u2-l2")?.lesson.title, "Le subjonctif");
  assert.equal(findLesson("xx"), null);
});
