import { test } from "node:test";
import assert from "node:assert/strict";
import { TEXT_BANK, pickBankText } from "../src/content/texts";
import { LANGS } from "../src/lib/languages";

test("chaque langue a des textes de dictée et de recopie différents", () => {
  for (const lang of LANGS) {
    const { dictation, copy } = TEXT_BANK[lang];
    assert.ok(dictation.length >= 3 && copy.length >= 3, lang);
    const dictationTexts = new Set(dictation.flatMap((t) => t.sentences.map((s) => s.text)));
    for (const t of copy) for (const s of t.sentences) assert.ok(!dictationTexts.has(s.text), `${lang} : phrase en double`);
  }
});

test("textes assez longs, identifiants uniques, translittération pour l'arabe", () => {
  const ids = new Set<string>();
  for (const lang of LANGS) {
    for (const t of [...TEXT_BANK[lang].dictation, ...TEXT_BANK[lang].copy]) {
      assert.ok(!ids.has(t.id), t.id);
      ids.add(t.id);
      assert.ok(t.sentences.length >= 5, `${t.id} trop court`);
      if (lang === "ar") assert.ok(t.sentences.every((s) => s.translit), `${t.id} sans translittération`);
    }
  }
});

test("le tirage renvoie un texte de la bonne réserve", () => {
  const t = pickBankText("es", "copy");
  assert.ok(TEXT_BANK.es.copy.some((c) => c.id === t.id));
});
