# Conventions des pages d'illustration

Les règles des sites de cours sont celles de
[`site.md`](https://github.com/ocourses/ocots-conventions/blob/main/site.md)
(`WEB1`–`WEB20`, d'`ocots-conventions`), pour le socle épinglé dans `socle/`.
Ce fichier ne garde que ce qui est propre à ce cours : ses arbitrages et les
règles qu'il est seul à appliquer pour l'instant. Le fonctionnement d'un module
d'illustration est décrit dans le `README.md`, section « Ajouter une
illustration ».

**Page de référence** : « Le problème de Cauchy, d'un clic »
(`js/illustrations/cauchy.js`).

## 1. Couleurs ([WEB11](https://github.com/ocourses/ocots-conventions/blob/main/site.md#web11--une-couleur-un-rôle-défini-par-le-cours))

| Rôle | Variable | Usage |
|---|---|---|
| Trajectoires, texte | `--texte` | orbites, trajectoires, courbes principales |
| Accent | `--accent` | l'objet courant : la solution choisie, le point d'équilibre stable, la direction propre |
| Zone | `--zone-stable` | bassin d'attraction, ensemble emporté par le flot, zone de stabilité |
| Choix à la souris | `--perturbation` (orange) | le point ou la condition initiale choisis d'un clic, rappelés partout de la même couleur (x₀ dans le portrait, en t = 0 dans la solution) |
| Équilibres | `--equilibre` (violet) | point d'équilibre, ensemble limite |
| Alerte | `--alerte` (rouge) | ce qui échoue ou diverge : équilibre instable, schéma qui explose ; jamais pour autre chose |
| Discret | `--discret` | champ de vecteurs, graduations, objets secondaires |

- Des séries comparées (schémas numériques, méthodes) prennent `--serie-1` à
  `--serie-4`, qui n'ont pas d'autre rôle : on n'emprunte pas le rouge d'alerte
  pour distinguer des courbes. Une courbe étudiée est en `--accent` ; son
  linéarisé, en tirets `--texte`. Un équilibre stable est un point plein
  violet, un équilibre instable un cercle violet.

## 2. Notations et nombres

- **Fidélité au poly.** Les énoncés du cours sont ceux du poly, avec ses
  notations, et la source affichée est celle du poly ou du TP cité. Le renvoi
  donne le numéro du résultat tel qu'il apparaît dans le PDF.
- **Nombres qui bougent** ([WEB5](https://github.com/ocourses/ocots-conventions/blob/main/site.md#web5--une-mise-en-page-qui-ne-bouge-pas-quand-une-valeur-change)) :
  virgule fixe (`latexNombreFixe`, `latexMatriceFixe`) ; une erreur qui
  traverse plusieurs ordres de grandeur (erreur globale, écart, pas $h$) en
  notation scientifique de largeur fixe (`latexScientifiqueFixe`). Les tableaux
  de valeurs, en police à chasse fixe, gardent leur écriture courte.
- **Lecture des nombres saisis.** Un tableau de Butcher se modifie au clavier :
  `lisNombre` (`ordre.js`) accepte les fractions (`1/2`) comme les décimaux,
  pour qu'on saisisse les schémas du poly tels qu'ils y sont écrits.

## 3. État et sauvegarde ([WEB13](https://github.com/ocourses/ocots-conventions/blob/main/site.md#web13--deux-mémoires--lurl-pour-lexpérience-le-navigateur-pour-le-confort))

- Préférences d'une illustration : clé `calcul-differentiel-edo.illustration.<id>`
  (inchangée à la migration : les réglages des lecteurs sont gardés).
- Le zoom d'une courbe n'est sauvé nulle part : il revient au cadre
  automatique à chaque visite.

## 4. Mise en page propre au cours

- **Dispositions.** La disposition la plus fréquente est `.grille-large` (une
  grande figure à gauche, une colonne de cartes `.colonne-cartes` à droite,
  propre à ce cours) ; `.grille-2` et `.grille-3` viennent du socle. La rangée
  des figures principales porte la classe `principale` ou, pour deux rangées,
  `plus-haut` et `rangee-basse`. Une figure et sa formule côte à côte forment
  un `.figure-et-formule`.
- **Compléments repliables.** Un contenu annexe (un contre-exemple, un schéma
  raide) va dans un `repliable()`, fermé par défaut, dont l'état est gardé
  dans les préférences.
- **Texte de hauteur fixe.** Un texte qui change avec les réglages réserve sa
  hauteur : `.note.conclusion-fixe` (une ligne), `.texte-fixe` et
  `.texte-fixe.six-lignes` dans une colonne étroite. Sans cela, la figure
  change de taille quand le texte passe à la ligne.
- **Champs sur deux colonnes.** Beaucoup de paramètres dans une carte se
  rangent deux par deux (`.reglages-2`) ; un champ imposé par les autres
  réglages reste en place, grisé (`.champ.inactif`).
- **Tableaux du cours.** Le tableau de Butcher modifiable est un `.butcher` ;
  un tableau de conditions vérifiées est un `table.conditions` (`.vrai` /
  `.faux`), un tableau de valeurs dont une ligne suit le réglage est un
  `table.valeurs` (`tr.choisie`).

## 5. Interactions propres au cours

Le clavier et l'aimantation exacte suivent [WEB14](https://github.com/ocourses/ocots-conventions/blob/main/site.md#web14--plusieurs-moyens-de-régler-une-valeur-dont-le-clavier),
l'animation [WEB15](https://github.com/ocourses/ocots-conventions/blob/main/site.md#web15--une-animation-sobre-et-pas-de-calcul-qui-fige-le-geste).
Ce cours y ajoute :

- **Un point glissé a ses deux champs.** Ses coordonnées sont dans deux
  champs côte à côte (`champsPoint` de `commun.js`), synchronisés avec le
  glisser.
- **Esquisse pendant le geste.** Un calcul qui dépend du point qu'on fait
  glisser (le transport d'un ensemble par le flot, une intégration longue) se
  fait pendant le geste avec moins de points et un pas plus grand, puis
  complètement au lâcher.
- **Chaque figure règle ce qu'elle montre.** Quand une grandeur réglable a
  une lecture sur une figure, cette figure la règle aussi, et les figures
  liées se suivent dans les deux sens : un clic sur une courbe d'erreur en
  fonction de $N$, de $h$ ou de $\delta$ choisit cette valeur ; un point image
  se saisit, et l'antécédent suit (inverse local, flot remonté) ; une ligne
  de tableau se clique. Un geste sans lecture géométrique n'est pas ajouté.
- **Molette.** Sur un plan où le glisser déplace un point, la molette zoome
  sans déplacer la vue (`zoomable`, `deplacer: false`). Sur une figure dont
  l'échelle est elle-même la grandeur (fenêtre de `tangence`, $\varepsilon$
  de `jacobienne`, pente du cône), la molette la règle en échelle
  logarithmique (`molette` de `commun.js`). Sur un graphe où l'on veut aussi
  déplacer la vue (fond du V des différences finies), le bouton gauche règle
  la grandeur et le bouton droit (ou Maj + gauche) déplace la vue
  (`zoomable({ deplacer: 'droit' })` et `boutonVue` du socle).
- **Surface 3D.** Comme Fubini (mesure-intégration) : le bouton gauche
  déplace le point étudié sur la surface, le bouton droit (ou Maj + gauche)
  fait tourner la vue ; au doigt, on saisit la bille et l'on tourne ailleurs.
  Le geste saisit la surface : tirer vers la droite la fait tourner vers la
  droite, tirer vers le bas fait voir le dessus (`Vue3D` du socle avec
  `tourne`, et `pointDuPlan` pour le point saisi ; formules de Taylor).

## 6. Glossaire ([WEB12](https://github.com/ocourses/ocots-conventions/blob/main/site.md#web12--le-glossaire-du-poly-déclaré-par-chaque-page))

- `tests/illustrations.test.js` vérifie que tout terme du glossaire employé
  dans « Ce que dit le cours » ou « À essayer » est déclaré dans `termes`, et
  réciproquement ; les homonymes (« erreur globale » n'est pas une « solution
  globale ») sont listés à part dans le test.
- Chaque définition cite sa source dans le poly (`source: 'Poly, chapitre …'`),
  ce que le même test vérifie.

## 7. Essais (« À essayer »)

Un essai décrit exactement ce qu'on voit ([WEB17](https://github.com/ocourses/ocots-conventions/blob/main/site.md#web17--un-essai-décrit-exactement-ce-quon-voit)).
Ce cours y ajoute : sur une page animée, un essai lance l'animation
(`preferences: { anime: true }`), pour qu'on voie l'effet décrit.
