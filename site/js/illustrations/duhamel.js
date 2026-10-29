// Variation de la constante (poly, chapitre « Équations différentielles
// linéaires », solution du problème de Cauchy général) :
//   x(t) = R(t, t₀) x₀ + ∫_{t₀}^t R(t, s) b(s) ds.
// Sur l'équation scalaire ẋ = a x + b(t), R(t, s) = e^{a(t − s)}. La solution est
// la somme de la réponse libre R(t, 0) x₀ et de la contribution de chaque
// instant s du second membre, b(s) ds, transportée jusqu'à t par R(t, s). On
// voit ces réponses élémentaires, leur somme, et, à t fixé, l'intégrande
// s ↦ R(t, s) b(s) : une mémoire du second membre, pondérée par e^{a(t − s)}.

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, glisse, legende, toile } from './commun.js';

// ∫_u^v e^{a(t − s)} ds pour u ≤ v ≤ t, sans perte quand a → 0 :
// e^{a(t − v)} (e^{a(v − u)} − 1)/a.
export function noyau(a, t, u, v) {
  if (v <= u) return 0;
  return Math.exp(a * (t - v)) * (a === 0 ? v - u : Math.expm1(a * (v - u)) / a);
}

// Partie forcée ∫₀ᵗ e^{a(t − s)} b(s) ds d'un second membre c sur [u, v] (0 ailleurs) :
// exacte, intégrée avant, pendant, puis après le morceau.
const morceau = (c, u, v) => (a, t) => c * noyau(a, t, Math.min(u, t), Math.min(v, t));

// Chaque second membre et sa partie forcée exacte.
export const SECONDS_MEMBRES = {
  constant: { latex: 'b(t) = 1', b: () => 1, forcee: morceau(1, 0, Infinity) },
  creneau: { latex: 'b(t) = \\mathbf 1_{[1, 2]}(t)', b: (t) => (t >= 1 && t <= 2 ? 1 : 0), forcee: morceau(1, 1, 2) },
  // Solution particulière α sin 2t + β cos 2t, puis on retranche sa valeur en 0 transportée.
  sinus: { latex: 'b(t) = \\sin(2t)', b: (t) => Math.sin(2 * t), forcee: (a, t) => (2 * Math.exp(a * t) - a * Math.sin(2 * t) - 2 * Math.cos(2 * t)) / (a * a + 4) },
};

export const T_MAX = 8;

// Partie libre R(t, 0) x₀ et partie forcée ∫₀ᵗ R(t, s) b(s) ds, exacte.
export function decomposition(cle, a, x0, t) {
  const libre = Math.exp(a * t) * x0;
  const forcee = SECONDS_MEMBRES[cle].forcee(a, t);
  return { libre, forcee, total: libre + forcee };
}

export default {
  etat: { bm: 'creneau', a: -0.7, x0: 1, t: 3 },

  choix: { bm: Object.keys(SECONDS_MEMBRES) },

  termes: ['résolvante', 'homogène', 'problème de Cauchy', 'solution globale', 'point d’équilibre'],

  rappel: [
    'Pour $\\dot x(t) = A(t)\\,x(t) + b(t)$, avec $A$ et $b$ continues, la solution du problème de Cauchy $x(t_0) = x_0$ est globale et vaut',
    '$$\\varphi(t, t_0, x_0) = R(t, t_0)\\,x_0 + \\int_{t_0}^t R(t, s)\\,b(s)\\,\\mathrm ds,$$',
    'où $R$ est la résolvante de l’équation homogène $\\dot x = A(t)\\,x$. C’est la formule de variation de la constante.',
    'Le premier terme est la réponse libre, sans second membre. Le second somme les contributions de chaque instant $s$ : $b(s)\\,\\mathrm ds$, transporté de $s$ à $t$ par la résolvante. Ici $A = a$ est constante et $R(t, s) = e^{a(t - s)}$.',
  ],

  essais: [
    { texte: 'Créneau : pendant $[1, 2]$, la solution monte ; après, elle oublie le créneau à la vitesse $e^{a(t - s)}$. Faites glisser $t$ au-delà de $2$ et regardez l’intégrande.', etat: { bm: 'creneau', a: -0.7, x0: 1, t: 3 } },
    { texte: 'Second membre constant, $a < 0$ : la solution tend vers $-b/a$. Les réponses élémentaires s’empilent jusqu’à l’équilibre.', etat: { bm: 'constant', a: -0.5, x0: 0, t: 6 } },
    { texte: 'Avec $a > 0$, la résolvante amplifie : les instants anciens pèsent le plus dans l’intégrale. Comparez l’intégrande avec $a = -1$.', etat: { bm: 'sinus', a: 0.3, x0: 0, t: 5 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'bm',
      options: Object.entries(SECONDS_MEMBRES).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        outils.change({ bm: valeur });
        dessine();
      },
    });

    // ---- La solution et ses morceaux ---------------------------------------------------------------
    const cSol = carte(zone, 'Solution de $\\dot x = a\\,x + b(t)$, $x(0) = x_0$');
    cSol.classList.add('plus-haut');
    boutonInfo(cSol, [
      ['ligne', '--accent', 'La solution $x(t)$.'],
      ['tirets', '--texte', 'La réponse libre $R(t, 0)\\,x_0 = e^{at}x_0$.'],
      ['ligne', '--serie-1', 'La partie forcée $\\int_0^t R(t, s)\\,b(s)\\,\\mathrm ds$.'],
      ['ligne', '--discret', 'Des réponses élémentaires $t \\mapsto R(t, s_k)\\,b(s_k)\\,\\Delta s$, partant chacune de l’instant $s_k$ : leur somme est la partie forcée.'],
      ['zone', '--zone-2', 'Le second membre $b$, à l’échelle.'],
      ['tirets', '--perturbation', 'L’instant $t$ : faites glisser, ici ou sur l’intégrande.'],
      ['point', '--perturbation', 'La condition initiale $x_0$ : faites-la glisser le long de l’axe vertical.'],
    ]);
    const canvas = toile(cSol, '16 / 6', () => dessine());
    canvas.classList.add('saisissable');
    const rep = new Repere(canvas, { x: [0, T_MAX], y: [-1, 2] });
    // On saisit x₀ près de (0, x₀), sinon l'instant t.
    let saisi = null;
    glisse(canvas, rep, {
      prend: (t, x) => {
        saisi = Math.hypot(t * rep.sx, (x - r.x0) * rep.sy) < 12 ? 'x0' : 't';
        return true;
      },
      deplace: (t, x) => {
        if (saisi === 'x0') {
          outils.change({ x0: Number(Math.max(-2, Math.min(2, x)).toFixed(2)) });
          champX0.fixe(r.x0);
          dessine();
        } else fixeT(t);
      },
    });
    function fixeT(t) {
      outils.change({ t: Number(Math.min(T_MAX, Math.max(0.01, t)).toFixed(2)) });
      champT.fixe(r.t);
      dessine();
    }
    const zoneLegende = document.createElement('div');
    cSol.appendChild(zoneLegende);

    const rangee = document.createElement('div');
    rangee.className = 'grille-2 rangee-basse';
    zone.appendChild(rangee);

    // ---- Intégrande à t fixé -------------------------------------------------------------------------
    const cInt = carte(rangee, 'Intégrande $s \\mapsto R(t, s)\\,b(s)$ sur $[0, t]$');
    boutonInfo(cInt, [
      ['zone', '--zone-stable', 'L’aire sous $s \\mapsto e^{a(t - s)}\\,b(s)$ : c’est la partie forcée en $t$.'],
      ['ligne', '--accent', 'L’intégrande $R(t, s)\\,b(s)$.'],
      ['tirets', '--discret', 'Le second membre $b(s)$ seul.'],
    ]);
    const canvasInt = toile(cInt, '16 / 7', () => dessine());
    canvasInt.classList.add('saisissable');
    const repInt = new Repere(canvasInt, { x: [0, T_MAX], y: [-1, 2] });
    glisse(canvasInt, repInt, { deplace: (t) => fixeT(t) });

    // ---- Réglages et formule ---------------------------------------------------------------------------
    const cReg = carte(rangee);
    const reglages = document.createElement('div');
    reglages.className = 'reglages-2';
    cReg.appendChild(reglages);
    const champA = champ(reglages, { latex: 'a', min: -2, max: 0.5, pas: 0.01, pasFleche: 0.1, valeur: r.a }, (v) => {
      outils.change({ a: v });
      dessine();
    });
    const champX0 = champ(reglages, { latex: 'x_0', min: -2, max: 2, pas: 0.01, pasFleche: 0.1, valeur: r.x0 }, (v) => {
      outils.change({ x0: v });
      dessine();
    });
    const champT = champ(cReg, { latex: 't', min: 0.01, max: T_MAX, pas: 0.01, pasFleche: 0.1, valeur: r.t }, (v) => {
      outils.change({ t: v });
      dessine();
    });
    const formule = document.createElement('div');
    formule.className = 'formule';
    cReg.appendChild(formule);

    function dessine() {
      const col = couleurs();
      choix.fixe(r.bm);
      const { b } = SECONDS_MEMBRES[r.bm];
      const n = 400;
      const ts = Array.from({ length: n + 1 }, (_, k) => (T_MAX * k) / n);
      const parts = ts.map((t) => decomposition(r.bm, r.a, r.x0, t));
      // Réponses élémentaires, tous les Δs = 0,25.
      const ds = 0.25;
      const elementaires = [];
      for (let s = 0; s < T_MAX; s += ds) {
        // Contribution de [s, s + Δs] : b au milieu.
        let poids = 0;
        for (let k = 0; k < 20; k++) poids += (b(s + ((k + 0.5) * ds) / 20) * ds) / 20;
        if (Math.abs(poids) < 1e-12) continue;
        elementaires.push(ts.filter((t) => t >= s).map((t) => [t, Math.exp(r.a * (t - s - ds / 2)) * poids]));
      }
      const ys = parts.flatMap((p) => [p.total, p.libre, p.forcee]).concat(elementaires.flat().map(([, v]) => v));
      const [ymin, ymax] = [Math.min(-0.2, ...ys), Math.max(1.2, ...ys)];
      const marge = 0.08 * (ymax - ymin);
      rep.fixeCadre([0, T_MAX], [ymin - marge, Math.min(ymax + marge, 60)]);
      if (rep.prepare()) {
        // Le second membre en aplat, ramené à la hauteur du cadre.
        const bmax = Math.max(...ts.map((t) => Math.abs(b(t))), 1e-9);
        const echelle = (0.25 * (ymax - ymin)) / bmax;
        rep.region((t, y) => (b(t) >= 0 ? y >= 0 && y <= b(t) * echelle : y <= 0 && y >= b(t) * echelle), { couleur: col.zone2, pas: 3 });
        rep.axes({ noms: ['t', 'x'] });
        for (const e of elementaires) rep.trace(e, { couleur: col.discret, largeur: 1, alpha: 0.55 });
        rep.trace(ts.map((t, k) => [t, parts[k].libre]), { couleur: col.trait, largeur: 1.6, tirets: [6, 4] });
        rep.trace(ts.map((t, k) => [t, parts[k].forcee]), { couleur: col.series[0], largeur: 2 });
        rep.trace(ts.map((t, k) => [t, parts[k].total]), { couleur: col.accent, largeur: 2.6 });
        const p = decomposition(r.bm, r.a, r.x0, r.t);
        rep.trace([[r.t, -1e3], [r.t, 1e3]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
        rep.point(r.t, p.total, { rayon: 5, couleur: col.accent });
        rep.point(0, r.x0, { rayon: 5, couleur: col.perturbation });
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, [
        { texte: '$x(t)$', couleur: col.accent },
        { texte: 'réponse libre', couleur: col.trait, tirets: true },
        { texte: 'partie forcée', couleur: col.series[0] },
        { texte: 'réponses élémentaires', couleur: col.discret },
      ]);

      // ---- Intégrande ----
      const ss = Array.from({ length: 601 }, (_, k) => (r.t * k) / 600);
      const integrande = ss.map((s) => [s, Math.exp(r.a * (r.t - s)) * b(s)]);
      // Cadre fixe quand t bouge : l'intégrande e^{a(t − s)} b(s), s ≤ t, est
      // compris entre b(s) (t = s) et e^{a(T_MAX − s)} b(s) (t = T_MAX).
      const vs = ts.flatMap((s) => [b(s), Math.exp(r.a * (T_MAX - s)) * b(s)]);
      repInt.fixeCadre([0, T_MAX], [Math.min(-0.2, ...vs) * 1.1, Math.max(1.2, ...vs) * 1.1]);
      if (repInt.prepare()) {
        repInt.region((s, y) => s <= r.t && (Math.exp(r.a * (r.t - s)) * b(s) >= 0 ? y >= 0 && y <= Math.exp(r.a * (r.t - s)) * b(s) : y <= 0 && y >= Math.exp(r.a * (r.t - s)) * b(s)), { couleur: col.zone, pas: 2 });
        repInt.axes({ noms: ['s', ''] });
        repInt.trace(ts.map((s) => [s, b(s)]), { couleur: col.discret, largeur: 1.2, tirets: [5, 4] });
        repInt.trace(integrande, { couleur: col.accent, largeur: 2 });
        repInt.trace([[r.t, -1e3], [r.t, 1e3]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
      }

      // ---- Formule ----
      const p = decomposition(r.bm, r.a, r.x0, r.t);
      outils.rend(
        formule,
        `x(${latexNombreFixe(r.t, 2)}) = \\underbrace{e^{a t} x_0}_{${latexNombreFixe(p.libre, 3, 2)}} + \\underbrace{\\int_0^t e^{a(t - s)} b(s)\\,\\mathrm ds}_{${latexNombreFixe(p.forcee, 3, 2)}} = ${latexNombreFixe(p.total, 3, 2)}`,
      );
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champA.fixe(r.a);
        champX0.fixe(r.x0);
        champT.fixe(r.t);
        dessine();
      },
    };
  },
};
