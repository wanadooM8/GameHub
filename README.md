# GameHub

Launcher de jeux PC pour Windows, avec une interface claire inspirée de Windows 11.

GameHub scanne automatiquement tes dossiers de jeux, détecte les exécutables, récupère les jaquettes officielles (via IGDB) et te permet de lancer, organiser et suivre tes jeux depuis une seule fenêtre.

![Plateforme](https://img.shields.io/badge/plateforme-Windows-0078D4)
![Version](https://img.shields.io/badge/version-1.0.1-informational)

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Installation (utilisateur)](#installation-utilisateur)
- [Récupérer une clé IGDB (jaquettes des jeux)](#récupérer-une-clé-igdb-jaquettes-des-jeux)
- [Développement](#développement)
- [Build et release](#build-et-release)
- [Structure du projet](#structure-du-projet)
- [Stack technique](#stack-technique)

## Fonctionnalités

- **Scan automatique** de dossiers pour détecter les jeux installés (`.exe`).
- **Jaquettes automatiques** via l'API IGDB, avec repli sur l'icône du `.exe` puis sur une tuile générique si aucune clé IGDB n'est configurée.
- **Bibliothèque** avec vue grille ou liste, recherche et tri (nom, note, temps de jeu, taille, date d'ajout...).
- **Favoris** et **jeux récents**, avec suivi automatique du temps de jeu et du nombre de lancements.
- **Fiche détaillée** par jeu : note, jaquette personnalisée, édition du nom/chemin, suppression.
- **Ajout manuel** d'un jeu (sélection directe d'un `.exe`) en plus du scan de dossiers.
- Thème clair, dense et responsive, utilisable dès 800×550.

## Installation (utilisateur)

Rendez-vous sur la page [Releases](https://github.com/wanadooM8/GameHub/releases) du dépôt et téléchargez la dernière version :

- **`GameHub-Setup-x.x.x.exe`** — installeur classique (recommandé), permet de choisir le dossier d'installation.
- **`GameHub-x.x.x-portable.exe`** — version portable, ne nécessite aucune installation, exécutable directement.

Aucune dépendance à installer, l'application est autonome.

## Récupérer une clé IGDB (jaquettes des jeux)

GameHub utilise l'API [IGDB](https://www.igdb.com/) pour récupérer automatiquement les jaquettes des jeux détectés. IGDB étant géré par Twitch, l'inscription se fait via le **portail développeur Twitch** — c'est gratuit et ne prend que quelques minutes.

1. Crée un compte Twitch si tu n'en as pas déjà un, puis rends-toi sur la [console développeur Twitch](https://dev.twitch.tv/console).
2. Active la **vérification en deux facteurs (2FA)** sur ton compte Twitch si ce n'est pas déjà fait — Twitch l'exige pour créer une application (Paramètres du compte → Sécurité).
3. Dans la console développeur, va dans l'onglet **Applications** puis clique sur **Register Your Application** (Enregistrer votre application).
4. Remplis le formulaire :
   - **Name** : un nom quelconque, par exemple `GameHub`.
   - **OAuth Redirect URLs** : `http://localhost` (obligatoire mais non utilisé ici).
   - **Category** : `Application Integration`.
5. Valide, puis ouvre l'application créée. Tu y trouveras ton **Client ID**.
6. Clique sur **New Secret** pour générer ton **Client Secret** (affiché une seule fois — copie-le immédiatement).
7. Dans GameHub, ouvre **Réglages** (icône dans la barre latérale) → section **IGDB API**, et colle le **Client ID** et le **Client Secret** dans les champs correspondants.
8. Relance un scan (**Rescan all** dans les réglages) : les jaquettes se téléchargent automatiquement pour les jeux détectés.

> Sans clé IGDB configurée, GameHub fonctionne normalement mais affiche l'icône extraite du `.exe`, ou une tuile générique si aucune icône n'est disponible.

Les identifiants sont stockés localement (base SQLite de l'application) et ne sont jamais transmis ailleurs qu'à l'API IGDB/Twitch.

## Développement

Prérequis : [Node.js](https://nodejs.org/) 18+ et npm.

```bash
npm install       # installe les dépendances
npm run dev       # lance Vite + Electron en mode dev (hot reload du renderer)
npm run typecheck # vérifie les types (renderer + electron)
```

## Build et release

```bash
npm run build     # build du renderer (Vite) + compilation d'electron/ (tsc)
npm run dist      # build complet + packaging avec electron-builder
```

Le packaging (`npm run dist`) génère dans `dist-electron-build/` :

- un installeur NSIS (`GameHub-Setup-x.x.x.exe`)
- une version portable (`GameHub-x.x.x-portable.exe`)

## Structure du projet

```
electron/          Processus main Electron (Node.js, jamais bundlé avec Vite)
  main.ts           Point d'entrée, fenêtre, gestion des handlers IPC
  preload.ts        Bridge contextIsolation → expose window.api au renderer
  db.ts             Accès SQLite (jeux, dossiers, réglages)
  scanner.ts        Scan des dossiers pour détecter les jeux
  launcher.ts       Lancement des .exe et suivi des process en cours
  igdb.ts           Récupération de jaquettes via IGDB

src/                Processus renderer (React)
  App.tsx            Layout racine : Sidebar + Toolbar + GameGrid/DetailPanel
  store/useStore.ts  State global Zustand — tout le state applicatif vit ici
  components/        Composants UI
  lib/               Fonctions pures (tri, formatage, URL de covers)
  types.ts           Types partagés (Game, NavSection, SortOption, ...)
```

## Stack technique

- **Electron** — fenêtre, système de fichiers, IPC, base de données
- **React 18 + TypeScript** — UI du renderer
- **Vite** — bundler/dev server
- **Zustand** — state global
- **Tailwind CSS** — styles utilitaires
- **SQLite** (via le processus main) — persistance locale des jeux, dossiers et réglages
