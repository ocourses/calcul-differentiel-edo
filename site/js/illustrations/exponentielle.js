// Exponentielle de matrice (poly, chapitre « Équations différentielles
// linéaires ») : e^{tA} = Σ (tA)^k / k!. Dans le plan, le chemin des sommes
// partielles x₀, x₀ + tAx₀, x₀ + tAx₀ + (tA)²x₀/2, … arrive sur x(t) = e^{tA}x₀,
// la solution du problème de Cauchy ẋ = Ax, x(0) = x₀, dont la vitesse est
// Ae^{tA}x₀. À côté, l'erreur de la somme partielle et la majoration du poly
// par la queue de la série de e^{‖tA‖}. En complément, le contre-exemple du
// poly : e^A e^B ≠ e^{A+B} quand A et B ne commutent pas.

import { applique, exponentielle } from '../../socle/js/core/dim2.js';
import { champ } from '../../socle/js/ui/controls.js';
import { latexMatrice, latexMatriceFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, boutonVue, carte, champsPoint, choixRadios, glisse, legende, paragraphe, repliable, toile, zoomable } from './commun.js';

export const produit = (M, N) => M.map((ligne) => N[0].map((_, j) => ligne.reduce((s, m, k) => s + m * N[k][j], 0)));
const somme = (M, N, a = 1) => M.map((ligne, i) => ligne.map((m, j) => m + a * N[i][j]));
// Norme de Frobenius, sous-multiplicative (poly).
export const frobenius = (M) => Math.hypot(...M.flat());

// Sommes partielles S_N = Σ_{k ≤ N} (tA)^k / k!, pour N = 0, …, Nmax.
export function sommesPartielles(A, t, Nmax) {
  const tA = A.map((l) => l.map((v) => t * v));
  let terme = [
    [1, 0],
    [0, 1],
  ];
  let S = terme;
  const res = [S];
  for (let k = 1; k <= Nmax; k++) {
    terme = produit(terme, tA).map((l) => l.map((v) => v / k));
    S = somme(S, terme);
    res.push(S);
  }
  return res;
}

// Majoration du poly : ‖e^{tA} − S_N‖ ≤ Σ_{k > N} ‖tA‖^k / k! = e^{‖tA‖} − Σ_{k ≤ N} ‖tA‖^k / k!.
// Instant s ∈ [−3, 8] où e^{sA}x₀ passe au plus près de p.
export function instantLePlusProche(A, x0, p, n = 1100) {
  let [meilleur, d] = [0, Infinity];
  for (let k = 0; k <= n; k++) {
    const s = -3 + (11 * k) / n;
    const q = applique(exponentielle(A, s), x0);
    const e = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (e < d) [meilleur, d] = [s, e];
  }
  return meilleur;
}

export function queue(nA, N) {
  let s = 0;
  let terme = 1;
  for (let k = 0; k <= N; k++) {
    s += terme;
    terme *= nA / (k + 1);
  }
  // Pour de grands N, on somme directement la queue (pas de soustraction).
  if (Math.exp(nA) - s < 1e-12 * Math.exp(nA)) {
    let q = 0;
    let u = terme;
    for (let k = N + 1; k < N + 200 && u > 1e-300; k++) {
      q += u;
      u *= nA / (k + 1);
    }
    return q;
  }
  return Math.exp(nA) - s;
}

export const MATRICES = {
  rotation: { latex: 'A = \\begin{pmatrix} 0 & 1 \\\\ -1 & 0 \\end{pmatrix}', A: [[0, 1], [-1, 0]], note: '$A$ antisymétrique : $e^{tA}$ est une rotation, la solution reste sur un cercle.' },
  nilpotente: { latex: 'N = \\begin{pmatrix} 0 & 1 \\\\ 0 & 0 \\end{pmatrix}', A: [[0, 1], [0, 0]], note: '$N^2 = 0$ : la série s’arrête, $e^{tN} = I + tN$. Dès $N \\ge 1$, la somme partielle est exacte.' },
  diagonale: { latex: 'D = \\begin{pmatrix} -1 & 0 \\\\ 0 & 0{,}5 \\end{pmatrix}', A: [[-1, 0], [0, 0.5]], note: '$e^{tD}$ est diagonale, de coefficients $e^{-t}$ et $e^{t/2}$ : chaque coordonnée suit sa propre exponentielle.' },
  quelconque: { latex: 'A = \\begin{pmatrix} -0{,}3 & 2 \\\\ -1 & -0{,}5 \\end{pmatrix}', A: [[-0.3, 2], [-1, -0.5]], note: 'Valeurs propres complexes de partie réelle négative : la solution spirale vers $0$.' },
};

// Contre-exemple du poly.
export const A_CE = [
  [0, 1],
  [0, 0],
];
export const B_CE = [
  [0, 0],
  [1, 0],
];

export default {
  etat: { mat: 'rotation', t: 2, N: 3, x1: 1, x2: 0 },

  choix: { mat: Object.keys(MATRICES) },

  preferences: { contreExemple: false },

  termes: ['exponentielle', 'problème de Cauchy', 'solution maximale', 'solution globale', 'différentiable'],

  rappel: [
    'L’exponentielle de $A \\in \\mathcal M_n(\\mathbb R)$ est la somme de la série absolument convergente',
    '$$e^A = \\sum_{k = 0}^{\\infty} \\frac{A^k}{k!}, \\qquad \\Big\\| \\frac{A^k}{k!} \\Big\\| \\le \\frac{\\|A\\|^k}{k!},$$',
    'pour une norme sous-multiplicative (par exemple celle de Frobenius). L’application $t \\mapsto e^{tA}$ est dérivable et $\\frac{\\mathrm d}{\\mathrm dt} e^{tA} = A\\,e^{tA} = e^{tA} A$.',
    'L’unique solution maximale du problème de Cauchy $\\dot x = Ax$, $x(0) = x_0$ est',
    '$$x(t) = e^{tA}x_0 ;$$',
    'elle est globale.',
    'Si $A$ et $B$ commutent, $e^{A+B} = e^A e^B$ ; en particulier $e^A$ est inversible, d’inverse $e^{-A}$. Sans commutation, c’est faux en général : voir le contre-exemple, à déplier.',
  ],

  essais: [
    { texte: 'Rotation, $t = 2$ : augmentez $N$ de $0$ à $8$. Le chemin des sommes partielles s’enroule et finit sur le cercle, au point $x(2)$.', etat: { mat: 'rotation', t: 2, N: 0, x1: 1, x2: 0 } },
    { texte: 'Prenez $t = 6$ : il faut bien plus de termes, car $\\|tA\\|$ est grand. Comparez la courbe d’erreur à la majoration $\\sum_{k > N} \\|tA\\|^k/k!$.', etat: { mat: 'rotation', t: 6, N: 6, x1: 1, x2: 0 } },
    { texte: 'Matrice nilpotente : dès $N = 1$, l’erreur est nulle. Le chemin a un seul segment.', etat: { mat: 'nilpotente', t: 1.5, N: 1, x1: 0.5, x2: 1 } },
    { texte: 'Déplacez $x_0$, puis faites varier $t$ : la flèche $A\\,x(t)$ est toujours tangente à la trajectoire.', etat: { mat: 'quelconque', t: 1, N: 4, x1: 1.5, x2: 0.5 } },
    { texte: 'Prenez $t < 0$ : $e^{tA}$ remonte le temps, et $e^{-tA} = (e^{tA})^{-1}$.', etat: { mat: 'diagonale', t: -1, N: 4, x1: 1, x2: 1 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;
    const prefs = outils.preferences;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'mat',
      options: Object.entries(MATRICES).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        outils.change({ mat: valeur });
        zoom.reinitialise();
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    // ---- Plan de phase ------------------------------------------------------------------------------
    const cPlan = carte(grille, 'Solution $x(t) = e^{tA}x_0$ et sommes partielles');
    boutonInfo(cPlan, [
      ['ligne', '--accent', 'La trajectoire $s \\mapsto e^{sA}x_0$, de $0$ à $t$.'],
      ['ligne', '--serie-1', 'Le chemin des sommes partielles : $S_0 x_0 = x_0$, puis on ajoute $\\frac{(tA)^k}{k!}x_0$ à chaque étape, jusqu’à $S_N x_0$.'],
      ['fleche', '--texte', 'La vitesse $\\dot x(t) = A\\,e^{tA}x_0$, tangente à la trajectoire.'],
      ['point', '--perturbation', 'La condition initiale $x_0$ : faites-la glisser.'],
      ['point', '--accent', 'Le point $x(t)$ : faites-le glisser le long de la trajectoire, $t$ suit. La molette zoome, le clic droit déplace la vue.'],
    ]);
    const canvas = toile(cPlan, '1 / 1', () => dessine());
    canvas.classList.add('saisissable');
    const rep = new Repere(canvas, { x: [-2.5, 2.5], y: [-2.5, 2.5], egal: true });
    // On saisit x(t) (t suit, au point de la trajectoire le plus proche) ou x₀.
    let saisi = null;
    const barrePlan = document.createElement('div');
    barrePlan.className = 'barre-legende';
    const zoneLegende = document.createElement('div');
    barrePlan.appendChild(zoneLegende);
    // Cadre automatique, recalculé à chaque dessin (trajectoire et sommes partielles).
    let cadreAuto = { x: [-2.5, 2.5], y: [-2.5, 2.5] };
    const zoom = zoomable(canvas, rep, { barre: barrePlan, auto: () => cadreAuto, redessine: () => dessine(), deplacer: 'droit' });
    glisse(canvas, rep, {
      prend: (a, b, ev) => {
        if (boutonVue(ev)) return false;
        const xt = applique(exponentielle(MATRICES[r.mat].A, r.t), [r.x1, r.x2]);
        saisi = Math.hypot((a - xt[0]) * rep.sx, (b - xt[1]) * rep.sy) < 10 ? 't' : 'x0';
        return true;
      },
      deplace: (a, b) => {
        if (saisi === 't') fixeT(instantLePlusProche(MATRICES[r.mat].A, [r.x1, r.x2], [a, b]));
        else outils.change({ x1: Number(a.toFixed(3)), x2: Number(b.toFixed(3)) });
        dessine();
      },
    });
    function fixeT(t) {
      outils.change({ t: Number(t.toFixed(2)) });
      champT.fixe(r.t);
    }
    cPlan.appendChild(barrePlan);

    // ---- Colonne : réglages et matrices, erreur --------------------------------------------------------
    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cMat = carte(colonne, 'Somme partielle $S_N(tA) = \\sum_{k \\le N} \\frac{(tA)^k}{k!}$');
    const champT = champ(cMat, { latex: 't', min: -3, max: 8, pas: 0.01, pasFleche: 0.1, valeur: r.t }, (v) => {
      outils.change({ t: v });
      dessine();
    });
    const champN = champ(cMat, { latex: 'N', min: 0, max: 25, pas: 1, valeur: r.N }, (v) => {
      outils.change({ N: Math.max(0, Math.min(60, Math.round(v))) });
      dessine();
    });
    const point = champsPoint(
      cMat,
      [
        { latex: 'x_{0,1}', min: -2.5, max: 2.5 },
        { latex: 'x_{0,2}', min: -2.5, max: 2.5 },
      ],
      [r.x1, r.x2],
      ([x1, x2]) => {
        outils.change({ x1, x2 });
        dessine();
      },
    );
    const formules = document.createElement('div');
    formules.className = 'formule';
    cMat.appendChild(formules);
    const note = paragraphe(cMat, '', 'note conclusion-fixe');

    const cErreur = carte(colonne, 'Erreur en fonction de $N$');
    boutonInfo(cErreur, [
      ['ligne', '--accent', '$\\|e^{tA} - S_N(tA)\\|$ (norme de Frobenius), en échelle logarithmique.'],
      ['tirets', '--texte', 'La majoration du poly : $\\sum_{k > N} \\|tA\\|^k / k!$.'],
      ['point', '--perturbation', 'Le $N$ choisi : cliquez sur la figure pour en changer.'],
    ]);
    const canvasErreur = toile(cErreur, '16 / 9', () => dessine());
    canvasErreur.classList.add('saisissable');
    const repErreur = new Repere(canvasErreur, { x: [0, 25], y: [-16, 2] });
    glisse(canvasErreur, repErreur, {
      deplace: (N) => {
        outils.change({ N: Math.max(0, Math.min(25, Math.round(N))) });
        champN.fixe(r.N);
        dessine();
      },
    });

    // ---- Contre-exemple, repliable -----------------------------------------------------------------
    const ce = repliable(zone, 'Contre-exemple du poly : $e^A e^B \\neq e^{A+B}$', {
      ouvert: prefs.valeurs.contreExemple,
      change: (ouvert) => {
        prefs.change({ contreExemple: ouvert });
        dessine();
      },
    });
    // Déplié, il passe par-dessus les figures au lieu de leur prendre de la hauteur.
    ce.carte.classList.add('superpose');
    const grilleCE = document.createElement('div');
    grilleCE.className = 'grille-3';
    ce.contenu.appendChild(grilleCE);
    const eA = exponentielle(A_CE, 1);
    const eB = exponentielle(B_CE, 1);
    const vues = [
      { titre: 'e^A e^B', M: produit(eA, eB) },
      { titre: 'e^B e^A', M: produit(eB, eA) },
      { titre: 'e^{A+B}', M: exponentielle(somme(A_CE, B_CE), 1) },
    ].map(({ titre, M }) => {
      const d = document.createElement('div');
      d.className = 'figure-et-formule';
      grilleCE.appendChild(d);
      const c = toile(d, '1 / 1', () => dessine());
      const f = document.createElement('div');
      f.className = 'formule';
      outils.rend(f, `${titre} = ${latexMatrice(M)}`);
      d.appendChild(f);
      // L'image du carré unité reste dans [0, 3]² (sommet (3, 2) pour e^A e^B).
      return { M, rep: new Repere(c, { x: [-0.4, 3.4], y: [-0.4, 3.4], egal: true, marges: { gauche: 4, bas: 4, haut: 4, droite: 4 } }) };
    });
    paragraphe(
      ce.contenu,
      'Avec $A = \\begin{pmatrix} 0 & 1 \\\\ 0 & 0 \\end{pmatrix}$ et $B = \\begin{pmatrix} 0 & 0 \\\\ 1 & 0 \\end{pmatrix}$, $A^2 = B^2 = 0$ et $(A + B)^2 = I_2$, d’où $e^{A+B} = \\cosh(1)\\,I_2 + \\sinh(1)\\,(A + B)$ : l’image du carré unité diffère dans les trois cas.',
      'note',
    );
    const CARRE = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];

    function dessine() {
      const col = couleurs();
      const { A, note: texteNote } = MATRICES[r.mat];
      choix.fixe(r.mat);
      const x0 = [r.x1, r.x2];
      point.fixe(x0);
      const E = exponentielle(A, r.t);
      const S = sommesPartielles(A, r.t, Math.max(r.N, 25));

      // ---- Plan ----
      // Cadre : la trajectoire et le chemin des sommes partielles, dans une
      // boîte carrée de demi-côté entre 2,5 et 40.
      const n = 300;
      const traj = Array.from({ length: n + 1 }, (_, k) => applique(exponentielle(A, (r.t * k) / n), x0));
      const chemin = S.slice(0, r.N + 1).map((M) => applique(M, x0));
      const R = Math.min(40, Math.max(2.5, 1.1 * Math.max(...[...traj, ...chemin].map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1]))))));
      cadreAuto = { x: [-R, R], y: [-R, R] };
      const cadre = zoom.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        rep.axes({ noms: ['x₁', 'x₂'] });
        rep.trace(traj, { couleur: col.accent, largeur: 2.2 });
        // Chemin des sommes partielles jusqu'à N.
        rep.trace(chemin, { couleur: col.series[0], largeur: 1.6 });
        for (const p of chemin) rep.point(p[0], p[1], { rayon: 3, couleur: col.series[0] });
        const xt = applique(E, x0);
        const v = applique(A, xt);
        const echelle = 0.5;
        rep.trace([xt, [xt[0] + echelle * v[0], xt[1] + echelle * v[1]]], { couleur: col.trait, largeur: 1.6 });
        rep.pointe(xt[0] + echelle * v[0], xt[1] + echelle * v[1], v[0], v[1], { couleur: col.trait });
        rep.point(xt[0], xt[1], { rayon: 5, couleur: col.accent });
        rep.point(r.x1, r.x2, { rayon: 5.5, couleur: col.perturbation });
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, [
        { texte: '$x(s) = e^{sA}x_0$', couleur: col.accent },
        { texte: `sommes partielles jusqu’à $N = ${r.N}$`, couleur: col.series[0] },
        { texte: '$\\dot x(t)$ (à l’échelle $1/2$)', couleur: col.trait },
      ]);

      // ---- Matrices ----
      outils.rend(formules, `\\begin{gathered} S_{${r.N}}(tA) = ${latexMatriceFixe(S[r.N], 3)} \\\\[0.3em] e^{tA} = ${latexMatriceFixe(E, 3)} \\end{gathered}`);
      outils.rendTexte(note, texteNote);

      // ---- Erreur ----
      const nA = frobenius(A) * Math.abs(r.t);
      const Nmax = S.length - 1;
      const erreurs = S.map((M, k) => [k, Math.log10(Math.max(frobenius(somme(E, M, -1)), 1e-17))]);
      const bornes = S.map((_, k) => [k, Math.log10(Math.max(queue(nA, k), 1e-300))]);
      const ys = erreurs.map(([, v]) => v);
      repErreur.fixeCadre([0, Nmax], [-17, Math.max(1, Math.ceil(Math.max(...ys, bornes[0][1])) + 0.5)]);
      if (repErreur.prepare()) {
        repErreur.axes({ noms: ['N', [['log₁₀ erreur', false]]], nomsAuBord: true, enL: true });
        repErreur.trace(bornes, { couleur: col.trait, largeur: 1.4, tirets: [6, 4] });
        repErreur.trace(erreurs, { couleur: col.accent, largeur: 2 });
        for (const [a, b] of erreurs) repErreur.point(a, b, { rayon: 2.2, couleur: col.accent });
        repErreur.point(r.N, erreurs[Math.min(r.N, Nmax)][1], { rayon: 5, couleur: col.perturbation });
      }

      // ---- Contre-exemple ----
      if (!ce.contenu.hidden) {
        for (const { M, rep: rv } of vues) {
          if (!rv.prepare()) continue;
          rv.axes({ grille: false });
          rv.trace(CARRE, { couleur: col.discret, largeur: 1, tirets: [4, 4] });
          rv.trace(CARRE.map((p) => applique(M, p)), { couleur: col.accent, largeur: 2 });
        }
      }
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champT.fixe(r.t);
        champN.fixe(r.N);
        ce.applique(prefs.valeurs.contreExemple);
        zoom.reinitialise();
        dessine();
      },
    };
  },
};
