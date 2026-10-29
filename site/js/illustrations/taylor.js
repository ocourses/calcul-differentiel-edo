// Formules de Taylor (poly, chapitre « Applications différentiables d'ordre
// supérieur »). Pour f : ℝ² → ℝ, la surface z = f(x) et, sur un pavé autour de
// a, son développement de Taylor d'ordre 1 (le plan tangent) ou 2 (la quadrique
// osculatrice) :
//   T₁(h) = f(a) + ⟨∇f(a), h⟩,   T₂(h) = T₁(h) + ½ ⟨∇²f(a) h, h⟩.
// Le long d'une direction u, l'erreur |f(a + su) − T_k(su)| décroît comme
// s^{k+1} (Taylor-Young, et Taylor-Lagrange pour la constante) : en échelle
// log-log, des droites de pente 2 et 3. Pour une fonction quadratique, T₂ est
// exacte (exemple du poly).

import { champ } from '../../socle/js/ui/controls.js';
import { latexMatriceFixe, latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { Vue3D } from '../../socle/js/ui/vue3d.js';
import { barreOutils, boutonInfo, boutonVue, carte, champsPoint, choixRadios, glisse, legende, paragraphe, toile } from './commun.js';

// Fonctions : valeur, gradient, hessienne.
export const FONCTIONS = {
  poly: {
    latex: 'f(x) = e^{x_1}\\sin x_2',
    f: ([x, y]) => Math.exp(x) * Math.sin(y),
    grad: ([x, y]) => [Math.exp(x) * Math.sin(y), Math.exp(x) * Math.cos(y)],
    hess: ([x, y]) => [
      [Math.exp(x) * Math.sin(y), Math.exp(x) * Math.cos(y)],
      [Math.exp(x) * Math.cos(y), -Math.exp(x) * Math.sin(y)],
    ],
    note: 'Exercice du poly : en $a = 0$, $\\nabla f(0) = (0, 1)$, $\\nabla^2 f(0) = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$, et $f(h) = h_2 + h_1 h_2 + o(\\|h\\|^2)$.',
  },
  quadratique: {
    latex: 'f(x) = x_1^2 + x_1 x_2 - \\tfrac12 x_2^2 + x_1',
    f: ([x, y]) => x * x + x * y - 0.5 * y * y + x,
    grad: ([x, y]) => [2 * x + y + 1, x - y],
    hess: () => [
      [2, 1],
      [1, -1],
    ],
    note: 'Fonction quadratique : $\\nabla^2 f$ est constante et les différentielles d’ordre $\\ge 3$ sont nulles. Le développement d’ordre $2$ est une identité, sans reste.',
  },
  trigo: {
    latex: 'f(x) = \\cos x_1 + \\sin(x_1 x_2)',
    f: ([x, y]) => Math.cos(x) + Math.sin(x * y),
    grad: ([x, y]) => [-Math.sin(x) + y * Math.cos(x * y), x * Math.cos(x * y)],
    hess: ([x, y]) => [
      [-Math.cos(x) - y * y * Math.sin(x * y), Math.cos(x * y) - x * y * Math.sin(x * y)],
      [Math.cos(x * y) - x * y * Math.sin(x * y), -x * x * Math.sin(x * y)],
    ],
    note: 'En $a = 0$, $\\nabla f(0) = 0$ : le plan tangent est horizontal. La quadrique $1 - \\tfrac12 h_1^2 + h_1 h_2$ dit la forme de la surface : un col.',
  },
};

// Développement de Taylor d'ordre k (1 ou 2) en a, évalué en a + h.
export function taylor(cle, a, k, h) {
  const F = FONCTIONS[cle];
  const g = F.grad(a);
  let v = F.f(a) + g[0] * h[0] + g[1] * h[1];
  if (k >= 2) {
    const H = F.hess(a);
    v += 0.5 * (H[0][0] * h[0] * h[0] + 2 * H[0][1] * h[0] * h[1] + H[1][1] * h[1] * h[1]);
  }
  return v;
}

const DOMAINE = [-1.5, 1.5];

// Deux gestes sur la vue 3D, comme pour Fubini (mesure-intégration) : le bouton
// gauche déplace a sur la surface, le bouton droit (ou Maj + gauche) fait
// tourner la vue (`tourne` de Vue3D). Au doigt, on saisit a près de la bille,
// et l'on tourne la vue ailleurs. `bille()` : { px, py, z } ou null.
function gestesTaylor(canvas, { vue, bille, deplace }) {
  const surBille = (ev) => {
    const b = bille();
    return b !== null && Math.hypot(ev.offsetX - b.px, ev.offsetY - b.py) <= 30;
  };
  const tourne = (ev) => boutonVue(ev) || (ev.pointerType === 'touch' && !surBille(ev));
  let z = null;
  const vers = (ev) => {
    const p = vue().pointDuPlan(ev.offsetX, ev.offsetY, z);
    if (p) deplace(p);
  };
  canvas.addEventListener('pointerdown', (ev) => {
    if (tourne(ev)) return;
    z = bille()?.z ?? 0;
    canvas.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    vers(ev);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (z !== null) vers(ev);
  });
  const fin = () => (z = null);
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);
  return tourne;
}

export default {
  etat: { fn: 'poly', ordre: 2, a1: 0, a2: 0, rho: 0.6, phi: 30 },

  choix: { fn: Object.keys(FONCTIONS) },

  termes: ['Taylor-Young', 'Taylor-Lagrange', 'gradient', 'hessienne', 'différentiable'],

  rappel: [
    'Taylor-Young : si $f$ est $k$ fois différentiable en $a$,',
    '$$f(a + h) = \\sum_{j=0}^{k} \\frac{1}{j!}\\, f^{(j)}(a)\\cdot h^j + o(\\|h\\|^k).$$',
    'Pour $f \\colon \\mathbb R^n \\to \\mathbb R$, à l’ordre $2$ :',
    '$$\\begin{aligned} f(a + h) = f(a) &+ \\langle \\nabla f(a), h\\rangle \\\\ &+ \\tfrac12 \\langle \\nabla^2 f(a)\\,h, h\\rangle + o(\\|h\\|^2). \\end{aligned}$$',
    'Taylor-Lagrange : si $f$ est de classe $C^{k+1}$ et $\\|f^{(k+1)}\\| \\le M$ sur $[a, a + h]$, l’erreur est au plus',
    '$$\\frac{M}{(k+1)!}\\,\\|h\\|^{k+1}.$$',
    'L’erreur de l’ordre $k$ décroît donc comme $\\|h\\|^{k+1}$ : en échelle log-log, une droite de pente $k + 1$.',
  ],

  essais: [
    { texte: 'Exercice du poly, en $a = 0$ : le plan tangent est $z = h_2$, la quadrique $z = h_2 + h_1 h_2$. Tournez la surface (bouton droit) pour voir où ils décollent.', etat: { fn: 'poly', ordre: 2, a1: 0, a2: 0, rho: 0.6 } },
    { texte: 'Sur le graphe d’erreur, les pentes sont $2$ pour l’ordre $1$ et $3$ pour l’ordre $2$. Divisez $\\|h\\|$ par $10$ : par combien l’erreur de l’ordre $2$ est-elle divisée ?', etat: { fn: 'poly', ordre: 2, a1: 0.3, a2: 0.5, phi: 30 } },
    { texte: 'Fonction quadratique : l’erreur de l’ordre $2$ est nulle (aux erreurs d’arrondi près) : la quadrique est la surface elle-même.', etat: { fn: 'quadratique', ordre: 2, a1: 0.2, a2: -0.3, rho: 0.8 } },
    { texte: '$\\cos x_1 + \\sin(x_1 x_2)$ en $0$ : le gradient est nul, le plan tangent horizontal ne dit rien de la forme. La hessienne indéfinie dit : un col.', etat: { fn: 'trigo', ordre: 2, a1: 0, a2: 0, rho: 0.8 } },
    { texte: 'Déplacez $a$ dans les lignes de niveau : le gradient est orthogonal aux lignes de niveau, et le plan tangent penche dans sa direction.', etat: { fn: 'poly', ordre: 1, a1: -0.5, a2: 0.8, rho: 0.5 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const barre = barreOutils(zone);
    const choix = choixRadios(barre, {
      nom: 'fn',
      options: Object.entries(FONCTIONS).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        outils.change({ fn: valeur });
        dessine();
      },
    });
    const choixOrdre = choixRadios(barre, {
      nom: 'ordre',
      options: [
        { valeur: '1', texte: 'ordre 1 (plan tangent)' },
        { valeur: '2', texte: 'ordre 2 (quadrique)' },
      ],
      change: (valeur) => {
        outils.change({ ordre: Number(valeur) });
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    // ---- Surface 3D -----------------------------------------------------------------------------------
    const c3d = carte(grille, 'La surface $z = f(x)$ et son développement en $a$');
    boutonInfo(c3d, [
      ['zone', '--accent', 'La surface $z = f(x)$ (en bleu).'],
      ['zone', '--perturbation', 'Le développement de Taylor $z = T_k(x - a)$ sur un pavé de demi-côté $\\rho$ autour de $a$ (en orange).'],
      ['point', '--perturbation', 'Le point $(a, f(a))$ : le bouton gauche le déplace.'],
      ['fleche', '--discret', 'Le bouton droit (ou Maj enfoncée avec le bouton gauche) fait tourner la vue : vers la droite ou la gauche pour faire le tour de la surface, vers le bas pour la voir de dessus. Au doigt, on saisit la bille et l’on tourne la vue ailleurs.'],
    ]);
    const canvas3d = toile(c3d, '16 / 10', () => dessine());
    const tourne = gestesTaylor(canvas3d, {
      vue: () => vue,
      bille: () => {
        if (!vue.rect) return null;
        const z = FONCTIONS[r.fn].f([r.a1, r.a2]);
        return { ...vue.projette(r.a1, r.a2, z), z };
      },
      deplace: ([x, y]) => fixeA(x, y),
    });
    const vue = new Vue3D(canvas3d, { x: DOMAINE, y: DOMAINE, zmax: 1, zmin: -1, azimut: -0.9, elevation: 0.45, rappel: () => dessine(), tourne });
    const point = champsPoint(
      c3d,
      [
        { latex: 'a_1', min: -1.4, max: 1.4 },
        { latex: 'a_2', min: -1.4, max: 1.4 },
      ],
      [r.a1, r.a2],
      ([a1, a2]) => {
        outils.change({ a1, a2 });
        dessine();
      },
    );
    const champRho = champ(c3d, { latex: '\\rho', min: 0.1, max: 1.5, pas: 0.01, pasFleche: 0.1, valeur: r.rho }, (v) => {
      outils.change({ rho: v });
      dessine();
    });

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);

    // ---- Lignes de niveau et point a -------------------------------------------------------------------
    const cNiveau = carte(colonne, 'Lignes de niveau, point $a$ et direction $u$');
    boutonInfo(cNiveau, [
      ['ligne', '--discret', 'Des lignes de niveau de $f$.'],
      ['fleche', '--accent', 'Le gradient $\\nabla f(a)$, orthogonal à la ligne de niveau.'],
      ['ligne', '--serie-1', 'La direction $u$ du graphe d’erreur, d’angle $\\varphi$.'],
      ['point', '--perturbation', 'Le point $a$ : faites-le glisser.'],
    ]);
    const canvasNiveau = toile(cNiveau, '1 / 1', () => dessine());
    canvasNiveau.classList.add('saisissable');
    const repNiveau = new Repere(canvasNiveau, { x: DOMAINE, y: DOMAINE, egal: true });
    glisse(canvasNiveau, repNiveau, { deplace: (x, y) => fixeA(x, y) });
    // a, borné au domaine et collé aux axes (8 px sur les lignes de niveau).
    function fixeA(x, y) {
      const aimante = (v) => (Math.abs(v) * repNiveau.sx < 8 ? 0 : Number(v.toFixed(3)));
      outils.change({ a1: aimante(Math.max(-1.4, Math.min(1.4, x))), a2: aimante(Math.max(-1.4, Math.min(1.4, y))) });
      dessine();
    }
    const champPhi = champ(cNiveau, { latex: '\\varphi', min: -180, max: 180, pas: 1, pasFleche: 15, valeur: r.phi, unite: '°' }, (v) => {
      outils.change({ phi: v });
      dessine();
    });

    // ---- Erreur ----------------------------------------------------------------------------------------------
    const cErr = carte(colonne, 'Erreur $|f(a + su) - T_k(su)|$');
    boutonInfo(cErr, [
      ['ligne', '--serie-1', 'Ordre $1$ : l’erreur, en échelle log-log selon $s$, a une pente $2$.'],
      ['ligne', '--serie-2', 'Ordre $2$ : pente $3$.'],
      ['tirets', '--texte', 'Des droites de pente $2$ et $3$, pour comparer.'],
    ]);
    const canvasErr = toile(cErr, '16 / 9', () => dessine());
    const repErr = new Repere(canvasErr, { x: [-4, 0], y: [-14, 1] });
    const zoneLegende = document.createElement('div');
    cErr.appendChild(zoneLegende);

    // Le développement en a, sous la surface.
    const formule = document.createElement('div');
    formule.className = 'formule';
    c3d.appendChild(formule);
    const note = paragraphe(c3d, '', 'note conclusion-fixe');

    function dessine() {
      const col = couleurs();
      const F = FONCTIONS[r.fn];
      // Un ordre lu dans l'URL autre que 1 ou 2 est ramené à 2.
      if (r.ordre !== 1 && r.ordre !== 2) outils.change({ ordre: 2 });
      choix.fixe(r.fn);
      choixOrdre.fixe(String(r.ordre));
      const a = [r.a1, r.a2];
      point.fixe(a);
      const fa = F.f(a);

      // ---- 3D : échelle verticale ajustée aux valeurs de f sur le domaine ----
      let [zmin, zmax] = [Infinity, -Infinity];
      for (let i = 0; i <= 30; i++) {
        for (let j = 0; j <= 30; j++) {
          const v = F.f([DOMAINE[0] + (3 * i) / 30, DOMAINE[0] + (3 * j) / 30]);
          zmin = Math.min(zmin, v);
          zmax = Math.max(zmax, v);
        }
      }
      const marge = 0.1 * (zmax - zmin);
      vue.fixeDomaine(DOMAINE, DOMAINE, zmax + marge, zmin - marge);
      if (vue.prepare()) {
        vue.socle();
        const pave = [
          [Math.max(DOMAINE[0], a[0] - r.rho), Math.min(DOMAINE[1], a[0] + r.rho)],
          [Math.max(DOMAINE[0], a[1] - r.rho), Math.min(DOMAINE[1], a[1] + r.rho)],
        ];
        vue.surfaces([
          { f: (x, y) => F.f([x, y]), n: 30, teinte: 215, alpha: 0.75 },
          { f: (x, y) => taylor(r.fn, a, r.ordre, [x - a[0], y - a[1]]), n: 14, pave, teinte: 25, alpha: 0.7 },
        ]);
        vue.bille(a[0], a[1], fa, col.perturbation);
      }

      // ---- Lignes de niveau ----
      const g = F.grad(a);
      const u = [Math.cos((r.phi * Math.PI) / 180), Math.sin((r.phi * Math.PI) / 180)];
      if (repNiveau.prepare()) {
        repNiveau.axes({ noms: ['x₁', 'x₂'] });
        const n = 12;
        for (let k = 1; k < n; k++) repNiveau.isoligne((x, y) => F.f([x, y]), zmin + ((zmax - zmin) * k) / n, { couleur: col.discret, largeur: 1 });
        repNiveau.isoligne((x, y) => F.f([x, y]), fa, { couleur: col.trait, largeur: 1.4 });
        repNiveau.droite(a[0], a[1], u[0], u[1], { couleur: col.series[0], largeur: 1.2, tirets: [5, 4] });
        const ng = Math.hypot(...g);
        if (ng > 1e-9) {
          const l = 0.5 / Math.max(1, ng);
          repNiveau.trace([a, [a[0] + l * g[0], a[1] + l * g[1]]], { couleur: col.accent, largeur: 2 });
          repNiveau.pointe(a[0] + l * g[0], a[1] + l * g[1], g[0], g[1], { couleur: col.accent });
        }
        repNiveau.point(a[0], a[1], { rayon: 5, couleur: col.perturbation });
      }

      // ---- Erreur le long de u ----
      const ss = Array.from({ length: 201 }, (_, k) => -4 + (4 * k) / 200);
      const courbe = (k) => ss.map((ls) => {
        const s = 10 ** ls;
        const h = [s * u[0], s * u[1]];
        return [ls, Math.log10(Math.max(Math.abs(F.f([a[0] + h[0], a[1] + h[1]]) - taylor(r.fn, a, k, h)), 1e-17))];
      });
      const [e1, e2] = [courbe(1), courbe(2)];
      if (repErr.prepare()) {
        repErr.axes({ noms: [[['log₁₀ ', false], ['s', true]], [['log₁₀ erreur', false]]], nomsAuBord: true, enL: true });
        for (const [p, b] of [[2, -1], [3, -1.5]]) repErr.trace([[-4, b + p * -4], [0, b]], { couleur: col.trait, largeur: 0.8, tirets: [3, 5], alpha: 0.6 });
        repErr.trace(e1, { couleur: col.series[0], largeur: r.ordre === 1 ? 2.6 : 1.4 });
        repErr.trace(e2, { couleur: col.series[1], largeur: r.ordre === 2 ? 2.6 : 1.4 });
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, [
        { texte: 'ordre $1$', couleur: col.series[0] },
        { texte: 'ordre $2$', couleur: col.series[1] },
        { texte: 'pentes $2$ et $3$', couleur: col.trait, tirets: true },
      ]);

      // ---- Formule ----
      const H = F.hess(a);
      outils.rend(
        formule,
        `f(a) = ${latexNombreFixe(fa, 3)}, \\quad \\nabla f(a) = \\begin{pmatrix} ${latexNombreFixe(g[0], 3)} \\\\ ${latexNombreFixe(g[1], 3)} \\end{pmatrix}, \\quad \\nabla^2 f(a) = ${latexMatriceFixe(H, 3)}`,
      );
      const enZero = r.a1 === 0 && r.a2 === 0;
      outils.rendTexte(note, enZero || r.fn === 'quadratique' ? F.note : 'Le développement dépend du point $a$ : le plan tangent penche dans la direction du gradient, et la quadrique suit la courbure donnée par la hessienne.');
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champRho.fixe(r.rho);
        champPhi.fixe(r.phi);
        dessine();
      },
    };
  },
};
