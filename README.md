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
- [Prisma](https://www.prisma.io) + SQLite (aucun serveur de base de données à installer)
- [API Claude](https://docs.claude.com) (`@anthropic-ai/sdk`) avec sorties structurées validées par [Zod](https://zod.dev)
- Web Speech API du navigateur pour la voix (synthèse et reconnaissance)

## Installation

Prérequis : Node.js 20 ou plus récent.

```bash
git clone https://github.com/yuku-ent/polyglotte.git
cd polyglotte
npm install
cp .env.example .env        # puis colle ta clé ANTHROPIC_API_KEY dans .env
npm run db:setup            # crée la base SQLite
npm run dev
```

Ouvre ensuite <http://localhost:3000>.

### La clé API Claude

Les histoires, la conversation, la correction de l'écrit et la génération de phrases utilisent l'API Claude. Crée une clé sur <https://console.anthropic.com> et colle-la dans `.env`. L'API est payante à l'usage (quelques centimes par session en général).

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
| `npm run db:setup` | Crée ou met à jour la base |
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
    ai.ts                Appel à Claude avec sortie structurée
    activity.ts          XP, série et activité du jour
    languages.ts         Langues, variantes, niveaux
tests/                   Tests unitaires (node:test)
```

### Comment ça marche

- **Répétition espacée** : chaque carte a une facilité, un intervalle et un nombre de répétitions. « Bien » multiplie l'intervalle par la facilité, « À revoir » remet la carte à zéro et la ramène 10 minutes plus tard. 15 nouvelles cartes maximum par jour et par langue.
- **IA fiable** : chaque appel à Claude force l'usage d'un outil avec un schéma JSON ; la réponse est validée par Zod avant d'être enregistrée. Une réponse invalide renvoie une erreur propre plutôt qu'un écran cassé.
- **XP calculée côté serveur** : le navigateur envoie un résultat (une note, un nombre de bonnes réponses), jamais un montant d'XP.
- **Profil local** : l'appli est personnelle et utilise un profil unique. L'authentification est prévue dans la feuille de route.

## Feuille de route

- [ ] Comptes utilisateurs (Auth.js) et base PostgreSQL pour un déploiement en ligne
- [ ] Voix IA naturelles (synthèse vocale serveur) en complément des voix du navigateur
- [ ] Test de placement pour fixer le niveau automatiquement
- [ ] Statistiques d'erreurs récurrentes et leçons de grammaire ciblées
- [ ] Application mobile (PWA hors ligne)
