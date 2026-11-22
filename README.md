# Polyglotte

Application web pour apprendre **l'anglais, l'espagnol et l'arabe** en travaillant les quatre compétences au même endroit : vocabulaire, compréhension, oral et écrit.

Elle reprend ce qui marche dans les grandes plateformes et corrige leurs points faibles :

| Inspiré de | Ce qu'on garde | Ce qu'on corrige |
| --- | --- | --- |
| Duolingo | Série de jours, XP, objectif quotidien, missions | Du vrai contenu, de l'oral réel |
| Anki | Répétition espacée (SM-2) | Paquets prêts, audio, ajout en un clic |
| LingQ / Lingopie | Lecture et écoute en contexte | Histoires générées à **ton** niveau, sur **tes** sujets |
| Pimsleur | Écouter et répéter | Note de prononciation mot par mot |
| italki / Speak | Conversation et corrections | Tuteur IA 24 h/24, corrections expliquées en français |
| HelloTalk | Écrire à des natifs | Chaque texte corrigé, expliqué et réécrit |

L'arabe a droit à un traitement à part : alphabet interactif, translittération partout, et choix entre l'arabe standard (fusha) et trois dialectes (marocain, égyptien, levantin).

## Fonctionnalités

- **Aujourd'hui** : objectif d'XP, série, missions du jour, activité de la semaine, réglages de niveau (A1 à C1) et de variante.
- **Réviser** : cartes en répétition espacée (algorithme SM-2), audio normal et lent, raccourcis clavier, sens langue → français ou l'inverse, gestion de ses mots.
- **Lire & écouter** : histoires générées par l'IA à ton niveau, lecture audio phrase par phrase, traduction au clic, vocabulaire à ajouter aux révisions, quiz de compréhension.
- **Parler** : jeux de rôle avec un tuteur IA (restaurant, visite d'appartement, négociation, pitch, entretien…), au micro ou au clavier. Chaque message est corrigé et expliqué, avec des idées de réponse.
- **Répéter** : shadowing. Tu écoutes, tu répètes au micro, tu obtiens une note et les mots mal prononcés en rouge.
- **Écrire** : journal corrigé. Note sur 100, texte corrigé, erreurs expliquées, version d'un natif, conseil.
- **Alphabet** (arabe) : les 28 lettres, leurs 4 formes, leurs sons, les voyelles courtes et un quiz.
- **La méthode** : l'analyse complète des plateformes existantes.

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript strict
- [Tailwind CSS 4](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + PostgreSQL (Neon gratuit via Vercel, ou Supabase)
- IA : [Gemini](https://ai.google.dev) (offre gratuite) ou [Claude](https://docs.claude.com), sorties JSON validées par [Zod](https://zod.dev)
- Web Speech API du navigateur pour la voix (synthèse et reconnaissance)

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

- **Chrome ou Edge** donnent les meilleurs résultats pour la reconnaissance vocale (l'arabe inclus).
- La voix lue dépend des voix installées sur ton système. Pour l'arabe et l'espagnol, installe la voix correspondante si besoin (Windows : Paramètres > Heure et langue > Voix ; macOS : Réglages > Accessibilité > Contenu énoncé).

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
    page.tsx             Tableau de bord « Aujourd'hui »
    revisions/           Répétition espacée
    lire/                Histoires à lire et écouter
    parler/              Conversation avec le tuteur
    repeter/             Shadowing et note de prononciation
    ecrire/              Journal corrigé
    alphabet/            Alphabet arabe
    methode/             Analyse des plateformes
    api/                 Routes API (profile, cards, stories, conversation, writing, phrases, activity)
  components/            Interface (navigation, boutons audio et micro, composants communs, contextes)
  content/               Contenus de départ : paquets de mots, phrases, alphabet, scénarios, analyse
  hooks/useSpeech.ts     Reconnaissance et synthèse vocales
  lib/
    srs.ts               Algorithme SM-2 (fonctions pures)
    scoring.ts           Comparaison phrase attendue / phrase entendue
    prompts.ts           Consignes et schémas JSON envoyés à Claude
    ai.ts                Appel à l'IA (Claude ou Gemini) avec sortie structurée
    activity.ts          XP, série et activité du jour
    languages.ts         Langues, variantes, niveaux
tests/                   Tests unitaires (node:test)
```

### Comment ça marche

- **Répétition espacée** : chaque carte a une facilité, un intervalle et un nombre de répétitions. « Bien » multiplie l'intervalle par la facilité, « À revoir » remet la carte à zéro et la ramène 10 minutes plus tard. 15 nouvelles cartes maximum par jour et par langue.
- **IA fiable** : chaque appel demande un JSON conforme à un schéma (outil forcé avec Claude, mode JSON avec Gemini) ; la réponse est validée par Zod avant d'être enregistrée. Une réponse invalide renvoie une erreur propre plutôt qu'un écran cassé.
- **XP calculée côté serveur** : le navigateur envoie un résultat (une note, un nombre de bonnes réponses), jamais un montant d'XP.
- **Profil local** : l'appli est personnelle et utilise un profil unique. L'authentification est prévue dans la feuille de route.

## Feuille de route

- [ ] Comptes utilisateurs (Auth.js) pour plusieurs personnes
- [ ] Voix IA naturelles (synthèse vocale serveur) en complément des voix du navigateur
- [ ] Test de placement pour fixer le niveau automatiquement
- [ ] Statistiques d'erreurs récurrentes et leçons de grammaire ciblées
- [ ] Application mobile (PWA hors ligne)
