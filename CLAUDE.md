# GameHub (Marathon Launcher)

Launcher de jeux PC Windows, style Windows 11 clair. Application Electron + React.

## Stack

- **Electron** (processus main) — fenêtre, système de fichiers, IPC, base de données
- **React 18 + TypeScript** (processus renderer, dossier `src/`) — UI
- **Vite** — bundler/dev server pour le renderer
- **Zustand** — state global (`src/store/useStore.ts`), pas de context React
- **Tailwind CSS** — tout le style est en classes utilitaires, pas de CSS modules

## Structure

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
  components/        Composants UI (voir ci-dessous)
  lib/               Fonctions pures (tri, formatage, URL de covers)
  types.ts           Types partagés (Game, NavSection, SortOption, ...)
```

### Composants principaux (`src/components/`)

- `Sidebar.tsx` — nav (Library/Recent/Favorites/Settings), largeur fixe 200px
- `Toolbar.tsx` — recherche, tri, toggle grille/liste, ajout de jeu
- `GameGrid.tsx` — grille (`GameCard`) ou liste (`ListRow`) des jeux filtrés
- `DetailPanel.tsx` — détail du jeu sélectionné, largeur fixe 280px
- `Settings.tsx`, `EditGameDialog.tsx`, `ConfirmDialog.tsx` — dialogues

Communication renderer ↔ main uniquement via `window.api` (défini dans `electron/preload.ts`), jamais d'accès Node direct depuis `src/`.

## Commandes

```
npm run dev         Lance Vite + Electron en mode dev (hot reload renderer)
npm run build        Build renderer (Vite) + compile electron/ (tsc)
npm run dist         Build complet + package avec electron-builder
npm run typecheck    Vérifie les types (renderer + electron), à lancer après toute modif
```

## Conventions

- Taille de police et espacements en valeurs arbitraires Tailwind (`text-[13px]`, `px-2.5`) pour coller précisément au design Windows 11 — ce n'est pas un oubli, ne pas "normaliser" vers l'échelle Tailwind par défaut.
- Commentaires de code en français quand ils expliquent un choix non évident (ex. `main.ts`, `App.tsx`).
- Les mises à jour optimistes du store (ex. `toggleFavorite`) mettent à jour le state local avant la confirmation IPC pour un retour instantané.
- La grille de jeux (`GameGrid.tsx`, vue grille) utilise `grid-cols-[repeat(auto-fill,minmax(150px,1fr))]` pour rester responsive : le nombre de colonnes s'adapte à la largeur de fenêtre plutôt que d'être fixé en dur. La fenêtre a un `minWidth: 800`/`minHeight: 550` défini dans `electron/main.ts` — toute nouvelle mise en page doit rester utilisable à cette taille minimale.
