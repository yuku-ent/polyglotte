export type Scenario = {
  id: string;
  title: string;
  description: string;
  /** Rôle joué par le tuteur, transmis au modèle. */
  tutorRole: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "libre",
    title: "Discussion libre",
    description: "On parle de tout : ta journée, tes projets, tes passions.",
    tutorRole: "un ami bienveillant qui discute de tout et pose des questions sur la vie de l'élève",
  },
  {
    id: "presentation",
    title: "Se présenter",
    description: "Ton nom, d'où tu viens, ce que tu fais.",
    tutorRole: "une personne rencontrée lors d'un événement, curieuse de connaître l'élève",
  },
  {
    id: "restaurant",
    title: "Au restaurant",
    description: "Commander, demander l'addition, poser des questions.",
    tutorRole: "un serveur de restaurant",
  },
  {
    id: "appartement",
    title: "Visiter un appartement",
    description: "Poser les bonnes questions au propriétaire, négocier le loyer.",
    tutorRole: "un propriétaire qui fait visiter un appartement à louer",
  },
  {
    id: "negociation",
    title: "Négocier une affaire",
    description: "Prix, conditions, délais : défends ton offre.",
    tutorRole: "un fournisseur ou partenaire commercial exigeant mais correct",
  },
  {
    id: "pitch",
    title: "Pitcher ton projet",
    description: "Présente ton entreprise à un investisseur.",
    tutorRole: "un investisseur qui écoute un pitch et pose des questions précises",
  },
  {
    id: "voyage",
    title: "En voyage",
    description: "Aéroport, hôtel, demander son chemin.",
    tutorRole: "un réceptionniste d'hôtel puis un passant qui aide un voyageur",
  },
  {
    id: "entretien",
    title: "Entretien d'embauche",
    description: "Parle de ton parcours et de tes compétences.",
    tutorRole: "un recruteur qui mène un entretien d'embauche",
  },
];

export function getScenario(id: string): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}

export const STORY_TOPICS = [
  "Vie quotidienne",
  "Business et entrepreneuriat",
  "Immobilier",
  "Voyage",
  "Technologie",
  "Football",
  "Culture et histoire",
  "Cuisine",
];

export const WRITING_PROMPTS = [
  "Présente-toi : qui es-tu, que fais-tu, qu'est-ce que tu aimes ?",
  "Raconte ta journée d'hier.",
  "Explique ton projet d'entreprise à un client.",
  "Décris l'appartement ou la maison de tes rêves.",
  "Écris un message à un partenaire pour fixer une réunion.",
  "Qu'est-ce que tu veux avoir accompli dans un an ?",
  "Raconte un voyage que tu as fait ou que tu veux faire.",
  "Donne ton avis : vaut-il mieux louer ou acheter son logement ?",
];
