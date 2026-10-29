// Briques du socle (socle/js/briques/), plus ce qui n'appartient qu'à ce cours.

export * from '../../socle/js/briques/commun.js';
import { champ } from '../../socle/js/ui/controls.js';

// Les deux coordonnées d'un point qu'on fait aussi glisser à la souris, en deux
// champs côte à côte (curseur, flèches ▲ ▼ et saisie) : la souris ne doit pas
// être le seul moyen de régler une grandeur. `champs` : [{ latex, min, max,
// pas, pasFleche }] ; `change([a, b])` à chaque modification. Renvoie
// { fixe([a, b]), bornes(i, min, max) } ; `fixe` est appelé après un glisser.
export function champsPoint(parent, champs, valeurs, change) {
  const ligne = document.createElement('div');
  ligne.className = 'reglages-2';
  parent.appendChild(ligne);
  const courant = valeurs.slice();
  const c = champs.map((options, i) =>
    champ(ligne, { pas: 0.01, pasFleche: 0.1, ...options, valeur: valeurs[i] }, (v) => {
      courant[i] = v;
      change(courant.slice());
    }),
  );
  return {
    fixe(v) {
      v.forEach((x, i) => {
        courant[i] = x;
        c[i].fixe(x);
      });
    },
    bornes: (i, min, max) => c[i].bornes(min, max),
  };
}

// Molette sur un canevas qui règle une grandeur en échelle logarithmique (la
// taille d'une fenêtre, un pas) : `change(d)`, d en décades, positif quand on
// tourne vers soi (on dézoome), borné à une décade par cran.
export function molette(canvas, change) {
  canvas.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      change(Math.max(-1, Math.min(1, ev.deltaY / 400)));
    },
    { passive: false },
  );
}
