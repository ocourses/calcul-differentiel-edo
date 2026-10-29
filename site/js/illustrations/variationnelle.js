// Équation linéarisée : la dérivée du flot (poly, chapitre « Flot »,
// linéarisation et perturbation du flot ; dépendance par rapport à un
// paramètre). On perturbe la condition initiale x̄₀ de ε δx₀ (ou le paramètre
// λ de ε δλ) et l'on compare l'écart réel Δx(t) entre les deux solutions à la
// prédiction au premier ordre ε δx(t), où δx est la solution de l'équation
// variationnelle
//   δẋ = f'(x̄(t)) δx (+ ∂f/∂λ δλ),   δx(0) = δx₀ (ou 0).
// Deux systèmes du poly : l'exemple explicite ẋ = (−x₁ + x₂, x₂), dont la
// résolvante est connue, et le pendule simple.

import { rk4 } from '../../socle/js/core/ode.js';
import { champ } from '../../socle/js/ui/controls.js';
import { latexMatriceFixe, latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, boutonVue, carte, champsPoint, choixRadios, glisse, legende, paragraphe, toile, zoomable } from './commun.js';

// Chaque système : dimension, f, jacobienne f'(x), dérivée par rapport au
// paramètre (s'il y en a un), axes affichés (indices), horizon et pas.
export const SYSTEMES = {
  poly: {
    nom: '\\dot x = (-x_1 + x_2,\\ x_2)',
    n: 2,
    f: ([a, b]) => [-a + b, b],
    J: () => [
      [-1, 1],
      [0, 1],
    ],
    axes: [0, 1],
    noms: ['x₁', 'x₂'],
    T: 2.5,
    h: 0.002,
    x0: [1, 0.2],
    jacobienne: 'f\'(x) = \\begin{pmatrix} -1 & 1 \\\\ 0 & 1 \\end{pmatrix}',
    commentaire: 'Le linéarisé est à coefficients constants : $\\delta x(t) = e^{tA}\\delta x_0$ avec $e^{tA} = \\begin{pmatrix} e^{-t} & \\sinh t \\\\ 0 & e^t \\end{pmatrix}$, et l’écart est exactement linéaire en $\\varepsilon$.',
  },
  pendule: {
    nom: '\\text{pendule}',
    n: 2,
    lambda: '\\omega^2',
    valeurLambda: 1,
    f: ([a, b], w2 = 1) => [b, -w2 * Math.sin(a)],
    J: ([a], w2 = 1) => [
      [0, 1],
      [-w2 * Math.cos(a), 0],
    ],
    dLambda: ([a]) => [0, -Math.sin(a)],
    axes: [0, 1],
    noms: ['θ', 'θ̇'],
    T: 15,
    h: 0.005,
    x0: [2, 0],
    jacobienne: 'f\'(x) = \\begin{pmatrix} 0 & 1 \\\\ -\\omega^2\\cos x_1 & 0 \\end{pmatrix}',
    commentaire: 'Le long d’une oscillation, deux orbites voisines ont des périodes voisines mais différentes : l’écart croît linéairement en temps, sans exploser.',
  },
};

const prod = (M, v) => M.map((ligne) => ligne.reduce((s, m, j) => s + m * v[j], 0));
const norme = (v) => Math.hypot(...v);

// Intègre ensemble la solution de référence x̄, la solution perturbée et la
// variation δx (RK4, pas h), et garde `m` échantillons. Perturbation de la
// condition initiale (`mode` = 'x0', direction d) ou du paramètre ('lambda').
export function integre(cle, { x0, d, eps, mode = 'x0', T = SYSTEMES[cle].T, m = 1200, h = SYSTEMES[cle].h }) {
  const S = SYSTEMES[cle];
  const n = S.n;
  const l0 = S.valeurLambda;
  const dl = mode === 'lambda' ? 1 : 0;
  // État étendu : (x̄, x perturbé, δx).
  const F = (t, y) => {
    const xb = y.slice(0, n);
    const xp = y.slice(n, 2 * n);
    const dx = y.slice(2 * n);
    const lin = prod(S.J(xb, l0), dx);
    if (dl) S.dLambda(xb).forEach((v, i) => (lin[i] += v));
    return [...S.f(xb, l0), ...S.f(xp, l0 + eps * dl), ...lin];
  };
  const depart = mode === 'x0' ? x0.map((v, i) => v + eps * d[i]) : x0.slice();
  let y = [...x0, ...depart, ...(mode === 'x0' ? d : Array(n).fill(0))];
  const N = Math.round(T / h);
  const tous = Math.max(1, Math.floor(N / m));
  const ech = [{ t: 0, y }];
  for (let k = 1; k <= N; k++) {
    y = rk4(F, (k - 1) * h, y, h);
    if (k % tous === 0 || k === N) ech.push({ t: k * h, y });
  }
  return ech.map(({ t, y: e }) => ({ t, xb: e.slice(0, n), xp: e.slice(n, 2 * n), dx: e.slice(2 * n) }));
}

// Direction δx₀ d'angle `ang` (degrés) dans le plan des axes affichés.
export function direction(cle, ang) {
  const S = SYSTEMES[cle];
  const d = Array(S.n).fill(0);
  d[S.axes[0]] = Math.cos((ang * Math.PI) / 180);
  d[S.axes[1]] = Math.sin((ang * Math.PI) / 180);
  return d;
}

// Perturbation initiale lue sur le plan : le bout p de la flèche ε δx₀ posée
// en x̄₀ donne la direction α (degrés) et log₁₀ ε, borné à [−7, 0]. Si p = x̄₀,
// la direction `ancienne` est gardée.
export function variationDe(x0, p, ancienne) {
  const [vx, vy] = [p[0] - x0[0], p[1] - x0[1]];
  const n = Math.hypot(vx, vy);
  if (n < 1e-300) return { ang: ancienne, leps: -7 };
  return { ang: (Math.atan2(vy, vx) * 180) / Math.PI, leps: Math.max(-7, Math.min(0, Math.log10(n))) };
}

// Ce que saisit le pointeur p (en unités du monde ; `echelle` = pixels par unité,
// par axe) : 'x0' (la condition initiale x̄₀), 'variation' (le bout de la flèche
// ε δx₀, qui est la condition initiale perturbée), ou null. Si les deux points
// sont à moins de 8 px l'un de l'autre, x̄₀ passe avant : zoomez pour les séparer.
export function poignee(p, x0, bout, echelle, rayon = 12) {
  const dist = (q) => Math.hypot((p[0] - q[0]) * echelle[0], (p[1] - q[1]) * echelle[1]);
  const [d0, dv] = [dist(x0), bout ? dist(bout) : Infinity];
  const separes = bout && Math.hypot((x0[0] - bout[0]) * echelle[0], (x0[1] - bout[1]) * echelle[1]) >= 8;
  if (separes && dv < d0 && dv <= rayon) return 'variation';
  return d0 <= rayon ? 'x0' : null;
}

// Échantillon le plus proche de l'instant t.
const aInstant = (ech, t) => ech[Math.min(ech.length - 1, Math.max(0, Math.round((t / ech[ech.length - 1].t) * (ech.length - 1))))];

const T_BOUCLE = 6; // durée de l'animation en boucle (s)

export default {
  etat: { sys: 'poly', mode: 'x0', x1: 1, x2: 0.2, ang: 90, leps: -1, t: 1.5 },

  choix: { sys: Object.keys(SYSTEMES), mode: ['x0', 'lambda'] },

  preferences: { anime: false },

  termes: ['équation linéarisée', 'résolvante', 'flot', 'matrice jacobienne', 'différentielle'],

  rappel: [
    'Si $f$ est de classe $C^1$, l’application $\\varphi_t \\colon x_0 \\mapsto \\varphi(t, x_0)$ du flot est de classe $C^1$ près de $\\bar x_0$, et sa différentielle dans la direction $\\delta x_0$ est',
    '$$\\varphi_t\'(\\bar x_0)\\cdot\\delta x_0 = \\delta x(t) = R(t, 0)\\,\\delta x_0,$$',
    'où $\\delta x$ est la solution de l’équation linéarisée (ou variationnelle) le long de $\\bar x(\\cdot) = \\varphi(\\cdot, \\bar x_0)$, $f\'(\\bar x(t))$ étant la matrice jacobienne de $f$ :',
    '$$\\dot{\\delta x}(t) = f\'(\\bar x(t))\\cdot\\delta x(t), \\qquad \\delta x(0) = \\delta x_0,$$',
    'et $R$ sa résolvante. Ainsi',
    '$$\\varphi_t(\\bar x_0 + \\varepsilon\\,\\delta x_0) = \\varphi_t(\\bar x_0) + \\varepsilon\\,\\delta x(t) + o(\\varepsilon).$$',
    'Pour un paramètre $\\lambda$, on le traite comme une variable d’état constante :',
    '$$\\dot{\\delta x} = \\partial_x f\\cdot\\delta x + \\partial_\\lambda f\\cdot\\delta\\lambda, \\qquad \\delta x(0) = 0.$$',
  ],

  essais: [
    { texte: 'Exemple du poly, $\\delta x_0 = (0, 1)$ : la première composante de $\\delta x(t)$ vaut $\\sinh t$, sans calculer $x(t)$.', etat: { sys: 'poly', mode: 'x0', x1: 1, x2: 0.2, ang: 90, leps: -1, t: 1.5 } },
    { texte: 'Pendule : diminuez $\\varepsilon$ de $10^{-1}$ à $10^{-4}$. Le rapport $\\|\\Delta x(t)\\| / (\\varepsilon\\|\\delta x(t)\\|)$ tend vers $1$ : c’est la définition de la différentielle.', etat: { sys: 'pendule', mode: 'x0', x1: 2, x2: 0, ang: 0, leps: -1, t: 10 } },
    { texte: 'Pendule, $\\varepsilon = 0{,}3$ : la prédiction linéaire se trompe dès que l’écart n’est plus petit. Le terme $o(\\varepsilon)$ n’est pas négligeable.', etat: { sys: 'pendule', mode: 'x0', x1: 2, x2: 0, ang: 0, leps: -0.5, t: 12 } },
    { texte: 'Perturbez le paramètre $\\omega^2$ du pendule plutôt que la condition initiale : la période change, et l’écart croît avec le temps.', etat: { sys: 'pendule', mode: 'lambda', x1: 2, x2: 0, ang: 0, leps: -2, t: 12 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;
    const prefs = outils.preferences;

    const barre = barreOutils(zone);
    const choixSys = choixRadios(barre, {
      nom: 'sys',
      options: Object.entries(SYSTEMES).map(([valeur, { nom }]) => ({ valeur, latex: nom })),
      change: (valeur) => {
        const S = SYSTEMES[valeur];
        outils.change({ sys: valeur, x1: S.x0[S.axes[0]], x2: S.x0[S.axes[1]], t: Math.min(r.t, S.T), mode: valeur === 'poly' ? 'x0' : r.mode });
        zoomPlan.reinitialise();
        applique();
      },
    });
    const choixMode = choixRadios(barre, {
      nom: 'mode',
      options: [
        { valeur: 'x0', texte: 'perturber x₀' },
        { valeur: 'lambda', texte: 'perturber le paramètre' },
      ],
      change: (valeur) => {
        outils.change({ mode: valeur });
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    // ---- Plan de phase ------------------------------------------------------------------------------
    const cPlan = carte(grille, 'Deux solutions voisines');
    boutonInfo(cPlan, [
      ['ligne', '--accent', 'La solution de référence $\\bar x(\\cdot)$ (bleu), de $\\bar x_0$ à l’instant $t$. Son point de départ $\\bar x_0$ et son point à l’instant $t$ ont sa couleur ; le bouton gauche saisit $\\bar x_0$ (ou réglez ses coordonnées dans les champs).'],
      ['ligne', '--serie-1', 'La vraie solution perturbée (orange), de condition initiale $\\bar x_0 + \\varepsilon\\,\\delta x_0$ (ou de paramètre $\\lambda + \\varepsilon$). Son point de départ est le bout de la flèche en tirets : saisissez-le pour changer la direction $\\alpha$ et la taille $\\varepsilon$ de la perturbation.'],
      ['tirets', '--serie-3', 'La trajectoire à l’ordre 1, $t \\mapsto \\bar x(t) + \\varepsilon\\,\\delta x(t)$ (vert), donnée par l’équation linéarisée sans refaire d’intégration non linéaire. Elle colle à la vraie solution tant que $\\varepsilon$ est petit, puis s’en écarte (le terme $o(\\varepsilon)$).'],
      ['fleche', '--serie-3', 'La flèche $\\varepsilon\\,\\delta x(t)$, posée en $\\bar x(t)$ : son bout est sur la trajectoire à l’ordre 1 ; en tirets, la même flèche à l’instant $0$, $\\varepsilon\\,\\delta x_0$. Les pointillés orange sont l’écart réel $\\Delta x(t)$, de $\\bar x(t)$ à la vraie solution perturbée.'],
      ['point', '--discret', 'Si $\\varepsilon$ est trop petit pour séparer les deux points, zoomez à la molette ; le clic droit déplace la vue.'],
    ]);
    const canvas = toile(cPlan, '16 / 10', () => dessine());
    canvas.classList.add('saisissable');
    const rep = new Repere(canvas, { x: [-3, 3], y: [-3, 3] });
    const barrePlan = document.createElement('div');
    barrePlan.className = 'barre-legende';
    cPlan.appendChild(barrePlan);
    const zoneLegende = document.createElement('div');
    barrePlan.appendChild(zoneLegende);
    // Cadre automatique : la boîte de la trajectoire de référence (calculé au dessin).
    let cadreAuto = { x: [-3, 3], y: [-3, 3] };
    const zoomPlan = zoomable(canvas, rep, { barre: barrePlan, auto: () => cadreAuto, redessine: () => dessine(), deplacer: 'droit' });
    const champT = champ(cPlan, { latex: 't', min: 0, max: SYSTEMES[r.sys].T, pas: 0.01, pasFleche: 0.1, valeur: r.t }, (v) => {
      arrete();
      outils.change({ t: v });
      dessine();
    });
    // La condition initiale x̄₀, dans le plan des axes affichés.
    const point = champsPoint(
      cPlan,
      [
        { latex: '\\bar x_0^{(1)}', min: -3, max: 3 },
        { latex: '\\bar x_0^{(2)}', min: -3, max: 3 },
      ],
      [r.x1, r.x2],
      ([x1, x2]) => {
        outils.change({ x1, x2 });
        dessine();
      },
    );
    const caseAnime = document.createElement('label');
    caseAnime.className = 'case';
    caseAnime.innerHTML = '<input type="checkbox" name="anime"> animer en boucle';
    cPlan.appendChild(caseAnime);
    const entreeAnime = caseAnime.querySelector('input');
    entreeAnime.disabled = outils.mouvementReduit;
    entreeAnime.addEventListener('change', () => {
      prefs.change({ anime: entreeAnime.checked });
      debut = null;
    });

    // La lecture de la figure, en toutes lettres.
    const lecture = paragraphe(cPlan, '', 'note lecture-figure');

    // Deux poignées : x̄₀ (la condition initiale de référence) et le bout de la
    // flèche ε δx₀ (la condition initiale perturbée : direction et taille de la
    // perturbation). Le bouton droit déplace la vue.
    let saisi = null;
    // Le cadre automatique suit la trajectoire, donc x̄₀ : pendant le geste on le gèle,
    // sinon le point visé change à chaque déplacement et x̄₀ s'enfuit.
    let gele = null;
    glisse(canvas, rep, {
      prend: (a, b, ev) => {
        if (boutonVue(ev)) return false;
        const [i, j] = SYSTEMES[r.sys].axes;
        const depart = ech[0];
        const bout = r.mode === 'x0' && depart ? [depart.xp[i], depart.xp[j]] : null;
        saisi = poignee([a, b], [r.x1, r.x2], bout, [rep.sx, rep.sy]);
        gele = saisi === null ? null : zoomPlan.cadre();
        return saisi !== null;
      },
      deplace: (a, b) => {
        if (saisi === 'x0') outils.change({ x1: Number(a.toFixed(3)), x2: Number(b.toFixed(3)) });
        else {
          const { ang, leps } = variationDe([r.x1, r.x2], [a, b], r.ang);
          outils.change({ ang: Number(ang.toFixed(1)), leps: Number(leps.toFixed(2)) });
          champEps.fixe(r.leps);
          champAng.fixe(r.ang);
        }
        dessine();
      },
      // Au lâcher, le calcul complet remplace l'esquisse faite pendant le geste.
      relache: () => {
        saisi = null;
        gele = null;
        dessine();
      },
    });

    // ---- Colonne : réglages, formules, écart -----------------------------------------------------------
    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cReglages = carte(colonne, 'Perturbation');
    const champEps = champ(cReglages, { latex: '\\log_{10}\\varepsilon', min: -7, max: 0, pas: 0.1, pasFleche: 0.5, valeur: r.leps }, (v) => {
      outils.change({ leps: v });
      dessine();
    });
    const champAng = champ(cReglages, { latex: '\\alpha', min: -180, max: 180, pas: 1, pasFleche: 15, valeur: r.ang, unite: '°' }, (v) => {
      outils.change({ ang: v });
      dessine();
    });
    const ligneAng = cReglages.querySelectorAll('.champ')[1];
    const formules = document.createElement('div');
    formules.className = 'formule';
    cReglages.appendChild(formules);
    const commentaire = paragraphe(cReglages, '', 'note texte-fixe');

    const cEcart = carte(colonne, 'Écart réel et prédiction');
    boutonInfo(cEcart, [
      ['ligne', '--serie-1', '$\\|\\Delta x(t)\\| / \\varepsilon$ : l’écart réel entre les deux solutions, divisé par $\\varepsilon$.'],
      ['tirets', '--texte', '$\\|\\delta x(t)\\|$ : la solution de l’équation variationnelle. Les deux courbes coïncident tant que l’écart reste petit.'],
      ['tirets', '--perturbation', 'L’instant $t$ : cliquez ou faites glisser pour le changer.'],
    ]);
    const canvasE = toile(cEcart, '16 / 9', () => dessine());
    canvasE.classList.add('saisissable');
    const repE = new Repere(canvasE, { x: [0, 1], y: [-1, 1] });
    glisse(canvasE, repE, {
      deplace: (t) => {
        arrete();
        outils.change({ t: Number(Math.max(0, Math.min(SYSTEMES[r.sys].T, t)).toFixed(2)) });
        champT.fixe(r.t);
        dessine();
      },
    });
    const rapport = paragraphe(cEcart, '', 'note conclusion-fixe');

    // ---- Calcul, gardé tant que les réglages (hors t) ne changent pas -----------------------------
    let cle = '';
    let ech = [];
    function calcule() {
      const S = SYSTEMES[r.sys];
      const x0 = S.x0.slice();
      x0[S.axes[0]] = r.x1;
      x0[S.axes[1]] = r.x2;
      // Pendant un glisser, une esquisse au pas quatre fois plus grand.
      const k = JSON.stringify([r.sys, r.mode, r.x1, r.x2, r.ang, r.leps, saisi !== null]);
      if (k !== cle) {
        cle = k;
        ech = integre(r.sys, { x0, d: direction(r.sys, r.ang), eps: 10 ** r.leps, mode: r.mode, h: (saisi ? 4 : 1) * S.h, m: saisi ? 400 : 1200 });
      }
      return ech;
    }

    function dessine() {
      const col = couleurs();
      const S = SYSTEMES[r.sys];
      if (r.sys === 'poly' && r.mode !== 'x0') outils.change({ mode: 'x0' });
      choixSys.fixe(r.sys);
      choixMode.fixe(r.mode);
      for (const input of choixMode.element.querySelectorAll('input')) input.disabled = r.sys === 'poly' && input.value === 'lambda';
      ligneAng.classList.toggle('inactif', r.mode === 'lambda');
      for (const input of ligneAng.querySelectorAll('input')) input.disabled = r.mode === 'lambda';
      entreeAnime.checked = prefs.valeurs.anime && !outils.mouvementReduit;
      const eps = 10 ** r.leps;
      const ech = calcule();
      const etendue = { poly: [[-2, 2], [-2, 2]], pendule: [[-3, 3], [-3, 3]] }[r.sys];
      point.bornes(0, ...etendue[0]);
      point.bornes(1, ...etendue[1]);
      point.fixe([r.x1, r.x2]);
      const e = aInstant(ech, r.t);
      const [i, j] = S.axes;

      // ---- Plan ----
      // Cadre : la boîte de la trajectoire de référence, avec une marge.
      const xs = ech.map((p) => p.xb[i]);
      const ys = ech.map((p) => p.xb[j]);
      const [xa, xb] = [Math.min(...xs, r.x1), Math.max(...xs, r.x1)];
      const [ya, yb] = [Math.min(...ys, r.x2), Math.max(...ys, r.x2)];
      const m = 0.12 * Math.max(xb - xa, yb - ya, 1);
      cadreAuto = { x: [xa - m, xb + m], y: [ya - m, yb + m] };
      const cadre = gele ?? zoomPlan.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        rep.axes({ noms: S.noms });
        const jusque = ech.filter((p) => p.t <= r.t + 1e-9);
        rep.trace(ech.map((p) => [p.xb[i], p.xb[j]]), { couleur: col.accent, largeur: 1, alpha: 0.3 });
        rep.trace(jusque.map((p) => [p.xb[i], p.xb[j]]), { couleur: col.accent, largeur: 2.2 });
        rep.trace(jusque.map((p) => [p.xp[i], p.xp[j]]), { couleur: col.series[0], largeur: 1.6 });
        // La trajectoire à l'ordre 1 : x̄(s) + ε δx(s), que le bout de la flèche ε δx(t) parcourt.
        const ordre1 = col.series[2];
        rep.trace(jusque.map((p) => [p.xb[i] + eps * p.dx[i], p.xb[j] + eps * p.dx[j]]), { couleur: ordre1, largeur: 1.8, tirets: [6, 4] });
        // Perturbation initiale ε δx₀ en tirets, posée en x̄₀ (nulle si l'on perturbe le paramètre).
        const depart = ech[0];
        const bout = [depart.xp[i], depart.xp[j]];
        if (r.mode === 'x0') {
          rep.trace([[r.x1, r.x2], bout], { couleur: ordre1, largeur: 1.8, tirets: [4, 3] });
          rep.pointe(bout[0], bout[1], eps * depart.dx[i], eps * depart.dx[j], { couleur: ordre1 });
        }
        // L'écart réel Δx(t), de x̄(t) à la solution perturbée (orange, pointillés), puis
        // la flèche d'ordre 1 ε δx(t) depuis x̄(t) : elles se superposent tant que ε
        // est petit, et se séparent quand la linéarisation décroche.
        rep.trace([[e.xb[i], e.xb[j]], [e.xp[i], e.xp[j]]], { couleur: col.series[0], largeur: 2.2, tirets: [2, 3] });
        const [px, py] = [e.xb[i] + eps * e.dx[i], e.xb[j] + eps * e.dx[j]];
        rep.trace([[e.xb[i], e.xb[j]], [px, py]], { couleur: ordre1, largeur: 2 });
        rep.pointe(px, py, eps * e.dx[i], eps * e.dx[j], { couleur: ordre1 });
        // Les points : chaque solution garde sa couleur, au départ comme à l'instant t.
        rep.point(bout[0], bout[1], { rayon: 4.5, couleur: col.series[0] });
        rep.point(r.x1, r.x2, { rayon: 5.5, couleur: col.accent });
        rep.point(e.xb[i], e.xb[j], { rayon: 4.5, couleur: col.accent });
        rep.point(e.xp[i], e.xp[j], { rayon: 4, couleur: col.series[0] });
        rep.point(px, py, { rayon: 3.5, couleur: ordre1 });
        // Étiquettes, décalées le long de la flèche (ε δx au bout, x̄ du côté opposé) pour ne pas se recouvrir.
        const etiquette = (x, y, v, texte, couleur, sens, ecart) => {
          const [ux, uy] = [v[i] * rep.sx, -v[j] * rep.sy];
          const n = Math.hypot(ux, uy) || 1;
          const place = (sg) => [(sg * ux * ecart) / n, (sg * uy * ecart) / n + 4];
          // Du côté opposé si l'étiquette sortirait de la figure.
          const dedans = ([dx, dy]) => {
            const [px, py] = [rep.X(x) + dx, rep.Y(y) + dy];
            return px > 30 && px < rep.rect.width - 30 && py > 14 && py < rep.rect.height - 14;
          };
          const [dx, dy] = dedans(place(sens)) ? place(sens) : place(-sens);
          rep.texte(x, y, texte, { couleur, align: 'center', dx, dy, police: 'italic 14px serif', fond: true });
        };
        etiquette(r.x1, r.x2, depart.dx, 'x̄₀', col.accent, -1, 18);
        if (r.mode === 'x0') etiquette(bout[0], bout[1], depart.dx, 'ε δx₀', ordre1, 1, 28);
        // Aux instants t > 0 seulement, quand les points de départ et d'arrivée sont distincts à l'écran.
        if (Math.hypot((e.xb[i] - r.x1) * rep.sx, (e.xb[j] - r.x2) * rep.sy) > 40) {
          etiquette(e.xb[i], e.xb[j], e.dx, 'x̄(t)', col.accent, -1, 18);
          etiquette(px, py, e.dx, 'ε δx(t)', ordre1, 1, 28);
        }
      }
      const perturbee = r.mode === 'x0' ? 'partie de $\\bar x_0 + \\varepsilon\\,\\delta x_0$ (le bout de la flèche en tirets)' : 'obtenue avec le paramètre $\\lambda + \\varepsilon$, de même condition initiale $\\bar x_0$';
      outils.rendTexte(
        lecture,
        `Bleu : la solution $\\bar x$, partie de $\\bar x_0$. Orange : la vraie solution perturbée, ${perturbee}. Vert : l’ordre 1, $\\bar x(t) + \\varepsilon\\,\\delta x(t)$, que parcourt le bout de la flèche $\\varepsilon\\,\\delta x(t)$ posée en $\\bar x(t)$. Pointillés orange : l’écart réel $\\Delta x(t)$, que la flèche prédit au premier ordre. ${r.mode === 'x0' ? 'Saisissez $\\bar x_0$ ou le point orange de départ pour les déplacer (direction $\\alpha$ et taille $\\varepsilon$ pour le second).' : ''}`,
      );
      zoneLegende.replaceChildren();
      legende(zoneLegende, [
        { texte: 'référence $\\bar x$', couleur: col.accent },
        { texte: 'perturbée (vraie)', couleur: col.series[0] },
        { texte: 'ordre 1 : $\\bar x + \\varepsilon\\,\\delta x$', couleur: col.series[2], tirets: true },
      ]);

      // ---- Formules ----
      const dx = e.dx;
      const nombre = (c) => latexNombreFixe(c, 3, 3);
      const vecteur = (v) => `\\begin{pmatrix} ${v.map(nombre).join(' \\\\ ')} \\end{pmatrix}`;
      const lambda = r.mode === 'lambda' ? `,\\quad \\partial_{${S.lambda}} f = (0, -\\sin x_1)` : '';
      const exact = r.sys === 'poly' ? `R(t, 0) = e^{tA} = ${latexMatriceFixe([[Math.exp(-r.t), Math.sinh(r.t)], [0, Math.exp(r.t)]], 3)}` : '';
      outils.rend(formules, `\\begin{gathered} ${S.jacobienne}${lambda} \\\\[0.3em] \\delta x(${latexNombreFixe(r.t, 2, 2)}) = ${vecteur(dx)} ${exact ? `\\\\[0.3em] ${exact}` : ''} \\end{gathered}`);
      const dir = r.mode === 'x0' ? ` Direction $\\delta x_0 = (\\cos\\alpha, \\sin\\alpha)$ dans le plan $(${S.noms.join(', ')})$.` : ` Paramètre $${S.lambda} + \\varepsilon$.`;
      outils.rendTexte(commentaire, `$\\varepsilon = 10^{${String(r.leps).replace('.', '{,}')}}$.${dir} ${S.commentaire}`);

      // ---- Écart réel et prédiction, en échelle logarithmique ----
      const T = ech[ech.length - 1].t;
      const reel = ech.map((p) => [p.t, Math.log10(norme(p.xp.map((v, k) => v - p.xb[k])) / eps)]);
      const pred = ech.map((p) => [p.t, Math.log10(norme(p.dx))]);
      const ys2 = [...reel, ...pred].map(([, v]) => v).filter(Number.isFinite);
      repE.fixeCadre([0, T], [Math.floor(Math.min(...ys2, -1)), Math.ceil(Math.max(...ys2, 1))]);
      if (repE.prepare()) {
        repE.axes({ noms: ['t', [['log₁₀ écart', false]]], nomsAuBord: true, enL: true });
        repE.trace(reel, { couleur: col.series[0], largeur: 2 });
        repE.trace(pred, { couleur: col.trait, largeur: 1.6, tirets: [6, 4] });
        repE.trace([[r.t, -100], [r.t, 100]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
      }
      const q = norme(e.xp.map((v, k) => v - e.xb[k])) / (eps * norme(dx));
      outils.rendTexte(rapport, `À l’instant $t$ : $\\|\\Delta x(t)\\| / (\\varepsilon\\,\\|\\delta x(t)\\|) = ${Number.isFinite(q) ? latexNombreFixe(q, 4) : '—'}$.`);
    }

    // ---- Animation en boucle de t -----------------------------------------------------------------------
    let debut = null;
    const arrete = () => {
      if (prefs.valeurs.anime) prefs.change({ anime: false });
      entreeAnime.checked = false;
    };
    const anime = (maintenant) => {
      if (prefs.valeurs.anime) {
        if (debut === null) debut = maintenant;
        const T = SYSTEMES[r.sys].T;
        const s = ((maintenant - debut) / 1000) % (T_BOUCLE + 0.6);
        const t = Number(((Math.min(s, T_BOUCLE) / T_BOUCLE) * T).toFixed(2));
        if (t !== r.t) {
          outils.change({ t });
          champT.fixe(t);
          dessine();
        }
      } else {
        debut = null;
      }
      requestAnimationFrame(anime);
    };
    if (!outils.mouvementReduit) requestAnimationFrame(anime);

    function applique() {
      const S = SYSTEMES[r.sys];
      const curseurT = champT;
      cPlan.querySelector('input[type=range]').max = S.T;
      curseurT.fixe(r.t);
      champEps.fixe(r.leps);
      champAng.fixe(r.ang);
      dessine();
    }

    outils.surTheme(dessine);
    applique();
    return { applique };
  },
};
