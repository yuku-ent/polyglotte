export type ArabicLetter = {
  letter: string;
  name: string;
  translit: string;
  sound: string; // indication pour un francophone
  connects: boolean; // false : ne s'attache pas à la lettre suivante
  example: { word: string; translit: string; meaning: string };
};

export const ARABIC_ALPHABET: ArabicLetter[] = [
  { letter: "ا", name: "alif", translit: "ā", sound: "« a » long, ou support de la hamza", connects: false, example: { word: "أب", translit: "ab", meaning: "père" } },
  { letter: "ب", name: "bāʾ", translit: "b", sound: "« b » comme en français", connects: true, example: { word: "باب", translit: "bāb", meaning: "porte" } },
  { letter: "ت", name: "tāʾ", translit: "t", sound: "« t » comme en français", connects: true, example: { word: "تمر", translit: "tamr", meaning: "dattes" } },
  { letter: "ث", name: "thāʾ", translit: "th", sound: "« th » de l'anglais think", connects: true, example: { word: "ثلاثة", translit: "thalātha", meaning: "trois" } },
  { letter: "ج", name: "jīm", translit: "j", sound: "« dj » (ou « j » selon les régions)", connects: true, example: { word: "جمل", translit: "jamal", meaning: "chameau" } },
  { letter: "ح", name: "ḥāʾ", translit: "ḥ", sound: "« h » soufflé fort du fond de la gorge", connects: true, example: { word: "حب", translit: "ḥubb", meaning: "amour" } },
  { letter: "خ", name: "khāʾ", translit: "kh", sound: "raclé, comme la jota espagnole", connects: true, example: { word: "خبز", translit: "khubz", meaning: "pain" } },
  { letter: "د", name: "dāl", translit: "d", sound: "« d » comme en français", connects: false, example: { word: "دار", translit: "dār", meaning: "maison" } },
  { letter: "ذ", name: "dhāl", translit: "dh", sound: "« th » de l'anglais this", connects: false, example: { word: "ذهب", translit: "dhahab", meaning: "or" } },
  { letter: "ر", name: "rāʾ", translit: "r", sound: "« r » roulé", connects: false, example: { word: "رجل", translit: "rajul", meaning: "homme" } },
  { letter: "ز", name: "zāy", translit: "z", sound: "« z » comme en français", connects: false, example: { word: "زيت", translit: "zayt", meaning: "huile" } },
  { letter: "س", name: "sīn", translit: "s", sound: "« s » comme en français", connects: true, example: { word: "سمك", translit: "samak", meaning: "poisson" } },
  { letter: "ش", name: "shīn", translit: "sh", sound: "« ch » comme dans chat", connects: true, example: { word: "شمس", translit: "shams", meaning: "soleil" } },
  { letter: "ص", name: "ṣād", translit: "ṣ", sound: "« s » emphatique, langue basse et lourde", connects: true, example: { word: "صبر", translit: "ṣabr", meaning: "patience" } },
  { letter: "ض", name: "ḍād", translit: "ḍ", sound: "« d » emphatique", connects: true, example: { word: "ضوء", translit: "ḍawʾ", meaning: "lumière" } },
  { letter: "ط", name: "ṭāʾ", translit: "ṭ", sound: "« t » emphatique", connects: true, example: { word: "طريق", translit: "ṭarīq", meaning: "route" } },
  { letter: "ظ", name: "ẓāʾ", translit: "ẓ", sound: "« dh » emphatique", connects: true, example: { word: "ظهر", translit: "ẓuhr", meaning: "midi" } },
  { letter: "ع", name: "ʿayn", translit: "ʿ", sound: "son serré du milieu de la gorge, sans équivalent", connects: true, example: { word: "عين", translit: "ʿayn", meaning: "œil" } },
  { letter: "غ", name: "ghayn", translit: "gh", sound: "« r » grasseyé à la française", connects: true, example: { word: "غرفة", translit: "ghurfa", meaning: "chambre" } },
  { letter: "ف", name: "fāʾ", translit: "f", sound: "« f » comme en français", connects: true, example: { word: "فيل", translit: "fīl", meaning: "éléphant" } },
  { letter: "ق", name: "qāf", translit: "q", sound: "« k » prononcé tout au fond de la gorge", connects: true, example: { word: "قلم", translit: "qalam", meaning: "stylo" } },
  { letter: "ك", name: "kāf", translit: "k", sound: "« k » comme en français", connects: true, example: { word: "كتاب", translit: "kitāb", meaning: "livre" } },
  { letter: "ل", name: "lām", translit: "l", sound: "« l » comme en français", connects: true, example: { word: "ليل", translit: "layl", meaning: "nuit" } },
  { letter: "م", name: "mīm", translit: "m", sound: "« m » comme en français", connects: true, example: { word: "ماء", translit: "māʾ", meaning: "eau" } },
  { letter: "ن", name: "nūn", translit: "n", sound: "« n » comme en français", connects: true, example: { word: "نور", translit: "nūr", meaning: "lumière" } },
  { letter: "ه", name: "hāʾ", translit: "h", sound: "« h » aspiré léger, comme en anglais", connects: true, example: { word: "هدية", translit: "hadiyya", meaning: "cadeau" } },
  { letter: "و", name: "wāw", translit: "w / ū", sound: "« w » ou « ou » long", connects: false, example: { word: "ولد", translit: "walad", meaning: "garçon" } },
  { letter: "ي", name: "yāʾ", translit: "y / ī", sound: "« y » ou « i » long", connects: true, example: { word: "يد", translit: "yad", meaning: "main" } },
];

const TATWEEL = "ـ";

/** Les quatre formes d'une lettre, rendues par la ligature du navigateur. */
export function letterForms(l: ArabicLetter) {
  return {
    isolee: l.letter,
    initiale: l.connects ? l.letter + TATWEEL : l.letter,
    mediane: l.connects ? TATWEEL + l.letter + TATWEEL : TATWEEL + l.letter,
    finale: TATWEEL + l.letter,
  };
}

export const HARAKAT = [
  { mark: "بَ", name: "fatḥa", sound: "« a » court" },
  { mark: "بِ", name: "kasra", sound: "« i » court" },
  { mark: "بُ", name: "ḍamma", sound: "« ou » court" },
  { mark: "بْ", name: "sukūn", sound: "pas de voyelle" },
  { mark: "بّ", name: "shadda", sound: "consonne doublée" },
  { mark: "بً", name: "tanwīn", sound: "« an » final" },
];
