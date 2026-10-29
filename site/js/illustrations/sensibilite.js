// Dériver une solution calculée (poly, linéarisation du flot ; TP « Calcul de
// dérivées » et « Estimation de paramètres »). On veut s(T) = ∂x(T)/∂x₀·v, la
// dérivée de la solution par rapport à la condition initiale, et on la calcule
// sur machine de quatre façons :
//   différences finies externes, pas fixe : (Φ_h(x₀ + δv) − Φ_h(x₀))/δ, où Φ_h
//     est le schéma (RK4, N pas) : une fonction lisse de x₀, dérivée à δ près ;
//   différences finies externes, pas adaptatif : les pas dépendent de x₀, et
//     l'erreur de l'intégrateur, de l'ordre de la tolérance, reste dans la
//     dérivée ;
//   équation variationnelle : on intègre ensemble ẋ = f(x) et ṡ = f'(x) s ;
//   différences finies internes : on intègre ensemble ẋ = f(x) et
//     ẇ = (f(x + δw) − f(x))/δ, des différences finies sur le second membre ;
//     les pas sont les mêmes pour x et w.
// Les différences finies, externes ou internes, butent vers √eps ; seule
// l'équation variationnelle descend jusqu'à la tolérance.

import { rk4 } from '../../socle/js/core/ode.js';
import { champ } from '../../socle/js/ui/controls.js';
import { latexScientifiqueFixe, nombreScientifique } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, glisse, legende, paragraphe, tableau, toile, zoomable } from './commun.js';

const EPS = 2 ** -52;

// Les systèmes : f, sa jacobienne, x₀, la direction v, l'horizon T, et s(T)
// exacte quand on la connaît (sinon calculée une fois, très finement).
export const SYSTEMES = {
  logistique: {
    latex: '\\dot x = x\\,(1 - x)',
    f: ([x]) => [x * (1 - x)],
    J: ([x]) => [[1 - 2 * x]],
    x0: [0.1],
    v: [1],
    T: 5,
    // x(T) = x₀eᵀ/(1 − x₀ + x₀eᵀ), d'où ∂x(T)/∂x₀ = eᵀ/(1 − x₀ + x₀eᵀ)².
    exacte: ([x0], T) => Math.exp(T) / (1 - x0 + x0 * Math.exp(T)) ** 2,
    quantite: '\\frac{\\partial x(T)}{\\partial x_0}',
  },
  pendule: {
    latex: '\\ddot\\theta = -\\sin\\theta',
    f: ([a, b]) => [b, -Math.sin(a)],
    J: ([a]) => [
      [0, 1],
      [-Math.cos(a), 0],
    ],
    x0: [2, 0],
    v: [1, 0],
    T: 10,
    quantite: '\\frac{\\partial \\theta(T)}{\\partial \\theta_0}',
  },
};

const ajoute = (a, b, k = 1) => a.map((v, i) => v + k * b[i]);

// Dormand-Prince 5(4), pas adaptatif : erreur locale estimée sur toutes les
// composantes, rapportée à tol·(1 + |y|), et pas suivant 0,9·err^(−1/5)·h
// (borné). Rend { y, pas } (les instants).
const DP = {
  c: [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1],
  a: [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729], [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]],
  b: [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0],
  e: [71 / 57600, 0, -71 / 16695, 71 / 1920, -17253 / 339200, 22 / 525, -1 / 40],
};
export function adaptatif(F, y0, T, tol) {
  let [t, y, h] = [0, y0.slice(), Math.min(0.01, T)];
  const pas = [0];
  for (let n = 0; t < T && n < 200000; n++) {
    h = Math.min(h, T - t);
    const k = [];
    for (let i = 0; i < 7; i++) {
      let yi = y;
      for (let j = 0; j < i; j++) if (DP.a[i][j]) yi = ajoute(yi, k[j], h * DP.a[i][j]);
      k.push(F(t + DP.c[i] * h, yi));
    }
    let err = 0;
    const suivant = y.map((v, m) => {
      let e = 0;
      let s = v;
      for (let i = 0; i < 7; i++) {
        s += h * DP.b[i] * k[i][m];
        e += h * DP.e[i] * k[i][m];
      }
      err = Math.max(err, Math.abs(e) / (tol * (1 + Math.max(Math.abs(v), Math.abs(s)))));
      return s;
    });
    if (err <= 1) {
      t += h;
      y = suivant;
      pas.push(t);
    }
    h *= Math.min(5, Math.max(0.2, 0.9 * err ** -0.2));
  }
  return { y, pas };
}

// RK4 à N pas fixes.
export function fixe(F, y0, T, N) {
  let y = y0.slice();
  for (let i = 0; i < N; i++) y = rk4(F, (i * T) / N, y, T / N);
  return y;
}

const autonome = (f) => (t, y) => f(y);

// Système augmenté (x, s) de l'équation variationnelle, et (x, w) des
// différences finies internes, de pas δ.
export function augmente(S, methode, delta) {
  const n = S.x0.length;
  return (t, y) => {
    const [x, s] = [y.slice(0, n), y.slice(n)];
    const fx = S.f(x);
    const ds = methode === 'variationnelle' ? S.J(x).map((l) => l.reduce((a, m, j) => a + m * s[j], 0)) : S.f(ajoute(x, s, delta)).map((v, i) => (v - fx[i]) / delta);
    return [...fx, ...ds];
  };
}

// La dérivée s(T)·v (première composante) par chaque méthode.
export function derivees(cle, { delta, tol, N }) {
  const S = SYSTEMES[cle];
  const F = autonome(S.f);
  const x1 = ajoute(S.x0, S.v, delta);
  const n = S.x0.length;
  const ext = (a, b) => (b[0] - a[0]) / delta;
  const base = adaptatif(F, S.x0, S.T, tol);
  const pert = adaptatif(F, x1, S.T, tol);
  return {
    fixe: ext(fixe(F, S.x0, S.T, N), fixe(F, x1, S.T, N)),
    adaptatif: ext(base.y, pert.y),
    variationnelle: adaptatif(augmente(S, 'variationnelle'), [...S.x0, ...S.v], S.T, tol).y[n],
    interne: adaptatif(augmente(S, 'interne', delta), [...S.x0, ...S.v], S.T, tol).y[n],
  };
}

// La valeur de référence : exacte, ou l'équation variationnelle intégrée par
// RK4 à 20 000 pas (erreur ≈ 10⁻¹³).
const references = {};
export function reference(cle) {
  const S = SYSTEMES[cle];
  if (S.exacte) return S.exacte(S.x0, S.T);
  references[cle] ??= fixe(augmente(S, 'variationnelle'), [...S.x0, ...S.v], S.T, 20000)[S.x0.length];
  return references[cle];
}

const METHODES = {
  fixe: { texte: 'DF externes, pas fixe', couleur: (c) => c.series[0] },
  adaptatif: { texte: 'DF externes, pas adaptatif', couleur: (c) => c.series[3] },
  interne: { texte: 'DF internes', couleur: (c) => c.series[2] },
  variationnelle: { texte: 'équation variationnelle', couleur: (c) => c.accent },
};

const DELTAS = [-14, -1];
// Bornes des réglages : en dessous de tol = 10⁻⁸ ou au-dessus de N = 2⁸, les
// différences internes à très petit δ font rejeter des centaines de milliers de
// pas (le bruit d'arrondi sur f) et la courbe met de longues secondes.
export const LTOL = [-8, -3];
export const LN = [4, 8];

export default {
  etat: { sys: 'logistique', ldelta: -6, ltol: -8, lN: 8 },

  choix: { sys: Object.keys(SYSTEMES) },

  termes: ['équation linéarisée'],

  rappel: [
    'On veut la dérivée de la solution par rapport à la condition initiale, dans la direction $v$ :',
    '$$s(T) = \\varphi_T\'(x_0)\\cdot v,$$',
    'solution de l’équation linéarisée $\\dot s = f\'(x(t))\\,s$, $s(0) = v$. Sur machine, trois voies :',
    [
      'différences finies externes : intégrer deux fois, et $\\big(x_h(T; x_0 + \\delta v) - x_h(T; x_0)\\big)/\\delta$ ;',
      'équation variationnelle : intégrer ensemble $\\dot x = f(x)$ et $\\dot s = f\'(x)\\,s$ ;',
      'différences finies internes : intégrer ensemble $\\dot x = f(x)$ et $\\dot w = \\big(f(x + \\delta w) - f(x)\\big)/\\delta$.',
    ],
    'Les différences finies gardent le « V » de l’erreur : troncature en $\\delta$, arrondi en $\\mathrm{eps}/\\delta$. Leur meilleure erreur est de l’ordre de',
    '$$\\sqrt{\\mathrm{eps}} \\approx 10^{-8},$$',
    'quelle que soit la précision de l’intégration. À pas adaptatif, les pas dépendent de $x_0$ : les différences externes ne descendent pas non plus sous la tolérance de l’intégrateur.',
    'L’équation variationnelle n’a pas de $\\delta$ : son erreur est de l’ordre de la tolérance, quel que soit $\\delta$ ; avec $\\mathrm{tol} < 10^{-8}$ (testé jusqu’à $10^{-12}$), elle descend sous $\\sqrt{\\mathrm{eps}}$.',
    'Réglages : $\\delta$, le pas des différences finies ; $N$, le nombre de pas de RK4 ($h = T/N$) des différences externes à pas fixe ; $\\mathrm{tol}$, la tolérance de l’intégrateur à pas adaptatif (Dormand-Prince). La page se limite à $\\mathrm{tol} \\ge 10^{-8}$ et $N \\le 2^8$ : en dessous, les calculs sont longs.',
  ],

  essais: [
    { texte: 'Pas fixe (orange) : on retrouve le « V » des différences finies. Passez $N$ de $2^6$ à $2^8$ : le fond du « V » descend de $10^{-6}$ à environ $6 \\cdot 10^{-9}$, tout près de $\\sqrt{\\mathrm{eps}}$, qui l’empêcherait d’aller plus bas.', etat: { sys: 'pendule', ldelta: -7, ltol: -8, lN: 8 } },
    { texte: 'Équation variationnelle (bleu) : une droite horizontale, qui ne dépend pas de $\\delta$, de l’ordre de dix fois la tolérance ($7 \\cdot 10^{-8}$ pour $\\mathrm{tol} = 10^{-8}$). Prenez $\\mathrm{tol} = 10^{-6}$ : elle monte avec la tolérance, vers $8 \\cdot 10^{-6}$.', etat: { sys: 'pendule', ldelta: -7, ltol: -8, lN: 8 } },
    { texte: 'Tolérance $10^{-6}$, pas adaptatif : les différences externes ne passent pas sous la tolérance, quel que soit $\\delta$. À pas fixe, on fait mieux, mais il faut choisir $N$ soi-même.', etat: { sys: 'pendule', ldelta: -7, ltol: -6, lN: 8 } },
    { texte: 'Petits $\\delta$ ($10^{-11}$) : à gauche du « V », les différences internes (vert) restent sous les externes. L’arrondi ne porte que sur un pas de $f$, pas sur toute la trajectoire.', etat: { sys: 'pendule', ldelta: -11, ltol: -8, lN: 8 } },
    { texte: 'Équation logistique : $\\partial x(T)/\\partial x_0$ est connue exactement. À droite du « V », les trois différences finies ont la même erreur, proportionnelle à $\\delta$ : la troncature. Seule la variationnelle n’en dépend pas.', etat: { sys: 'logistique', ldelta: -4, ltol: -8, lN: 8 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'sys',
      options: Object.entries(SYSTEMES).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        outils.change({ sys: valeur });
        zoom.reinitialise();
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    // ---- Erreur en fonction de δ ------------------------------------------------------------------
    const cErr = carte(grille, 'Erreur sur $s(T)$ en fonction du pas $\\delta$');
    boutonInfo(cErr, [
      ['ligne', '--serie-1', 'Différences finies externes, RK4 à $N$ pas fixes.'],
      ['ligne', '--serie-4', 'Différences finies externes, pas adaptatif (Dormand-Prince, tolérance $\\mathrm{tol}$).'],
      ['ligne', '--serie-3', 'Différences finies internes, intégrées avec le système.'],
      ['ligne', '--accent', 'Équation variationnelle : elle ne dépend pas de $\\delta$.'],
      ['tirets', '--texte', 'La droite $\\mathrm{eps}/\\delta$ (pente $-1$, l’arrondi) et le niveau de la tolérance.'],
      ['tirets', '--perturbation', 'Le $\\delta$ choisi : cliquez ou faites glisser. La molette zoome.'],
    ]);
    const canvas = toile(cErr, '16 / 10', () => dessine());
    canvas.classList.add('saisissable');
    const CADRE = { x: DELTAS, y: [-14, 2] };
    const rep = new Repere(canvas, CADRE);
    const barre = document.createElement('div');
    barre.className = 'barre-legende';
    cErr.appendChild(barre);
    const zoneLegende = document.createElement('div');
    barre.appendChild(zoneLegende);
    const zoom = zoomable(canvas, rep, { barre, auto: () => CADRE, redessine: () => dessine(), deplacer: false });
    glisse(canvas, rep, {
      deplace: (ld) => {
        outils.change({ ldelta: Number(Math.max(DELTAS[0], Math.min(DELTAS[1], ld)).toFixed(1)) });
        champs.delta.fixe(r.ldelta);
        dessine();
      },
    });
    const reglages = document.createElement('div');
    reglages.className = 'reglages-2';
    cErr.appendChild(reglages);
    const champs = {
      delta: champ(cErr, { latex: '\\log_{10} \\delta', min: DELTAS[0], max: DELTAS[1], pas: 0.1, pasFleche: 1, valeur: r.ldelta }, (v) => {
        outils.change({ ldelta: v });
        dessine();
      }),
      tol: champ(reglages, { latex: '\\log_{10} \\mathrm{tol}', min: LTOL[0], max: LTOL[1], pas: 1, valeur: r.ltol }, (v) => {
        outils.change({ ltol: Math.round(v) });
        dessine();
      }),
      N: champ(reglages, { latex: '\\log_2 N', min: LN[0], max: LN[1], pas: 1, valeur: r.lN }, (v) => {
        outils.change({ lN: Math.round(v) });
        dessine();
      }),
    };

    // ---- Colonne : valeurs au δ choisi, pas des deux intégrations -----------------------------------
    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cVal = carte(colonne, 'Au pas $\\delta$ choisi');
    const formule = document.createElement('div');
    formule.className = 'formule';
    cVal.appendChild(formule);
    const zoneTable = document.createElement('div');
    cVal.appendChild(zoneTable);

    const note = paragraphe(cVal, '', 'note conclusion-fixe');

    // Les courbes d'erreur, gardées pour un système, une tolérance et un N.
    let cache = { cle: '', valeur: null };
    function courbes() {
      const cle = JSON.stringify([r.sys, r.ltol, r.lN]);
      if (cache.cle === cle) return cache.valeur;
      const ref = reference(r.sys);
      const valeur = { fixe: [], adaptatif: [], interne: [], variationnelle: [] };
      for (let k = 0; k <= 65; k++) {
        const ld = DELTAS[0] + ((DELTAS[1] - DELTAS[0]) * k) / 65;
        const d = derivees(r.sys, { delta: 10 ** ld, tol: 10 ** r.ltol, N: 2 ** r.lN });
        for (const m of Object.keys(valeur)) valeur[m].push([ld, Math.log10(Math.max(Math.abs(d[m] - ref), 1e-16))]);
      }
      cache = { cle, valeur };
      return valeur;
    }

    function dessine() {
      const col = couleurs();
      // Un ancien lien peut porter des valeurs hors des bornes : on les y ramène.
      const [ltol, lN] = [Math.max(LTOL[0], Math.min(LTOL[1], Math.round(r.ltol) || LTOL[0])), Math.max(LN[0], Math.min(LN[1], Math.round(r.lN) || LN[1]))];
      if (ltol !== r.ltol || lN !== r.lN) {
        outils.change({ ltol, lN });
        champs.tol.fixe(ltol);
        champs.N.fixe(lN);
      }
      choix.fixe(r.sys);
      const S = SYSTEMES[r.sys];
      const ref = reference(r.sys);
      const c = courbes();
      const cadre = zoom.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        rep.axes({ noms: [[['log₁₀ ', false], ['δ', true]], [['log₁₀ erreur', false]]], nomsAuBord: true, enL: true });
        const leps = Math.log10(EPS);
        rep.trace(DELTAS.map((ld) => [ld, leps - ld]), { couleur: col.trait, largeur: 0.9, tirets: [3, 5], alpha: 0.7 });
        rep.texte(DELTAS[0], leps - DELTAS[0], 'eps/δ', { couleur: col.discret, dx: 6, dy: -6, fond: true });
        rep.trace(DELTAS.map((ld) => [ld, r.ltol]), { couleur: col.trait, largeur: 0.9, tirets: [3, 5], alpha: 0.7 });
        rep.texte(DELTAS[1], r.ltol, 'tol', { couleur: col.discret, align: 'right', dx: -6, dy: -6, fond: true });
        for (const m of Object.keys(METHODES)) rep.trace(c[m], { couleur: METHODES[m].couleur(col), largeur: m === 'variationnelle' ? 2.4 : 1.8 });
        rep.trace([[r.ldelta, -100], [r.ldelta, 100]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, Object.values(METHODES).map((m) => ({ texte: m.texte, couleur: m.couleur(col) })));

      // ---- Valeurs au δ choisi ----
      const d = derivees(r.sys, { delta: 10 ** r.ldelta, tol: 10 ** r.ltol, N: 2 ** r.lN });
      outils.rend(formule, `${S.quantite} = ${ref.toFixed(10).replace('.', '{,}')}`);
      const nouveau = document.createElement('div');
      tableau(nouveau, ['méthode', 'erreur'], Object.keys(METHODES).map((m) => [METHODES[m].texte, nombreScientifique(Math.abs(d[m] - ref), 1)]));
      zoneTable.replaceChildren(...nouveau.childNodes);

      const meilleure = Object.keys(METHODES).reduce((a, m) => (Math.abs(d[m] - ref) < Math.abs(d[a] - ref) ? m : a), 'fixe');
      outils.rendTexte(note, `Ici, la plus précise : ${METHODES[meilleure].texte} ; tolérance $${latexScientifiqueFixe(10 ** r.ltol, 0)}$, $N = ${2 ** r.lN}$ pas fixes.`);
    }

    function applique() {
      champs.delta.fixe(r.ldelta);
      champs.tol.fixe(r.ltol);
      champs.N.fixe(r.lN);
      zoom.reinitialise();
      dessine();
    }

    outils.surTheme(dessine);
    applique();
    return { applique };
  },
};
