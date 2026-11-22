# Polyglotte

Application web pour apprendre **l'anglais, l'espagnol et l'arabe**, et se **perfectionner en français**, en travaillant les quatre compétences au même endroit : vocabulaire, compréhension, oral et écrit.

Deux façons d'apprendre :

- **Le parcours** : un vrai fil directeur, unité par unité, leçon par leçon, du tout premier mot jusqu'au niveau B1.
- **L'arcade** : révisions, histoires, conversation, répétition et écriture, autant que tu veux. Tu fixes un **temps minimum par jour, jamais de maximum** : aucun quota ne te bloque.

Elle reprend ce qui marche dans les grandes plateformes et corrige leurs points faibles :

| Inspiré de | Ce qu'on garde | Ce qu'on corrige |
| --- | --- | --- |
| Duolingo | Parcours guidé, série de jours, XP | Pas de quotas ni de limites, du vrai contenu, de l'oral réel |
| Anki | Répétition espacée (SM-2) | Paquets prêts, audio, ajout en un clic |
| LingQ / Lingopie | Lecture et écoute en contexte | Histoires générées à **ton** niveau, sur **tes** sujets |
| Pimsleur | Écouter et répéter | Note de prononciation mot par mot |
| italki / Speak | Conversation et corrections | Tuteur IA 24 h/24, corrections expliquées en français |
| HelloTalk | Écrire à des natifs | Chaque texte corrigé, expliqué et réécrit |

L'arabe a droit à un traitement à part : alphabet interactif, translittération partout, et choix entre l'arabe standard (fusha) et trois dialectes (marocain, égyptien, levantin).

## Fonctionnalités

- **Accueil** : premier lancement guidé (langue, niveau, temps minimum), puis « Continuer le parcours », temps d'étude du jour, entraînement libre et réglages.
- **Parcours** : 5 à 6 unités par langue, 4 à 5 leçons chacune, et une révision en fin d'unité. Chaque leçon : objectif, mots nouveaux avec audio, une règle expliquée en français, un dialogue, puis 10 à 12 exercices variés (choix, écoute, remettre dans l'ordre, phrase à trou, parler au micro). Les erreurs reviennent à la fin, les mots rejoignent les révisions. Placement selon le niveau et bouton « Je connais déjà » pour passer une unité.
- **Réviser** : répétition espacée (SM-2), sans limite de nouveaux mots.
- **Dictée** : écoute (normale, lente ou par morceaux), écris, et vois chaque faute mot par mot (faux, accent, oublié, en trop) ; indice possible, clavier arabe à l'écran.
- **Recopie** : le texte est affiché, chaque lettre se colore en direct ; précision et mots par minute.
- **Traduire** : un texte à traduire vers le français ou vers la langue, corrigé par l'IA (sens, grammaire, version d'un natif).
- **Arcade** : la page qui regroupe tous les modes libres.
- **Lire & écouter** : histoires générées à ton niveau, audio phrase par phrase, traduction, quiz.
- **Parler** : jeux de rôle avec un tuteur IA, au micro ou au clavier, chaque message corrigé et expliqué.
- **Répéter** : shadowing avec note de prononciation mot par mot.
- **Écrire** : journal corrigé, note, erreurs expliquées, version d'un natif.
- **Alphabet** (arabe) : 28 lettres, 4 formes, sons, voyelles courtes, quiz.
- **Français** : parcours de perfectionnement (orthographe, conjugaison, vocabulaire précis, écrit pro, oral).
- **Voix** : voix naturelle générée par Gemini (mise en cache) et micro transcrit par Gemini ; voix et micro du navigateur en secours.
- **Temps d'étude** : compté seulement quand tu es actif, affiché par rapport à ton minimum.

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript strict
- [Tailwind CSS 4](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + PostgreSQL (Neon gratuit via Vercel, ou Supabase)
- IA : [Gemini](https://ai.google.dev) (offre gratuite) ou [Claude](https://docs.claude.com), sorties JSON validées par [Zod](https://zod.dev)
- Voix : synthèse et transcription Gemini, Web Speech API du navigateur en secours

## Installation

Prérequis : Node.js 20 ou plus récent, et une base PostgreSQL (Neon gratuit, voir plus bas).

```bash
git clone https://github.com/yuku-ent/polyglotte.git
cd polyglotte
npm install
cp .env.example .env        # remplis DATABASE_URL, DATABASE_URL_UNPOOLED et GEMINI_API_KEY
npm run db:push             # crée les tables
npm run dev
```

Ouvre ensuite <http://localhost:3000>.

## Mise en ligne sur Vercel

1. Importe le dépôt GitHub dans Vercel.
2. Dans le projet Vercel : **Storage > Create Database > Neon** (gratuit), puis connecte-la au projet. Vercel ajoute `DATABASE_URL` et `DATABASE_URL_UNPOOLED` tout seul.
3. **Settings > Environment Variables** : ajoute `GEMINI_API_KEY` (ou `ANTHROPIC_API_KEY`) et `APP_PASSWORD`.
4. **Deployments > Redeploy**. Le build crée les tables automatiquement (`prisma db push`).

`APP_PASSWORD` protège l'appli : sans lui, toute personne qui a le lien utilise ton profil et ta clé API.

Pour travailler en local avec la même base, copie les deux variables de Neon dans ton `.env` (Vercel > Storage > ta base > `.env.local`).

### La clé IA

Les histoires, la conversation, la correction de l'écrit et la génération de phrases utilisent un modèle d'IA. Deux choix :

- **Gemini (gratuit)** : crée une clé sur <https://aistudio.google.com> (« Get API key »), sans carte bancaire, et mets-la dans `GEMINI_API_KEY`. L'offre gratuite limite le nombre de demandes par minute et par jour, et Google peut utiliser les échanges pour améliorer ses produits.
- **Claude (payant à l'usage)** : clé sur <https://console.anthropic.com> dans `ANTHROPIC_API_KEY`. Si elle est remplie, elle est utilisée en priorité.

Sans clé, l'appli reste utilisable : tableau de bord, révisions, répétition et alphabet fonctionnent hors IA.

### Le micro et la voix

Avec `GEMINI_API_KEY`, la voix est générée par Gemini (une seule fois par phrase, puis gardée en base) et le micro enregistre ta voix pour la faire transcrire par Gemini : ça marche dans tous les navigateurs récents et pour l'arabe. Autorise le micro quand le navigateur le demande.

Sans clé, l'appli utilise la voix et la reconnaissance vocale du navigateur (Chrome ou Edge conseillés).

Variables facultatives : `GEMINI_TTS_MODEL` (modèle de voix, par défaut `gemini-3.1-flash-tts-preview`) et `GEMINI_TTS_VOICE` (par défaut `Kore`). Si Google renomme ses modèles, copie le nouveau nom depuis AI Studio.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm test` | Tests de la logique (répétition espacée, notation, dates) |
| `npm run db:push` | Crée ou met à jour les tables |
| `npm run db:studio` | Explore les données dans le navigateur |

## Structure

```
prisma/
  schema.prisma          Modèle de données (profil, cartes, journal, histoires, conversations…)
src/
  app/
    page.tsx             Accueil
    bienvenue/           Premier lancement (langue, niveau, temps minimum)
    parcours/            Le parcours et le lecteur de leçon (parcours/[id])
    revisions/           Répétition espacée
    lire/                Histoires à lire et écouter
    parler/              Conversation avec le tuteur
    repeter/             Shadowing et note de prononciation
    ecrire/              Journal corrigé
    alphabet/            Alphabet arabe
    methode/             Analyse des plateformes
    api/                 Routes API (profile, cards, stories, conversation, writing, phrases, activity)
  components/            Interface (navigation, boutons audio et micro, composants communs, contextes)
  content/
    curriculum.ts        Le plan du parcours (unités, leçons, objectifs, grammaire)
    …                    Paquets de mots, phrases, alphabet, scénarios, analyse
  hooks/                 Voix (useVoice), micro (useRecorder), Web Speech (useSpeech)
  lib/
    srs.ts               Algorithme SM-2 (fonctions pures)
    diff.ts              Correction de dictée mot à mot
    scoring.ts           Comparaison phrase attendue / phrase entendue
    prompts.ts           Consignes et schémas JSON envoyés à Claude
    ai.ts                Appel à l'IA (Claude ou Gemini) avec sortie structurée
    course.ts            Parcours : avancement, placement, génération des leçons
    voice.ts             Voix Gemini (WAV) et transcription du micro
    activity.ts          XP, série, temps d'étude
    languages.ts         Langues, variantes, niveaux
tests/                   Tests unitaires (node:test)
```

### Comment ça marche

- **Parcours** : le plan de chaque leçon est écrit dans `curriculum.ts` ; le contenu détaillé est généré par l'IA à la première ouverture, puis gardé en base et réutilisé.
- **Répétition espacée** : chaque carte a une facilité, un intervalle et un nombre de répétitions. « Bien » multiplie l'intervalle par la facilité, « À revoir » remet la carte à zéro et la ramène 10 minutes plus tard. Les nouveaux mots arrivent par séries de 10, sans limite par jour.
- **Temps d'étude** : compté seconde par seconde quand l'onglet est visible et que tu as interagi depuis moins de 90 secondes.
- **IA fiable** : chaque appel demande un JSON conforme à un schéma (outil forcé avec Claude, mode JSON avec Gemini) ; la réponse est validée par Zod avant d'être enregistrée. Une réponse invalide renvoie une erreur propre plutôt qu'un écran cassé.
- **XP calculée côté serveur** : le navigateur envoie un résultat (une note, un nombre de bonnes réponses), jamais un montant d'XP.
- **Profil local** : l'appli est personnelle et utilise un profil unique. L'authentification est prévue dans la feuille de route.

## Feuille de route

- [ ] Comptes utilisateurs (Auth.js) pour plusieurs personnes
- [ ] Voix IA naturelles (synthèse vocale serveur) en complément des voix du navigateur
- [ ] Test de placement pour fixer le niveau automatiquement
- [ ] Statistiques d'erreurs récurrentes et leçons de grammaire ciblées
- [ ] Application mobile (PWA hors ligne)
