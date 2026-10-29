// Le pendule simple, qu'on attrape (poly, chapitre « Flot », orbites et
// portraits de phase) : θ̈ = −ω² sin θ, soit ẋ₁ = x₂, ẋ₂ = −ω² sin x₁. On
// saisit le pendule à la souris et on le lâche : la vitesse du geste donne la
// vitesse initiale. Son point (θ, θ̇) parcourt une orbite du portrait de phase :
// un équilibre, une oscillation (orbite périodique) ou une rotation, séparées
// par les séparatrices. L'énergie E = θ̇²/2 − ω² cos θ est constante le long des
// orbites. En option, le pendule linéarisé (sin θ ≈ θ), dont la période ne
// dépend pas de l'amplitude.

import { rk4 } from '../../socle/js/core/ode.js';
import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { boutonInfo, carte, champsPoint, glisse, paragraphe, toile } from './commun.js';

export const champPendule = (w2, lineaire = false) => (t, [th, om]) => [om, -w2 * (lineaire ? th : Math.sin(th))];

// Énergie (par unité de m l²) : constante le long des orbites.
export const energie = ([th, om], w2, lineaire = false) => (om * om) / 2 + (lineaire ? (w2 * th * th) / 2 : -w2 * Math.cos(th));

// Angle ramené dans [−π, π[.
export const ramene = (th) => th - 2 * Math.PI * Math.floor((th + Math.PI) / (2 * Math.PI));

// Nature de l'orbite de x = (θ, θ̇) : les cols (±π, 0) ont l'énergie ω², le
// puits (0, 0) l'énergie −ω².
export function nature(x, w2, tol = 1e-3) {
  const E = energie(x, w2);
  const th = ramene(x[0]);
  if (Math.abs(E + w2) < tol * w2) return 'equilibre-bas';
  if (Math.abs(E - w2) < tol * w2) return Math.abs(Math.abs(th) - Math.PI) < 1e-3 && Math.abs(x[1]) < 1e-3 ? 'equilibre-haut' : 'separatrice';
  return E < w2 ? 'oscillation' : 'rotation';
}

// Moyenne arithmético-géométrique, pour l'intégrale elliptique complète
// K(k) = π / (2 AGM(1, √(1 − k²))).
export function agm(a, b) {
  for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15 * a; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return a;
}

// Période d'une oscillation d'amplitude θ_max : T = 4 K(sin(θ_max/2)) / ω ; elle
// tend vers 2π/ω pour les petites amplitudes et vers +∞ près de la séparatrice.
export function periode(thetaMax, w2) {
  const k = Math.sin(thetaMax / 2);
  if (k >= 1) return Infinity;
  return (2 * Math.PI) / (agm(1, Math.sqrt(1 - k * k)) * Math.sqrt(w2));
}

// Amplitude de l'oscillation d'énergie E < ω² : cos θ_max = −E/ω².
export const amplitude = (E, w2) => Math.acos(Math.max(-1, Math.min(1, -E / w2)));

const NATURES = {
  'equilibre-bas': 'Point d’équilibre stable : le pendule au repos, en bas.',
  'equilibre-haut': 'Point d’équilibre instable : le pendule à la verticale, tête en haut.',
  oscillation: 'Oscillation : une orbite périodique, fermée autour de $(0, 0)$.',
  rotation: 'Rotation : le pendule fait des tours complets, $\\theta$ croît (ou décroît) sans fin.',
  separatrice: 'Séparatrice : le pendule tend vers la position haute sans l’atteindre.',
};

const CADRE = { x: [-3.7, 3.7], y: [-7.5, 7.5] };
const H = 0.004; // pas d'intégration (s)
const T_MAX = 60; // durée du mouvement (s)

export default {
  etat: { th: 2, om: 0, w2: 9.81, lineaire: false },

  termes: ['orbite périodique', 'portrait de phase', 'séparatrice', 'point d’équilibre', 'orbite', 'autonome'],

  rappel: [
    'Le pendule simple, d’angle $\\theta$ : $\\ddot\\theta = -\\omega^2 \\sin\\theta$ avec $\\omega^2 = g/l$. Avec $x_1 = \\theta$ et $x_2 = \\dot\\theta$, c’est le système autonome',
    '$$\\dot x_1 = x_2, \\qquad \\dot x_2 = -\\omega^2 \\sin x_1.$$',
    'Les orbites partitionnent le plan $(x_1, x_2)$ : c’est le portrait de phase. On y trouve les trois types d’orbites :',
    [
      'des points d’équilibre, $f(x) = 0$ : $(0, 0)$ et $(\\pm\\pi, 0)$ ;',
      'des courbes fermées : les orbites périodiques, ici les oscillations ;',
      'des courbes ouvertes : les rotations, et les séparatrices qui relient les équilibres hauts.',
    ],
    'Si $\\theta$ est petit, $\\sin\\theta \\approx \\theta$ et l’équation devient linéaire :',
    '$$\\dot x = \\begin{pmatrix} 0 & 1 \\\\ -\\omega^2 & 0 \\end{pmatrix} x.$$',
    'L’énergie $E = \\tfrac12 \\dot\\theta^2 - \\omega^2 \\cos\\theta$ est constante le long d’une orbite : les orbites sont ses lignes de niveau.',
  ],

  essais: [
    { texte: 'Saisissez le pendule, écartez-le et lâchez-le sans élan : son point parcourt une orbite fermée. Lancez-le d’un geste plus vif : il fait des tours.', etat: { th: 1.2, om: 0, lineaire: false } },
    { texte: 'Petite oscillation : le pendule et son linéarisé restent ensemble, et la période vaut presque $2\\pi/\\omega$.', etat: { th: 0.25, om: 0, lineaire: true } },
    { texte: 'Grande oscillation : la période du pendule dépasse nettement celle du linéarisé, qui ne dépend pas de l’amplitude.', etat: { th: 2.6, om: 0, lineaire: true } },
    { texte: 'Lâchez-le presque à la verticale : il y reste longtemps avant de retomber. Le temps de parcours de l’orbite tend vers $+\\infty$ près de la séparatrice.', etat: { th: 3.1, om: 0, lineaire: false } },
    { texte: 'Juste au-dessus de la séparatrice, $\\dot\\theta_0 = 2\\omega$ depuis la position basse : il monte jusqu’en haut et y ralentit à l’extrême.', etat: { th: 0, om: 6.3, lineaire: false } },
    { texte: 'Cliquez dans le portrait de phase : le pendule part de ce point. Deux orbites peuvent-elles se croiser ?', etat: { th: -1, om: 3, lineaire: false } },
  ],

  monte(zone, outils) {
    const r = outils.etat;
    // État courant du pendule et de son linéarisé ; la condition initiale est dans r.
    let x = [r.th, r.om];
    let xLin = [r.th, r.om];
    let t = 0;
    let enMarche = !outils.mouvementReduit;
    let tenu = false;
    let trace = [];

    const grille = document.createElement('div');
    grille.className = 'grille-2 principale';
    zone.appendChild(grille);

    // ---- Scène -------------------------------------------------------------------------------------
    const cScene = carte(grille, 'Le pendule');
    boutonInfo(cScene, [
      ['ligne', '--texte', 'Le pendule : saisissez la masse, déplacez-la et lâchez-la. La vitesse du geste donne $\\dot\\theta_0$.'],
      ['tirets', '--discret', 'Le pendule linéarisé, $\\ddot\\theta = -\\omega^2 \\theta$, parti du même point.'],
      ['point', '--perturbation', 'La position de départ.'],
    ]);
    const canvasScene = toile(cScene, '1 / 1', () => dessine());
    canvasScene.classList.add('saisissable');
    const repScene = new Repere(canvasScene, { x: [-1.35, 1.35], y: [-1.35, 1.35], egal: true, marges: { gauche: 4, bas: 4, haut: 4, droite: 4 } });
    const barreScene = document.createElement('div');
    barreScene.className = 'barre-legende';
    cScene.appendChild(barreScene);
    const temps = document.createElement('span');
    temps.className = 'note';
    const boutons = document.createElement('div');
    boutons.className = 'zoom';
    boutons.innerHTML = '<button type="button" data-action="lecture"></button><button type="button" data-action="relance">Relancer</button>';
    barreScene.append(temps, boutons);
    const boutonLecture = boutons.querySelector('[data-action="lecture"]');
    boutons.addEventListener('click', (ev) => {
      const action = ev.target.closest('button')?.dataset.action;
      if (action === 'lecture' && !enMarche && t >= T_MAX - 1e-9) part(r.th, r.om);
      if (action === 'lecture') enMarche = !enMarche;
      if (action === 'relance') {
        part(r.th, r.om);
        enMarche = true;
      }
      dessine();
    });

    // Saisie de la masse : l'angle suit le pointeur ; au lâcher, la vitesse
    // angulaire est celle du geste sur les 80 dernières millisecondes.
    let historique = [];
    glisse(canvasScene, repScene, {
      prend: () => {
        tenu = true;
        historique = [];
        return true;
      },
      deplace: (px, py) => {
        const th = Math.atan2(px, -py);
        const maintenant = performance.now();
        historique.push([maintenant, th]);
        historique = historique.filter(([s]) => maintenant - s < 80);
        part(Number(th.toFixed(3)), 0);
        dessine();
      },
      relache: () => {
        tenu = false;
        let om = 0;
        if (historique.length >= 2) {
          const [s0, a0] = historique[0];
          const [s1, a1] = historique[historique.length - 1];
          let d = a1 - a0;
          d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
          if (s1 > s0) om = Math.max(-12, Math.min(12, (d / (s1 - s0)) * 1000));
        }
        part(x[0], Number(om.toFixed(3)));
        enMarche = true;
        dessine();
      },
    });

    // ---- Portrait de phase --------------------------------------------------------------------------
    const cPhase = carte(grille, 'Portrait de phase $(\\theta, \\dot\\theta)$');
    boutonInfo(cPhase, [
      ['fleche', '--discret', 'Le champ de vecteurs $f(x) = (x_2, -\\omega^2 \\sin x_1)$.'],
      ['ligne', '--discret', 'Des orbites : oscillations fermées, rotations en haut et en bas.'],
      ['ligne', '--texte', 'Les séparatrices, d’énergie $\\omega^2$ : elles relient les équilibres hauts.'],
      ['ligne', '--accent', 'L’orbite du pendule, et le point $(\\theta(t), \\dot\\theta(t))$ qui la parcourt.'],
      ['tirets', '--accent', 'Celle du linéarisé : une ellipse.'],
      ['point', '--equilibre', 'L’équilibre stable $(0, 0)$, pendule en bas.'],
      ['cercle', '--equilibre', 'Les équilibres instables $(\\pm\\pi, 0)$, pendule en haut.'],
      ['point', '--perturbation', 'La condition initiale : cliquez pour lancer le pendule de ce point.'],
    ]);
    const canvasPhase = toile(cPhase, '1 / 1', () => dessine());
    canvasPhase.classList.add('cliquable');
    const repPhase = new Repere(canvasPhase, CADRE);
    glisse(canvasPhase, repPhase, {
      deplace: (th, om) => {
        tenu = true;
        part(Number(th.toFixed(3)), Number(om.toFixed(3)));
        dessine();
      },
      relache: () => {
        tenu = false;
        enMarche = true;
      },
    });

    // ---- Réglages et mesures ----------------------------------------------------------------------
    const cMesures = carte(zone);
    const reglages = document.createElement('div');
    reglages.className = 'reglages-2';
    cMesures.appendChild(reglages);
    const champW2 = champ(reglages, { latex: '\\omega^2', min: 1, max: 20, pas: 0.01, pasFleche: 0.5, valeur: r.w2 }, (v) => {
      outils.change({ w2: v });
      part(r.th, r.om);
      dessine();
    });
    const caseLin = document.createElement('label');
    caseLin.className = 'case';
    reglages.appendChild(caseLin);
    const entreeLin = document.createElement('input');
    Object.assign(entreeLin, { type: 'checkbox', name: 'lineaire' });
    const libelleLin = document.createElement('span');
    outils.rendTexte(libelleLin, ' comparer au pendule linéarisé ($\\sin\\theta \\approx \\theta$)');
    caseLin.replaceChildren(entreeLin, libelleLin);
    entreeLin.addEventListener('change', () => {
      outils.change({ lineaire: entreeLin.checked });
      part(r.th, r.om);
      dessine();
    });
    // La condition initiale au clavier aussi : elle relance le pendule.
    const depart = champsPoint(
      cMesures,
      [
        { latex: '\\theta_0', min: -Math.PI, max: Math.PI },
        { latex: '\\dot\\theta_0', min: -8, max: 8 },
      ],
      [r.th, r.om],
      ([th, om]) => {
        part(th, om);
        enMarche = !outils.mouvementReduit;
        dessine();
      },
    );
    const mesures = document.createElement('div');
    mesures.className = 'formule';
    cMesures.appendChild(mesures);
    const natureTexte = paragraphe(cMesures, '', 'note conclusion-fixe');

    // Nouveau départ de (θ₀, θ̇₀) : il devient la condition initiale du lien.
    function part(th, om) {
      outils.change({ th, om });
      x = [th, om];
      xLin = [th, om];
      t = 0;
      depart.fixe([th, om]);
      trace = [];
    }

    // ---- Dessin -------------------------------------------------------------------------------------
    function dessine() {
      const col = couleurs();
      const w2 = r.w2;
      entreeLin.checked = r.lineaire;
      boutonLecture.textContent = enMarche ? 'Pause' : 'Lecture';
      boutonLecture.setAttribute('aria-label', enMarche ? 'Mettre en pause' : 'Lancer le mouvement');
      // Espaces de chiffre : « t =  9,99 s » a la largeur de « t = 59,99 s ».
      temps.textContent = `t = ${t.toFixed(2).replace('.', ',').padStart(5, '\u2007')} s`;

      // ---- Scène ----
      if (repScene.prepare()) {
        const tige = (th, couleur, tirets = []) => {
          const [bx, by] = [Math.sin(th), -Math.cos(th)];
          repScene.trace([[0, 0], [bx, by]], { couleur, largeur: 3, tirets });
          return [bx, by];
        };
        // Cercle parcouru par la masse, et position de départ.
        repScene.trace(Array.from({ length: 121 }, (_, k) => [Math.cos((k * Math.PI) / 60), Math.sin((k * Math.PI) / 60)]), { couleur: col.grille, largeur: 1 });
        repScene.point(Math.sin(r.th), -Math.cos(r.th), { rayon: 5, couleur: col.perturbation });
        if (r.lineaire) {
          const [bx, by] = tige(xLin[0], col.discret, [6, 5]);
          repScene.point(bx, by, { rayon: 13, couleur: col.discret, plein: false });
        }
        const [bx, by] = tige(x[0], col.trait);
        repScene.point(bx, by, { rayon: 14, couleur: col.accent });
        repScene.point(0, 0, { rayon: 4, couleur: col.trait });
      }

      // ---- Portrait de phase ----
      if (repPhase.prepare()) {
        repPhase.axes({ noms: ['θ', 'θ̇'] });
        repPhase.champ((th, om) => [om, -w2 * Math.sin(th)], { n: 17 });
        for (const E of [-0.75, -0.4, 0, 0.45, 1.6, 2.6, 4]) repPhase.isoligne((a, b) => energie([a, b], w2) / w2, E, { couleur: col.discret, largeur: 1 });
        repPhase.isoligne((a, b) => energie([a, b], w2) / w2, 1, { couleur: col.trait, largeur: 1.6, n: 160 });
        if (r.lineaire) {
          // Le linéarisé : l'ellipse θ = A cos(ωt + φ), θ̇ = −Aω sin(ωt + φ).
          const w = Math.sqrt(w2);
          const A = Math.hypot(r.th, r.om / w);
          const ellipse = Array.from({ length: 241 }, (_, k) => [A * Math.cos((k * Math.PI) / 120), -A * w * Math.sin((k * Math.PI) / 120)]);
          repPhase.trace(ellipse, { couleur: col.accent, largeur: 1.4, tirets: [6, 4] });
        }
        repPhase.isoligne((a, b) => energie([a, b], w2), energie([r.th, r.om], w2), { couleur: col.accent, largeur: 2, n: 160 });
        // Sillage du point (θ ramené dans [−π, π[ ; on coupe au passage de ±π).
        repPhase.trace(trace, { couleur: col.accent, largeur: 3.5, alpha: 0.5 });
        repPhase.point(0, 0, { rayon: 5, couleur: col.equilibre });
        for (const s of [-1, 1]) repPhase.point(s * Math.PI, 0, { rayon: 5, couleur: col.equilibre, plein: false });
        repPhase.point(ramene(r.th), r.om, { rayon: 5, couleur: col.perturbation });
        if (r.lineaire) repPhase.point(xLin[0], xLin[1], { rayon: 4, couleur: col.discret });
        repPhase.point(ramene(x[0]), x[1], { rayon: 6, couleur: col.accent });
      }

      // ---- Mesures ----
      const x0 = [r.th, r.om];
      const E = energie(x0, w2);
      const n = nature(x0, w2);
      const T = n === 'oscillation' ? periode(amplitude(E, w2), w2) : n === 'separatrice' ? Infinity : null;
      const TLin = (2 * Math.PI) / Math.sqrt(w2);
      const periodeLatex = T === null ? '\\text{—}' : T === Infinity ? '+\\infty' : latexNombreFixe(T, 3, 2);
      outils.rend(
        mesures,
        `E = \\tfrac12 \\dot\\theta^2 - \\omega^2 \\cos\\theta = ${latexNombreFixe(E, 2, 2)}, \\qquad T = ${periodeLatex}${r.lineaire ? `, \\qquad T_{\\text{lin}} = 2\\pi/\\omega = ${latexNombreFixe(TLin, 3, 2)}` : ''}`,
      );
      outils.rendTexte(natureTexte, NATURES[n]);
      outils.glossaire(natureTexte, ['point d’équilibre', 'orbite périodique', 'séparatrice']);
    }

    // ---- Animation : temps réel, RK4 à petit pas ----------------------------------------------------------
    // Le mouvement s'arrête à T_MAX : le temps affiché garde deux chiffres
    // entiers (WEB5) ; « Lecture » repart alors du départ.
    let avant = null;
    function anime(maintenant) {
      if (enMarche && !tenu) {
        const dt = avant === null ? 0 : Math.min(0.05, (maintenant - avant) / 1000, T_MAX - t);
        const F = champPendule(r.w2);
        const FLin = champPendule(r.w2, true);
        for (let s = 0; s < dt - 1e-12; s += H) {
          const h = Math.min(H, dt - s);
          x = rk4(F, t, x, h);
          xLin = rk4(FLin, t, xLin, h);
          t += h;
        }
        if (t >= T_MAX - 1e-9) enMarche = false;
        const p = [ramene(x[0]), x[1]];
        const dernier = trace[trace.length - 1];
        if (dernier && Math.abs(dernier[0] - p[0]) > Math.PI) trace.push([NaN, NaN]);
        trace.push(p);
        if (trace.length > 90) trace.shift();
        dessine();
      }
      avant = maintenant;
      requestAnimationFrame(anime);
    }
    requestAnimationFrame(anime);

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champW2.fixe(r.w2);
        part(r.th, r.om);
        enMarche = !outils.mouvementReduit;
        dessine();
      },
    };
  },
};
