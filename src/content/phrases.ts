import type { Lang } from "@/lib/languages";

export type Phrase = { text: string; translation: string; translit?: string };

/** Phrases de départ pour l'exercice « Répéter » (shadowing). */
export const STARTER_PHRASES: Record<Lang, Phrase[]> = {
  en: [
    { text: "Nice to meet you.", translation: "Enchanté." },
    { text: "I'm learning English every day.", translation: "J'apprends l'anglais tous les jours." },
    { text: "Could you speak a bit more slowly?", translation: "Pourriez-vous parler un peu plus lentement ?" },
    { text: "I'm working on my own business.", translation: "Je travaille sur ma propre entreprise." },
    { text: "How much is the rent per month?", translation: "Combien coûte le loyer par mois ?" },
    { text: "Let's schedule a meeting next week.", translation: "Prévoyons une réunion la semaine prochaine." },
    { text: "I don't agree, but I understand your point.", translation: "Je ne suis pas d'accord, mais je comprends ton point de vue." },
    { text: "What do you recommend?", translation: "Qu'est-ce que tu recommandes ?" },
  ],
  es: [
    { text: "Mucho gusto.", translation: "Enchanté." },
    { text: "Estoy aprendiendo español cada día.", translation: "J'apprends l'espagnol chaque jour." },
    { text: "¿Puedes hablar un poco más despacio?", translation: "Peux-tu parler un peu plus lentement ?" },
    { text: "Estoy trabajando en mi propia empresa.", translation: "Je travaille sur ma propre entreprise." },
    { text: "¿Cuánto cuesta el alquiler al mes?", translation: "Combien coûte le loyer par mois ?" },
    { text: "Podemos tener una reunión la semana que viene.", translation: "On peut faire une réunion la semaine prochaine." },
    { text: "No estoy de acuerdo, pero entiendo tu punto de vista.", translation: "Je ne suis pas d'accord, mais je comprends ton point de vue." },
    { text: "¿Qué me recomiendas?", translation: "Qu'est-ce que tu me recommandes ?" },
  ],
  ar: [
    { text: "تشرفنا", translit: "tasharrafnā", translation: "Enchanté." },
    { text: "أتعلم العربية كل يوم", translit: "ataʿallamu al-ʿarabiyya kulla yawm", translation: "J'apprends l'arabe tous les jours." },
    { text: "هل يمكنك أن تتكلم ببطء؟", translit: "hal yumkinuka an tatakallama bi-buṭʾ?", translation: "Peux-tu parler lentement ?" },
    { text: "أعمل في شركتي الخاصة", translit: "aʿmalu fī sharikatī al-khāṣṣa", translation: "Je travaille dans ma propre entreprise." },
    { text: "كم الإيجار في الشهر؟", translit: "kam al-ījār fī al-shahr?", translation: "Combien coûte le loyer par mois ?" },
    { text: "لنحدد موعدا الأسبوع القادم", translit: "li-nuḥaddid mawʿidan al-usbūʿ al-qādim", translation: "Fixons un rendez-vous la semaine prochaine." },
    { text: "لا أوافق، لكنني أفهم وجهة نظرك", translit: "lā uwāfiq, lākinnanī afhamu wijhata naẓarik", translation: "Je ne suis pas d'accord, mais je comprends ton point de vue." },
    { text: "ماذا تنصحني؟", translit: "mādhā tanṣaḥunī?", translation: "Que me conseilles-tu ?" },
  ],
};
