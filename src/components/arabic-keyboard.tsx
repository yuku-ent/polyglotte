"use client";

import { cx } from "./ui";

/** Disposition proche du clavier arabe standard, en trois rangées. */
const ROWS = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط", "ذ"],
  ["ئ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ", "أ", "إ", "آ"],
];

/** Clavier arabe à l'écran, pour taper sans clavier arabe installé. */
export function ArabicKeyboard({ onKey, onBackspace }: { onKey: (char: string) => void; onBackspace: () => void }) {
  const key = "h-10 min-w-9 flex-1 rounded-lg border border-stone-300 bg-white font-arabic text-xl shadow-sm transition hover:border-[var(--accent)] active:scale-95";
  return (
    <div className="mt-3 space-y-1.5 rounded-2xl bg-stone-100 p-2" dir="rtl" aria-label="Clavier arabe">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5">
          {row.map((c) => (
            <button key={c} type="button" className={key} onClick={() => onKey(c)}>
              {c}
            </button>
          ))}
        </div>
      ))}
      <div className="flex gap-1.5" dir="ltr">
        <button type="button" className={cx(key, "font-sans text-sm")} onClick={onBackspace} aria-label="Effacer">
          ⌫
        </button>
        <button type="button" className={cx(key, "flex-[5] font-sans text-sm")} onClick={() => onKey(" ")}>
          espace
        </button>
        <button type="button" className={cx(key, "font-arabic")} onClick={() => onKey("؟")}>
          ؟
        </button>
        <button type="button" className={cx(key, "font-arabic")} onClick={() => onKey("،")}>
          ،
        </button>
      </div>
    </div>
  );
}
