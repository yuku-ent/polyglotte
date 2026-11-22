/** Analyse des plateformes existantes : ce que Polyglotte garde et ce qu'il corrige. */

export type PlatformReview = {
  name: string;
  kind: string;
  strengths: string[];
  weaknesses: string[];
  inPolyglotte: string;
};

export const PLATFORMS: PlatformReview[] = [
  {
    name: "Duolingo",
    kind: "Leçons ludiques",
    strengths: ["Gratuit et très motivant", "Séries (streaks), XP et objectif quotidien", "Sessions courtes"],
    weaknesses: [
      "Phrases artificielles, peu d'oral réel",
      "On plafonne vite au niveau intermédiaire",
      "Arabe limité",
    ],
    inPolyglotte: "Série, XP, objectif du jour et missions quotidiennes, mais avec du vrai contenu.",
  },
  {
    name: "Babbel",
    kind: "Cours structurés",
    strengths: ["Grammaire expliquée", "Dialogues réalistes", "Progression claire"],
    weaknesses: ["Payant", "Peu de conversation libre", "Contenu identique pour tout le monde"],
    inPolyglotte: "Niveaux A1 à C1 et explications de grammaire en français à chaque correction.",
  },
  {
    name: "Anki",
    kind: "Cartes mémoire",
    strengths: ["Répétition espacée très efficace", "Mémorisation à long terme"],
    weaknesses: ["Austère", "Il faut créer ses cartes soi-même", "Aucun oral"],
    inPolyglotte:
      "Algorithme SM-2, paquets de départ prêts, ajout en un clic depuis les histoires, audio sur chaque carte.",
  },
  {
    name: "italki / Preply",
    kind: "Tuteurs humains",
    strengths: ["Vrais natifs", "Conversation authentique", "Corrections personnalisées"],
    weaknesses: ["Payant à l'heure", "Horaires à caler", "Intimidant pour un débutant"],
    inPolyglotte:
      "Tuteur IA disponible 24 h/24, en jeux de rôle, qui corrige chaque phrase. Un vrai tuteur 1 fois par semaine reste un plus.",
  },
  {
    name: "Pimsleur",
    kind: "Audio",
    strengths: ["Prononciation", "Apprendre en marchant ou en conduisant"],
    weaknesses: ["Cher", "Lent", "Peu de lecture et d'écriture"],
    inPolyglotte: "Exercice « Répéter » : écoute normale ou lente, puis note de prononciation mot par mot.",
  },
  {
    name: "LingQ / Lingopie",
    kind: "Contenu authentique",
    strengths: ["Beaucoup de lecture et d'écoute", "Vocabulaire riche en contexte"],
    weaknesses: ["Trop difficile pour débuter", "Apprentissage passif", "Peu d'oral"],
    inPolyglotte:
      "Histoires générées à ton niveau, sur les sujets qui t'intéressent, avec audio, traduction phrase par phrase et quiz.",
  },
  {
    name: "Speak / Talkpal / IA vocale",
    kind: "Conversation IA",
    strengths: ["Pratique orale illimitée", "Sans stress"],
    weaknesses: ["Pas de programme", "Corrections parfois superficielles", "Pas de suivi"],
    inPolyglotte:
      "Conversation reliée au reste : niveau, série, mots à réviser, historique de tes erreurs.",
  },
  {
    name: "HelloTalk / Tandem",
    kind: "Échange linguistique",
    strengths: ["Gratuit", "Natifs du monde entier", "Écrit et vocal"],
    weaknesses: ["Irrégulier", "Dépend des partenaires", "Corrections rares et non expliquées"],
    inPolyglotte: "Journal d'écriture corrigé systématiquement : erreurs, explications et version naturelle.",
  },
];

export const POLYGLOTTE_PRINCIPLES = [
  {
    title: "Une seule appli, toutes les compétences",
    text: "Vocabulaire, compréhension, oral et écrit au même endroit, avec une seule progression.",
  },
  {
    title: "Ton niveau, tes sujets",
    text: "Tout le contenu IA s'adapte à ton niveau (A1 à C1) et aux sujets que tu choisis : business, immobilier, voyage…",
  },
  {
    title: "Parler dès le premier jour",
    text: "Micro dans la conversation, la répétition et l'écriture. Les corrections sont expliquées en français.",
  },
  {
    title: "L'arabe pris au sérieux",
    text: "Alphabet interactif, translittération partout, et choix entre l'arabe standard et trois dialectes.",
  },
  {
    title: "La régularité avant tout",
    text: "Objectif quotidien, série et missions du jour : 20 minutes par jour valent mieux que 3 heures le dimanche.",
  },
];
