// Théorème d'échappement (poly, chapitre « Théorèmes d'existence et
// d'unicité », temps de vie des solutions) : une courbe intégrale maximale
// finit par sortir de tout compact de I × Ω, et n'y revient plus. On épuise
// I × Ω par des compacts emboîtés Kₙ : l'instant τₙ de la dernière sortie de
// Kₙ tend vers t⁺. Selon le cas, |x(t)| → +∞ (Ω = ℝ), x(t) tend vers la
// frontière de Ω (Ω borné) ou t⁺ = +∞ (solution globale).

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { solutionMaximale } from './cauchy.js';
import { barreOutils, boutonInfo, carte, champsPoint, choixRadios, glisse, paragraphe, tableau, toile, zoomable } from './commun.js';

export const EQUATIONS = {
  'carre-plus-un': { latex: '\\dot x = 1 + x^2', cadre: { x: [-3, 3], y: [-12, 12] } },
  'moins-carre': { latex: '\\dot x = -x^2', cadre: { x: [-5, 3], y: [-12, 12] } },
  unite: { latex: '\\dot x = 1 \\text{ sur } ]0, 1[', omega: [0, 1], cadre: { x: [-1, 1.5], y: [-0.2, 1.2] } },
  lineaire: { latex: '\\dot x = 2t\\,(1 + x)', cadre: { x: [-4, 4], y: [-6, 12] } },
};

// Compact Kₙ, contenant (t₀, x₀) et croissant avec n : [t₀ − n, t₀ + n] en
// temps ; en x, [x₀ − 2n, x₀ + 2n] si Ω = ℝ, et, si Ω = ]α, β[, l'intervalle
// qui se rapproche de ]α, β[ en gardant x₀ : [x₀ − (x₀ − α)·n/(n+1), …].
export function compact(eq, t0, x0, n) {
  const omega = EQUATIONS[eq].omega;
  if (!omega) return { t: [t0 - n, t0 + n], x: [x0 - 2 * n, x0 + 2 * n] };
  const s = n / (n + 1);
  return { t: [t0 - n, t0 + n], x: [x0 - (x0 - omega[0]) * s, x0 + (omega[1] - x0) * s] };
}

// Instant de la dernière sortie de K vers le futur (sens = 1) : le plus grand
// t ≥ t₀ de l'intervalle maximal où (t, x(t)) ∈ K ; vers le passé (sens = −1),
// le plus petit t ≤ t₀. À la précision `pas` près, affiné par dichotomie. La
// courbe est dans K en t₀.
export function derniereSortie(sol, K, t0, pas = 1e-3, sens = 1) {
  const dans = (t) => t > sol.a && t < sol.b && t >= K.t[0] && t <= K.t[1] && sol.x(t) >= K.x[0] && sol.x(t) <= K.x[1];
  // Distance parcourue depuis t₀ dans le sens choisi, jusqu'au bord de K ou de I.
  const longueur = sens > 0 ? Math.min(sol.b, K.t[1]) - t0 : t0 - Math.max(sol.a, K.t[0]);
  let dernier = 0;
  for (let s = 0; s < longueur; s += pas) if (dans(t0 + sens * s)) dernier = s;
  // Dichotomie entre le dernier instant dans K et le suivant.
  const fin = Math.min(dernier + pas, longueur);
  if (dans(t0 + sens * fin)) return t0 + sens * fin;
  let [a, b] = [dernier, fin];
  for (let k = 0; k < 50; k++) {
    const m = (a + b) / 2;
    if (dans(t0 + sens * m)) a = m;
    else b = m;
  }
  return t0 + sens * a;
}

const fr = (v) => (Number.isFinite(v) ? String(Number(v.toPrecision(4))).replace('.', ',').replace('-', '−') : v > 0 ? '+∞' : '−∞');

export default {
  etat: { eq: 'carre-plus-un', t0: 0, x0: 0, n: 3 },

  choix: { eq: Object.keys(EQUATIONS) },

  termes: ['solution maximale', 'courbe intégrale', 'explosion en temps fini', 'solution globale'],

  rappel: [
    'Théorème d’échappement : soit $f$ continue et $t \\mapsto x(t, t_0, x_0)$ la solution maximale, d’intervalle $I(t_0, x_0) = ]t^-, t^+[$. Pour tout compact $K \\subset I \\times \\Omega$, il existe $\\eta > 0$ tel que',
    '$$\\begin{gathered} (t, x(t)) \\notin K \\\\ \\text{dès que } t \\ge t^+ - \\eta \\text{ ou } t \\le t^- + \\eta. \\end{gathered}$$',
    'La courbe intégrale finit par sortir de tout compact, et n’y revient plus. En épuisant $I \\times \\Omega$ par des compacts, on en tire, quand $t \\to t^\\pm$ :',
    '$$\\begin{gathered} \\|(t, x(t))\\| \\to +\\infty \\\\ \\text{ou} \\\\ (t, x(t)) \\to \\mathrm{Front}(I \\times \\Omega). \\end{gathered}$$',
    ['si $t^+ < +\\infty$ et $\\Omega = \\mathbb R^n$ : $\\|x(t)\\| \\to +\\infty$, explosion en temps fini ;', 'si $t^+ < +\\infty$ et $\\Omega$ est borné : $x(t)$ tend vers la frontière de $\\Omega$ ;', 'sinon $t^+ = \\sup I$ : la solution est définie jusqu’au bout.'],
  ],

  essais: [
    { texte: '$\\dot x = 1 + x^2$ : augmentez $n$. L’instant $\\tau_n^+$ de la dernière sortie de $K_n$ se rapproche de $t^+ = \\pi/2$, sans jamais l’atteindre ; $\\tau_n^-$ se rapproche de $t^- = -\\pi/2$.', etat: { eq: 'carre-plus-un', t0: 0, x0: 0, n: 1 } },
    { texte: '$\\dot x = 1$ sur $]0, 1[$ : les compacts $K_n$ remplissent la bande, et la courbe en sort par le haut, au voisinage de $x = 1$.', etat: { eq: 'unite', t0: 0, x0: 0.3, n: 2 } },
    { texte: '$\\dot x = 2t(1 + x)$ : la solution est globale. Elle sort quand même de chaque $K_n$… mais à un instant $\\tau_n^+$ qui tend vers $+\\infty$.', etat: { eq: 'lineaire', t0: 0, x0: 0, n: 2 } },
    { texte: '$\\dot x = -x^2$ avec $x_0 < 0$ : déplacez la condition initiale. Par où la courbe sort-elle des compacts ?', etat: { eq: 'moins-carre', t0: 0, x0: -0.5, n: 3 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'eq',
      options: Object.entries(EQUATIONS).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        const omega = EQUATIONS[valeur].omega;
        outils.change({ eq: valeur, x0: omega ? Math.min(0.9, Math.max(0.1, r.x0)) : r.x0 });
        zoomPlan.reinitialise();
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    const cPlan = carte(grille, 'Compacts emboîtés $K_1 \\subset K_2 \\subset \\cdots$');
    boutonInfo(cPlan, [
      ['zone', '--zone-stable', 'Le compact $K_n$ choisi ; les autres $K_k$ en traits fins.'],
      ['ligne', '--accent', 'La courbe intégrale maximale par $(t_0, x_0)$.'],
      ['point', '--texte', 'Les points de dernière sortie de chaque $K_k$ vers le futur, aux instants $\\tau_k^+$.'],
      ['cercle', '--texte', 'Vers le passé, aux instants $\\tau_k^-$.'],
      ['tirets', '--texte', 'La borne $t^+$, si elle est finie.'],
      ['zone', '--grille', 'Hors de $\\Omega$, quand $\\Omega$ est borné.'],
      ['point', '--perturbation', 'La condition initiale : cliquez ou faites glisser. La molette zoome : près de $t^+$, les $\\tau_k^+$ s’accumulent.'],
    ]);
    const canvas = toile(cPlan, '16 / 10', () => dessine());
    canvas.classList.add('cliquable');
    const rep = new Repere(canvas, EQUATIONS[r.eq].cadre);
    const barrePlan = document.createElement('div');
    barrePlan.className = 'barre-legende';
    cPlan.appendChild(barrePlan);
    const zoomPlan = zoomable(canvas, rep, { barre: barrePlan, auto: () => EQUATIONS[r.eq].cadre, redessine: () => dessine(), deplacer: false });
    const champN = champ(cPlan, { latex: 'n', min: 1, max: 8, pas: 1, valeur: r.n }, (v) => fixeN(v));
    function fixeN(v) {
      outils.change({ n: Math.max(1, Math.min(8, Math.round(v))) });
      champN.fixe(r.n);
      dessine();
    }
    glisse(canvas, rep, {
      deplace: (t, x) => {
        const omega = EQUATIONS[r.eq].omega;
        const x0 = omega ? Math.min(omega[1] - 0.02, Math.max(omega[0] + 0.02, x)) : x;
        outils.change({ t0: Number(t.toFixed(3)), x0: Number(x0.toFixed(3)) });
        dessine();
      },
    });

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cTable = carte(colonne, 'Dernière sortie de $K_k$');
    // La condition initiale au clavier aussi.
    const point = champsPoint(
      cTable,
      [
        { latex: 't_0', min: -3, max: 3 },
        { latex: 'x_0', min: -12, max: 12 },
      ],
      [r.t0, r.x0],
      ([t0, x]) => {
        const omega = EQUATIONS[r.eq].omega;
        outils.change({ t0, x0: omega ? Math.min(omega[1] - 0.02, Math.max(omega[0] + 0.02, x)) : x });
        dessine();
      },
    );
    const zoneTable = document.createElement('div');
    zoneTable.className = 'lignes-cliquables';
    zoneTable.title = 'Cliquez une ligne pour choisir le compact';
    cTable.appendChild(zoneTable);
    // Une ligne du tableau choisit le compact K_k.
    zoneTable.addEventListener('click', (ev) => {
      const ligne = ev.target.closest('tbody tr');
      if (ligne) fixeN([...ligne.parentNode.children].indexOf(ligne) + 1);
    });
    const conclusion = paragraphe(cTable, '', 'note texte-fixe');

    // ---- τₖ⁺ en fonction de k : il tend vers t⁺ ----
    const cTau = carte(colonne, 'Instants de sortie $\\tau_k^\\pm$ en fonction de $k$');
    boutonInfo(cTau, [
      ['point', '--texte', '$\\tau_k^+$, l’instant de dernière sortie de $K_k$ vers le futur ; $\\tau_k^-$ (cercles) vers le passé.'],
      ['tirets', '--texte', 'Les bornes $t^\\pm$, si elles sont finies : les instants s’en approchent sans les atteindre.'],
      ['point', '--perturbation', 'Le compact $K_n$ choisi : cliquez pour en changer.'],
    ]);
    const canvasTau = toile(cTau, '16 / 7', () => dessine());
    canvasTau.classList.add('saisissable');
    const repTau = new Repere(canvasTau, { x: [0.5, 8.5], y: [-2, 2] });
    glisse(canvasTau, repTau, { deplace: (k) => fixeN(k) });

    function dessine() {
      const col = couleurs();
      const E = EQUATIONS[r.eq];
      choix.fixe(r.eq);
      point.bornes(0, ...E.cadre.x);
      point.bornes(1, ...(E.omega ?? E.cadre.y));
      point.fixe([r.t0, r.x0]);
      const sol = solutionMaximale(r.eq, r.t0, r.x0);
      const ks = Array.from({ length: 8 }, (_, k) => k + 1);
      const n = Math.max(1, Math.min(8, Math.round(r.n) || 1));
      const sorties = ks.map((k) => derniereSortie(sol, compact(r.eq, r.t0, r.x0, k), r.t0));
      const passees = ks.map((k) => derniereSortie(sol, compact(r.eq, r.t0, r.x0, k), r.t0, 1e-3, -1));

      const cadre = zoomPlan.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        const [y1, y2] = rep.cadre.y;
        if (E.omega) rep.region((t, x) => x <= E.omega[0] || x >= E.omega[1], { couleur: col.grille, alpha: 0.7 });
        // Les compacts : le choisi en aplat, les autres en traits fins.
        const rectangle = (K) => [[K.t[0], K.x[0]], [K.t[1], K.x[0]], [K.t[1], K.x[1]], [K.t[0], K.x[1]], [K.t[0], K.x[0]]];
        const Kn = compact(r.eq, r.t0, r.x0, n);
        rep.region((t, x) => t >= Kn.t[0] && t <= Kn.t[1] && x >= Kn.x[0] && x <= Kn.x[1], { couleur: col.zone, pas: 3 });
        for (const k of ks) rep.trace(rectangle(compact(r.eq, r.t0, r.x0, k)), { couleur: col.discret, largeur: k === n ? 1.8 : 0.8, alpha: k === n ? 1 : 0.6 });
        rep.axes({ noms: ['t', 'x'] });
        for (const borne of [sol.a, sol.b]) if (Number.isFinite(borne)) rep.trace([[borne, y1 - 1], [borne, y2 + 1]], { couleur: col.trait, largeur: 1.2, tirets: [6, 4] });
        // La courbe : d'un bord à l'autre de son intervalle, à l'intérieur du cadre.
        const [t1, t2] = rep.cadre.x;
        const [u, v] = [Math.max(sol.a, t1 - 1), Math.min(sol.b, t2 + 1)];
        const pts = Array.from({ length: 1200 }, (_, k) => u + ((v - u) * (k + 0.5)) / 1200).map((t) => [t, sol.x(t)]);
        rep.trace(pts, { couleur: col.accent, largeur: 2.4 });
        ks.forEach((k, i) => {
          rep.point(sorties[i], sol.x(sorties[i]), { rayon: k === n ? 5 : 3, couleur: col.trait });
          rep.point(passees[i], sol.x(passees[i]), { rayon: k === n ? 5 : 3, couleur: col.trait, plein: false });
        });
        const indice = '₀₁₂₃₄₅₆₇₈'[n];
        rep.texte(sorties[n - 1], sol.x(sorties[n - 1]), `τ${indice}⁺`, { couleur: col.trait, dx: -8, dy: -8, align: 'right', police: 'italic 14px serif', fond: true });
        rep.texte(passees[n - 1], sol.x(passees[n - 1]), `τ${indice}⁻`, { couleur: col.trait, dx: 8, dy: 16, align: 'left', police: 'italic 14px serif', fond: true });
        rep.point(r.t0, r.x0, { rayon: 5, couleur: col.perturbation });
      }

      // Tableau des instants de sortie (construit à part, puis remplacé).
      const nouveau = document.createElement('div');
      tableau(
        nouveau,
        ['k', 'τₖ⁻', 'τₖ⁺', 't⁺ − τₖ⁺'],
        ks.map((k, i) => [String(k), fr(passees[i]), fr(sorties[i]), Number.isFinite(sol.b) ? fr(sol.b - sorties[i]) : '—']),
      );
      zoneTable.replaceChildren(...nouveau.childNodes);
      zoneTable.querySelectorAll('tbody tr')[n - 1]?.classList.add('choisie');

      // ---- τₖ en fonction de k ----
      const bornes = [sol.a, sol.b].filter(Number.isFinite);
      const valeurs = [...sorties, ...passees, ...bornes];
      const [ya, yb] = [Math.min(...valeurs), Math.max(...valeurs)];
      const m = 0.1 * Math.max(yb - ya, 0.5);
      repTau.fixeCadre([0.5, 8.5], [ya - m, yb + m]);
      if (repTau.prepare()) {
        repTau.axes({ noms: ['k', 't'] });
        for (const b of bornes) {
          repTau.trace([[0, b], [9, b]], { couleur: col.trait, largeur: 1.2, tirets: [6, 4] });
          repTau.texte(8.5, b, b === sol.b ? 't⁺' : 't⁻', { couleur: col.trait, align: 'right', dx: -4, dy: b === sol.b ? -6 : 14, police: 'italic 14px serif', fond: true });
        }
        ks.forEach((k, i) => {
          repTau.point(k, sorties[i], { rayon: k === n ? 5 : 3.5, couleur: k === n ? col.perturbation : col.trait });
          repTau.point(k, passees[i], { rayon: k === n ? 5 : 3.5, couleur: k === n ? col.perturbation : col.trait, plein: false });
        });
      }
      outils.rendTexte(
        conclusion,
        Number.isFinite(sol.b)
          ? E.omega
            ? `$t^+ = ${latexNombreFixe(sol.b, 3)}$ est fini et $\\Omega$ est borné : $\\tau_k^+ \\to t^+$ et $x(t)$ tend vers la frontière, $x(t^+) = 1$. De même dans le passé, $\\tau_k^- \\to t^-$.`
            : `$t^+ = ${latexNombreFixe(sol.b, 3)}$ est fini et $\\Omega = \\mathbb R$ : $\\tau_k^+ \\to t^+$ et $|x(t)| \\to +\\infty$. De même dans le passé, $\\tau_k^- \\to t^-$.`
          : 'Ici $t^+ = +\\infty$ : la courbe sort de chaque $K_k$ par le côté droit ou par le haut, et $\\tau_k^+ \\to +\\infty$. Dans le passé, $\\tau_k^- \\to t^-$.',
      );
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champN.fixe(r.n);
        zoomPlan.reinitialise();
        dessine();
      },
    };
  },
};
