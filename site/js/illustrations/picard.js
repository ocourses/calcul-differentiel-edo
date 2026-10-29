// Approximations successives et lemme de Grönwall (poly, chapitre « Théorèmes
// d'existence et d'unicité » : équation intégrale, exercice des approximations
// successives, preuve de Cauchy-Lipschitz). Les itérées de Picard
//   x⁽⁰⁾ = x₀,   x⁽ᵏ⁺¹⁾(t) = x₀ + ∫_{t₀}^t f(s, x⁽ᵏ⁾(s)) ds
// convergent vers la solution ; pour ẋ = 2t(1 + x), x(0) = 0, ce sont les
// sommes partielles de e^{t²} − 1. À côté, deux solutions voisines : leur écart
// reste sous la borne de Grönwall |x₀ − y₀| exp(∫ k(s) ds).

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, glisse, legende, paragraphe, toile } from './commun.js';

// Les équations : f(t, x), solution exacte de x(0) = x₀, et constante de
// Lipschitz locale k(s) entre deux solutions x et y, pour Grönwall.
export const EQUATIONS = {
  poly: {
    latex: '\\dot x = 2t\\,(1 + x)',
    f: (t, x) => 2 * t * (1 + x),
    exacte: (t, x0) => (1 + x0) * Math.exp(t * t) - 1,
    k: (s) => 2 * Math.abs(s),
    // Constante de Lipschitz de f en x sur [0, T] × ℝ : sup |2t| = 2T.
    L: (T) => 2 * T,
    // Itérée exacte : (1 + x₀) Σ_{j ≤ k} t^{2j}/j! − 1.
    iteree: (k, t, x0) => {
      let s = 0;
      let terme = 1;
      for (let j = 0; j <= k; j++) {
        s += terme;
        terme *= (t * t) / (j + 1);
      }
      return (1 + x0) * s - 1;
    },
    borne: 'e^{t^2}',
    T: 1.6,
    commentaire: 'Exercice du poly : $x^{(1)} = t^2$, $x^{(2)} = t^2 + t^4/2$, $x^{(3)} = t^2 + t^4/2 + t^6/6$, les sommes partielles de $e^{t^2} - 1 = \\sum_{k \\ge 1} t^{2k}/k!$.',
  },
  lineaire: {
    latex: '\\dot x = x',
    f: (t, x) => x,
    exacte: (t, x0) => x0 * Math.exp(t),
    k: () => 1,
    L: () => 1,
    // Itérée exacte : x₀ Σ_{j ≤ k} t^j/j!.
    iteree: (k, t, x0) => {
      let s = 0;
      let terme = 1;
      for (let j = 0; j <= k; j++) {
        s += terme;
        terme *= t / (j + 1);
      }
      return x0 * s;
    },
    borne: 'e^{t}',
    T: 3,
    commentaire: 'Avec $x_0 = 1$, $x^{(k)}(t) = \\sum_{j \\le k} t^j/j!$ : les itérées de Picard sont les polynômes de Taylor de $e^t$.',
  },
  tangente: {
    latex: '\\dot x = 1 + x^2',
    f: (t, x) => 1 + x * x,
    exacte: (t, x0) => Math.tan(t + Math.atan(x0)),
    k: (s, x, y) => Math.abs(x + y),
    borne: 'e^{\\int_0^t |x + y|}',
    T: 1.3,
    commentaire: '$f$ n’est lipschitzienne que localement : les itérées convergent vers $\\tan t$ près de $0$, mais la convergence se dégrade quand on s’approche de $\\pi/2$, où la solution explose.',
  },
};

// Itérées de Picard sur la grille t₀ = 0 < … < T : exactes quand le poly les
// donne, sinon par quadrature des trapèzes (alors précises à 10⁻⁶ près).
// Rend un tableau de K + 1 fonctions échantillonnées.
export function iterees(cle, x0, T, K, n = 2000) {
  const { f, iteree } = EQUATIONS[cle];
  const ts = Array.from({ length: n + 1 }, (_, i) => (T * i) / n);
  if (iteree) return { ts, resultat: Array.from({ length: K + 1 }, (_, k) => ts.map((t) => iteree(k, t, x0))) };
  const h = T / n;
  const resultat = [ts.map(() => x0)];
  for (let k = 0; k < K; k++) {
    const prec = resultat[k];
    const g = ts.map((t, i) => f(t, prec[i]));
    const suivante = [x0];
    for (let i = 1; i <= n; i++) suivante.push(suivante[i - 1] + (h / 2) * (g[i - 1] + g[i]));
    resultat.push(suivante.map((v) => (Number.isFinite(v) && Math.abs(v) < 1e8 ? v : NaN)));
  }
  return { ts, resultat };
}

// Bornes de l'erreur ‖x⁽ʲ⁾ − x‖∞ sur [0, T] quand f est L-lipschitzienne en x,
// avec d = ‖x⁽¹⁾ − x⁽⁰⁾‖∞ et q = LT :
//   point fixe (Φ contractante de rapport q, si q < 1) : q^j d/(1 − q) ;
//   récurrence sur les itérées, valable pour tout T : d Σ_{i ≥ j} q^i/i!.
export function bornesPicard(q, d, j) {
  let terme = 1;
  for (let i = 1; i <= j; i++) terme *= q / i;
  let reste = 0;
  for (let i = j, t = terme; i < j + 200 && t > 1e-300; i++, t *= q / (i + 0)) reste += t;
  return { pointFixe: q < 1 ? (d * q ** j) / (1 - q) : Infinity, factorielle: d * reste };
}

// Écart de deux solutions et borne de Grönwall |x₀ − y₀| exp(∫₀ᵗ k).
export function gronwall(cle, x0, y0, T, n = 600) {
  const E = EQUATIONS[cle];
  const ts = Array.from({ length: n + 1 }, (_, i) => (T * i) / n);
  let integrale = 0;
  return ts.map((t, i) => {
    const [x, y] = [E.exacte(t, x0), E.exacte(t, y0)];
    if (i > 0) {
      const s = ts[i - 1];
      integrale += ((t - s) / 2) * (E.k(s, E.exacte(s, x0), E.exacte(s, y0)) + E.k(t, x, y));
    }
    return { t, ecart: Math.abs(x - y), borne: Math.abs(x0 - y0) * Math.exp(integrale) };
  });
}

export default {
  etat: { eq: 'poly', x0: 0, k: 3, T: 1.6, ldelta: -1 },

  choix: { eq: Object.keys(EQUATIONS) },

  termes: ['équation intégrale', 'contractante', 'lemme de Grönwall', 'lipschitzienne', 'problème de Cauchy'],

  rappel: [
    'Équation intégrale : $\\varphi$ est solution du problème de Cauchy $\\dot x = f(t, x)$, $x(t_0) = x_0$, si et seulement si',
    '$$\\varphi(t) = x_0 + \\int_{t_0}^t f(s, \\varphi(s))\\,\\mathrm ds.$$',
    'La solution est donc un point fixe de $\\Phi \\colon x \\mapsto x_0 + \\int_{t_0}^{t} f(s, x(s))\\,\\mathrm ds$. Les approximations successives $x^{(k+1)} = \\Phi(x^{(k)})$ convergent vers elle (exercice du poly).',
    'Elles donnent une autre preuve de Cauchy-Lipschitz que celle du poly (Peano pour l’existence, Grönwall pour l’unicité). Si $f$ est $L$-lipschitzienne en $x$, sur $[t_0, t_0 + T]$,',
    '$$\\|\\Phi(x) - \\Phi(y)\\|_\\infty \\le LT\\,\\|x - y\\|_\\infty :$$',
    'sur un intervalle assez court ($LT < 1$), $\\Phi$ est contractante et le théorème du point fixe de l’annexe s’applique.',
    'Lemme de Grönwall : si $u(t) \\le a + \\int_{t_0}^t k(s)\\,u(s)\\,\\mathrm ds$, alors',
    '$$u(t) \\le a \\exp\\Big(\\int_{t_0}^t k(s)\\,\\mathrm ds\\Big).$$',
    'Avec $u = \\|x - y\\|$ et $f$ lipschitzienne de constante $k$, deux solutions s’écartent au plus comme $\\|x_0 - y_0\\|\\,e^{kt}$ ; et si $x_0 = y_0$, elles sont égales : c’est l’unicité.',
  ],

  essais: [
    { texte: 'Exercice du poly : faites passer $k$ de $0$ à $3$. Reconnaissez-vous $t^2$, $t^2 + t^4/2$, $t^2 + t^4/2 + t^6/6$ ?', etat: { eq: 'poly', x0: 0, k: 0, T: 1.6 } },
    { texte: 'Sur $[0, 1{,}6]$, combien d’itérées faut-il pour que l’écart à $e^{t^2} - 1$ passe sous $10^{-4}$ ? Lisez-le sur le graphe de l’erreur.', etat: { eq: 'poly', x0: 0, k: 6, T: 1.6 } },
    { texte: '$\\dot x = x$ : les itérées sont les polynômes de Taylor de $e^t$. L’erreur décroît comme $T^{k+1}/(k+1)!$.', etat: { eq: 'lineaire', x0: 1, k: 4, T: 3 } },
    { texte: 'Point fixe : avec $\\dot x = x$, réduisez $T$ sous $1$. La borne du point fixe apparaît : $\\Phi$ est contractante. Au-dessus de $1$, elle disparaît, mais les itérées convergent toujours.', etat: { eq: 'lineaire', x0: 1, k: 6, T: 0.8 } },
    { texte: '$\\dot x = 1 + x^2$ : augmentez $T$ vers $\\pi/2 \\approx 1{,}57$. Il faut de plus en plus d’itérées ; réduisez $T$ à $0{,}5$ : la convergence redevient rapide.', etat: { eq: 'tangente', x0: 0, k: 8, T: 1.3 } },
    { texte: 'Grönwall sur une équation linéaire : l’écart et la borne coïncident. Pour $\\dot x = 1 + x^2$, la borne utilise la constante locale $|x + y|$.', etat: { eq: 'lineaire', x0: 1, k: 4, T: 3, ldelta: -1 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'eq',
      options: Object.entries(EQUATIONS).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        outils.change({ eq: valeur, T: EQUATIONS[valeur].T, x0: valeur === 'lineaire' ? 1 : 0 });
        applique();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    // ---- Itérées --------------------------------------------------------------------------------------
    const cIter = carte(grille, 'Itérées de Picard $x^{(0)}, x^{(1)}, \\ldots, x^{(k)}$');
    boutonInfo(cIter, [
      ['ligne', '--texte', 'La solution exacte.'],
      ['ligne', '--discret', 'Les itérées précédentes $x^{(0)}, \\ldots, x^{(k-1)}$.'],
      ['ligne', '--accent', 'L’itérée $x^{(k)}$.'],
    ]);
    const canvas = toile(cIter, '16 / 10', () => dessine());
    const rep = new Repere(canvas, { x: [0, 1.6], y: [-1, 12] });
    const reglages = document.createElement('div');
    reglages.className = 'reglages-2';
    cIter.appendChild(reglages);
    const champK = champ(reglages, { latex: 'k', min: 0, max: 15, pas: 1, valeur: r.k }, (v) => {
      outils.change({ k: Math.max(0, Math.min(40, Math.round(v))) });
      dessine();
    });
    const champT = champ(reglages, { latex: 'T', min: 0.2, max: 3, pas: 0.05, valeur: r.T }, (v) => {
      outils.change({ T: v });
      dessine();
    });
    const commentaire = paragraphe(cIter, '', 'note texte-fixe');

    // ---- Colonne : erreur des itérées, Grönwall ----------------------------------------------------------
    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cErreur = carte(colonne, 'Erreur $\\max_{[0, T]} |x^{(j)} - x|$');
    boutonInfo(cErreur, [
      ['ligne', '--accent', 'L’écart maximal entre l’itérée $x^{(j)}$ et la solution sur $[0, T]$, en fonction de $j$, en échelle logarithmique.'],
      ['point', '--perturbation', 'L’itérée $x^{(k)}$ affichée : cliquez sur la figure pour en choisir une autre.'],
      ['tirets', '--serie-2', 'La borne du point fixe $q^j\\,d/(1 - q)$, avec $q = LT$ et $d = \\|x^{(1)} - x^{(0)}\\|$ : seulement si $\\Phi$ est contractante, $q < 1$.'],
      ['tirets', '--texte', 'La borne $d \\sum_{i \\ge j} q^i/i!$, valable pour tout $T$.'],
    ]);
    const canvasErreur = toile(cErreur, '16 / 9', () => dessine());
    canvasErreur.classList.add('saisissable');
    const repErreur = new Repere(canvasErreur, { x: [0, 15], y: [-12, 2] });
    glisse(canvasErreur, repErreur, {
      deplace: (j) => {
        outils.change({ k: Math.max(0, Math.min(15, Math.round(j))) });
        champK.fixe(r.k);
        dessine();
      },
    });
    const noteErreur = paragraphe(cErreur, '', 'note conclusion-fixe');

    const cGronwall = carte(colonne, 'Lemme de Grönwall');
    boutonInfo(cGronwall, [
      ['ligne', '--serie-1', 'L’écart $|x(t) - y(t)|$ entre les solutions de $x(0) = x_0$ et $y(0) = x_0 + \\delta$, en échelle logarithmique.'],
      ['tirets', '--texte', 'La borne de Grönwall $\\delta\\,\\exp\\big(\\int_0^t k(s)\\,\\mathrm ds\\big)$.'],
    ]);
    const canvasG = toile(cGronwall, '16 / 9', () => dessine());
    const repG = new Repere(canvasG, { x: [0, 1.6], y: [-2, 2] });
    const champDelta = champ(cGronwall, { latex: '\\log_{10}\\delta', min: -6, max: 0, pas: 0.1, pasFleche: 0.5, valeur: r.ldelta }, (v) => {
      outils.change({ ldelta: v });
      dessine();
    });
    const noteG = paragraphe(cGronwall, '', 'note');

    let cache = { cle: '', valeur: null };
    function calcule() {
      const cle = JSON.stringify([r.eq, r.x0, r.T]);
      if (cache.cle !== cle) cache = { cle, valeur: iterees(r.eq, r.x0, r.T, 15) };
      // Au-delà de 15 itérées (saisie au clavier), on prolonge.
      if (r.k > 15 && cache.valeur.resultat.length <= r.k) cache.valeur = iterees(r.eq, r.x0, r.T, r.k);
      return cache.valeur;
    }

    function dessine() {
      const col = couleurs();
      const E = EQUATIONS[r.eq];
      // Réglages lus dans l'URL : k entier entre 0 et 40, T dans ]0, 3].
      if (!Number.isInteger(r.k) || r.k < 0 || r.k > 40 || !(r.T > 0 && r.T <= 3)) outils.change({ k: Math.max(0, Math.min(40, Math.round(r.k) || 0)), T: r.T > 0 && r.T <= 3 ? r.T : E.T });
      choix.fixe(r.eq);
      outils.rendTexte(commentaire, E.commentaire);
      const { ts, resultat } = calcule();
      const exacte = ts.map((t) => E.exacte(t, r.x0));

      // ---- Itérées ----
      const finies = exacte.filter((v) => Number.isFinite(v) && Math.abs(v) < 50);
      const yMax = Math.max(...finies, 1);
      const yMin = Math.min(...finies, r.x0, 0);
      rep.fixeCadre([0, r.T], [yMin - 0.08 * (yMax - yMin), yMax + 0.12 * (yMax - yMin)]);
      if (rep.prepare()) {
        rep.axes({ noms: ['t', 'x'] });
        rep.trace(ts.map((t, i) => [t, exacte[i]]), { couleur: col.trait, largeur: 2 });
        for (let j = 0; j < Math.min(r.k, resultat.length); j++) rep.trace(ts.map((t, i) => [t, resultat[j][i]]), { couleur: col.discret, largeur: 1, alpha: 0.6 });
        const xk = resultat[Math.min(r.k, resultat.length - 1)];
        rep.trace(ts.map((t, i) => [t, xk[i]]), { couleur: col.accent, largeur: 2.6 });
        rep.texte(r.T, xk[xk.length - 1], `x⁽${String(r.k).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')}⁾`, { couleur: col.accent, align: 'right', dx: -6, dy: -6, fond: true });
      }

      // ---- Erreur des itérées ----
      const erreurs = resultat.map((xj) => Math.max(...xj.map((v, i) => Math.abs(v - exacte[i])).map((v) => (Number.isFinite(v) ? v : 1e8))));
      const pts = erreurs.map((e, j) => [j, Math.log10(Math.max(e, 1e-16))]);
      repErreur.fixeCadre([0, resultat.length - 1], [Math.max(-16, Math.floor(Math.min(...pts.map(([, v]) => v))) - 0.5), Math.ceil(Math.max(...pts.map(([, v]) => v))) + 0.5]);
      if (repErreur.prepare()) {
        repErreur.axes({ noms: ['j', [['log₁₀ erreur', false]]], nomsAuBord: true, enL: true });
        if (E.L) {
          const d = Math.max(...resultat[1].map((v, i) => Math.abs(v - resultat[0][i])));
          const q = E.L(r.T) * r.T;
          const bornes = pts.map(([j]) => [j, bornesPicard(q, d, j)]);
          repErreur.trace(bornes.map(([j, b]) => [j, Math.log10(b.factorielle)]), { couleur: col.trait, largeur: 1.2, tirets: [5, 4] });
          if (q < 1) repErreur.trace(bornes.map(([j, b]) => [j, Math.log10(b.pointFixe)]), { couleur: col.series[1], largeur: 1.4, tirets: [5, 4] });
        }
        repErreur.trace(pts, { couleur: col.accent, largeur: 2 });
        for (const [a, b] of pts) repErreur.point(a, b, { rayon: 2.5, couleur: col.accent });
        const k = Math.min(r.k, pts.length - 1);
        repErreur.point(k, pts[k][1], { rayon: 5, couleur: col.perturbation });
      }

      if (E.L) {
        const q = E.L(r.T) * r.T;
        outils.rendTexte(
          noteErreur,
          q < 1
            ? `$q = LT = ${latexNombreFixe(q, 2)} < 1$ : $\\Phi$ est contractante sur $[0, T]$, le théorème du point fixe s’applique.`
            : `$q = LT = ${latexNombreFixe(q, 2)} \\ge 1$ : $\\Phi$ n’est pas contractante sur $[0, T]$, et pourtant les itérées convergent, comme $q^j/j!$.`,
        );
      } else outils.rendTexte(noteErreur, '$f$ n’est pas globalement lipschitzienne : pas de constante $L$ sur tout $\\mathbb R$.');

      // ---- Grönwall ----
      const d = 10 ** r.ldelta;
      const g = gronwall(r.eq, r.x0, r.x0 + d, r.T).filter((p) => Number.isFinite(p.ecart) && Number.isFinite(p.borne) && p.ecart < 1e8);
      const ys = g.flatMap((p) => [Math.log10(Math.max(p.ecart, 1e-16)), Math.log10(p.borne)]);
      repG.fixeCadre([0, r.T], [Math.floor(Math.min(...ys)) - 0.3, Math.ceil(Math.max(...ys)) + 0.3]);
      if (repG.prepare()) {
        repG.axes({ noms: ['t', [['log₁₀ écart', false]]], nomsAuBord: true, enL: true });
        repG.trace(g.map((p) => [p.t, Math.log10(p.borne)]), { couleur: col.trait, largeur: 1.6, tirets: [6, 4] });
        repG.trace(g.map((p) => [p.t, Math.log10(Math.max(p.ecart, 1e-16))]), { couleur: col.series[0], largeur: 2 });
      }
      const dernier = g[g.length - 1];
      outils.rendTexte(noteG, `Constante locale $k(s)$, borne $\\delta\\,${E.borne}$. En $t = ${latexNombreFixe(dernier.t, 2)}$ : écart $/$ borne $= ${latexNombreFixe(dernier.ecart / dernier.borne, 3)}$.`);
    }

    function applique() {
      champK.fixe(r.k);
      champT.fixe(r.T);
      champDelta.fixe(r.ldelta);
      dessine();
    }

    outils.surTheme(dessine);
    dessine();
    return { applique };
  },
};
