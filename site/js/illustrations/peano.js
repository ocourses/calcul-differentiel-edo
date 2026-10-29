// Peano par les polygones d'Euler (poly, théorème de Peano ; la preuve
// renvoie à Demailly, § V.2). Dans un cylindre de sécurité
// C = [t₀, t₀ + T] × [x₀ − r, x₀ + r], avec M = sup_C |f| et T ≤ r/M, les
// polygones d'Euler de pas h = T/N restent dans le cône de pentes ±M : ils
// sont tous M-lipschitziens et bornés (Ascoli), et ce sont des solutions
// ε-approchées, |ẋ_h − f(x_h)| ≤ ε(h) → 0. Une sous-suite converge donc
// uniformément, et sa limite est une solution. Sans unicité, la limite dépend
// de l'approximation : partis de x₀ = 0, les polygones de ẋ = √|x| restent
// nuls ; partis de x₀ + δ_N, δ_N = r/(10N²) → 0, ils convergent vers t²/4. Les
// deux suites sont tracées ensemble. L'équation oscillante montre la
// convergence elle-même : à peu de pas, le polygone ne voit pas l'oscillation.

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe, latexPositifFixe, latexScientifiqueFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, glisse, legende, paragraphe, toile, zoomable } from './commun.js';
import { EQUATIONS as NON_UNIQUES, contraintes, solution } from './non-unicite.js';

// Solution de ẋ = 2 cos 4t − x/2 : (x₀ − A) e^{−t/2} + A cos 4t + B sin 4t.
const [A, B] = [4 / 65, 32 / 65];

// Les équations f(t, x), et M(x₀, r) = sup |f| sur [0, T_MAX] × [x₀ − r, x₀ + r].
export const EQUATIONS = {
  racine: { latex: '\\dot x = \\sqrt{|x|}', f: (t, x) => NON_UNIQUES.racine.f(x), M: (x0, r) => Math.sqrt(Math.abs(x0) + r), unique: false },
  oscille: {
    latex: '\\dot x = 2\\cos 4t - x/2',
    f: (t, x) => 2 * Math.cos(4 * t) - x / 2,
    M: (x0, r) => 2 + (Math.abs(x0) + r) / 2,
    unique: true,
  },
  carre: { latex: '\\dot x = 1 + x^2', f: (t, x) => 1 + x * x, M: (x0, r) => 1 + (Math.abs(x0) + r) ** 2, unique: true },
};

// Durée au plus montrée, même quand r/M est plus grand.
export const T_MAX = 2;

// Cylindre de sécurité de demi-hauteur r autour de x₀ : M et T = min(r/M, T_MAX).
export function cylindre(eq, x0, r) {
  const M = EQUATIONS[eq].M(x0, r);
  return { M, T: Math.min(r / M, T_MAX) };
}

// Polygone d'Euler à N pas sur [0, T], parti de x₀ : les N + 1 sommets.
export function polygone(eq, x0, T, N) {
  const f = EQUATIONS[eq].f;
  const h = T / N;
  const xs = [x0];
  for (let i = 0; i < N; i++) xs.push(xs[i] + h * f(i * h, xs[i]));
  return xs;
}

// Valeur du polygone (sommets xs sur [0, T]) en t, par interpolation linéaire.
export function valeur(xs, T, t) {
  const N = xs.length - 1;
  const s = Math.max(0, Math.min(N, (t / T) * N));
  const i = Math.min(N - 1, Math.floor(s));
  return xs[i] + (s - i) * (xs[i + 1] - xs[i]);
}

// Défaut de solution approchée : sup sur [0, T] de |ẋ_h(t) − f(x_h(t))|, où ẋ_h
// est la pente du segment ; échantillonné sur chaque segment.
export function defaut(eq, xs, T) {
  const f = EQUATIONS[eq].f;
  const N = xs.length - 1;
  const h = T / N;
  let e = 0;
  for (let i = 0; i < N; i++) {
    const pente = (xs[i + 1] - xs[i]) / h;
    for (let k = 0; k <= 8; k++) e = Math.max(e, Math.abs(pente - f((i + k / 8) * h, xs[i] + (k / 8) * (xs[i + 1] - xs[i]))));
  }
  return e;
}

// Solutions exactes vers le futur, sur [0, T] : la seule, ou la plus petite et
// la plus grande quand l'unicité tombe (non-unicité, a et b).
export function solutionsExactes(eq, x0) {
  if (eq === 'carre') return [(t) => Math.tan(t + Math.atan(x0))];
  if (eq === 'oscille') return [(t) => (x0 - A) * Math.exp(-t / 2) + A * Math.cos(4 * t) + B * Math.sin(4 * t)];
  const c = contraintes(eq, 0, x0);
  const a = c.aFixe ?? c.aMax;
  if (c.bFixe !== undefined) return [solution(eq, a, c.bFixe)];
  return [solution(eq, a, Infinity), solution(eq, a, c.bMin)];
}

// Le départ des polygones : exact, ou perturbé de δ_N = r/(10N²) (une autre
// suite de solutions approchées, dont l'erreur initiale tend vers 0).
export const depart = (x0, r, N, perturbe) => x0 + (perturbe ? r / (10 * N * N) : 0);

// Pour N = 2^k, k = 0 … K : écart au polygone suivant, ‖x_N − x_{2N}‖∞, et défaut ε(h).
export function convergence(eq, x0, r, T, perturbe, K = 10) {
  const grille = Array.from({ length: 1025 }, (_, i) => (T * i) / 1024);
  const poly = (N) => polygone(eq, depart(x0, r, N, perturbe), T, N);
  return Array.from({ length: K + 1 }, (_, k) => {
    const [p, q] = [poly(2 ** k), poly(2 ** (k + 1))];
    const ecart = Math.max(...grille.map((t) => Math.abs(valeur(p, T, t) - valeur(q, T, t))));
    return { k, ecart, defaut: defaut(eq, p, T) };
  });
}

export default {
  etat: { eq: 'racine', x0: 0, r: 1, k: 3 },

  choix: { eq: Object.keys(EQUATIONS) },

  termes: ['équation intégrale', 'lipschitzienne'],

  rappel: [
    'Peano : si $f$ est continue, par tout point $(t_0, x_0)$ il passe au moins une solution. Une preuve (Demailly, citée par le poly) construit la solution comme limite de polygones d’Euler,',
    '$$x_{i+1} = x_i + h\\,f(t_i, x_i), \\qquad h = T/N.$$',
    'Cylindre de sécurité : sur $C = [t_0, t_0 + T] \\times \\bar B(x_0, r)$, soit $M = \\sup_C \\|f\\|$. Si',
    '$$T \\le r/M,$$',
    'une fonction $M$-lipschitzienne partie de $x_0$ ne sort pas de $C$ avant $t_0 + T$ : les polygones y restent, dans le cône de pentes $\\pm M$.',
    'Ils sont $M$-lipschitziens et bornés : par Ascoli, une sous-suite converge uniformément. Ce sont des solutions approchées,',
    '$$\\|\\dot x_h(t) - f(t, x_h(t))\\| \\le \\varepsilon(h) \\xrightarrow[h \\to 0]{} 0,$$',
    'par continuité uniforme de $f$ sur $C$ ; la limite vérifie donc l’équation intégrale : c’est une solution.',
    'Sans unicité, rien ne dit laquelle : la limite dépend de la suite d’approximations.',
  ],

  essais: [
    { texte: '$\\dot x = \\sqrt{|x|}$, $x_0 = 0$ : deux suites de polygones. « Partis de $x_0$ », ils restent nuls ; « partis de $x_0 + \\delta_N$ », $\\delta_N \\to 0$, ils tendent vers $t^2/4$. Deux suites de solutions approchées, deux solutions limites.', etat: { eq: 'racine', x0: 0, r: 1, k: 4 } },
    { texte: 'Même équation, $N = 1$ puis $N = 2, 4, \\ldots$ : à peu de pas, le polygone parti de $\\delta_N$ dépasse $t^2/4$ ; en doublant $N$, il s’en rapproche. Zoomez à la molette pour le voir près de l’origine.', etat: { eq: 'racine', x0: 0, r: 1, k: 0 } },
    { texte: '$\\dot x = 2\\cos 4t - x/2$ avec $N = 2$ : le polygone ne voit pas l’oscillation. Augmentez $N$ : il se resserre sur la solution, et l’écart entre deux polygones successifs est divisé par $2$ à chaque doublement (Euler est d’ordre $1$).', etat: { eq: 'oscille', x0: 0, r: 2, k: 1 } },
    { texte: '$\\dot x = 1 + x^2$ : augmentez $r$. $M = 1 + r^2$ grandit plus vite que $r$, et $T = r/M$ ne dépasse jamais $1/2$ : le cylindre ne donne qu’une existence locale.', etat: { eq: 'carre', x0: 0, r: 0.5, k: 3 } },
    { texte: 'Partez de $x_0 = 0{,}5$ pour $\\dot x = \\sqrt{|x|}$ : la solution vers le futur est unique (elle ne touche pas $0$), et les deux suites de polygones convergent vers elle.', etat: { eq: 'racine', x0: 0.5, r: 1, k: 3 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'eq',
      options: Object.entries(EQUATIONS).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        outils.change({ eq: valeur });
        zoom.reinitialise();
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    // ---- Cylindre et polygones ------------------------------------------------------------------
    const cPlan = carte(grille, 'Polygones d’Euler dans le cylindre de sécurité');
    boutonInfo(cPlan, [
      ['zone', '--zone-stable', 'Le cylindre $C = [0, T] \\times [x_0 - r, x_0 + r]$ : faites glisser son bord haut pour changer $r$.'],
      ['tirets', '--texte', 'Le cône de pentes $\\pm M$ issu de $(0, x_0)$ : les polygones n’en sortent pas.'],
      ['ligne', '--serie-2', 'Les polygones partis de $x_0$ : $1, 2, 4, \\ldots$ pas en clair, $N = 2^k$ pas en gras.'],
      ['ligne', '--serie-3', 'Quand l’unicité tombe, les polygones partis de $x_0 + \\delta_N$, $\\delta_N = r/(10N^2) \\to 0$ : une autre suite de solutions approchées.'],
      ['ligne', '--texte', 'La solution exacte ; quand l’unicité tombe, la plus petite et la plus grande (tirets).'],
      ['point', '--perturbation', 'La condition initiale $(0, x_0)$ : cliquez ou faites glisser. La molette zoome.'],
    ]);
    const canvas = toile(cPlan, '16 / 10', () => dessine());
    canvas.classList.add('cliquable');
    const rep = new Repere(canvas, { x: [0, 1], y: [-1, 1] });
    const barrePlan = document.createElement('div');
    barrePlan.className = 'barre-legende';
    cPlan.appendChild(barrePlan);
    const zoneLegendePlan = document.createElement('div');
    barrePlan.appendChild(zoneLegendePlan);
    // Cadre automatique : le cylindre, avec une marge.
    const cadreCylindre = () => {
      const { T } = cylindre(r.eq, r.x0, r.r);
      const marge = 0.24 * r.r;
      return { x: [0, T * 1.06], y: [r.x0 - r.r - marge, r.x0 + r.r + marge] };
    };
    const zoom = zoomable(canvas, rep, { barre: barrePlan, auto: cadreCylindre, redessine: () => dessine(), deplacer: false, tempsPositif: true });
    let saisi = null;
    glisse(canvas, rep, {
      prend: (t, x) => {
        const { T } = cylindre(r.eq, r.x0, r.r);
        saisi = t <= T && Math.abs((x - (r.x0 + r.r)) * rep.sy) < 8 ? 'r' : 'x0';
        return true;
      },
      deplace: (t, x) => {
        if (saisi === 'r') outils.change({ r: Number(Math.max(0.1, Math.min(3, x - r.x0)).toFixed(2)) });
        else outils.change({ x0: Math.abs(x) * rep.sy < 8 ? 0 : Number(Math.max(-2, Math.min(2, x)).toFixed(3)) });
        majChamps();
        dessine();
      },
    });
    const reglages = document.createElement('div');
    reglages.className = 'reglages-2';
    cPlan.appendChild(reglages);
    const champs = {
      x0: champ(reglages, { latex: 'x_0', min: -2, max: 2, pas: 0.01, pasFleche: 0.1, valeur: r.x0 }, (v) => {
        outils.change({ x0: v });
        dessine();
      }),
      r: champ(reglages, { latex: 'r', min: 0.1, max: 3, pas: 0.01, pasFleche: 0.1, valeur: r.r }, (v) => {
        outils.change({ r: v });
        dessine();
      }),
      k: champ(cPlan, { latex: '\\log_2 N', min: 0, max: 10, pas: 1, valeur: r.k }, (v) => fixeK(v)),
    };
    function fixeK(v) {
      outils.change({ k: Math.max(0, Math.min(10, Math.round(v))) });
      champs.k.fixe(r.k);
      dessine();
    }

    // ---- Colonne : cylindre, convergence --------------------------------------------------------------
    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cCyl = carte(colonne, 'Le cylindre');
    const formule = document.createElement('div');
    formule.className = 'formule';
    cCyl.appendChild(formule);
    const noteCyl = paragraphe(cCyl, '', 'note conclusion-fixe');

    const cConv = carte(colonne, 'Convergence des polygones');
    boutonInfo(cConv, [
      ['ligne', '--serie-2', 'L’écart $\\|x_N - x_{2N}\\|_\\infty$ entre deux polygones successifs, en fonction de $N$ (échelle logarithmique) : une suite de Cauchy, si elle décroît. Quand l’unicité tombe, pour les polygones partis de $x_0 + \\delta_N$, de leur couleur (vert).'],
      ['tirets', '--serie-4', 'Le défaut $\\varepsilon(h) = \\sup |\\dot x_h - f(t, x_h)|$ : le polygone est une solution approchée.'],
      ['point', '--perturbation', 'Le $N$ choisi : cliquez sur la figure pour en changer.'],
    ]);
    const canvasConv = toile(cConv, '16 / 9', () => dessine());
    canvasConv.classList.add('saisissable');
    const repConv = new Repere(canvasConv, { x: [0, 10], y: [-6, 1] });
    glisse(canvasConv, repConv, { deplace: (k) => fixeK(k) });
    const zoneLegende = document.createElement('div');
    cConv.appendChild(zoneLegende);
    const noteConv = paragraphe(cConv, '', 'note conclusion-fixe');

    // La suite étudiée à droite : partie de x₀ + δ_N quand l'unicité tombe.
    let cache = { cle: '', valeur: null };
    function suite() {
      const { T } = cylindre(r.eq, r.x0, r.r);
      const cle = JSON.stringify([r.eq, r.x0, r.r]);
      if (cache.cle !== cle) cache = { cle, valeur: convergence(r.eq, r.x0, r.r, T, !EQUATIONS[r.eq].unique) };
      return cache.valeur;
    }

    function dessine() {
      const col = couleurs();
      const E = EQUATIONS[r.eq];
      // Réglages lus dans l'URL : k entier dans [0, 10], r dans [0,1 ; 3].
      if (!Number.isInteger(r.k) || r.k < 0 || r.k > 10 || !(r.r >= 0.1 && r.r <= 3)) outils.change({ k: Math.max(0, Math.min(10, Math.round(r.k) || 3)), r: r.r >= 0.1 && r.r <= 3 ? r.r : 1 });
      choix.fixe(r.eq);
      const { M, T } = cylindre(r.eq, r.x0, r.r);
      const N = 2 ** r.k;
      const exactes = solutionsExactes(r.eq, r.x0);
      // Les suites de polygones : partis de x₀, et de x₀ + δ_N sans unicité.
      const suites = [{ perturbe: false, couleur: col.series[1] }, ...(E.unique ? [] : [{ perturbe: true, couleur: col.series[2] }])];
      const couleurSuite = suites.at(-1).couleur;

      // ---- Plan ----
      const [y0, y1] = [r.x0 - r.r, r.x0 + r.r];
      const cadre = zoom.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        rep.region((t, x) => t >= 0 && t <= T && x >= y0 && x <= y1, { couleur: col.zone, pas: 3 });
        rep.axes({ noms: ['t', 'x'] });
        rep.trace([[0, y0], [T, y0], [T, y1], [0, y1]], { couleur: col.discret, largeur: 1 });
        for (const s of [-1, 1]) rep.trace([[0, r.x0], [T, r.x0 + s * M * T]], { couleur: col.trait, largeur: 1, tirets: [5, 4] });
        const ts = Array.from({ length: 401 }, (_, i) => (T * i) / 400);
        exactes.forEach((x, i) => rep.trace(ts.map((t) => [t, x(t)]), { couleur: col.trait, largeur: 1.6, tirets: i > 0 ? [6, 4] : [] }));
        for (const { perturbe, couleur } of suites) {
          for (let j = 0; j < r.k; j++) {
            const xs = polygone(r.eq, depart(r.x0, r.r, 2 ** j, perturbe), T, 2 ** j);
            rep.trace(xs.map((v, i) => [(T * i) / 2 ** j, v]), { couleur, largeur: 1, alpha: 0.35 });
          }
          const xs = polygone(r.eq, depart(r.x0, r.r, N, perturbe), T, N);
          rep.trace(xs.map((v, i) => [(T * i) / N, v]), { couleur, largeur: 2.4 });
          if (N <= 64) xs.forEach((v, i) => rep.point((T * i) / N, v, { rayon: 2.5, couleur }));
        }
        rep.point(0, r.x0, { rayon: 5, couleur: col.perturbation });
      }
      zoneLegendePlan.replaceChildren();
      legende(zoneLegendePlan, [
        { texte: 'partis de $x_0$', couleur: col.series[1] },
        ...(E.unique ? [] : [{ texte: 'partis de $x_0 + \\delta_N$', couleur: col.series[2] }]),
        { texte: E.unique ? 'solution' : 'solutions', couleur: col.trait },
      ]);

      // ---- Cylindre ----
      outils.rend(formule, `\\begin{gathered} M = \\sup_C |f| = ${latexPositifFixe(M, 3, 2)} \\\\ T = \\min\\big(r/M,\\ ${T_MAX}\\big) = ${latexPositifFixe(T, 3)} \\end{gathered}`);
      outils.rendTexte(
        noteCyl,
        T < T_MAX
          ? `$T = r/M$ : plus haut est le cylindre, plus $f$ y est grande, et l’existence n’est obtenue que sur $[0, ${latexNombreFixe(T, 2)}]$.`
          : `$r/M \\ge ${T_MAX}$ : on se limite à $T = ${T_MAX}$.`,
      );

      // ---- Convergence ----
      const s = suite();
      const lg = (v) => Math.log10(Math.max(v, 1e-16));
      const ys = s.flatMap((p) => [lg(p.ecart), lg(p.defaut)]);
      repConv.fixeCadre([0, 10], [Math.max(-16, Math.floor(Math.min(...ys))) - 0.3, Math.ceil(Math.max(...ys)) + 0.3]);
      if (repConv.prepare()) {
        repConv.axes({ noms: [[['log₂ ', false], ['N', true]], [['log₁₀', false]]], nomsAuBord: true, enL: true });
        repConv.trace(s.map((p) => [p.k, lg(p.defaut)]), { couleur: col.series[3], largeur: 1.6, tirets: [5, 4] });
        repConv.trace(s.map((p) => [p.k, lg(p.ecart)]), { couleur: couleurSuite, largeur: 2 });
        for (const p of s) repConv.point(p.k, lg(p.ecart), { rayon: 2.5, couleur: couleurSuite });
        repConv.point(r.k, lg(s[r.k].ecart), { rayon: 5, couleur: col.perturbation });
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, [
        { texte: '$\\|x_N - x_{2N}\\|_\\infty$', couleur: couleurSuite },
        { texte: 'défaut $\\varepsilon(h)$', couleur: col.series[3] },
      ]);
      const quelle = E.unique ? '' : ', départ $x_0 + \\delta_N$';
      outils.rendTexte(noteConv, `$N = ${latexPositifFixe(N, 0, 4)}$${quelle} : écart $${latexScientifiqueFixe(s[r.k].ecart, 1)}$, défaut $${latexScientifiqueFixe(s[r.k].defaut, 1)}$.`);
    }

    function majChamps() {
      champs.x0.fixe(r.x0);
      champs.r.fixe(r.r);
      champs.k.fixe(r.k);
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        majChamps();
        zoom.reinitialise();
        dessine();
      },
    };
  },
};
