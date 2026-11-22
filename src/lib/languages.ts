export const LANGS = ["en", "es", "ar", "fr"] as const;
export type Lang = (typeof LANGS)[number];

export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];

export type Variety = {
  id: string;
  label: string;
  /** Code BCP-47 pour la synthèse et la reconnaissance vocale du navigateur. */
  speechCode: string;
  /** Description donnée au modèle IA. */
  promptName: string;
};

export type LanguageInfo = {
  id: Lang;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  varieties: Variety[];
};

export const LANGUAGES: Record<Lang, LanguageInfo> = {
  en: {
    id: "en",
    name: "Anglais",
    nativeName: "English",
    dir: "ltr",
    varieties: [
      { id: "us", label: "Américain", speechCode: "en-US", promptName: "anglais américain" },
      { id: "uk", label: "Britannique", speechCode: "en-GB", promptName: "anglais britannique" },
    ],
  },
  es: {
    id: "es",
    name: "Espagnol",
    nativeName: "Español",
    dir: "ltr",
    varieties: [
      { id: "es", label: "Espagne", speechCode: "es-ES", promptName: "espagnol d'Espagne" },
      {
        id: "latam",
        label: "Amérique latine",
        speechCode: "es-MX",
        promptName: "espagnol d'Amérique latine",
      },
    ],
  },
  fr: {
    id: "fr",
    name: "Français",
    nativeName: "Français",
    dir: "ltr",
    varieties: [
      {
        id: "standard",
        label: "Français standard",
        speechCode: "fr-FR",
        promptName: "français standard (perfectionnement pour un francophone)",
      },
    ],
  },
  ar: {
    id: "ar",
    name: "Arabe",
    nativeName: "العربية",
    dir: "rtl",
    varieties: [
      {
        id: "msa",
        label: "Standard (fusha)",
        speechCode: "ar-SA",
        promptName: "arabe standard moderne (fusha)",
      },
      {
        id: "darija",
        label: "Marocain (darija)",
        speechCode: "ar-MA",
        promptName: "arabe dialectal marocain (darija), écrit en caractères arabes",
      },
      {
        id: "egy",
        label: "Égyptien",
        speechCode: "ar-EG",
        promptName: "arabe dialectal égyptien, écrit en caractères arabes",
      },
      {
        id: "levant",
        label: "Levantin",
        speechCode: "ar-LB",
        promptName: "arabe dialectal levantin (Liban, Syrie, Jordanie), écrit en caractères arabes",
      },
    ],
  },
};

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  A1: "Débutant : phrases très courtes, mots du quotidien, présent uniquement.",
  A2: "Élémentaire : phrases simples, passé et futur proches, sujets familiers.",
  B1: "Intermédiaire : raconter, donner son avis, phrases reliées.",
  B2: "Intermédiaire avancé : nuances, arguments, vocabulaire plus riche.",
  C1: "Avancé : langue naturelle et idiomatique, sujets complexes.",
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

export function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}

export function getVariety(lang: Lang, varietyId?: string | null): Variety {
  const list = LANGUAGES[lang].varieties;
  return list.find((v) => v.id === varietyId) ?? list[0];
}

export function defaultVariety(lang: Lang): string {
  return LANGUAGES[lang].varieties[0].id;
}

/** Le français est étudié en perfectionnement : pas de traduction, mais des reformulations. */
export function isImprovement(lang: Lang): boolean {
  return lang === "fr";
}

/** Libellé de la colonne « traduction » selon la langue. */
export function meaningLabel(lang: Lang): string {
  return isImprovement(lang) ? "Sens" : "Traduction";
}

export const LANG_CODES: Record<Lang, string> = { en: "en", es: "es", ar: "ar", fr: "fr" };
