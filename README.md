# gardenofearth.games

Site du studio **Garden of Earth Game** : accueil, une page par jeu ou appli, leurs politiques de
confidentialité (à donner à Google Play), mentions légales. En français et en anglais.

Aucune dépendance : `node build.mjs` fabrique le site dans `dist/`. GitHub le publie tout seul à chaque
modification de `main` (voir `.github/workflows/pages.yml`).

## Modifier les textes du studio

Tout est dans **`site.json`** : slogan, présentation, valeurs, e-mail de contact (`fr` et `en`).

## Ajouter un jeu ou une appli

1. Copier le dossier `games/bauform/` en `games/<nom-court>/` (le nom devient l'adresse : `gardenofearth.games/<nom-court>/`).
2. Remplacer les images : `icon.png` (512 × 512), `feature-fr.png` / `feature-en.png` (1024 × 500), `poster.png` (image mise en avant), `screens/` (captures).
3. Modifier `game.json` :
   - `slug` : le même nom court que le dossier ;
   - `kind` : `"game"` ou `"app"` ;
   - `order` : position dans la liste ;
   - `status` : `"in-development"`, `"coming-soon"` ou `"available"` ;
   - `platforms[].url` : le lien Google Play une fois le jeu publié (le bouton « Télécharger » apparaît tout seul) ;
   - `theme` : les couleurs de sa page ;
   - textes `fr` et `en`.
4. Écrire sa politique de confidentialité dans `privacy.fr.html` et `privacy.en.html` (morceaux de HTML : `<h2>`, `<p>`), et mettre à jour `privacyUpdated`.

Un dossier qui commence par `_` est ignoré (brouillon).

## Adresses utiles

- Bauform : https://gardenofearth.games/bauform/
- Confidentialité de Bauform (Google Play) : https://gardenofearth.games/bauform/privacy/
- Mentions légales : https://gardenofearth.games/mentions-legales/

## Mise en ligne (une seule fois)

1. **Settings > Pages** : Source « GitHub Actions » ; Custom domain `gardenofearth.games` ; cocher « Enforce HTTPS » dès que possible.
2. **DNS du domaine** (Squarespace Domains, ex-Google Domains) :

   | Type | Nom | Valeur |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | pinocchi00.github.io |

## Polices et licences

Police Jost (SIL Open Font License 1.1, `static/fonts/OFL.txt`). Images de Bauform : projet Bauform-Block-Puzzle.
