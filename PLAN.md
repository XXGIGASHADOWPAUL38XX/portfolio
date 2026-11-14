# Plan — portfolio de Tristan Ginet

Source : maquette Claude Design « Accueil — Tristan Ginet » (`Main.dc.html`) et ses notes.
Stack : Astro 7 (sortie statique) + TypeScript strict, Tailwind CSS 4 (plugin Vite, via `astro add`),
polices Fontsource, contenu en collections Zod éditées par Pages CMS, hébergement Coolify.

Chaque lot vit sur sa branche `lot-N-…`, avec des commits Conventional Commits, et il est fusionné
dans `main` une fois ses critères de fin vérifiés.

## Décisions transverses

- **Contenus manquants `[…]`** : les valeurs entre crochets de la maquette restent telles quelles dans
  `src/content` pour que le rendu reste fidèle en développement. Le schéma Zod refuse toute
  chaîne qui contient `[` ou `]`, sauf avec `ALLOW_PLACEHOLDERS=true` (développement, captures).
  Un build de production (CI, Coolify) échoue donc tant que Tristan n'a pas rempli ces champs.
  Dans Pages CMS, le même motif (`pattern`) empêche d'enregistrer un champ qui contient un crochet.
- **Pas de lien « Code » vers LED Tristan** : le champ existe dans le schéma (optionnel) mais reste
  vide tant que le mot de passe Wi-Fi est dans l'historique Git du dépôt.
- **`/assistant-docs`** : exemple inventé, il n'est pas créé. Le bouton « Tous les projets »
  ne s'affiche qu'au-delà de 3 projets.
- **Liens optionnels** (étude de cas, vidéo) : ils ne s'affichent que s'ils sont renseignés,
  ce qui garantit l'absence de `href="#"`.
- **Photo** : déposée dans `src/assets/media` via Pages CMS. Un endpoint statique la convertit au build
  (sharp + tramage Floyd–Steinberg) en PNG 1 bit, vert signal sur fond noir.

## Lots

### 0. Scaffolding + git
- Objectif : projet Astro généré par `npm create astro`, dépôt git, plan.
- Fini quand : `npm run build` passe ; PLAN.md commité ; branche fusionnée.

### 1. Tokens, Tailwind, polices, layout, thème
- Objectif : `tokens.css` Signal = seule source (variables CSS sombre/clair par `[data-theme]`)
  exposées à Tailwind par `@theme` ; Fontsource (Space Grotesk, JetBrains Mono, Silkscreen) ;
  `BaseLayout` avec un script inline anti-flash (préférence système puis localStorage).
- Fini quand : la page vide prend les bons fonds/couleurs dans les deux thèmes ; aucune couleur
  en dur hors `tokens.css` (grep) ; build OK.

### 2. Modèle de contenu
- Objectif : collections `site`, `parcours`, `apropos` (JSON) et `projets` (Markdown), schémas Zod,
  `.pages.yml` couvrant tous les champs.
- Fini quand : tests du garde-fou des crochets ; build strict échoue sur les crochets, build
  `ALLOW_PLACEHOLDERS=true` passe.

### 3. Composants de base
- Objectif : `ui/` Button, Tag, PixelArt, Separator, NavBar, ProjectCard, SectionHeading ;
  logique pure (sprite → rectangles, spectre…) testée avec Vitest.
- Fini quand : tests verts, CRAP < 10, mutants tués, build OK.

### 4. Hero et LED Tristan
- Objectif : sections `#top` et `#a-la-une` (graphe en serpentin, spectre, ruban, étapes), portrait 1 bit.
- Fini quand : captures 1440 / 900 / 390 en sombre et clair comparées à la maquette.

### 5. Autres projets et parcours
- Objectif : `#projets` (cartes primary), `#parcours` (deux tableaux sémantiques), séparateurs.
- Fini quand : captures comparées ; tri et « auj. » testés.

### 6. À propos, contact, pied de page
- Objectif : `#a-propos`, `#contact`, footer, page `/mentions-legales`.
- Fini quand : captures comparées ; aucun `href="#"` dans `dist`.

### 7. Interactions et accessibilité
- Objectif : bascule de thème (aria-pressed), nav sticky avec `aria-current`, sous-nav ≤ 720 px,
  apparition des PixelArt au scroll (sauf `prefers-reduced-motion`), focus visible, cibles ≥ 44 px.
- Fini quand : 0 erreur axe dans les deux thèmes ; JS client < 5 ko ; navigation clavier vérifiée.

### 8. CI, README, déploiement
- Objectif : workflow GitHub Actions (build strict, `[`/`href="#"`, liens internes, axe, poids JS,
  domaines tiers) ; README (lancer, éditer via Pages CMS, déployer sur Coolify).
- Fini quand : la CI locale passe en mode placeholders ; checklist « Définition de fini » cochée avec preuves.
