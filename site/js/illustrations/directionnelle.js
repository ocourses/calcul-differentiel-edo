// Dérivées directionnelles sans différentiabilité (poly, chapitre
// « Applications différentiables », dérivée directionnelle). Le contre-exemple
// du poly : f(x) = 1 si x₂ = x₁² et x₁ ≠ 0, f(x) = 0 sinon. Toute droite
// passant par 0 ne rencontre la parabole qu'en un point t* = v₂/v₁², loin de 0 :
// t ↦ f(tv) est nulle près de 0, et D_v f(0) = 0 pour tout v. Pourtant f
// n'est pas continue en 0, puisqu'elle vaut 1 le long de la parabole. Pour
// comparer, une fonction dérivable, g(x) = sin x₁ + x₂², dont les dérivées
// directionnelles sont données par g'(0)·v = v₁.

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, glisse, paragraphe, toile, zoomable } from './commun.js';

const EPS = 1e-12;

export const FONCTIONS = {
  poly: {
    latex: 'f(x) = \\begin{cases} 1 & x_2 = x_1^2,\\ x_1 \\neq 0 \\\\ 0 & \\text{sinon} \\end{cases}',
    radio: '\\text{contre-exemple du poly}',
    f: ([a, b]) => (a !== 0 && Math.abs(b - a * a) < EPS ? 1 : 0),
    derivee: () => 0,
    derivable: false,
  },
  lisse: {
    latex: 'g(x) = \\sin x_1 + x_2^2',
    radio: 'g(x) = \\sin x_1 + x_2^2',
    f: ([a, b]) => Math.sin(a) + b * b,
    derivee: (v) => v[0],
    derivable: true,
  },
};

// Instant où la droite t ↦ tv rencontre la parabole x₂ = x₁², t ≠ 0 : t* = v₂/v₁²
// (aucun si v₁ = 0 ou v₂ = 0).
export function rencontre([v1, v2]) {
  if (Math.abs(v1) < EPS || Math.abs(v2) < EPS) return null;
  return v2 / (v1 * v1);
}

// Angle α (en degrés) de la direction v dont la droite coupe la parabole en t*,
// du côté de v₁ indiqué par `signe` : sin α = t* cos² α, soit, avec s = sin α,
// t* s² + s − t* = 0 et s = 2t*/(1 + √(1 + 4t*²)) (la racine de module ≤ 1).
export function directionDe(ts, signe = 1) {
  const sinus = (2 * ts) / (1 + Math.sqrt(1 + 4 * ts * ts));
  const al = Math.asin(sinus);
  return ((signe >= 0 ? al : Math.PI - al) * 180) / Math.PI;
}

// t ↦ f(tv) pour le contre-exemple, évalué exactement : 1 au seul point t*.
export function surLaDroite(cle, v, t) {
  if (cle === 'lisse') return FONCTIONS.lisse.f([t * v[0], t * v[1]]);
  const ts = rencontre(v);
  return ts !== null && Math.abs(t - ts) < EPS ? 1 : 0;
}

export default {
  etat: { fn: 'poly', alpha: 40 },

  choix: { fn: Object.keys(FONCTIONS) },

  termes: ['dérivée directionnelle', 'différentiable'],

  rappel: [
    '$f$ admet une dérivée directionnelle en $x$ dans la direction $v$ si $t \\mapsto f(x + tv)$ est dérivable en $t = 0$ :',
    '$$D_v f(x) = \\lim_{t \\to 0} \\frac{f(x + tv) - f(x)}{t}.$$',
    'Si $f$ est dérivable en $x$, toutes les dérivées directionnelles existent et $D_v f(x) = f\'(x)\\cdot v$ : elles dépendent linéairement de $v$.',
    'La réciproque est fausse. Contre-exemple du poly :',
    '$$f(x) = \\begin{cases} 1 & \\text{si } x_2 = x_1^2 \\text{ et } x_1 \\neq 0, \\\\ 0 & \\text{sinon.} \\end{cases}$$',
    'Pour tout $v$, $D_v f(0) = 0$ ; mais $f$ n’est même pas continue en $0$, car $f(x_1, x_1^2) = 1 \\not\\to 0$.',
  ],

  essais: [
    { texte: 'Faites tourner la direction $v$ : la droite coupe la parabole en un seul point $t^* = v_2/v_1^2$. Près de $t = 0$, $f(tv) = 0$.', etat: { fn: 'poly', alpha: 40 } },
    { texte: 'Rapprochez $v$ de l’horizontale ($\\alpha \\to 0$) : le point $t^*$ se rapproche de $0$, mais pour chaque $v$ il en reste séparé. $D_v f(0) = 0$ quand même.', etat: { fn: 'poly', alpha: 10 } },
    { texte: 'Le long de la parabole, $f$ vaut $1$ jusqu’en $0$ (exclu) : $f$ n’est pas continue en $0$, et le reste $|f(x) - f(0) - 0|/\\|x\\|$ explose.', etat: { fn: 'poly', alpha: 40 } },
    { texte: 'Comparez avec $g(x) = \\sin x_1 + x_2^2$ : $D_v g(0) = v_1 = \\cos\\alpha$ dépend linéairement de $v$, et le reste le long de la parabole tend vers $0$.', etat: { fn: 'lisse', alpha: 40 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'fn',
      options: Object.entries(FONCTIONS).map(([valeur, { radio }]) => ({ valeur, latex: radio })),
      change: (valeur) => {
        outils.change({ fn: valeur });
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    const cPlan = carte(grille, 'Le plan $(x_1, x_2)$ et la direction $v$');
    boutonInfo(cPlan, [
      ['ligne', '--accent', 'Pour le contre-exemple : la parabole $x_2 = x_1^2$ privée de $0$, où $f$ vaut $1$ ($f$ est nulle ailleurs). Pour $g$ : ses lignes de niveau.'],
      ['ligne', '--serie-1', 'La droite $t \\mapsto tv$, de direction $v = (\\cos\\alpha, \\sin\\alpha)$.'],
      ['point', '--perturbation', 'Le point $t^* v$ où la droite coupe la parabole.'],
      ['fleche', '--serie-1', 'Le vecteur $v$ : faites glisser sa pointe.'],
    ]);
    const canvas = toile(cPlan, '1 / 1', () => dessine());
    canvas.classList.add('saisissable');
    const CADRE = { x: [-1.6, 1.6], y: [-1.6, 1.6] };
    const rep = new Repere(canvas, { ...CADRE, egal: true });
    const barrePlan = document.createElement('div');
    barrePlan.className = 'barre-legende';
    cPlan.appendChild(barrePlan);
    const zoomPlan = zoomable(canvas, rep, { barre: barrePlan, auto: () => CADRE, redessine: () => dessine(), deplacer: false });
    glisse(canvas, rep, {
      deplace: (a, b) => {
        if (Math.hypot(a, b) < 1e-9) return;
        fixeAlpha((Math.atan2(b, a) * 180) / Math.PI);
      },
    });
    function fixeAlpha(alpha) {
      outils.change({ alpha: Math.round(alpha * 10) / 10 });
      champAlpha.fixe(r.alpha);
      dessine();
    }
    const champAlpha = champ(cPlan, { latex: '\\alpha', min: -180, max: 180, pas: 0.1, pasFleche: 5, valeur: r.alpha, unite: '°' }, (v) => {
      outils.change({ alpha: v });
      dessine();
    });

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cDroite = carte(colonne, 'Sur la droite : $t \\mapsto f(tv)$');
    boutonInfo(cDroite, [
      ['ligne', '--serie-1', 'La fonction $t \\mapsto f(tv)$ ; sa dérivée en $0$ est $D_v f(0)$.'],
      ['point', '--perturbation', 'Pour le contre-exemple, la seule valeur non nulle, en $t^*$ : faites-la glisser, la direction $v$ suit.'],
      ['tirets', '--texte', 'La droite de pente $D_v f(0)$ en $t = 0$.'],
    ]);
    const canvasDroite = toile(cDroite, '16 / 8', () => dessine());
    const repDroite = new Repere(canvasDroite, { x: [-1.5, 1.5], y: [-0.4, 1.4] });
    // On saisit t* et on le déplace : la direction v est celle dont la droite
    // coupe la parabole là (t* ≠ 0, du même côté de l'axe vertical que v).
    glisse(canvasDroite, repDroite, {
      prend: () => r.fn === 'poly',
      deplace: (t) => {
        if (Math.abs(t) < 0.02) return;
        fixeAlpha(directionDe(t, Math.cos((r.alpha * Math.PI) / 180)));
      },
    });
    canvasDroite.classList.add('saisissable');
    const noteDroite = paragraphe(cDroite, '', 'note conclusion-fixe');

    const cParabole = carte(colonne, 'Le long de la parabole $x = (s, s^2)$');
    boutonInfo(cParabole, [
      ['ligne', '--accent', 'Le reste $|f(x) - f(0) - L\\cdot x| / \\|x\\|$, avec $L$ l’application linéaire candidate, $L\\cdot v = D_v f(0)$, en échelle log-log selon $s$.'],
    ]);
    const canvasPar = toile(cParabole, '16 / 8', () => dessine());
    const repPar = new Repere(canvasPar, { x: [-5, 0], y: [-6, 6] });
    const notePar = paragraphe(cParabole, '', 'note conclusion-fixe');

    function dessine() {
      const col = couleurs();
      const F = FONCTIONS[r.fn];
      choix.fixe(r.fn);
      const al = (r.alpha * Math.PI) / 180;
      const v = [Math.cos(al), Math.sin(al)];
      const ts = r.fn === 'poly' ? rencontre(v) : null;

      // ---- Plan ----
      const cadre = zoomPlan.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        rep.axes({ noms: ['x₁', 'x₂'] });
        if (r.fn === 'poly') {
          const [x1, x2] = cadre.x;
          rep.trace(Array.from({ length: 801 }, (_, k) => x1 + ((x2 - x1) * k) / 800).map((s) => [s, s * s]), { couleur: col.accent, largeur: 3 });
          rep.point(0, 0, { rayon: 5, couleur: col.accent, plein: false });
        } else {
          for (const c of [-1, -0.5, 0, 0.5, 1, 1.5, 2]) rep.isoligne((a, b) => F.f([a, b]), c, { couleur: col.accent, largeur: 1 });
        }
        rep.droite(0, 0, v[0], v[1], { couleur: col.series[0], largeur: 1.4 });
        // Le vecteur v garde à l'écran une longueur lisible quel que soit le zoom.
        const l = Math.min(cadre.x[1] - cadre.x[0], cadre.y[1] - cadre.y[0]) / 3.2;
        const w = [l * v[0], l * v[1]];
        rep.trace([[0, 0], w], { couleur: col.series[0], largeur: 2.5 });
        rep.pointe(w[0], w[1], v[0], v[1], { couleur: col.series[0], taille: 10 });
        if (ts !== null) rep.point(ts * v[0], ts * v[1], { rayon: 5, couleur: col.perturbation });
      }

      // ---- Sur la droite ----
      const D = F.derivee(v);
      if (repDroite.prepare()) {
        repDroite.axes({ noms: ['t', ''] });
        const pts = Array.from({ length: 601 }, (_, k) => -1.5 + (3 * k) / 600).map((t) => [t, surLaDroite(r.fn, v, t)]);
        repDroite.trace(pts, { couleur: col.series[0], largeur: 2.2 });
        if (ts !== null && Math.abs(ts) <= 1.5) repDroite.point(ts, 1, { rayon: 5, couleur: col.perturbation });
        repDroite.droite(0, surLaDroite(r.fn, v, 0), 1, D, { couleur: col.trait, largeur: 1.2, tirets: [6, 4] });
      }
      outils.rendTexte(
        noteDroite,
        r.fn === 'poly'
          ? `$D_v f(0) = 0$ : $f(tv) = 0$ pour $|t| < ${ts === null ? '+\\infty' : latexNombreFixe(Math.abs(ts), 2)}$${ts === null ? ' (la droite ne coupe pas la parabole)' : ''}.`
          : `$D_v g(0) = g'(0)\\cdot v = v_1 = ${latexNombreFixe(D, 3)}$.`,
      );

      // ---- Le long de la parabole ----
      const ss = Array.from({ length: 301 }, (_, k) => -5 + (5 * k) / 300);
      const pts = ss.map((ls) => {
        const s = 10 ** ls;
        const x = [s, s * s];
        const L = F.derivee(x); // L·x = D_x f(0), linéaire en x
        return [ls, Math.log10(Math.max(Math.abs(F.f(x) - F.f([0, 0]) - L) / Math.hypot(...x), 1e-16))];
      });
      if (repPar.prepare()) {
        repPar.axes({ noms: [[['log₁₀ ', false], ['s', true]], [['log₁₀ reste/‖x‖', false]]], nomsAuBord: true, enL: true });
        repPar.trace(pts, { couleur: col.accent, largeur: 2 });
      }
      outils.rendTexte(
        notePar,
        r.fn === 'poly' ? 'Le reste vaut $1/\\|x\\|$ et tend vers $+\\infty$ : $f$ n’est pas dérivable en $0$.' : 'Le reste tend vers $0$ : $g$ est dérivable en $0$, de différentielle $g\'(0)\\cdot v = v_1$.',
      );
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champAlpha.fixe(r.alpha);
        zoomPlan.reinitialise();
        dessine();
      },
    };
  },
};
