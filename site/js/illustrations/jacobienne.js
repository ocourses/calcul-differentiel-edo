// La différentielle déforme une petite grille (poly, chapitre « Applications
// différentiables » : matrice jacobienne, dérivation des composées). Un petit
// carré de côté 2ε autour de x, quadrillé, est envoyé par f sur une figure
// courbe ; son approximation au premier ordre est le parallélogramme
// f(x) + J_f(x)·(carré − x). Quand ε → 0, les deux se confondent, à l'échelle
// du carré : c'est f(x + v) = f(x) + f'(x)·v + o(v). Le jacobien det J_f(x) est
// le facteur d'aire. En option, on compose avec g, et la jacobienne de g ∘ f
// est le produit J_g(f(x)) J_f(x).

import { champ } from '../../socle/js/ui/controls.js';
import { latexMatriceFixe, latexNombreFixe, latexScientifiqueFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, champsPoint, choixRadios, glisse, molette, paragraphe, toile, zoomable } from './commun.js';

export const APPLICATIONS = {
  polaires: {
    latex: 'f(r, \\theta) = (r\\cos\\theta,\\ r\\sin\\theta)',
    noms: ['r', 'θ'],
    f: ([r, t]) => [r * Math.cos(t), r * Math.sin(t)],
    J: ([r, t]) => [
      [Math.cos(t), -r * Math.sin(t)],
      [Math.sin(t), r * Math.cos(t)],
    ],
    domaine: { x: [-0.2, 2.6], y: [-3.4, 3.4] },
    x0: [1.5, 0.8],
    jacobien: '\\det J_f = r',
  },
  carre: {
    latex: 'f(x, y) = (x^2 - y^2,\\ 2xy)',
    noms: ['x', 'y'],
    f: ([x, y]) => [x * x - y * y, 2 * x * y],
    J: ([x, y]) => [
      [2 * x, -2 * y],
      [2 * y, 2 * x],
    ],
    domaine: { x: [-1.6, 1.6], y: [-1.6, 1.6] },
    x0: [1, 0.5],
    jacobien: '\\det J_f = 4(x^2 + y^2)',
  },
  cisaillement: {
    latex: 'f(x, y) = (x + \\tfrac12\\sin y,\\ y + \\tfrac12 x^2)',
    noms: ['x', 'y'],
    f: ([x, y]) => [x + 0.5 * Math.sin(y), y + 0.5 * x * x],
    J: ([x, y]) => [
      [1, 0.5 * Math.cos(y)],
      [x, 1],
    ],
    domaine: { x: [-2, 2], y: [-2, 2] },
    x0: [0.8, -0.5],
    jacobien: '\\det J_f = 1 - \\tfrac12 x \\cos y',
  },
};

// g, pour la règle des composées : une rotation non uniforme du plan.
export const G = {
  latex: 'g(u, v) = (u - \\tfrac12 v^2,\\ v)',
  g: ([u, v]) => [u - 0.5 * v * v, v],
  J: ([, v]) => [
    [1, -v],
    [0, 1],
  ],
};

export const produit = (M, N) => M.map((l) => N[0].map((_, j) => l.reduce((s, m, k) => s + m * N[k][j], 0)));
export const det = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];

// Jacobienne par différences centrées, pour vérifier les formules.
export function jacobienneNumerique(f, x, h = 1e-6) {
  const colonnes = [0, 1].map((j) => {
    const e = [0, 0];
    e[j] = h;
    const a = f([x[0] + e[0], x[1] + e[1]]);
    const b = f([x[0] - e[0], x[1] - e[1]]);
    return [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)];
  });
  return [
    [colonnes[0][0], colonnes[1][0]],
    [colonnes[0][1], colonnes[1][1]],
  ];
}

// Le quadrillage du carré [x − ε, x + ε]² : 5 lignes dans chaque sens.
export function quadrillage(x, eps, n = 4, m = 24) {
  const lignes = [];
  for (let i = 0; i <= n; i++) {
    const c = -eps + (2 * eps * i) / n;
    const pas = Array.from({ length: m + 1 }, (_, k) => -eps + (2 * eps * k) / m);
    lignes.push(pas.map((s) => [x[0] + c, x[1] + s]), pas.map((s) => [x[0] + s, x[1] + c]));
  }
  return lignes;
}

// Antécédent de y près de x par la méthode de Newton, x ← x + J(x)⁻¹ (y − f(x)) :
// c'est l'inverse local que garantit l'inversion locale quand det J ≠ 0. Rend
// null si les itérées ne convergent pas (jacobien trop petit, y trop loin).
export function antecedent(A, x, y, iterations = 20) {
  let p = x.slice();
  for (let k = 0; k < iterations; k++) {
    const fp = A.f(p);
    const [r0, r1] = [y[0] - fp[0], y[1] - fp[1]];
    if (Math.hypot(r0, r1) < 1e-12) return p;
    const J = A.J(p);
    const d = det(J);
    if (Math.abs(d) < 1e-9) return null;
    p = [p[0] + (J[1][1] * r0 - J[0][1] * r1) / d, p[1] + (-J[1][0] * r0 + J[0][0] * r1) / d];
  }
  const fp = A.f(p);
  return Math.hypot(y[0] - fp[0], y[1] - fp[1]) < 1e-9 ? p : null;
}

// Aire d'un polygone fermé (formule du lacet).
export function aire(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}

export default {
  etat: { app: 'polaires', x1: 1.5, x2: 0.8, leps: -0.5, compose: false },

  choix: { app: Object.keys(APPLICATIONS) },

  termes: ['matrice jacobienne', 'jacobien', 'différentielle', 'différentiable', 'dérivation des composées', 'difféomorphisme'],

  rappel: [
    'Pour $f \\colon \\mathbb R^n \\to \\mathbb R^m$ dérivable en $x$, la différentielle agit par la matrice jacobienne :',
    '$$f\'(x)\\cdot v = J_f(x)\\,v, \\qquad J_f(x) = \\Big(\\frac{\\partial f_i}{\\partial x_j}(x)\\Big)_{i, j}.$$',
    'Ainsi',
    '$$f(x + v) = f(x) + J_f(x)\\,v + o(v) :$$',
    'près de $x$, $f$ ressemble à l’application affine $v \\mapsto f(x) + J_f(x)\\,v$, qui envoie un petit carré sur un parallélogramme d’aire multipliée par $|\\det J_f(x)|$.',
    'Dérivation des composées : $(g \\circ f)\'(x) = g\'(f(x)) \\circ f\'(x)$, soit',
    '$$J_{g \\circ f}(x) = J_g(f(x))\\,J_f(x).$$',
  ],

  essais: [
    { texte: 'Coordonnées polaires : réduisez $\\varepsilon$. L’image du petit carré, un secteur de couronne, devient un rectangle, celui de $J_f$.', etat: { app: 'polaires', x1: 1.5, x2: 0.8, leps: -0.5, compose: false } },
    { texte: 'Polaires : rapprochez $r$ de $0$. Le jacobien $\\det J_f = r$ tend vers $0$ : l’image s’écrase, $f$ n’est pas un difféomorphisme près de $r = 0$.', etat: { app: 'polaires', x1: 0.15, x2: 0.8, leps: -1, compose: false } },
    { texte: '$z \\mapsto z^2$ : l’image d’un petit carré est un petit carré, tourné et agrandi. $J_f$ est une similitude.', etat: { app: 'carre', x1: 1, x2: 0.5, leps: -1, compose: false } },
    { texte: 'Composez avec $g$ : la jacobienne de $g \\circ f$ est le produit $J_g(f(x))\\,J_f(x)$, et le parallélogramme final est l’image du précédent par $J_g(f(x))$.', etat: { app: 'cisaillement', x1: 0.8, x2: -0.5, leps: -0.7, compose: true } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const barre = barreOutils(zone);
    const choix = choixRadios(barre, {
      nom: 'app',
      options: Object.entries(APPLICATIONS).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        const A = APPLICATIONS[valeur];
        outils.change({ app: valeur, x1: A.x0[0], x2: A.x0[1] });
        zoomDom.reinitialise();
        dessine();
      },
    });
    const caseCompose = document.createElement('label');
    caseCompose.className = 'case';
    const entreeCompose = document.createElement('input');
    Object.assign(entreeCompose, { type: 'checkbox', name: 'compose' });
    const libelle = document.createElement('span');
    outils.rendTexte(libelle, ` composer avec $${G.latex}$`);
    caseCompose.append(entreeCompose, libelle);
    barre.appendChild(caseCompose);
    entreeCompose.addEventListener('change', () => {
      outils.change({ compose: entreeCompose.checked });
      dessine();
    });

    const grille = document.createElement('div');
    grille.className = 'grille-3 principale';
    zone.appendChild(grille);

    // ---- Domaine ----------------------------------------------------------------------------------
    const cDom = carte(grille, 'Le carré autour de $x$');
    boutonInfo(cDom, [
      ['ligne', '--accent', 'Le petit carré $[x - \\varepsilon, x + \\varepsilon]^2$, quadrillé.'],
      ['point', '--perturbation', 'Le point $x$ : faites-le glisser, ici ou son image $f(x)$ à droite.'],
    ]);
    const canvasDom = toile(cDom, '1 / 1', () => dessine());
    canvasDom.classList.add('saisissable');
    const repDom = new Repere(canvasDom, { x: [-2, 2], y: [-2, 2], egal: true });
    const barreDom = document.createElement('div');
    barreDom.className = 'barre-legende';
    cDom.appendChild(barreDom);
    const zoomDom = zoomable(canvasDom, repDom, { barre: barreDom, auto: () => APPLICATIONS[r.app].domaine, redessine: () => dessine(), deplacer: false });
    glisse(canvasDom, repDom, {
      deplace: (a, b) => {
        outils.change({ x1: Number(a.toFixed(3)), x2: Number(b.toFixed(3)) });
        dessine();
      },
    });
    const point = champsPoint(
      cDom,
      [
        { latex: 'x_1', min: -2, max: 2 },
        { latex: 'x_2', min: -2, max: 2 },
      ],
      [r.x1, r.x2],
      ([x1, x2]) => {
        outils.change({ x1, x2 });
        dessine();
      },
    );
    const champEps = champ(cDom, { latex: '\\log_{10}\\varepsilon', min: -3, max: 0, pas: 0.05, pasFleche: 0.25, valeur: r.leps }, (v) => {
      outils.change({ leps: v });
      dessine();
    });

    // ---- Image par f, et par g ∘ f ---------------------------------------------------------------------
    const cImg = carte(grille, 'Image par $f$, à l’échelle du carré');
    boutonInfo(cImg, [
      ['ligne', '--accent', 'L’image du quadrillage par $f$.'],
      ['tirets', '--texte', 'Son approximation au premier ordre : $f(x) + J_f(x)\\,(\\cdot - x)$, un parallélogramme.'],
      ['point', '--perturbation', 'Le point $f(x)$. La fenêtre est centrée sur lui, et sa taille suit $\\varepsilon$ : la molette la change.'],
      ['fleche', '--discret', 'Faites glisser l’image : $x$ suit, par l’inverse local de $f$ (méthode de Newton, qui n’aboutit pas où $\\det J_f = 0$).'],
    ]);
    const canvasImg = toile(cImg, '1 / 1', () => dessine());
    canvasImg.classList.add('saisissable');
    const repImg = new Repere(canvasImg, { x: [-1, 1], y: [-1, 1], egal: true });
    // La fenêtre reste centrée sur f(x) : le glisser déplace f(x) comme le
    // pointeur (en unités de la fenêtre courante), et x devient l'antécédent,
    // près de l'ancien x, du point visé.
    let dernier = null;
    const relatif = (a, b) => {
      const { x: [x0, x1], y: [y0, y1] } = repImg.cadre;
      const R = (x1 - x0) / 2;
      return [(a - (x0 + x1) / 2) / R, (b - (y0 + y1) / 2) / R, R];
    };
    glisse(canvasImg, repImg, {
      prend: (a, b) => {
        dernier = relatif(a, b);
        return true;
      },
      deplace: (a, b) => {
        const A = APPLICATIONS[r.app];
        const [u, v, R] = relatif(a, b);
        const fx = A.f([r.x1, r.x2]);
        const cible = [fx[0] + (u - dernier[0]) * R, fx[1] + (v - dernier[1]) * R];
        dernier = [u, v];
        const p = antecedent(A, [r.x1, r.x2], cible);
        if (!p) return;
        const borne = (t, [m, M]) => Math.min(M, Math.max(m, t));
        outils.change({ x1: Number(borne(p[0], A.domaine.x).toPrecision(6)), x2: Number(borne(p[1], A.domaine.y).toPrecision(6)) });
        dessine();
      },
    });
    molette(canvasImg, (d) => fixeEps(r.leps + d));
    function fixeEps(leps) {
      outils.change({ leps: Number(Math.max(-3, Math.min(0, leps)).toFixed(2)) });
      champEps.fixe(r.leps);
      dessine();
    }
    const formuleF = document.createElement('div');
    formuleF.className = 'formule';
    cImg.appendChild(formuleF);

    const cComp = carte(grille, 'Image par $g \\circ f$');
    boutonInfo(cComp, [
      ['ligne', '--accent', 'L’image du quadrillage par $g \\circ f$.'],
      ['tirets', '--texte', 'Le parallélogramme de $J_g(f(x))\\,J_f(x)$.'],
    ]);
    const canvasComp = toile(cComp, '1 / 1', () => dessine());
    const repComp = new Repere(canvasComp, { x: [-1, 1], y: [-1, 1], egal: true });
    const formuleG = document.createElement('div');
    formuleG.className = 'formule';
    cComp.appendChild(formuleG);

    const note = paragraphe(carte(zone), '', 'note conclusion-fixe');

    // Dessine dans `rep`, centré sur F(x), l'image des lignes par F et leur
    // approximation par J ; renvoie le rapport des aires image / carré.
    function vueImage(rep, F, J, x, eps, col) {
      const fx = F(x);
      const lignes = quadrillage(x, eps);
      const images = lignes.map((l) => l.map(F));
      const lin = lignes.map((l) => l.map(([a, b]) => [fx[0] + J[0][0] * (a - x[0]) + J[0][1] * (b - x[1]), fx[1] + J[1][0] * (a - x[0]) + J[1][1] * (b - x[1])]));
      const pts = [...images.flat(), ...lin.flat()];
      const R = 1.15 * Math.max(1e-12, ...pts.map(([a, b]) => Math.max(Math.abs(a - fx[0]), Math.abs(b - fx[1]))));
      rep.fixeCadre([fx[0] - R, fx[0] + R], [fx[1] - R, fx[1] + R]);
      if (rep.prepare()) {
        rep.axes({ grille: false });
        for (const l of lin) rep.trace(l, { couleur: col.trait, largeur: 1, tirets: [5, 4] });
        for (const l of images) rep.trace(l, { couleur: col.accent, largeur: 1.6 });
        rep.point(fx[0], fx[1], { rayon: 4.5, couleur: col.perturbation });
      }
      // Bord du carré image : les quatre côtés, dans l'ordre.
      const m = 60;
      const bord = [];
      for (let k = 0; k < m; k++) bord.push(F([x[0] - eps + (2 * eps * k) / m, x[1] - eps]));
      for (let k = 0; k < m; k++) bord.push(F([x[0] + eps, x[1] - eps + (2 * eps * k) / m]));
      for (let k = 0; k < m; k++) bord.push(F([x[0] + eps - (2 * eps * k) / m, x[1] + eps]));
      for (let k = 0; k < m; k++) bord.push(F([x[0] - eps, x[1] + eps - (2 * eps * k) / m]));
      return aire(bord) / (4 * eps * eps);
    }

    function dessine() {
      const col = couleurs();
      const A = APPLICATIONS[r.app];
      choix.fixe(r.app);
      entreeCompose.checked = r.compose;
      cComp.hidden = !r.compose;
      grille.classList.toggle('grille-2', !r.compose);
      grille.classList.toggle('grille-3', r.compose);
      const x = [r.x1, r.x2];
      point.bornes(0, ...A.domaine.x);
      point.bornes(1, ...A.domaine.y);
      point.fixe(x);
      const eps = 10 ** r.leps;
      const J = A.J(x);

      // ---- Domaine ----
      const cadreDom = zoomDom.cadre();
      repDom.fixeCadre(cadreDom.x, cadreDom.y);
      if (repDom.prepare()) {
        repDom.axes({ noms: A.noms });
        repDom.region((u, v) => Math.abs(u - x[0]) <= eps && Math.abs(v - x[1]) <= eps, { couleur: col.zone, pas: 2 });
        for (const l of quadrillage(x, eps)) repDom.trace(l, { couleur: col.accent, largeur: 1.2 });
        repDom.point(x[0], x[1], { rayon: 5, couleur: col.perturbation });
      }

      // ---- Image par f ----
      const rapport = vueImage(repImg, A.f, J, x, eps, col);
      outils.rend(formuleF, `\\begin{gathered} J_f(x) = ${latexMatriceFixe(J, 2)} \\\\ \\det J_f(x) = ${latexNombreFixe(det(J), 3)} \\end{gathered}`);

      // ---- Composée ----
      let texteComp = '';
      if (r.compose) {
        const fx = A.f(x);
        const JG = G.J(fx);
        const JGF = produit(JG, J);
        const gf = (p) => G.g(A.f(p));
        vueImage(repComp, gf, JGF, x, eps, col);
        outils.rend(formuleG, `\\begin{gathered} J_g(f(x)) = ${latexMatriceFixe(JG, 2)} \\\\ J_{g \\circ f}(x) = ${latexMatriceFixe(JGF, 2)} \\end{gathered}`);
        const num = jacobienneNumerique(gf, x);
        const ecart = Math.max(...num.flat().map((v, i) => Math.abs(v - JGF.flat()[i])));
        texteComp = ` Jacobienne de $g \\circ f$ calculée par différences finies : écart au produit $${latexScientifiqueFixe(ecart, 2)}$.`;
      }
      outils.rendTexte(
        note,
        `$${A.jacobien}$. Aire de l’image du carré divisée par celle du carré : $${latexNombreFixe(rapport, 4)}$, à comparer à $|\\det J_f(x)| = ${latexNombreFixe(Math.abs(det(J)), 4)}$.${texteComp}`,
      );
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champEps.fixe(r.leps);
        zoomDom.reinitialise();
        dessine();
      },
    };
  },
};
