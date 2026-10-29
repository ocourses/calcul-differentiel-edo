# Calcul différentiel et EDO : explorer le cours

Site web statique pour explorer le cours de calcul différentiel et d'équations
différentielles ordinaires (parcours ModIA) : des illustrations interactives du
poly et des TP. On y manipule les objets du cours (une condition initiale qu'on
clique, un pendule qu'on saisit, un tableau de Butcher qu'on modifie), et l'on
regarde ce que dit le théorème.

Le site est construit sur le socle commun des sites de cours,
[`ocots-site`](https://github.com/ocourses/ocots-site), en sous-module dans
`socle/` et épinglé sur un tag : gabarits, feuille de style, briques, moteur du
glossaire et CI viennent de lui. Le cours n'écrit que ce qui le distingue :
`site.config.js`, ses illustrations, son catalogue, son glossaire et
`css/cours.css`. Les conventions sont celles de
[`site.md`](https://github.com/ocourses/ocots-conventions/blob/main/site.md),
plus les arbitrages du cours ([`CONVENTIONS.md`](CONVENTIONS.md)).

## Lancer le site

Il n'y a aucune étape de construction ni dépendance : il suffit de servir le
dossier.

```bash
git submodule update --init   # une fois après le clone : le socle (site/socle/)
cd site
npm run serve        # http://localhost:8000/, sans mise en cache
npm test             # tests du cours et du socle (Node ≥ 20)
```

KaTeX est chargé depuis un CDN ; tout le reste est dans le dépôt.

## Un site pour explorer le cours

L'accueil (`index.html`) est une **carte du cours**, organisée en thèmes dans
l'ordre du poly. Chaque thème propose des illustrations interactives, listées
dans `js/illustrations/catalogue.js`.

| Thème | Illustrations |
|---|---|
| Applications différentiables | tangence à une application affine (zoom, reste en log-log) ; dérivées directionnelles sans différentiabilité (contre-exemple du poly) ; la jacobienne déforme une petite grille, et la règle des composées ; formules de Taylor (surface 3D, plan tangent, quadrique) ; dérivées numériques, le « V » de l'erreur (TP) |
| Existence et unicité | le problème de Cauchy d'un clic (intervalle maximal, temps de vie) ; quand l'unicité tombe (√\|x\|, 3\|x\|^{2/3}, condition du double cône) ; théorème d'échappement (compacts emboîtés) ; approximations successives et Grönwall |
| Équations linéaires | exponentielle de matrice (sommes partielles, majoration du poly, eᴬeᴮ ≠ eᴬ⁺ᴮ) ; variation de la constante (réponses élémentaires) |
| Flot | le flot transporte les ensembles (formule du flot, Liouville) ; le pendule qu'on attrape (portrait de phase, période) ; équation linéarisée (exemple du poly, pendule, Lorenz) |
| Intégration numérique | Euler pas à pas (erreurs locales, éventail, stabilité) ; ordre de convergence et tableau de Butcher modifiable ; schémas implicites (point fixe, Newton, raideur en complément) |
| Grands théorèmes | inversion locale et fonctions implicites (continuation de la ligne de niveau) |

Toutes les illustrations suivent le même **gabarit** (`illustration.html?id=…`) :

- « Ce que dit le cours » énonce le résultat, avec le renvoi au poly ou au TP ;
- l'illustration se manipule : on clique, on fait glisser, on règle des valeurs
  au curseur, aux petites flèches ▲ ▼ ou au clavier ;
- « À essayer » propose des questions guidées, dont certaines règlent
  l'illustration d'un clic.

Les termes définis dans le poly sont soulignés : leur définition s'affiche en
infobulle (`js/illustrations/glossaire.js`). Chaque figure a un bouton « i » qui
explique ses tracés. Les réglages sont dans l'URL, pour partager une expérience ;
les préférences d'affichage restent dans le navigateur. Les animations
respectent `prefers-reduced-motion`.

### Ajouter une illustration

Avant d'écrire ou de reprendre une illustration, lire
[`CONVENTIONS.md`](CONVENTIONS.md) : mise en page, typographie, rôle des
couleurs, ce qui va dans l'URL ou dans le navigateur, interactions et
vérifications.

Un module `js/illustrations/<id>.js` exporte par défaut
`{ etat, rappel, essais, monte(zone, outils) }`, et au besoin `preferences`,
`choix` et `termes` :

- `etat` : les réglages par défaut (nombres, textes ou booléens), gardés dans l'URL ;
- `rappel` : les paragraphes du cours, avec des formules `$…$` (ou `$$…$$` pour
  une formule centrée) ; un élément qui est un tableau de textes devient une
  liste à puces ;
- `essais` : `{ texte, etat?, preferences? }` ; avec `etat`, un bouton
  « Essayer » applique ce réglage ;
- `preferences` : les préférences d'affichage par défaut, gardées dans le
  navigateur (clé `calcul-differentiel-edo.illustration.<id>`) ;
- `termes` : les termes du glossaire employés par la page ;
- `choix` : les valeurs permises des réglages textuels ;
- `monte(zone, outils)` construit l'illustration dans `zone` et renvoie
  `{ applique() }`, appelé après un « Essayer ».

Les briques communes sont celles du socle (`socle/js/briques/` : cartes,
canevas, légendes, tableaux, glisser à la souris, zoom ; `socle/js/ui/` : repère
2D, champs à curseur, flèches et saisie, infobulles, surfaces 3D ;
`socle/js/core/` : intégrateurs, systèmes linéaires plans), réexportées par
`js/illustrations/commun.js`, qui garde ce qui n'appartient qu'à ce cours
(`champsPoint`). On déclare enfin l'illustration dans
`js/illustrations/catalogue.js`. Les fonctions mathématiques de chaque module
sont exportées et testées sous Node contre le poly ou le TP
(`tests/illustrations.test.js`).
