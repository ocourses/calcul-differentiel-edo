// Le problème de Cauchy, d'un clic (poly, chapitre « Théorèmes d'existence et
// d'unicité ») : dans l'espace des phases élargi (t, x), on clique la condition
// initiale (t₀, x₀) et la solution maximale part dans les deux sens, jusqu'à
// exploser, atteindre la frontière de Ω ou exister pour tout temps. À côté, le
// temps de vie t⁺ − t₀ en fonction de x₀. Les équations sont celles du poly :
//   ẋ = −x²          : maximale, non globale, explose d'un seul côté ;
//   ẋ = 1 + x²       : x = tan t, explose des deux côtés ;
//   ẋ = 1 sur ]0, 1[ : la solution atteint la frontière de Ω en temps fini ;
//   ẋ = 2t(1 + x)    : linéaire, non autonome, toute solution est globale ;
//   ẋ = f(x), f(x) = e si x ≤ e, x ln x sinon : globale sans croissance linéaire.

import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, champsPoint, choixRadios, glisse, paragraphe, toile, zoomable } from './commun.js';

const E = Math.E;
const inf = Infinity;

// Solution maximale de x(t₀) = x₀ : { a, b, x(t), latex, fin } où ]a, b[ est
// l'intervalle maximal I(t₀, x₀) et `fin` dit ce qui se passe à une borne finie
// ('explosion' : |x| → +∞ ; 'frontiere' : x tend vers le bord de Ω).
export function solutionMaximale(eq, t0, x0) {
  switch (eq) {
    case 'moins-carre':
      if (x0 === 0) return { a: -inf, b: inf, x: () => 0, latex: 'x(t) = 0', fin: null };
      return {
        a: x0 > 0 ? t0 - 1 / x0 : -inf,
        b: x0 > 0 ? inf : t0 - 1 / x0,
        x: (t) => x0 / ((t - t0) * x0 + 1),
        latex: 'x(t) = \\dfrac{x_0}{(t - t_0)\\,x_0 + 1}',
        fin: 'explosion',
      };
    case 'carre-plus-un': {
      const phi = Math.atan(x0);
      return {
        a: t0 - Math.PI / 2 - phi,
        b: t0 + Math.PI / 2 - phi,
        x: (t) => Math.tan(t - t0 + phi),
        latex: 'x(t) = \\tan(t - t_0 + \\arctan x_0)',
        fin: 'explosion',
      };
    }
    case 'unite':
      return { a: t0 - x0, b: t0 - x0 + 1, x: (t) => x0 + t - t0, latex: 'x(t) = x_0 + t - t_0', fin: 'frontiere' };
    case 'lineaire':
      return {
        a: -inf,
        b: inf,
        x: (t) => (1 + x0) * Math.exp(t * t - t0 * t0) - 1,
        latex: 'x(t) = (1 + x_0)\\,e^{t^2 - t_0^2} - 1',
        fin: null,
      };
    case 'xlnx': {
      // Instant τ où la solution vaut e : droite de pente e avant, puis
      // x(t) = exp(e^{t − τ}) après (exercice du poly, translaté en temps).
      const tau = x0 <= E ? t0 + (E - x0) / E : t0 + Math.log(1 / Math.log(x0));
      return {
        a: -inf,
        b: inf,
        x: (t) => (t <= tau ? E + E * (t - tau) : Math.exp(Math.exp(t - tau))),
        latex: 'x(t) = \\begin{cases} e + e\\,(t - \\tau) & t \\le \\tau \\\\ \\exp\\big(e^{\\,t - \\tau}\\big) & t \\ge \\tau \\end{cases}',
        tau,
        fin: null,
      };
    }
    default:
      throw new Error(`équation inconnue : ${eq}`);
  }
}

// Les équations : second membre f(t, x), domaine Ω (bornes en x), cadre par
// défaut et ce que montre chacune.
export const EQUATIONS = {
  'moins-carre': {
    latex: '\\dot x = -x^2',
    f: (t, x) => -x * x,
    cadre: { x: [-4, 4], y: [-4, 4] },
    commentaire:
      'Pour $x_0 \\neq 0$, la solution maximale explose en $t_0 - 1/x_0$, d’un seul côté : elle n’est pas globale. La solution nulle est globale. Les courbes intégrales ne se coupent pas : elles partitionnent le plan.',
  },
  'carre-plus-un': {
    latex: '\\dot x = 1 + x^2',
    f: (t, x) => 1 + x * x,
    cadre: { x: [-4, 4], y: [-4, 4] },
    commentaire:
      '$f$ est localement lipschitzienne, avec une constante qui dépend de $x$ : toutes les solutions explosent en temps fini, des deux côtés, après un temps de vie $\\pi$. Avec $x(0) = 0$, c’est $\\tan t$ sur $]-\\pi/2, \\pi/2[$.',
  },
  unite: {
    latex: '\\dot x = 1 \\text{ sur } \\Omega = ]0, 1[',
    f: () => 1,
    omega: [0, 1],
    cadre: { x: [-2, 2], y: [-0.4, 1.4] },
    commentaire:
      'Ici $\\Omega = ]0, 1[$ est borné : la solution ne peut pas exploser. Elle atteint la frontière de $\\Omega$ en temps fini, en $0$ dans le passé et en $1$ dans le futur. Son intervalle maximal est de longueur $1$.',
  },
  lineaire: {
    latex: '\\dot x = 2t\\,(1 + x)',
    f: (t, x) => 2 * t * (1 + x),
    cadre: { x: [-2.5, 2.5], y: [-4, 4] },
    commentaire:
      'Équation linéaire, non autonome, à coefficients continus : toute solution maximale est globale, même si elle croît comme $e^{t^2}$. C’est l’équation de l’exercice des approximations successives.',
  },
  xlnx: {
    latex: '\\dot x = f(x),\\ f(x) = \\begin{cases} e & x \\le e \\\\ x \\ln x & x > e \\end{cases}',
    radio: '\\dot x = x \\ln x',
    f: (t, x) => (x <= E ? E : x * Math.log(x)),
    cadre: { x: [-3, 3], y: [-3, 20] },
    commentaire:
      '$f$ n’est ni globalement lipschitzienne ni à croissance linéaire, et pourtant toute solution maximale est globale : $x(t) = \\exp(e^{t - \\tau})$ croît très vite, sans exploser. Les conditions suffisantes du poly ne sont pas nécessaires.',
  },
};

// Courbes intégrales de fond : des départs régulièrement espacés sur le bord
// du cadre (distances rapportées à la taille du cadre), chacune étant la
// solution maximale par ce point ; un départ déjà sur une courbe tracée est
// sauté. Rend des lignes brisées.
export function courbesDeFond(eq, cadre, departs = 40) {
  const [t1, t2] = cadre.x;
  const [y1, y2] = cadre.y;
  const [L, H] = [t2 - t1, y2 - y1];
  const omega = EQUATIONS[eq].omega;
  const norme = ([t, x]) => [(t - t1) / L, (x - y1) / H];
  const ecart = 4 / departs;
  const traces = [];
  const courbes = [];
  for (let k = 0; k < departs; k++) {
    let d = (k + 0.5) * ecart;
    let p;
    if (d < 1) p = [t1 + d * L, y1];
    else if ((d -= 1) < 1) p = [t2, y1 + d * H];
    else if ((d -= 1) < 1) p = [t2 - d * L, y2];
    else p = [t1, y2 - (d - 1) * H];
    if (omega) p[1] = Math.min(omega[1] - 1e-3, Math.max(omega[0] + 1e-3, p[1]));
    const [u, v] = norme(p);
    if (traces.some(([a, b]) => Math.hypot(a - u, b - v) < 0.5 * ecart)) continue;
    const pts = echantillons(solutionMaximale(eq, p[0], p[1]), [t1, t2], 500);
    if (pts.length < 2) continue;
    for (const q of pts) if (q[1] >= y1 && q[1] <= y2) traces.push(norme(q));
    courbes.push(pts);
  }
  return courbes;
}

// Points de la solution sur ]a, b[ ∩ [t1, t2].
export function echantillons(sol, [t1, t2], n = 600) {
  const pts = [];
  const [u, v] = [Math.max(sol.a, t1), Math.min(sol.b, t2)];
  for (let k = 0; k <= n; k++) {
    const t = u + ((v - u) * k) / n;
    if (t <= sol.a || t >= sol.b) continue;
    const x = sol.x(t);
    if (Number.isFinite(x)) pts.push([t, x]);
  }
  return pts;
}

// Condition initiale ramenée dans Ω quand Ω est borné.
export function dansOmega(eq, x0) {
  const omega = EQUATIONS[eq].omega;
  return omega ? Math.min(omega[1] - 0.01, Math.max(omega[0] + 0.01, x0)) : x0;
}

// Nombre au format français, pour les étiquettes du graphe.
const fr = (v) => String(Number(v.toPrecision(3))).replace('.', ',').replace('-', '−');
const borneTexte = (v) => (Number.isFinite(v) ? fr(v) : v > 0 ? '+∞' : '−∞');

// Durée du tracé progressif de la solution après un clic (ms).
const DUREE = 900;

export default {
  etat: { eq: 'moins-carre', t0: 0, x0: 1 },

  choix: { eq: Object.keys(EQUATIONS) },

  termes: ['problème de Cauchy', 'espace des phases élargi', 'courbe intégrale', 'solution maximale', 'solution globale', 'lipschitzienne', 'explosion en temps fini', 'croissance linéaire', 'champ de vecteurs'],

  rappel: [
    'Le problème de Cauchy : $\\dot x(t) = f(t, x(t))$, $x(t_0) = x_0$, où le second membre $f$, continu sur $I \\times \\Omega$, est un champ de vecteurs. Le graphe d’une solution est une courbe intégrale, tracée dans l’espace des phases élargi $(t, x)$.',
    'Cauchy-Lipschitz : si $f$ est localement lipschitzienne en $x$, il passe par chaque $(t_0, x_0)$ une unique solution maximale, définie sur un intervalle ouvert',
    '$$I(t_0, x_0) = \\left]t^-, t^+\\right[.$$',
    'Théorème d’échappement : quand $t \\to t^\\pm$, la courbe intégrale sort de tout compact de $I \\times \\Omega$. Si $t^+ < +\\infty$ :',
    ['si $\\Omega = \\mathbb R^n$, $\\|x(t)\\| \\to +\\infty$ : c’est l’explosion en temps fini ;', 'si $\\Omega$ est borné, $x(t)$ tend vers la frontière de $\\Omega$.'],
    'Une solution globale est définie sur tout $I$. C’est le cas de toute solution maximale si $f$ est à croissance linéaire,',
    '$$\\|f(t, x)\\| \\le \\alpha(t) + \\beta(t)\\,\\|x\\|,$$',
    'en particulier pour une équation linéaire.',
  ],

  essais: [
    { texte: '$\\dot x = -x^2$ avec $x(0) = 1$ : de quel côté la solution explose-t-elle ? Cliquez ensuite sous l’axe, en $x_0 < 0$.', etat: { eq: 'moins-carre', t0: 0, x0: 1 } },
    { texte: 'Faites glisser $x_0$ vers $0$ : le temps de vie $t_0 - t^-= 1/x_0$ grandit sans borne. Que vaut-il en $x_0 = 0$ ?', etat: { eq: 'moins-carre', t0: 0, x0: 0.5 } },
    { texte: '$\\dot x = 1 + x^2$, $x(0) = 0$ : on retrouve $\\tan t$ sur $]-\\pi/2, \\pi/2[$. La longueur de l’intervalle dépend-elle de $x_0$ ?', etat: { eq: 'carre-plus-un', t0: 0, x0: 0 } },
    { texte: '$\\dot x = 1$ sur $]0, 1[$ : la solution s’arrête en temps fini sans exploser. Que vaut $x$ aux bornes de l’intervalle ?', etat: { eq: 'unite', t0: 0, x0: 0.3 } },
    { texte: '$\\dot x = 2t(1 + x)$ : la solution de $x(0) = 0$ est $e^{t^2} - 1$. Elle croît très vite : explose-t-elle ?', etat: { eq: 'lineaire', t0: 0, x0: 0 } },
    { texte: '$\\dot x = x \\ln x$ au-delà de $e$ : croissance plus que linéaire, et pourtant aucune explosion. Comparez avec $\\dot x = 1 + x^2$.', etat: { eq: 'xlnx', t0: 0, x0: 1 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    // ---- Choix de l'équation, ce qu'elle montre ----------------------------------------------
    const choix = choixRadios(barreOutils(zone), {
      nom: 'eq',
      options: Object.entries(EQUATIONS).map(([valeur, { latex, radio }]) => ({ valeur, latex: radio ?? latex })),
      change: (valeur) => {
        outils.change({ eq: valeur, x0: dansOmega(valeur, r.x0) });
        zoomPlan.reinitialise?.();
        lance();
      },
    });
    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    // ---- Espace des phases élargi ------------------------------------------------------------
    const cPlan = carte(grille, 'Espace des phases élargi $(t, x)$');
    boutonInfo(cPlan, [
      ['fleche', '--discret', 'Le champ de directions : en $(t, x)$, la pente $f(t, x)$ des courbes intégrales.'],
      ['ligne', '--discret', 'D’autres courbes intégrales : elles ne se coupent pas.'],
      ['ligne', '--accent', 'La solution maximale par $(t_0, x_0)$, tracée dans les deux sens à partir du point.'],
      ['zone', '--zone-stable', 'Son intervalle maximal $I(t_0, x_0) = ]t^-, t^+[$, reporté sur l’axe des temps.'],
      ['tirets', '--texte', 'Une borne finie de l’intervalle.'],
      ['zone', '--grille', 'Hors de $\\Omega$, quand $\\Omega$ est borné.'],
      ['point', '--perturbation', 'La condition initiale $(t_0, x_0)$ : cliquez ou faites glisser.'],
    ]);
    const canvas = toile(cPlan, '16 / 10', () => dessine());
    canvas.classList.add('cliquable');
    const rep = new Repere(canvas, EQUATIONS[r.eq].cadre);
    const barre = document.createElement('div');
    barre.className = 'barre-legende';
    cPlan.appendChild(barre);
    const intervalle = document.createElement('div');
    intervalle.className = 'note';
    barre.appendChild(intervalle);
    const zoomPlan = zoomable(canvas, rep, { barre, auto: () => EQUATIONS[r.eq].cadre, redessine: () => dessine(), deplacer: false });

    glisse(canvas, rep, {
      deplace: (t, x) => {
        // Aimantation sur l'axe x = 0 (solution nulle de ẋ = −x²).
        const x0 = Math.abs(x) * rep.sy < 6 ? 0 : Number(x.toFixed(3));
        outils.change({ t0: Number(t.toFixed(3)), x0: dansOmega(r.eq, x0) });
        progression = 1;
        dessine();
      },
      relache: () => lance(),
    });
    // La condition initiale au clavier aussi.
    const point = champsPoint(
      cPlan,
      [
        { latex: 't_0', min: -4, max: 4 },
        { latex: 'x_0', min: -4, max: 4 },
      ],
      [r.t0, r.x0],
      ([t0, x0]) => {
        outils.change({ t0, x0: dansOmega(r.eq, x0) });
        lance();
      },
    );

    // ---- Colonne de droite : solution et temps de vie --------------------------------------------
    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cSol = carte(colonne, 'Solution maximale');
    const formule = document.createElement('div');
    formule.className = 'formule';
    cSol.appendChild(formule);
    const formuleI = document.createElement('div');
    formuleI.className = 'formule';
    cSol.appendChild(formuleI);
    const verdict = paragraphe(cSol, '', 'note conclusion-fixe');
    // Ce que montre l'équation, en dernier : sa hauteur réservée (le plus long
    // commentaire) reste en bas de la carte au lieu d'écarter texte et formules.
    const texte = document.createElement('div');
    texte.className = 'texte-fixe six-lignes';
    cSol.appendChild(texte);
    const commentaire = paragraphe(texte, '', '');

    const cVie = carte(colonne, 'Temps de vie en fonction de $x_0$');
    boutonInfo(cVie, [
      ['ligne', '--accent', 'Vers le futur : $t^+ - t_0$, en fonction de $x_0$ ($t_0$ fixé).'],
      ['tirets', '--accent', 'Vers le passé : $t_0 - t^-$.'],
      ['tirets', '--discret', 'Un temps de vie infini est dessiné en haut du cadre.'],
      ['point', '--perturbation', 'Le $x_0$ choisi : cliquez ou faites glisser sur la figure pour le changer.'],
    ]);
    const canvasVie = toile(cVie, '16 / 9', () => dessine());
    canvasVie.classList.add('saisissable');
    const repVie = new Repere(canvasVie, { x: [-4, 4], y: [0, 4] });
    // Choisir x₀ sur la courbe du temps de vie ; t₀ ne change pas.
    glisse(canvasVie, repVie, {
      deplace: (x) => {
        const x0 = Math.abs(x) * repVie.sx < 6 ? 0 : Number(x.toFixed(3));
        outils.change({ x0: dansOmega(r.eq, x0) });
        progression = 1;
        dessine();
      },
      relache: () => lance(),
    });
    const noteVie = paragraphe(cVie, '', 'note');

    // ---- Tracé progressif après un clic --------------------------------------------------------
    let progression = 1;
    let debut = null;
    function lance() {
      if (outils.mouvementReduit) {
        progression = 1;
        dessine();
        return;
      }
      progression = 0;
      debut = null;
      requestAnimationFrame(anime);
    }
    function anime(maintenant) {
      if (debut === null) debut = maintenant;
      progression = Math.min(1, (maintenant - debut) / DUREE);
      dessine();
      if (progression < 1) requestAnimationFrame(anime);
    }

    function dessine() {
      const col = couleurs();
      const eq = EQUATIONS[r.eq];
      point.bornes(0, ...eq.cadre.x);
      point.bornes(1, ...(eq.omega ?? eq.cadre.y));
      point.fixe([r.t0, r.x0]);
      choix.fixe(r.eq);
      outils.rendTexte(commentaire, eq.commentaire);
      const sol = solutionMaximale(r.eq, r.t0, r.x0);
      const globale = !Number.isFinite(sol.a) && !Number.isFinite(sol.b);

      // Formules : la solution, puis l'intervalle, en nombres de largeur fixe.
      outils.rend(formule, sol.latex);
      const borne = (v) => (Number.isFinite(v) ? latexNombreFixe(v, 2) : v > 0 ? '+\\infty' : '-\\infty');
      outils.rend(formuleI, `I(t_0, x_0) = \\left]\\, ${borne(sol.a)},\\ ${borne(sol.b)} \\,\\right[`);
      const fin = sol.fin === 'explosion' ? '$|x(t)| \\to +\\infty$ à chaque borne finie.' : sol.fin === 'frontiere' ? '$x(t)$ tend vers la frontière de $\\Omega$ à chaque borne.' : '';
      outils.rendTexte(verdict, globale ? 'Solution globale : définie pour tout $t \\in \\mathbb R$.' : `Solution maximale, non globale : ${fin}`);

      // ---- Plan (t, x) ----
      const cadre = zoomPlan.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        const [t1, t2] = cadre.x;
        const [y1, y2] = cadre.y;
        if (eq.omega) rep.region((t, x) => x <= eq.omega[0] || x >= eq.omega[1], { couleur: col.grille, alpha: 0.7 });
        rep.axes({ noms: ['t', 'x'] });
        rep.champ((t, x) => [1, eq.f(t, x)], { n: 19 });
        for (const pts of courbesDeFond(r.eq, cadre)) rep.trace(pts, { couleur: col.discret, largeur: 1, alpha: 0.45 });
        // Intervalle maximal sur l'axe des temps, bornes finies en tirets.
        const marge = 0.05 * (t2 - t1);
        rep.trace([[Math.max(sol.a, t1 - marge), 0], [Math.min(sol.b, t2 + marge), 0]], { couleur: col.accent, largeur: 6, alpha: 0.3 });
        for (const b of [sol.a, sol.b]) {
          if (!Number.isFinite(b)) continue;
          rep.trace([[b, y1 - 1], [b, y2 + 1]], { couleur: col.trait, largeur: 1.2, tirets: [6, 4] });
          rep.texte(b, y2, b === sol.a ? 't⁻' : 't⁺', { couleur: col.trait, dx: b === sol.a ? -6 : 6, dy: 16, align: b === sol.a ? 'right' : 'left', police: 'italic 14px serif', fond: true });
        }
        // La solution, tracée depuis t₀ dans les deux sens selon la progression.
        const [u, v] = [Math.max(sol.a, t1 - marge), Math.min(sol.b, t2 + marge)];
        const p = progression;
        const morceau = { a: Math.max(sol.a, r.t0 - p * (r.t0 - u)), b: Math.min(sol.b, r.t0 + p * (v - r.t0)), x: sol.x };
        // Bornes ouvertes : on s'arrête juste avant une borne finie.
        const pts = echantillons({ ...morceau, a: morceau.a - 1e-9, b: morceau.b + 1e-9 }, [morceau.a, morceau.b]).filter(([t]) => t > sol.a && t < sol.b);
        rep.trace(pts, { couleur: col.accent, largeur: 2.6 });
        rep.point(r.t0, r.x0, { rayon: 5, couleur: col.perturbation });
        rep.texte(r.t0, r.x0, `(t₀, x₀) = (${fr(r.t0)} ; ${fr(r.x0)})`, { couleur: col.perturbation, dx: 9, dy: r.x0 >= (y1 + y2) / 2 ? 18 : -10, police: '600 13px system-ui, sans-serif', fond: true });
      }
      outils.rendTexte(noteVie, `Pour $x_0 = ${latexNombreFixe(r.x0, 2)}$ : $t^+ - t_0 = ${Number.isFinite(sol.b) ? latexNombreFixe(sol.b - r.t0, 2) : '+\\infty'}$ et $t_0 - t^- = ${Number.isFinite(sol.a) ? latexNombreFixe(r.t0 - sol.a, 2) : '+\\infty'}$.`);
      intervalle.textContent = `Intervalle ]${borneTexte(sol.a)} ; ${borneTexte(sol.b)}[ : solution ${globale ? 'globale' : 'maximale, non globale'}`;

      // ---- Temps de vie ----
      const [xa, xb] = eq.omega ?? cadre.y;
      const vieMax = 4;
      repVie.fixeCadre([xa, xb], [0, vieMax * 1.15]);
      if (repVie.prepare()) {
        repVie.axes({ noms: [[['x', true], ['₀', false]], [['temps de vie', false]]], nomsAuBord: true });
        const n = 300;
        const futur = [];
        const passe = [];
        for (let k = 0; k <= n; k++) {
          const x0 = xa + ((xb - xa) * k) / n;
          if (eq.omega && (x0 <= eq.omega[0] || x0 >= eq.omega[1])) continue;
          const s = solutionMaximale(r.eq, r.t0, x0);
          // Un temps infini est posé en haut du cadre.
          futur.push([x0, Math.min(s.b - r.t0, vieMax * 1.08)]);
          passe.push([x0, Math.min(r.t0 - s.a, vieMax * 1.08)]);
        }
        repVie.trace([[xa, vieMax * 1.08], [xb, vieMax * 1.08]], { couleur: col.discret, largeur: 1, tirets: [3, 4] });
        repVie.texte(xb, vieMax * 1.08, '+∞', { couleur: col.discret, align: 'right', dx: -4, dy: -4, fond: true });
        repVie.trace(futur, { couleur: col.accent, largeur: 2.2 });
        repVie.trace(passe, { couleur: col.accent, largeur: 1.6, tirets: [6, 4] });
        const futurX = Math.min(sol.b - r.t0, vieMax * 1.08);
        const passeX = Math.min(r.t0 - sol.a, vieMax * 1.08);
        repVie.point(r.x0, futurX, { rayon: 4.5, couleur: col.perturbation });
        repVie.point(r.x0, passeX, { rayon: 4.5, couleur: col.perturbation, plein: false });
      }
    }

    outils.surTheme(dessine);
    lance();
    return {
      applique() {
        zoomPlan.reinitialise?.();
        lance();
      },
    };
  },
};
