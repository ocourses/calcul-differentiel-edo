// Euler, pas à pas (poly, chapitre « Intégration numérique » : schéma d'Euler,
// consistance, stabilité, convergence). On avance le schéma
// x_{i+1} = x_i + h f(t_i, x_i) un pas à la fois : chaque pas suit la tangente.
// Deux erreurs se lisent sur la figure :
//   - l'erreur locale de consistance e_i = x(t_{i+1}) − x(t_i) − h f(t_i, x(t_i)),
//     l'écart entre la solution exacte et sa tangente en t_i (figure du poly) ;
//   - l'erreur globale x(t_i) − x_i, qui accumule les erreurs locales, chacune
//     transportée par le flot : les solutions exactes issues de chaque x_i
//     forment un éventail.
// La stabilité donne max_i |x(t_i) − x_i| ≤ S Σ |e_i|, avec S = e^{L(t_f − t₀)}.
// Trois vues séparent les trois notions du poly : la consistance (la solution
// exacte injectée dans le schéma), la stabilité (le schéma contre le même
// schéma perturbé) et la convergence (Lax : la solution exacte est le schéma
// perturbé par les e_i). Une figure suit chacune quand h → 0.

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe, latexScientifique, latexScientifiqueFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, glisse, legende, paragraphe, toile } from './commun.js';

// Problèmes : f, solution exacte par (s, y) au temps t, intervalle et
// constante de Lipschitz L de f en x sur la bande.
export const PROBLEMES = {
  poly: {
    latex: '\\dot x = (1 - 2t)\\,x,\\ x(0) = 1',
    f: (t, x) => (1 - 2 * t) * x,
    exacte: (s, y) => (t) => y * Math.exp(t - t * t - (s - s * s)),
    t0: 0,
    tf: 3,
    xi0: 1,
    L: 5,
    Llatex: 'L = \\max_{[0, 3]} |1 - 2t| = 5',
    cadre: [-0.3, 1.6],
  },
  croissance: {
    latex: '\\dot x = x,\\ x(0) = 1',
    f: (t, x) => x,
    exacte: (s, y) => (t) => y * Math.exp(t - s),
    t0: 0,
    tf: 2,
    xi0: 1,
    L: 1,
    Llatex: 'L = 1',
    cadre: [0, 8],
  },
};

// Schéma d'Euler sur N pas uniformes : points (t_i, x_i).
export function euler(cle, N) {
  const P = PROBLEMES[cle];
  const h = (P.tf - P.t0) / N;
  const pts = [[P.t0, P.xi0]];
  for (let i = 0; i < N; i++) {
    const [t, x] = pts[i];
    pts.push([t + h, x + h * P.f(t, x)]);
  }
  return pts;
}

// Erreurs locales de consistance e_i (sur la solution exacte), i = 0…N − 1.
export function erreursLocales(cle, N) {
  const P = PROBLEMES[cle];
  const h = (P.tf - P.t0) / N;
  const x = P.exacte(P.t0, P.xi0);
  return Array.from({ length: N }, (_, i) => {
    const t = P.t0 + i * h;
    return x(t + h) - x(t) - h * P.f(t, x(t));
  });
}

// Signe pseudo-aléatoire et reproductible de la perturbation du pas j.
export const signe = (j) => (Math.sin(12.9898 * (j + 1)) * 43758.5453 % 1 > 0 ? 1 : -1);

// Schéma d'Euler perturbé : y₀ = x₀ + η, puis y_{i+1} = y_i + h f(t_i, y_i) + ε_i,
// avec ε_i = ±η (définition de la stabilité du poly). Rend les points et la
// somme |y₀ − x₀| + Σ|ε_i|.
export function eulerPerturbe(cle, N, eta) {
  const P = PROBLEMES[cle];
  const h = (P.tf - P.t0) / N;
  const pts = [[P.t0, P.xi0 + eta]];
  for (let i = 0; i < N; i++) {
    const [t, y] = pts[i];
    pts.push([t + h, y + h * P.f(t, y) + signe(i) * eta]);
  }
  return { pts, perturbations: (N + 1) * eta };
}

// Les grandeurs de chaque notion pour N pas : consistance (Σ|e_i|, max|e_i|),
// stabilité (max|x_i − y_i| rapporté aux perturbations), convergence (erreur
// globale, et la borne de Lax S Σ|e_i|).
export function bilan(cle, N, eta) {
  const P = PROBLEMES[cle];
  const e = erreursLocales(cle, N);
  const pts = euler(cle, N);
  const x = P.exacte(P.t0, P.xi0);
  const { pts: ys, perturbations } = eulerPerturbe(cle, N, eta);
  const S = Math.exp(P.L * (P.tf - P.t0));
  const somme = e.reduce((a, v) => a + Math.abs(v), 0);
  return {
    somme,
    maxLocale: Math.max(...e.map(Math.abs)),
    ecartPerturbe: Math.max(...pts.map(([, v], i) => Math.abs(v - ys[i][1]))),
    perturbations,
    globale: Math.max(...pts.map(([t, v]) => Math.abs(v - x(t)))),
    S,
    borne: S * somme,
  };
}

const VUES = {
  consistance: '1. consistance',
  stabilite: '2. stabilité',
  convergence: '3. convergence (Lax)',
};

export default {
  etat: { pb: 'poly', vue: 'convergence', N: 8, i: 3, leta: -1.5 },

  choix: { pb: Object.keys(PROBLEMES), vue: Object.keys(VUES) },

  termes: ['schéma d’Euler', 'erreur locale de consistance', 'méthode stable', 'consistante', 'erreur globale', 'convergente', 'flot', 'lipschitzienne'],

  rappel: [
    'Le schéma d’Euler explicite : $x_{i+1} = x_i + h_i\\,f(t_i, x_i)$. Sur un pas, il suit la tangente. Trois notions, trois questions :',
    '1. Consistance : la solution exacte vérifie-t-elle presque le schéma ? Erreur locale',
    '$$e_i = x(t_{i+1}) - x(t_i) - h_i\\,f(t_i, x(t_i)),$$',
    'l’écart entre la solution et sa tangente. La méthode est consistante si $\\sum |e_i| \\to 0$ quand $h \\to 0$. Pour Euler, $e_i = O(h^2)$, ordre $1$.',
    '2. Stabilité : le schéma amplifie-t-il des perturbations ? C’est une méthode stable si, pour $y_{i+1} = y_i + h_i\\,f(t_i, y_i) + \\varepsilon_i$,',
    '$$\\max_i |x_i - y_i| \\le S \\Big( |x_0 - y_0| + \\sum_j |\\varepsilon_j| \\Big),$$',
    'avec $S$ indépendant des pas. Pour Euler, $f$ étant $L$-lipschitzienne, $S = e^{L(t_f - t_0)}$.',
    '3. Convergence : la méthode est convergente si $\\max_i |x(t_i) - x_i| \\to 0$. La solution exacte est le schéma perturbé par $\\varepsilon_i = e_i$ : la stabilité donne',
    '$$\\max_i |x(t_i) - x_i| \\le S \\sum_i |e_i|,$$',
    'qui tend vers $0$ par consistance (théorème de Lax). L’erreur globale d’Euler est en $O(h)$.',
  ],

  essais: [
    { texte: 'Consistance : on n’avance pas le schéma, on y injecte la solution exacte. Chaque segment suit la tangente à la solution en $t_i$ ; l’écart en $t_{i+1}$ est $e_i$. Où est-il le plus grand ?', etat: { pb: 'poly', vue: 'consistance', N: 8, i: 8 } },
    { texte: 'Consistance, quand $h \\to 0$ : $\\max |e_i|$ décroît comme $h^2$, et leur somme comme $h$. C’est la somme qui doit tendre vers $0$.', etat: { pb: 'poly', vue: 'consistance', N: 16, i: 16 } },
    { texte: 'Stabilité : on ajoute $\\pm\\eta$ à chaque pas. L’écart entre les deux schémas reste sous $S$ fois la somme des perturbations, et le rapport reste borné quand $N$ grandit.', etat: { pb: 'croissance', vue: 'stabilite', N: 16, i: 16, leta: -1.5 } },
    { texte: 'Convergence : avancez pas à pas. L’éventail montre chaque erreur locale transportée par le flot jusqu’à $t_f$ : leur somme est majorée par $S \\sum |e_i|$.', etat: { pb: 'poly', vue: 'convergence', N: 6, i: 6 } },
    { texte: 'Convergence, quand $h \\to 0$ : doublez $N$, l’erreur globale est divisée par $2$ (ordre $1$), sous la borne de Lax. Consistance et stabilité ont suffi.', etat: { pb: 'poly', vue: 'convergence', N: 8, i: 8 } },
    { texte: '$\\dot x = x$ : le flot écarte les solutions, et chaque erreur locale est amplifiée par $e^{t_f - t_{i+1}}$. La borne $S \\sum |e_i|$ en tient compte.', etat: { pb: 'croissance', vue: 'convergence', N: 8, i: 8 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const barre = barreOutils(zone);
    const choix = choixRadios(barre, {
      nom: 'pb',
      options: Object.entries(PROBLEMES).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        outils.change({ pb: valeur });
        dessine();
      },
    });
    const choixVue = choixRadios(barre, {
      nom: 'vue',
      options: Object.entries(VUES).map(([valeur, texte]) => ({ valeur, texte })),
      change: (valeur) => {
        outils.change({ vue: valeur });
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    const cPlan = carte(grille, 'Le schéma, pas à pas');
    const titrePlan = cPlan.querySelector('h2, h3');
    boutonInfo(cPlan, [
      ['ligne', '--texte', 'La solution exacte $x(t)$.'],
      ['ligne', '--accent', 'Le schéma d’Euler $x_i$ (stabilité, convergence).'],
      ['ligne', '--serie-3', 'Stabilité : le schéma perturbé $y_i$, avec $\\pm\\eta$ ajouté à chaque pas.'],
      ['ligne', '--discret', 'Convergence : l’éventail, la solution exacte passant par chaque $(t_i, x_i)$.'],
      ['ligne', '--serie-1', 'Consistance : les erreurs locales $e_i$, entre la solution et sa tangente en $t_i$ (en tirets).'],
    ]);
    const canvas = toile(cPlan, '16 / 10', () => dessine());
    const rep = new Repere(canvas, { x: [0, 3], y: [-0.3, 1.6] });
    const zoneLegende = document.createElement('div');
    cPlan.appendChild(zoneLegende);
    const commandes = document.createElement('div');
    commandes.className = 'zoom';
    commandes.innerHTML =
      '<button type="button" data-p="debut">⏮ début</button><button type="button" data-p="-1">‹ pas précédent</button><button type="button" data-p="1">pas suivant ›</button><button type="button" data-p="fin">fin ⏭</button>';
    cPlan.appendChild(commandes);
    commandes.addEventListener('click', (ev) => {
      const p = ev.target.closest('button')?.dataset.p;
      if (!p) return;
      const i = p === 'debut' ? 0 : p === 'fin' ? r.N : Math.max(0, Math.min(r.N, r.i + Number(p)));
      outils.change({ i });
      dessine();
    });

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cReg = carte(colonne, 'Réglages et bilan');
    const champN = champ(cReg, { latex: 'N', min: 2, max: 64, pas: 1, valeur: r.N }, (v) => fixeN(v));
    const champEta = champ(cReg, { latex: '\\log_{10}\\eta', min: -3, max: -0.5, pas: 0.1, pasFleche: 0.5, valeur: r.leta }, (v) => {
      outils.change({ leta: v });
      dessine();
    });
    const ligneEta = cReg.querySelectorAll('.champ')[1];
    const formule = document.createElement('div');
    formule.className = 'formule';
    cReg.appendChild(formule);
    const texteBilan = paragraphe(cReg, '', 'note texte-fixe');
    function fixeN(v) {
      const N = Math.max(1, Math.min(400, Math.round(v)));
      outils.change({ N, i: r.i >= r.N ? N : Math.min(r.i, N) });
      champN.fixe(r.N);
      dessine();
    }

    // ---- Quand h → 0 : la grandeur de chaque notion en fonction de N --------------------------------
    const cLim = carte(colonne, 'Quand $h \\to 0$');
    boutonInfo(cLim, [
      ['ligne', '--serie-1', 'Consistance : $\\sum |e_i|$ (trait plein, pente $-1$) et $\\max |e_i|$ (tirets, pente $-2$), en échelle log-log selon $N$.'],
      ['ligne', '--serie-2', 'Stabilité : $\\max |x_i - y_i|$ divisé par les perturbations, sous la constante $S$ (tirets), quel que soit $N$.'],
      ['ligne', '--accent', 'Convergence : l’erreur globale (pente $-1$), sous la borne $S \\sum |e_i|$ (tirets).'],
      ['tirets', '--perturbation', 'Le $N$ choisi : cliquez sur la figure pour en changer.'],
    ]);
    const canvasLim = toile(cLim, '16 / 9', () => dessine());
    canvasLim.classList.add('saisissable');
    const repLim = new Repere(canvasLim, { x: [0, 3], y: [-6, 1] });
    glisse(canvasLim, repLim, { deplace: (lN) => fixeN(10 ** lN) });
    const noteLim = paragraphe(cLim, '', 'note conclusion-fixe');

    function dessine() {
      const col = couleurs();
      const P = PROBLEMES[r.pb];
      // Réglages lus dans l'URL : N entier entre 1 et 400, 0 ≤ i ≤ N.
      const Nlu = Math.max(1, Math.min(400, Math.round(r.N) || 8));
      if (Nlu !== r.N || !Number.isInteger(r.i) || r.i < 0 || r.i > Nlu) outils.change({ N: Nlu, i: Math.max(0, Math.min(Nlu, Math.round(r.i) || 0)) });
      choix.fixe(r.pb);
      choixVue.fixe(r.vue);
      ligneEta.classList.toggle('inactif', r.vue !== 'stabilite');
      for (const input of ligneEta.querySelectorAll('input')) input.disabled = r.vue !== 'stabilite';
      const N = r.N;
      const i = Math.min(r.i, N);
      const h = (P.tf - P.t0) / N;
      const eta = 10 ** r.leta;
      const pts = euler(r.pb, N);
      const e = erreursLocales(r.pb, N);
      const x = P.exacte(P.t0, P.xi0);
      const { pts: ys } = eulerPerturbe(r.pb, N, eta);
      if (titrePlan) titrePlan.textContent = { consistance: 'La solution exacte injectée dans le schéma', stabilite: 'Le schéma et le schéma perturbé', convergence: 'Le schéma, pas à pas' }[r.vue];

      // ---- Plan ----
      rep.fixeCadre([P.t0, P.tf], P.cadre);
      if (rep.prepare()) {
        rep.axes({ noms: ['t', 'x'] });
        const ts = Array.from({ length: 401 }, (_, k) => P.t0 + ((P.tf - P.t0) * k) / 400);
        if (r.vue === 'convergence') {
          // Éventail : la solution exacte issue de chaque point du schéma déjà calculé.
          for (let j = 1; j <= i; j++) {
            const g = P.exacte(...pts[j]);
            rep.trace(ts.filter((t) => t >= pts[j][0] - 1e-12).map((t) => [t, g(t)]), { couleur: col.discret, largeur: 1, alpha: 0.6 });
          }
        }
        rep.trace(ts.map((t) => [t, x(t)]), { couleur: col.trait, largeur: 2 });
        if (r.vue === 'consistance') {
          // La solution exacte dans le schéma : la tangente en t_j, et l'écart e_j en t_{j+1}.
          for (let j = 0; j < i; j++) {
            const tj = P.t0 + j * h;
            const t1 = tj + h;
            rep.trace([[tj, x(tj)], [t1, x(tj) + h * P.f(tj, x(tj))]], { couleur: col.series[0], largeur: 1.2, tirets: [5, 4] });
            rep.trace([[t1, x(t1)], [t1, x(t1) - e[j]]], { couleur: col.series[0], largeur: 2.5 });
            rep.point(tj, x(tj), { rayon: 3, couleur: col.trait });
          }
        } else {
          if (r.vue === 'stabilite') {
            rep.trace(ys.slice(0, i + 1), { couleur: col.series[2], largeur: 1.8 });
            ys.slice(0, i + 1).forEach(([t, v]) => rep.point(t, v, { rayon: 3, couleur: col.series[2] }));
          }
          rep.trace(pts.slice(0, i + 1), { couleur: col.accent, largeur: 2.2 });
          pts.slice(0, i + 1).forEach(([t, v], j) => rep.point(t, v, { rayon: j === i ? 5 : 3.5, couleur: col.accent }));
          if (i < N) rep.trace([pts[i], pts[i + 1]], { couleur: col.accent, largeur: 1.4, tirets: [3, 4] });
        }
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, [
        { texte: 'solution exacte', couleur: col.trait },
        ...(r.vue === 'consistance'
          ? [{ texte: 'tangentes et erreurs locales $e_i$', couleur: col.series[0] }]
          : [{ texte: `Euler, pas ${i} sur ${N}`, couleur: col.accent }, r.vue === 'stabilite' ? { texte: 'schéma perturbé $y_i$', couleur: col.series[2] } : { texte: 'éventail', couleur: col.discret }]),
      ]);

      // ---- Bilan ----
      const b = bilan(r.pb, N, eta);
      outils.rend(formule, `h = ${latexNombreFixe(h, 4)}, \\qquad ${P.Llatex}`);
      const sci = (v) => latexScientifiqueFixe(v);
      outils.rendTexte(
        texteBilan,
        {
          consistance: `$\\max_i |e_i| = ${sci(b.maxLocale)}$, $\\sum_i |e_i| = ${sci(b.somme)}$. La consistance ne regarde que la solution exacte : le schéma n’est pas avancé.`,
          stabilite: `Perturbations $|y_0 - x_0| + \\sum |\\varepsilon_j| = ${sci(b.perturbations)}$. Écart $\\max_i |x_i - y_i| = ${sci(b.ecartPerturbe)}$, sous $S \\times$ perturbations, $S = ${latexScientifique(b.S)}$.`,
          convergence: `Erreur globale $\\max_i |x(t_i) - x_i| = ${sci(b.globale)}$, sous la borne de Lax $S \\sum |e_i| = ${sci(b.borne)}$.`,
        }[r.vue],
      );

      // ---- Quand h → 0 ----
      const Ns = [2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384];
      const bs = Ns.map((n) => [Math.log10(n), bilan(r.pb, n, eta)]);
      const lg = (v) => Math.log10(Math.max(v, 1e-16));
      const courbes = {
        consistance: [
          [bs.map(([l, q]) => [l, lg(q.somme)]), { couleur: col.series[0], largeur: 2 }],
          [bs.map(([l, q]) => [l, lg(q.maxLocale)]), { couleur: col.series[0], largeur: 1.4, tirets: [5, 4] }],
        ],
        stabilite: [
          [bs.map(([l, q]) => [l, lg(q.ecartPerturbe / q.perturbations)]), { couleur: col.series[2], largeur: 2 }],
          [bs.map(([l, q]) => [l, lg(q.S)]), { couleur: col.trait, largeur: 1.2, tirets: [5, 4] }],
        ],
        convergence: [
          [bs.map(([l, q]) => [l, lg(q.globale)]), { couleur: col.accent, largeur: 2 }],
          [bs.map(([l, q]) => [l, lg(q.borne)]), { couleur: col.trait, largeur: 1.2, tirets: [5, 4] }],
        ],
      }[r.vue];
      const ys2 = courbes.flatMap(([c]) => c.map(([, v]) => v));
      repLim.fixeCadre([Math.log10(2), Math.log10(384)], [Math.floor(Math.min(...ys2)) - 0.3, Math.ceil(Math.max(...ys2)) + 0.3]);
      if (repLim.prepare()) {
        repLim.axes({ noms: [[['log₁₀ ', false], ['N', true]], [['log₁₀', false]]], nomsAuBord: true, enL: true });
        for (const [c, style] of courbes) repLim.trace(c, style);
        repLim.trace([[Math.log10(N), -100], [Math.log10(N), 100]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
      }
      outils.rendTexte(
        noteLim,
        {
          consistance: '$\\sum |e_i| \\to 0$ : Euler est consistante. Chaque $e_i$ est en $h^2$, leur somme en $h$.',
          stabilite: 'Le rapport reste sous $S$ pour tout $N$ : la borne ne dépend pas des pas. C’est la stabilité.',
          convergence: 'L’erreur globale tend vers $0$ comme $h$, sous la borne de Lax : consistance et stabilité donnent la convergence.',
        }[r.vue],
      );
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champN.fixe(r.N);
        champEta.fixe(r.leta);
        dessine();
      },
    };
  },
};
