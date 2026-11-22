/**
 * Le parcours : le fil directeur des cours.
 * Chaque leçon a un objectif, un thème de vocabulaire et un point de grammaire précis.
 * Le contenu détaillé (mots, explications, exercices) est généré par l'IA à partir
 * de ce plan, une seule fois, puis réutilisé.
 */
import { LEVELS, type Lang, type Level } from "@/lib/languages";

export type LessonPlan = {
  id: string;
  title: string;
  goal: string; // ce que l'élève saura faire à la fin
  vocab: string; // thème de vocabulaire
  grammar: string; // point de grammaire ou de méthode
  review?: boolean; // leçon de révision de l'unité
};

export type Unit = {
  id: string;
  title: string;
  level: Level;
  description: string;
  lessons: LessonPlan[];
};

type RawLesson = [title: string, goal: string, vocab: string, grammar: string];

function unit(
  lang: Lang,
  n: number,
  title: string,
  level: Level,
  description: string,
  lessons: RawLesson[],
  withReview = true,
): Unit {
  const id = `${lang}-u${n}`;
  const plans: LessonPlan[] = lessons.map(([t, goal, vocab, grammar], i) => ({
    id: `${id}-l${i + 1}`,
    title: t,
    goal,
    vocab,
    grammar,
  }));
  if (withReview) {
    plans.push({
      id: `${id}-r`,
      title: "Révision de l'unité",
      goal: `Réutiliser tout ce qui a été vu dans « ${title} » dans des situations nouvelles.`,
      vocab: lessons.map((l) => l[2]).join(" ; "),
      grammar: lessons.map((l) => l[3]).join(" ; "),
      review: true,
    });
  }
  return { id, title, level, description, lessons: plans };
}

/* -------------------------------------------------------------------------- */
/* Anglais                                                                    */
/* -------------------------------------------------------------------------- */

const EN: Unit[] = [
  unit("en", 1, "Premiers pas", "A1", "Saluer, se présenter, compter, parler de sa famille.", [
    ["Saluer et se présenter", "Dire bonjour, donner son prénom et demander celui de l'autre.", "salutations, prénom, enchanté, au revoir", "le verbe « to be » au présent (I am, you are, he/she is)"],
    ["D'où viens-tu ?", "Dire d'où l'on vient et poser la question.", "pays, nationalités, villes", "questions et négation avec « to be » (Where are you from? I'm not…)"],
    ["Les nombres et l'âge", "Compter jusqu'à 100, donner son âge et son numéro.", "nombres 0 à 100, âge, téléphone", "How old…? / How many…?"],
    ["La famille", "Présenter les membres de sa famille.", "famille : parents, frères, sœurs, enfants", "les possessifs (my, your, his, her) et le « 's »"],
  ]),
  unit("en", 2, "Le quotidien", "A1", "Raconter sa journée, l'heure, la nourriture, la ville.", [
    ["Ma journée", "Décrire sa routine du matin au soir.", "verbes du quotidien : se lever, travailler, manger, dormir", "le présent simple (I work, you work, we work)"],
    ["L'heure et les jours", "Dire l'heure et parler de son emploi du temps.", "heures, jours de la semaine, moments de la journée", "What time…? et les prépositions at / on / in"],
    ["Manger et boire", "Commander et dire ce qu'on aime.", "aliments, boissons, repas", "like / don't like, a / an / some"],
    ["En ville", "Décrire sa ville et demander où se trouve un lieu.", "lieux : banque, marché, gare, pharmacie", "there is / there are et les prépositions de lieu"],
  ]),
  unit("en", 3, "Parler de soi", "A1", "Métiers, loisirs, achats et logement.", [
    ["Les métiers", "Dire ce que l'on fait et ce que font les autres.", "métiers et lieux de travail", "le présent simple à la 3ᵉ personne (he works, she doesn't)"],
    ["Les loisirs", "Parler de ses passions et de ce qu'on sait faire.", "sports, musique, loisirs", "can / can't et les adverbes de fréquence (always, often, never)"],
    ["Faire des achats", "Demander un prix et choisir un article.", "vêtements, couleurs, prix", "How much…? et this / that / these / those"],
    ["Mon logement", "Décrire sa maison ou son appartement.", "pièces, meubles, équipements", "have got / has got"],
  ]),
  unit("en", 4, "Raconter", "A2", "Parler du passé, de ses projets et comparer.", [
    ["Hier", "Raconter ce qu'on a fait hier.", "activités passées, marqueurs de temps (yesterday, last week)", "le prétérit des verbes réguliers (-ed)"],
    ["Week-end et voyages", "Raconter un voyage ou un week-end.", "voyage, transport, hébergement", "le prétérit des verbes irréguliers (went, saw, had)"],
    ["Mes projets", "Parler de ses intentions et de ses projets.", "projets, objectifs, futur proche", "be going to + verbe"],
    ["Comparer", "Comparer des lieux, des prix, des options.", "adjectifs : cher, grand, rapide, sûr", "le comparatif et le superlatif"],
  ]),
  unit("en", 5, "Le monde professionnel", "A2", "Travail, e-mails, rendez-vous, négociation et immobilier.", [
    ["Se présenter au travail", "Présenter son poste et son entreprise.", "entreprise, poste, missions", "le présent continu (I'm working on…)"],
    ["Écrire un e-mail pro", "Écrire un e-mail clair et poli.", "formules d'e-mail, pièces jointes, relances", "les demandes polies : could / would / I'd like"],
    ["Réunions et rendez-vous", "Fixer, déplacer et confirmer un rendez-vous.", "agenda, disponibilités, réunion", "will et be going to pour le futur"],
    ["Négocier", "Faire une offre et discuter un prix.", "offre, remise, délai, contrat", "le conditionnel de type 1 (If you…, I will…)"],
    ["Visiter un bien immobilier", "Poser les bonnes questions lors d'une visite.", "loyer, charges, bail, propriétaire, quartier", "les questions ouvertes (How long, How far, Is there…)"],
  ]),
  unit("en", 6, "Aller plus loin", "B1", "Expériences, opinions, récits et hypothèses.", [
    ["Mon expérience", "Parler de son parcours et de ses expériences.", "expérience, réussite, échec", "le present perfect (I have worked, have you ever…?)"],
    ["Donner son avis", "Exprimer et nuancer une opinion.", "opinions, accord, désaccord", "les connecteurs : however, although, because of"],
    ["Raconter une histoire", "Raconter un événement passé de façon vivante.", "récit, émotions, rebondissements", "prétérit simple et prétérit continu (I was walking when…)"],
    ["Et si… ?", "Imaginer des situations et leurs conséquences.", "rêves, projets, hypothèses", "le conditionnel de type 2 (If I had…, I would…)"],
  ]),
];

/* -------------------------------------------------------------------------- */
/* Espagnol                                                                   */
/* -------------------------------------------------------------------------- */

const ES: Unit[] = [
  unit("es", 1, "Premiers pas", "A1", "Saluer, se présenter, compter, parler de sa famille.", [
    ["Saluer et se présenter", "Dire bonjour, donner son prénom et demander celui de l'autre.", "salutations, prénom, enchanté, au revoir", "le verbe « ser » au présent et « llamarse »"],
    ["D'où viens-tu ?", "Dire d'où l'on vient et poser la question.", "pays, nationalités, villes", "¿De dónde eres? et le genre des adjectifs de nationalité"],
    ["Les nombres et l'âge", "Compter jusqu'à 100, donner son âge et son numéro.", "nombres 0 à 100, âge, téléphone", "le verbe « tener » (tengo 25 años)"],
    ["La famille", "Présenter les membres de sa famille.", "famille : padres, hermanos, hijos", "les possessifs (mi, tu, su) et le masculin / féminin"],
  ]),
  unit("es", 2, "Le quotidien", "A1", "Raconter sa journée, l'heure, la nourriture, la ville.", [
    ["Ma journée", "Décrire sa routine.", "verbes du quotidien", "le présent des verbes réguliers en -ar, -er, -ir et les verbes pronominaux (me levanto)"],
    ["L'heure et les jours", "Dire l'heure et parler de son emploi du temps.", "heures, jours, moments de la journée", "¿Qué hora es? / ¿A qué hora…?"],
    ["Manger et boire", "Commander au restaurant et dire ce qu'on aime.", "aliments, boissons, repas", "le verbe « gustar » (me gusta, me gustan)"],
    ["En ville", "Décrire sa ville et demander son chemin.", "lieux de la ville", "« hay » et « estar » pour situer (el banco está…)"],
  ]),
  unit("es", 3, "Parler de soi", "A1", "Métiers, loisirs, achats et logement.", [
    ["Les métiers", "Dire ce que l'on fait.", "métiers et lieux de travail", "ser vs estar (soy profesor, estoy cansado)"],
    ["Les loisirs", "Parler de ses passions.", "sports, musique, loisirs", "les verbes à diphtongue (quiero, puedo, juego)"],
    ["Faire des achats", "Demander un prix et choisir un article.", "vêtements, couleurs, prix", "¿Cuánto cuesta? et les démonstratifs (este, ese, aquel)"],
    ["Mon logement", "Décrire sa maison ou son appartement.", "pièces, meubles", "les prépositions de lieu (encima de, al lado de)"],
  ]),
  unit("es", 4, "Raconter", "A2", "Parler du passé, de ses projets et comparer.", [
    ["Hier", "Raconter ce qu'on a fait hier.", "activités passées, marqueurs de temps", "le passé simple régulier (pretérito indefinido : hablé, comí)"],
    ["Voyages", "Raconter un voyage.", "voyage, transport, hébergement", "le passé simple irrégulier (fui, tuve, hice)"],
    ["Mes projets", "Parler de ses intentions.", "projets, objectifs", "ir a + infinitif"],
    ["Comparer", "Comparer des lieux, des prix, des options.", "adjectifs courants", "más… que, menos… que, tan… como, le superlatif"],
  ]),
  unit("es", 5, "Le monde professionnel", "A2", "Travail, e-mails, rendez-vous, négociation et immobilier.", [
    ["Se présenter au travail", "Présenter son poste et son entreprise.", "entreprise, poste, missions", "estar + gérondif (estoy trabajando en…)"],
    ["Écrire un e-mail pro", "Écrire un e-mail clair et poli.", "formules d'e-mail", "le conditionnel de politesse (me gustaría, podría)"],
    ["Rendez-vous", "Fixer et confirmer un rendez-vous.", "agenda, disponibilités", "le futur simple (trabajaré)"],
    ["Négocier", "Faire une offre et discuter un prix.", "offre, remise, délai, contrat", "si + présent, futur (si compras dos, te hago un descuento)"],
    ["Visiter un appartement", "Poser les bonnes questions lors d'une visite.", "alquiler, fianza, propietario, barrio", "les questions avec ¿cuánto?, ¿cuándo?, ¿hay…?"],
  ]),
  unit("es", 6, "Aller plus loin", "B1", "Expériences, opinions, récits et souhaits.", [
    ["Mon expérience", "Parler de son parcours.", "expérience, réussite", "le passé composé (he trabajado, ¿has estado…?)"],
    ["Raconter le passé", "Décrire des habitudes et des situations passées.", "souvenirs, enfance", "l'imparfait vs le passé simple"],
    ["Donner son avis", "Exprimer et nuancer une opinion.", "opinions, accord, désaccord", "creo que / no creo que + subjonctif"],
    ["Souhaits et conseils", "Exprimer un souhait, donner un conseil.", "conseils, désirs", "le subjonctif présent (quiero que, es importante que)"],
  ]),
];

/* -------------------------------------------------------------------------- */
/* Arabe                                                                      */
/* -------------------------------------------------------------------------- */

const AR: Unit[] = [
  unit("ar", 0, "Lire l'arabe", "A1", "Les 28 lettres, les voyelles courtes et les premiers mots lus seul.", [
    ["Les premières lettres", "Reconnaître et lire ب ت ث ن ي avec les voyelles courtes.", "mots simples avec ب ت ث ن ي", "les voyelles courtes (fatḥa, kasra, ḍamma) et le sens de lecture"],
    ["Les lettres qui ne s'attachent pas", "Lire ا د ذ ر ز و et comprendre pourquoi elles coupent le mot.", "mots simples avec ا د ذ ر ز و", "les voyelles longues (ā, ī, ū) et le sukūn"],
    ["Les sons de la gorge", "Distinguer ج ح خ ه et lire le tā' marbūṭa ة.", "mots simples avec ج ح خ ه ة", "la différence ح / ه / خ et la terminaison ة"],
    ["Les lettres emphatiques", "Lire س ش ص ض ط ظ et sentir la différence s / ṣ, t / ṭ.", "mots simples avec ces lettres", "les consonnes emphatiques et la shadda"],
    ["Les dernières lettres", "Lire ع غ ف ق ك ل م et l'article ال.", "premiers mots du quotidien", "l'article « al- » et les lettres solaires / lunaires"],
  ]),
  unit("ar", 1, "Premiers pas", "A1", "Saluer, se présenter, compter, parler de sa famille.", [
    ["Saluer et se présenter", "Dire bonjour, donner son prénom et demander celui de l'autre.", "salutations : as-salāmu ʿalaykum, marḥaban, ismī", "les pronoms personnels (anā, anta, anti, huwa, hiya)"],
    ["D'où viens-tu ?", "Dire d'où l'on vient.", "pays, villes, nationalités", "l'adjectif de nationalité en -ī / -iyya (sinighālī, maghribiyya)"],
    ["Les nombres", "Compter jusqu'à 20 et donner son âge.", "nombres 0 à 20, chiffres arabes et indiens", "kam ? (combien) et l'accord simple des nombres"],
    ["La famille", "Présenter sa famille.", "famille : ab, umm, akh, ukht, ibn, bint", "les pronoms possessifs suffixés (-ī, -ka, -ki, -hu, -hā)"],
  ]),
  unit("ar", 2, "Le quotidien", "A1", "La phrase sans verbe être, les verbes au présent, la ville.", [
    ["La phrase nominale", "Décrire des choses et des personnes.", "adjectifs courants : grand, petit, nouveau, beau", "la phrase sans verbe « être » au présent (al-baytu kabīrun)"],
    ["Ma journée", "Décrire sa routine.", "verbes du quotidien", "le présent (inaccompli) : aktubu, taktubu, yaktubu"],
    ["Manger et boire", "Dire ce qu'on aime et commander.", "aliments, boissons", "uḥibbu + nom ou + an + verbe"],
    ["En ville", "Dire où se trouvent les lieux.", "lieux de la ville", "hunāka (il y a), fī (dans), les prépositions de lieu"],
  ]),
  unit("ar", 3, "Parler de soi", "A2", "Masculin et féminin, métiers, achats, logement.", [
    ["Les métiers", "Dire ce que l'on fait.", "métiers", "le masculin et le féminin (mudarris / mudarrisa)"],
    ["Faire des achats", "Demander un prix et choisir.", "marché, prix, vêtements", "les démonstratifs hādhā / hādhihi / dhālika"],
    ["Mon logement", "Décrire sa maison.", "pièces, meubles", "ʿindī (j'ai) et la négation laysa"],
    ["Le pluriel", "Parler de plusieurs choses ou personnes.", "objets du quotidien", "le pluriel régulier (-ūn, -āt) et quelques pluriels brisés"],
  ]),
  unit("ar", 4, "Raconter", "A2", "Le passé, le futur, la négation et la comparaison.", [
    ["Hier", "Raconter ce qu'on a fait.", "activités passées", "le passé (accompli) : katabtu, katabta, kataba"],
    ["Mes projets", "Parler de ses intentions.", "projets, voyages", "le futur avec sa- / sawfa"],
    ["Dire non", "Nier au présent, au passé et au futur.", "refus, excuses", "lā, mā, lam, lan"],
    ["Comparer", "Comparer des lieux et des prix.", "adjectifs courants", "le comparatif afʿal min (akbar min)"],
  ]),
  unit("ar", 5, "Le monde professionnel", "B1", "Travail, rendez-vous, négociation et immobilier.", [
    ["Se présenter au travail", "Présenter son poste et son entreprise.", "entreprise, poste, missions", "la phrase verbale (verbe en tête)"],
    ["Rendez-vous", "Fixer et confirmer un rendez-vous.", "jours, heures, agenda", "les jours de la semaine et les ordinaux"],
    ["Négocier", "Faire une offre et discuter un prix.", "prix, remise, contrat", "idhā (si) + passé"],
    ["Visiter un appartement", "Poser les bonnes questions lors d'une visite.", "loyer, propriétaire, quartier", "les mots interrogatifs (kam, matā, hal, ayna)"],
  ]),
];

/* -------------------------------------------------------------------------- */
/* Français (perfectionnement)                                                */
/* -------------------------------------------------------------------------- */

const FR: Unit[] = [
  unit("fr", 1, "Orthographe sans faute", "B1", "Les erreurs les plus fréquentes, enfin réglées.", [
    ["Les homophones de base", "Ne plus confondre a / à, et / est, son / sont, on / ont.", "phrases du quotidien et du travail", "la méthode de remplacement (avait, était, leur…)"],
    ["Ces, ses, c'est, s'est", "Choisir la bonne forme à coup sûr.", "phrases du quotidien et du travail", "démonstratif, possessif, présentatif et verbe pronominal"],
    ["L'accord du participe passé", "Accorder avec être et avec avoir.", "phrases au passé composé", "la règle du COD placé avant"],
    ["Tout, leur, quel", "Maîtriser les mots variables pièges.", "phrases courantes", "tout / tous / toute(s), leur / leurs, quel(le) / qu'elle"],
  ]),
  unit("fr", 2, "Conjugaison", "B1", "Les temps qui piègent même les francophones.", [
    ["Futur ou conditionnel ?", "Choisir entre -rai et -rais.", "demandes, promesses, hypothèses", "la terminaison -rai / -rais et la méthode du « nous »"],
    ["Le subjonctif", "Savoir quand et comment l'employer.", "souhaits, obligations, doutes", "il faut que, bien que, avant que, pour que"],
    ["Après que et autres pièges", "Éviter les erreurs de mode les plus courantes.", "connecteurs temporels", "après que + indicatif, si + imparfait (jamais de conditionnel)"],
    ["La concordance des temps", "Raconter au passé sans incohérence.", "récit, compte rendu", "plus-que-parfait, imparfait et conditionnel dans le discours rapporté"],
  ]),
  unit("fr", 3, "Vocabulaire précis", "B2", "Parler et écrire avec justesse.", [
    ["Les connecteurs logiques", "Structurer une argumentation.", "cependant, néanmoins, par conséquent, en outre", "le sens exact de chaque connecteur"],
    ["Le mot juste", "Remplacer les mots passe-partout.", "verbes précis à la place de faire, dire, mettre, avoir", "la reformulation"],
    ["Anglicismes et barbarismes", "Éviter les fautes qui décrédibilisent.", "au jour d'aujourd'hui, pallier à, se rappeler de", "les formes correctes et pourquoi"],
    ["Business et immobilier", "Maîtriser le vocabulaire des affaires.", "rendement, plus-value, bail, levier, trésorerie", "les définitions exactes et leur emploi"],
  ]),
  unit("fr", 4, "Écrit professionnel", "B2", "E-mails, comptes rendus et lettres qui font sérieux.", [
    ["L'e-mail professionnel", "Écrire un e-mail clair, court et poli.", "formules d'appel et de fin", "la structure : objet, contexte, demande, clôture"],
    ["Relancer et refuser", "Relancer ou dire non avec diplomatie.", "formules de relance et de refus", "l'atténuation (conditionnel, tournures impersonnelles)"],
    ["Le compte rendu", "Résumer une réunion de façon claire.", "décisions, actions, échéances", "le style nominal et le présent de narration"],
    ["La lettre de motivation", "Convaincre en une page.", "compétences, motivations", "le vouvoiement, les formules de politesse officielles"],
  ]),
  unit("fr", 5, "Expression orale", "B2", "Convaincre à l'oral.", [
    ["Le pitch", "Présenter un projet en une minute.", "problème, solution, marché, demande", "la structure d'un pitch et les phrases d'accroche"],
    ["Argumenter", "Défendre une position face à un contradicteur.", "arguments, concessions, objections", "la concession (certes… mais, bien que)"],
    ["Négocier", "Obtenir un accord gagnant-gagnant.", "offre, contre-offre, conditions", "les formules pour proposer, refuser, conclure"],
    ["Prendre la parole", "Parler avec aisance en public.", "introduction, transitions, conclusion", "le registre soutenu à l'oral, sans être pompeux"],
  ]),
];

export const CURRICULUM: Record<Lang, Unit[]> = { en: EN, es: ES, ar: AR, fr: FR };

export type FlatLesson = LessonPlan & { unitId: string; unitTitle: string; level: Level; index: number };

export function allLessons(lang: Lang): FlatLesson[] {
  let index = 0;
  return CURRICULUM[lang].flatMap((u) =>
    u.lessons.map((l) => ({ ...l, unitId: u.id, unitTitle: u.title, level: u.level, index: index++ })),
  );
}

export function findLesson(lessonId: string): { lang: Lang; lesson: FlatLesson } | null {
  for (const lang of Object.keys(CURRICULUM) as Lang[]) {
    const lesson = allLessons(lang).find((l) => l.id === lessonId);
    if (lesson) return { lang, lesson };
  }
  return null;
}

/** Unités en dessous du niveau choisi : considérées comme acquises au départ. */
export function unitsBelowLevel(lang: Lang, level: Level): Unit[] {
  const rank = LEVELS.indexOf(level);
  return CURRICULUM[lang].filter((u) => LEVELS.indexOf(u.level) < rank);
}

/**
 * Leçon suivante : la première qui n'est ni terminée ni passée.
 * Une leçon est ouverte si toutes celles d'avant sont terminées ou passées.
 */
export function nextLessonId(lang: Lang, finished: Set<string>): string | null {
  return allLessons(lang).find((l) => !finished.has(l.id))?.id ?? null;
}
