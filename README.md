# Portfolio de Tristan Ginet

Site d'une page (plus les mentions légales), généré en statique à partir de la maquette
Claude Design « Accueil — Tristan Ginet » et du design system **Signal**.

- **Astro 7** (sortie statique) + TypeScript strict, aucun framework côté client (≈ 1,7 ko de JS) ;
- **Tailwind CSS 4** : le thème ne contient que les tokens Signal (`src/styles/signal-tokens.css`) ;
- **Pages CMS** pour éditer le contenu (`src/content`, configuré par `.pages.yml`) ;
- polices auto-hébergées (Fontsource) : le site n'appelle aucun domaine tiers ;
- hébergement : build statique servi par **Coolify**.

## Lancer le projet

Prérequis : Node 24 (`nvm use` lit `.nvmrc`).

```bash
npm ci
npm run dev          # http://localhost:4321, contenus [à remplacer] tolérés
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement (tolère les contenus `[à remplacer]`). |
| `npm run build` | Build de **production** : échoue tant qu'un contenu est entre crochets. |
| `npm run build:draft` | Build de brouillon, crochets tolérés (captures, tests e2e). |
| `npm run preview` | Sert `dist/`. |
| `npm run check` | Typage (`astro check`). |
| `npm test` / `npm run coverage` | Tests unitaires (Vitest), avec couverture LCOV. |
| `npm run e2e` | Tests e2e sur `dist/` (Playwright + axe) : lancer un build avant. |
| `npm run verify` / `verify:draft` | Contrôle de `dist/` : crochets, `href="#"`, liens cassés, ressources tierces, JS < 5 ko. |
| `node scripts/screenshots.mjs <url> <dossier>` | Captures 1440 / 900 / 390 px, sombre et clair. |

### Organisation

```
src/
  content/            contenu édité par Tristan (JSON + Markdown)
  content.config.ts   collections Astro
  lib/                logique pure, testée (schémas, pixels, spectre, parcours, portrait…)
  components/ui/      composants Signal (Button, Tag, PixelArt, ProjectCard…)
  components/layout/  NavBar, SubNav, Section, Footer, ThemeToggle
  components/sections/ une section de la page par composant
  styles/             tokens Signal, tokens du portfolio, thème Tailwind
tests/                tests unitaires (Vitest)
e2e/                  tests de bout en bout (Playwright)
scripts/              vérification de dist/, Lighthouse, captures
```

## Éditer le contenu avec Pages CMS

1. Aller sur [app.pagescms.org](https://app.pagescms.org) et se connecter avec GitHub.
2. Installer l'application GitHub Pages CMS sur le compte qui possède le dépôt, puis ouvrir le dépôt.
3. Le menu reprend `.pages.yml` :
   - **Site** : identité, liens (GitHub, LinkedIn, CV), textes de la navigation, du hero, du contact, du pied de page ;
   - **Parcours** : expériences et formations (triées automatiquement, la plus récente d'abord ; une fin vide = « auj. ») ;
   - **À propos** : les trois étapes, la bio, les tuiles (une seule « mise en avant ») ;
   - **Projets** : un fichier Markdown par projet. Un seul projet « à la une » ; les autres sont des cartes triées par « ordre » ;
   - **Mentions légales**.
4. Chaque enregistrement crée un commit sur le dépôt. Coolify redéploie ensuite le site.

À savoir :

- **Les crochets `[…]` marquent un contenu à remplacer.** Pages CMS refuse d'enregistrer un texte qui en
  contient, et le build de production échoue tant qu'il en reste.
- **Photo** : envoyer la photo telle quelle (champ « Photo », dossier `src/assets/media`). Au build, elle
  est recadrée et tramée en pixels vert signal (41 × 47 pixels), comme le reste du site.
- **CV** : déposer le PDF (dossier `public/documents`). Le même fichier sert au hero, au parcours et au pied de page.
- **LED Tristan** : ne pas renseigner le lien « Code » tant que l'historique Git du dépôt contient
  le mot de passe Wi-Fi.

### Contenus à remplacer avant la mise en ligne

`npm run build` les signale fichier par fichier (il s'arrête au premier fichier en erreur) ;
`grep -rnoE '\[[A-Za-zÀ-ÿ0-9][^]"]*\]' src/content` donne la liste complète. Aujourd'hui :

| Fichier | Champ |
| --- | --- |
| `site.json` | photo, CV, URL GitHub, URL LinkedIn, mode de travail (« remote / hybride ») |
| `parcours.json` | intitulés de poste (Bedrock, URSSAF), année de début du BUT, spécialité du mastère |
| `apropos.json` | période de l'étape 1 (année du BUT), suite de la bio, « à distance » |
| `projets/reco-streaming.md` | pastille résultat (chiffre clé) |
| `pages/mentions-legales.md` | statut et SIRET, coordonnées de l'hébergeur du VPS |

## Déployer sur Coolify

1. Dans Coolify : **New Resource → Public/Private Repository** (via l'application GitHub de Coolify,
   pour que chaque push déclenche un déploiement), branche `main`.
2. **Build Pack** : Nixpacks. **Site type** : Static. **Publish Directory** : `/dist`.
3. **Build Command** : `npm run build` (la valeur détectée). Node est pris dans `.nvmrc` (24).
   Ne pas définir `ALLOW_PLACEHOLDERS` : le build de production doit refuser les contenus à remplacer.
4. Ajouter le domaine. Coolify sert `dist/` par Nginx sur le port 80 et gère le certificat HTTPS.

Tant qu'un contenu est entre crochets, le build échoue et Coolify garde la version précédente en ligne.

## Qualité

La CI (`.github/workflows/ci.yml`) a deux jobs :

- **qualite** : typage, tests unitaires, build de brouillon, `verify:draft`, tests e2e (axe sans violation
  en sombre et clair à 1440 et 390 px, clavier, thème, aucune requête tierce), Lighthouse ≥ 95 sur les 4 axes ;
- **publication** : build de production et `verify`. Ce job reste rouge tant que des contenus sont à remplacer.
