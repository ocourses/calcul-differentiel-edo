// Schémas implicites (poly, chapitre « Intégration numérique », méthodes de
// Runge-Kutta implicites). Le poly part du schéma
//   x₁ = x₀ + h f(t₀ + αh, x₀ + β(x₁ − x₀)),
// soit, avec k = (x₁ − x₀)/h, l'équation k = G(k) := f(t₀ + αh, x₀ + βh k) :
// β = 0 donne Euler explicite, β = 1/2 le point milieu, β = 1 Euler implicite.
// Chaque pas demande de résoudre cette équation : par point fixe
// (k⁽ᵐ⁺¹⁾ = G(k⁽ᵐ⁾), en toile d'araignée), qui converge si h L β < 1 (théorème
// du poly), ou par Newton sur F(k) = k − G(k). En complément, hors poly : sur
// un problème raide, le pas qu'Euler explicite ne tolère pas.

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, legende, paragraphe, repliable, tableau, toile } from './commun.js';

// Le problème d'un pas : ẋ = −λ x³, x₀ = 1 (autonome : α ne joue pas).
export const f = (x, lambda) => -lambda * x * x * x;
export const fx = (x, lambda) => -3 * lambda * x * x;

export const G = (k, { h, beta, lambda }) => f(1 + beta * h * k, lambda);
export const dG = (k, { h, beta, lambda }) => beta * h * fx(1 + beta * h * k, lambda);

// Itérées de la méthode choisie, à partir de k⁽⁰⁾ = f(x₀) (la pente explicite).
export function iterations(methode, p, M = 12) {
  const ks = [f(1, p.lambda)];
  for (let m = 0; m < M; m++) {
    const k = ks[m];
    let suivant;
    if (methode === 'point-fixe') suivant = G(k, p);
    else {
      // Newton sur F(k) = k − G(k) : F'(k) = 1 − G'(k).
      const d = 1 - dG(k, p);
      suivant = Math.abs(d) < 1e-14 ? NaN : k - (k - G(k, p)) / d;
    }
    if (!Number.isFinite(suivant) || Math.abs(suivant) > 1e6) break;
    ks.push(suivant);
  }
  return ks;
}

// Solution exacte de k = G(k) par dichotomie sur F(k) = k − G(k), croissante
// quand β ≥ 0 (G est décroissante en k) : une seule racine.
export function racine(p) {
  let [a, b] = [-1e3, 1e3];
  const F = (k) => k - G(k, p);
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (F(m) > 0) b = m;
    else a = m;
  }
  return (a + b) / 2;
}

// ---- Complément : problème raide ẋ = μ(x − cos t) − sin t, solution exacte
// cos t + e^{μt}(x₀ − 1). Euler explicite et implicite (linéaire : résolu exactement).
export const raideExacte = (t, mu, x0) => Math.cos(t) + Math.exp(mu * t) * (x0 - 1);
export function raide(schema, mu, h, T = 4, x0 = 1.5) {
  const pts = [[0, x0]];
  const N = Math.round(T / h);
  for (let i = 0; i < N; i++) {
    const [t, x] = pts[i];
    const t1 = t + h;
    const suivant = schema === 'explicite' ? x + h * (mu * (x - Math.cos(t)) - Math.sin(t)) : (x + h * (-mu * Math.cos(t1) - Math.sin(t1))) / (1 - h * mu);
    pts.push([t1, suivant]);
  }
  return pts;
}

export default {
  etat: { methode: 'point-fixe', h: 0.3, beta: 1, lambda: 1, mu: -20, hr: 0.08 },

  choix: { methode: ['point-fixe', 'newton'] },

  preferences: { complement: false },

  termes: ['implicite', 'contractante', 'schéma d’Euler', 'lipschitzienne'],

  rappel: [
    'Le poly approche $\\int_{t_0}^{t_1} f(t, x(t))\\,\\mathrm dt$ par $h\\,f(t_0 + \\alpha h, x_0 + \\beta(x_1 - x_0))$, d’où le schéma',
    '$$x_1 = x_0 + h\\,f\\big(t_0 + \\alpha h,\\ x_0 + \\beta (x_1 - x_0)\\big).$$',
    'Si $\\beta \\neq 0$, ce n’est pas une formule mais une équation en $x_1$ : la méthode est implicite. $\\alpha = \\beta = 0$ donne le schéma d’Euler explicite, $\\alpha = \\beta = 1$ Euler implicite, $\\alpha = \\beta = 1/2$ le point milieu.',
    'Avec $k = (x_1 - x_0)/h$, il faut résoudre',
    '$$k = G(k) = f(t_0 + \\alpha h,\\ x_0 + \\beta h\\,k).$$',
    'Si $f$ est $L$-lipschitzienne en $x$ et $h < 1/(L \\max_i \\sum_j |a_{ij}|)$, ici $h L \\beta < 1$, $G$ est contractante : le point fixe existe, il est unique, et les itérées $k^{(m+1)} = G(k^{(m)})$ y convergent. La méthode de Newton est préférable.',
    'L’exemple de la page, $f(x) = -\\lambda x^3$, n’est pas globalement lipschitzien : on y lit la version locale de ce critère, $|G\'(k^*)| < 1$ au point fixe, qui suffit pour que les itérées convergent en partant assez près.',
  ],

  essais: [
    { texte: 'Euler implicite ($\\beta = 1$), $h = 0{,}3$ : le point fixe converge, en spirale autour de la solution. Comptez les itérations pour atteindre $10^{-6}$.', etat: { methode: 'point-fixe', h: 0.3, beta: 1, lambda: 1 } },
    { texte: 'Augmentez $h$ jusqu’à $0{,}8$ : $|G\'(k^*)| > 1$, le point fixe diverge alors que l’équation a toujours une solution. Passez à Newton.', etat: { methode: 'point-fixe', h: 0.8, beta: 1, lambda: 1 } },
    { texte: 'Newton : le nombre de chiffres justes double à chaque itération (convergence quadratique), même là où le point fixe diverge.', etat: { methode: 'newton', h: 0.8, beta: 1, lambda: 1 } },
    { texte: 'Prenez $\\beta = 0$ : $G$ est constante, une seule itération suffit. C’est Euler explicite.', etat: { methode: 'point-fixe', h: 0.3, beta: 0, lambda: 1 } },
    { texte: 'Point milieu ($\\beta = 1/2$), $h = 0{,}8$ : là où Euler implicite faisait diverger le point fixe, il converge, car $G\'$ est multiplié par $\\beta$.', etat: { methode: 'point-fixe', h: 0.8, beta: 0.5, lambda: 1 } },
    { texte: 'Dépliez le complément : sur un problème raide, la solution rejoint $\\cos t$ en un temps de l’ordre de $1/|\\mu|$, et Euler explicite explose dès que $h|\\mu| > 2$, Euler implicite non.', etat: { mu: -20, hr: 0.12 }, preferences: { complement: true } },
  ],

  monte(zone, outils) {
    const r = outils.etat;
    const prefs = outils.preferences;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'methode',
      options: [
        { valeur: 'point-fixe', texte: 'point fixe' },
        { valeur: 'newton', texte: 'méthode de Newton' },
      ],
      change: (valeur) => {
        outils.change({ methode: valeur });
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    const cToile = carte(grille, 'Résoudre $k = G(k)$ pour un pas de $\\dot x = -\\lambda x^3$, $x_0 = 1$');
    boutonInfo(cToile, [
      ['ligne', '--accent', 'Le graphe de $G(k) = f(x_0 + \\beta h\\,k)$.'],
      ['tirets', '--texte', 'La diagonale $y = k$ : le point fixe est à l’intersection.'],
      ['ligne', '--serie-1', 'Les itérations : en escalier ou en spirale pour le point fixe, par les tangentes au graphe de $F(k) = k - G(k)$ pour Newton.'],
      ['point', '--perturbation', 'Le départ $k^{(0)} = f(x_0)$, la pente explicite.'],
      ['point', '--equilibre', 'La solution $k^*$.'],
    ]);
    const canvas = toile(cToile, '1 / 1', () => dessine());
    const rep = new Repere(canvas, { x: [-3, 1], y: [-3, 1], egal: true });

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cReg = carte(colonne, 'Le pas');
    const champs = {
      h: champ(cReg, { latex: 'h', min: 0.01, max: 1, pas: 0.01, pasFleche: 0.05, valeur: r.h }, (v) => {
        outils.change({ h: v });
        dessine();
      }),
      beta: champ(cReg, { latex: '\\beta', min: 0, max: 1, pas: 0.01, pasFleche: 0.25, valeur: r.beta }, (v) => {
        outils.change({ beta: v });
        dessine();
      }),
      lambda: champ(cReg, { latex: '\\lambda', min: 0.1, max: 5, pas: 0.1, valeur: r.lambda }, (v) => {
        outils.change({ lambda: v });
        dessine();
      }),
    };
    const formule = document.createElement('div');
    formule.className = 'formule';
    cReg.appendChild(formule);
    const verdict = paragraphe(cReg, '', 'note conclusion-fixe');
    const cTable = carte(colonne, 'Itérations');
    const zoneTable = document.createElement('div');
    cTable.appendChild(zoneTable);

    // ---- Complément : raideur ---------------------------------------------------------------------
    const comp = repliable(zone, 'Complément, hors poly : pourquoi un schéma implicite ?', {
      ouvert: prefs.valeurs.complement,
      change: (ouvert) => {
        prefs.change({ complement: ouvert });
        dessine();
      },
    });
    // Déplié, il passe par-dessus les figures au lieu de leur prendre de la hauteur.
    comp.carte.classList.add('superpose');
    const grilleComp = document.createElement('div');
    grilleComp.className = 'grille-2';
    comp.contenu.appendChild(grilleComp);
    const zoneRaide = document.createElement('div');
    zoneRaide.className = 'colonne';
    grilleComp.appendChild(zoneRaide);
    const canvasRaide = toile(zoneRaide, '16 / 7', () => dessine());
    const repRaide = new Repere(canvasRaide, { x: [0, 4], y: [-2, 2] });
    const reglagesRaide = document.createElement('div');
    grilleComp.appendChild(reglagesRaide);
    const champMu = champ(reglagesRaide, { latex: '\\mu', min: -50, max: -1, pas: 1, valeur: r.mu }, (v) => {
      outils.change({ mu: v });
      dessine();
    });
    const champHr = champ(reglagesRaide, { latex: 'h', min: 0.01, max: 0.5, pas: 0.005, pasFleche: 0.01, valeur: r.hr }, (v) => {
      outils.change({ hr: v });
      dessine();
    });
    const texteRaide = paragraphe(reglagesRaide, '', 'note');
    const legendeRaide = document.createElement('div');
    zoneRaide.appendChild(legendeRaide);

    function dessine() {
      const col = couleurs();
      choix.fixe(r.methode);
      const p = { h: r.h, beta: r.beta, lambda: r.lambda };
      const ks = iterations(r.methode, p);
      const kEtoile = racine(p);
      const derivee = dG(kEtoile, p);

      // ---- Toile d'araignée ou tangentes de Newton ----
      const centre = kEtoile;
      const R = Math.max(1.5, 1.3 * Math.max(...ks.map((k) => Math.abs(k - centre)).filter(Number.isFinite).map((v) => Math.min(v, 6))));
      rep.fixeCadre([centre - R, centre + R], [centre - R, centre + R]);
      if (rep.prepare()) {
        rep.axes({ noms: ['k', 'y'] });
        const [a, b] = rep.cadre.x;
        const xs = Array.from({ length: 401 }, (_, i) => a + ((b - a) * i) / 400);
        rep.trace([[a, a], [b, b]], { couleur: col.trait, largeur: 1.2, tirets: [6, 4] });
        rep.trace(xs.map((k) => [k, G(k, p)]), { couleur: col.accent, largeur: 2.2 });
        const chemin = [];
        if (r.methode === 'point-fixe') {
          // Escalier : (k_m, k_m) → (k_m, G(k_m)) → (G(k_m), G(k_m)).
          chemin.push([ks[0], ks[0]]);
          for (let m = 0; m + 1 < ks.length; m++) chemin.push([ks[m], ks[m + 1]], [ks[m + 1], ks[m + 1]]);
          rep.trace(chemin, { couleur: col.series[0], largeur: 1.6 });
        } else {
          // Newton : la tangente au graphe de G en k_m coupe la diagonale en k_{m+1}.
          for (let m = 0; m + 1 < ks.length; m++) {
            const [k, g, d] = [ks[m], G(ks[m], p), dG(ks[m], p)];
            rep.trace([[k, k], [k, g], [ks[m + 1], g + d * (ks[m + 1] - k)]], { couleur: col.series[0], largeur: 1.6 });
          }
        }
        for (const k of ks) rep.point(k, k, { rayon: 3, couleur: col.series[0] });
        rep.point(ks[0], ks[0], { rayon: 5, couleur: col.perturbation });
        rep.point(kEtoile, kEtoile, { rayon: 5, couleur: col.equilibre });
      }

      outils.rend(formule, `G'(k^*) = \\beta h\\,f'(x_0 + \\beta h k^*) = ${latexNombreFixe(derivee, 3)}`);
      const contractante = Math.abs(derivee) < 1;
      outils.rendTexte(
        verdict,
        r.beta === 0
          ? '$\\beta = 0$ : $G$ est constante, le schéma est explicite.'
          : r.methode === 'point-fixe'
            ? contractante
              ? `$|G'(k^*)| < 1$ : le point fixe converge${derivee < 0 ? ', en spirale' : ''}.`
              : '$|G\'(k^*)| > 1$ : le point fixe diverge. Il faut réduire $h$, ou passer à Newton.'
            : 'Newton : convergence quadratique près de $k^*$.',
      );

      // Tableau des itérations, construit à part.
      const nouveau = document.createElement('div');
      tableau(
        nouveau,
        ['m', 'k⁽ᵐ⁾', '|k⁽ᵐ⁾ − k*|'],
        ks.slice(0, 6).map((k, m) => [String(m), String(Number(k.toPrecision(10))).replace('.', ',').replace('-', '−'), Math.abs(k - kEtoile) < 1e-15 ? '0' : Math.abs(k - kEtoile).toExponential(1).replace('.', ',').replace('e-', 'e−').replace('e+', 'e')]),
      );
      zoneTable.replaceChildren(...nouveau.childNodes);

      // ---- Complément ----
      if (!comp.contenu.hidden) {
        const T = 4;
        const exp = raide('explicite', r.mu, r.hr, T);
        const imp = raide('implicite', r.mu, r.hr, T);
        repRaide.fixeCadre([0, T], [-2, 2]);
        if (repRaide.prepare()) {
          repRaide.axes({ noms: ['t', 'x'] });
          repRaide.trace(Array.from({ length: 801 }, (_, i) => [(T * i) / 800, raideExacte((T * i) / 800, r.mu, 1.5)]), { couleur: col.trait, largeur: 1.6 });
          repRaide.trace(exp, { couleur: col.series[0], largeur: 1.6 });
          repRaide.trace(imp, { couleur: col.series[1], largeur: 1.6 });
        }
        const facteur = Math.abs(1 + r.hr * r.mu);
        outils.rendTexte(
          texteRaide,
          `$\\dot x = \\mu(x - \\cos t) - \\sin t$. Par pas, l’écart à $\\cos t$ est multiplié par $1 + h\\mu = ${latexNombreFixe(1 + r.hr * r.mu, 2)}$ (explicite${facteur > 1 ? ', il explose' : ''}) et par $1/(1 - h\\mu) = ${latexNombreFixe(1 / (1 - r.hr * r.mu), 2)}$ (implicite).`,
        );
        legendeRaide.replaceChildren();
        legende(legendeRaide, [
          { texte: 'solution exacte', couleur: col.trait },
          { texte: 'Euler explicite', couleur: col.series[0] },
          { texte: 'Euler implicite', couleur: col.series[1] },
        ]);
      }
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        for (const [cle, c] of Object.entries(champs)) c.fixe(r[cle]);
        champMu.fixe(r.mu);
        champHr.fixe(r.hr);
        comp.applique(prefs.valeurs.complement);
        dessine();
      },
    };
  },
};
