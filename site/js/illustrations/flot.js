// Le flot transporte les ensembles (poly, chapitre « Flot », définition et
// formule du flot ; chapitre « Linéaire », formule de Liouville). Un disque X
// de conditions initiales est emporté par φ_t : on voit φ_t(X), qui se
// déforme sans se déchirer, et des rayons marqués pour suivre les points. On
// remonte le temps avec t < 0 (φ_{−t} ∘ φ_t = id), et l'on compare φ_t(X) à
// φ_{t/2}(φ_{t/2}(X)). L'aire de φ_t(X) suit exp(∫ div f) : constante pour le
// pendule, en e^{−at} pour le pendule amorti (Liouville appliqué à l'équation
// linéarisée, det φ_t'(x₀) = exp ∫₀ᵗ tr f'(x̄(s)) ds).

import { rk4 } from '../../socle/js/core/ode.js';
import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, champsPoint, choixRadios, glisse, legende, paragraphe, toile, zoomable } from './commun.js';

export const SYSTEMES = {
  pendule: {
    latex: '\\dot x_1 = x_2,\\ \\dot x_2 = -\\sin x_1 \\ \\text{(pendule)}',
    f: ([a, b]) => [b, -Math.sin(a)],
    div: 0,
    cadre: { x: [-4, 4], y: [-3, 3] },
    centre: [1, 0],
    rappel: '$\\dot x_1 = x_2$, $\\dot x_2 = -\\sin x_1$ : $\\operatorname{tr} f\'(x) = 0$, l’aire est conservée.',
  },
  amorti: {
    latex: '\\dot x_1 = x_2,\\ \\dot x_2 = -\\sin x_1 - 0{,}3\\,x_2 \\ \\text{(pendule amorti)}',
    f: ([a, b]) => [b, -Math.sin(a) - 0.3 * b],
    div: -0.3,
    cadre: { x: [-4, 4], y: [-3, 3] },
    centre: [1, 1],
    rappel: '$\\dot x_1 = x_2$, $\\dot x_2 = -\\sin x_1 - 0{,}3\\,x_2$ : $\\operatorname{tr} f\'(x) = -0{,}3$, l’aire est multipliée par $e^{-0{,}3\\,t}$.',
  },
  col: {
    latex: '\\dot x = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix} x \\ \\text{(col)}',
    f: ([a, b]) => [a, -b],
    div: 0,
    cadre: { x: [-4, 4], y: [-3, 3] },
    centre: [0.3, 1.5],
    rappel: '$e^{tA}$ est diagonale, de coefficients $e^t$ et $e^{-t}$ : le disque s’étire selon $x_1$ et s’écrase selon $x_2$, à aire constante ($\\operatorname{tr} A = 0$).',
  },
  foyer: {
    latex: '\\dot x = \\begin{pmatrix} -0{,}2 & 1 \\\\ -1 & -0{,}2 \\end{pmatrix} x \\ \\text{(foyer)}',
    f: ([a, b]) => [-0.2 * a + b, -a - 0.2 * b],
    div: -0.4,
    cadre: { x: [-4, 4], y: [-3, 3] },
    centre: [2, 0],
    rappel: '$e^{tA}$ fait tourner et contracte : l’aire est multipliée par $\\det e^{tA} = e^{t \\operatorname{tr} A} = e^{-0{,}4\\,t}$.',
  },
};

export const T_MIN = -3;
export const T_MAX = 8;
const H = 0.01;
const GARDE = 5; // un échantillon tous les 5 pas : Δt = 0,05

// Points de l'ensemble X : le cercle de centre c et de rayon ρ (le bord),
// et six rayons marqués (pour suivre les points, et voir le cisaillement).
export function ensemble(c, rho, nBord = 240, nRayon = 12) {
  const bord = Array.from({ length: nBord + 1 }, (_, k) => [c[0] + rho * Math.cos((2 * Math.PI * k) / nBord), c[1] + rho * Math.sin((2 * Math.PI * k) / nBord)]);
  const rayons = Array.from({ length: 6 }, (_, j) => Array.from({ length: nRayon + 1 }, (_, i) => [c[0] + ((rho * i) / nRayon) * Math.cos((j * Math.PI) / 3), c[1] + ((rho * i) / nRayon) * Math.sin((j * Math.PI) / 3)]));
  return { bord, rayons };
}

// Le bord de X, raffiné là où le flot l'étire : on part de `n` points du cercle
// de centre c et de rayon ρ, et l'on insère le milieu (en angle) de deux points
// voisins tant que leurs images, à l'un des instants de T_MIN à T_MAX (pas 0,5,
// RK4 au pas 0,05), sont distantes de plus de `seuil`, dans la limite de `max`
// points. Sans cela, un disque étiré par le flot (pendule près de la
// séparatrice) devient un polygone à longs côtés. Rend le bord fermé.
export function bordRaffine(cle, c, rho, { n = 120, seuil = 0.08, max = 4000 } = {}) {
  const f = SYSTEMES[cle].f;
  const F = (t, x) => f(x);
  const instants = Array.from({ length: Math.round((T_MAX - T_MIN) / 0.5) + 1 }, (_, k) => T_MIN + 0.5 * k);
  const point = (theta) => [c[0] + rho * Math.cos(theta), c[1] + rho * Math.sin(theta)];
  // Images d'un point aux instants, par un seul passage dans chaque sens.
  const images = (p) => {
    const sortie = new Map();
    for (const sens of [1, -1]) {
      let x = p;
      for (let k = 0; k < Math.round(Math.max(T_MAX, -T_MIN) / 0.5); k++) {
        for (let j = 0; j < 10; j++) x = rk4(F, 0, x, sens * 0.05);
        sortie.set(sens * 0.5 * (k + 1), x);
      }
    }
    sortie.set(0, p);
    return instants.map((t) => sortie.get(t) ?? p);
  };
  const ecart = (a, b) => Math.max(...a.map((p, i) => Math.hypot(p[0] - b[i][0], p[1] - b[i][1])));
  let pts = Array.from({ length: n + 1 }, (_, k) => {
    const theta = (2 * Math.PI * k) / n;
    return { theta, im: images(point(theta)) };
  });
  let change = true;
  while (change && pts.length < max) {
    change = false;
    const suite = [pts[0]];
    for (let i = 0; i + 1 < pts.length; i++) {
      if (pts.length + suite.length < max && ecart(pts[i].im, pts[i + 1].im) > seuil) {
        const theta = (pts[i].theta + pts[i + 1].theta) / 2;
        suite.push({ theta, im: images(point(theta)) });
        change = true;
      }
      suite.push(pts[i + 1]);
    }
    pts = suite;
  }
  return pts.map(({ theta }) => point(theta));
}

// Trajectoires de chaque point, de T_MIN à T_MAX, au pas h, échantillonnées
// tous les Δt = h·garde : rend une fonction qui donne l'image d'un point au
// temps t. Pendant un glisser, on passe un pas plus grand (calcul rapide).
export function transporte(cle, points, { h = H, garde = GARDE } = {}) {
  const f = SYSTEMES[cle].f;
  const F = (t, x) => f(x);
  const avant = Math.round(T_MAX / h);
  const arriere = Math.round(-T_MIN / h);
  return points.map((p) => {
    const futur = [p];
    const passe = [p];
    let x = p;
    for (let k = 1; k <= avant; k++) {
      x = rk4(F, 0, x, h);
      if (k % garde === 0) futur.push(x);
    }
    x = p;
    for (let k = 1; k <= arriere; k++) {
      x = rk4(F, 0, x, -h);
      if (k % garde === 0) passe.push(x);
    }
    // Image au temps t, par interpolation linéaire entre deux échantillons.
    return (t) => {
      const suite = t >= 0 ? futur : passe;
      const u = Math.abs(t) / (h * garde);
      const i = Math.min(suite.length - 2, Math.floor(u));
      const s = Math.min(1, u - i);
      return [suite[i][0] + s * (suite[i + 1][0] - suite[i][0]), suite[i][1] + s * (suite[i + 1][1] - suite[i][1])];
    };
  });
}

// φ_t(p) pour un seul point, t de signe quelconque (RK4, pas ≤ H).
export function flotDe(cle, p, t) {
  const f = SYSTEMES[cle].f;
  const n = Math.max(1, Math.ceil(Math.abs(t) / H));
  let x = p;
  for (let k = 0; k < n; k++) x = rk4((s, y) => f(y), 0, x, t / n);
  return x;
}

// Aire d'un polygone fermé (formule du lacet).
export function aire(poly) {
  let s = 0;
  for (let i = 0; i + 1 < poly.length; i++) s += poly[i][0] * poly[i + 1][1] - poly[i + 1][0] * poly[i][1];
  return Math.abs(s) / 2;
}

const T_BOUCLE = 4;

export default {
  etat: { sys: 'pendule', cx: 1, cy: 0, rho: 0.6, t: 2 },

  choix: { sys: Object.keys(SYSTEMES) },

  preferences: { anime: false, moitie: false },

  termes: ['flot', 'autonome', 'résolvante', 'équation linéarisée', 'solution maximale', 'différentielle', 'séparatrice', 'orbite'],

  rappel: [
    'Le flot $\\varphi(t, x_0)$ est la valeur au temps $t$ de la solution maximale de $\\dot x = f(x)$, $x(0) = x_0$. Pour $t$ fixé, $\\varphi_t \\colon x_0 \\mapsto \\varphi(t, x_0)$ transporte à l’instant $t$ un objet présent en $x_0$ au temps $0$.',
    'Formule du flot, pour un système autonome :',
    '$$\\varphi_{t_1 + t_2} = \\varphi_{t_2} \\circ \\varphi_{t_1}.$$',
    'En particulier $\\varphi_{-t} \\circ \\varphi_t = \\mathrm{id}$ : $\\varphi_t$ est inversible.',
    'Sa différentielle est la résolvante de l’équation linéarisée, $\\varphi_t\'(x_0) = R(t, 0)$, et la formule de Liouville donne',
    '$$\\det R(t, 0) = \\exp \\int_0^t \\operatorname{tr} f\'(\\bar x(s))\\,\\mathrm ds.$$',
    'L’aire de $\\varphi_t(X)$ en découle : conservée si $\\operatorname{tr} f\' = 0$, multipliée par $e^{ct}$ si $\\operatorname{tr} f\' = c$.',
    'Les quatre systèmes de la page, d’inconnue $x = (x_1, x_2)$ :',
    [
      'pendule : $\\dot x_1 = x_2$, $\\dot x_2 = -\\sin x_1$, avec $\\operatorname{tr} f\'(x) = 0$ ;',
      'pendule amorti : $\\dot x_1 = x_2$, $\\dot x_2 = -\\sin x_1 - 0{,}3\\,x_2$, avec $\\operatorname{tr} f\'(x) = -0{,}3$ ;',
      'col : $\\dot x = A x$, $A = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$, avec $\\operatorname{tr} A = 0$ ;',
      'foyer : $\\dot x = A x$, $A = \\begin{pmatrix} -0{,}2 & 1 \\\\ -1 & -0{,}2 \\end{pmatrix}$, avec $\\operatorname{tr} A = -0{,}4$.',
    ],
  ],

  essais: [
    { texte: 'Pendule : le disque s’étire le long des orbites, car les points ne tournent pas à la même vitesse, mais son aire reste celle du départ.', etat: { sys: 'pendule', cx: 1, cy: 0, rho: 0.6, t: 6 }, preferences: { anime: true } },
    { texte: 'Pendule amorti : l’aire décroît exactement comme $e^{-0{,}3\\,t}$. Vérifiez sur la courbe d’aire.', etat: { sys: 'amorti', cx: 1, cy: 1, rho: 0.6, t: 5 }, preferences: { anime: true } },
    { texte: 'Formule du flot : cochez « $\\varphi_{t/2}$ ». L’ensemble $\\varphi_{t/2}(X)$, transporté encore de $t/2$, donne bien $\\varphi_t(X)$.', etat: { sys: 'pendule', cx: 1, cy: 0, rho: 0.6, t: 4 }, preferences: { anime: false, moitie: true } },
    { texte: 'Prenez $t < 0$ : $\\varphi_t$ remonte le temps, et $\\varphi_{-t}$ ramène $\\varphi_t(X)$ sur $X$.', etat: { sys: 'pendule', cx: 1, cy: 0, rho: 0.6, t: -2 }, preferences: { anime: false } },
    { texte: 'Disque à cheval sur la séparatrice, près de $(\\pi, 0)$ : une partie oscille, l’autre fait des tours. Le disque s’étire en deux lobes reliés par un filament de plus en plus fin, mais il ne se coupe jamais : $\\varphi_t$ est continue et inversible.', etat: { sys: 'pendule', cx: 2.4, cy: 0.7, rho: 0.4, t: 5 }, preferences: { anime: false } },
    { texte: 'Col linéaire : le disque devient une ellipse de plus en plus fine, d’aire constante. Une application linéaire envoie les rayons sur des segments.', etat: { sys: 'col', cx: 0.3, cy: 1.5, rho: 0.6, t: 1.5 }, preferences: { anime: false } },
  ],

  monte(zone, outils) {
    const r = outils.etat;
    const prefs = outils.preferences;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'sys',
      options: Object.entries(SYSTEMES).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        const c = SYSTEMES[valeur].centre;
        outils.change({ sys: valeur, cx: c[0], cy: c[1] });
        zoomPlan.reinitialise();
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    const cPlan = carte(grille, 'L’ensemble $X$ et son image $\\varphi_t(X)$');
    boutonInfo(cPlan, [
      ['fleche', '--discret', 'Le champ de vecteurs $f$.'],
      ['tirets', '--discret', 'L’ensemble $X$ au temps $0$ : le disque de centre $c = (c_1, c_2)$ et de rayon $\\rho$, avec six rayons marqués.'],
      ['zone', '--zone-stable', 'Son image $\\varphi_t(X)$, bord en trait plein, rayons transportés.'],
      ['ligne', '--serie-1', 'Avec « $\\varphi_{t/2}$ » : l’image intermédiaire $\\varphi_{t/2}(X)$.'],
      ['point', '--perturbation', 'Le centre $c$ de $X$ : faites-le glisser.'],
      ['point', '--accent', 'Son image $\\varphi_t(c)$ : faites-la glisser, et $X$ suit par $\\varphi_{-t}$ (on remonte le temps).'],
    ]);
    const canvas = toile(cPlan, '4 / 3', () => dessine());
    canvas.classList.add('saisissable');
    const rep = new Repere(canvas, { x: [-4, 4], y: [-3, 3], egal: true });
    const barrePlan = document.createElement('div');
    barrePlan.className = 'barre-legende';
    cPlan.appendChild(barrePlan);
    const zoomPlan = zoomable(canvas, rep, { barre: barrePlan, auto: () => SYSTEMES[r.sys].cadre, redessine: () => dessine(), deplacer: false });
    // On saisit c, ou son image φ_t(c) : alors c = φ_{−t}(point visé).
    let saisi = null;
    glisse(canvas, rep, {
      prend: (a, b) => {
        const [u, v] = flotDe(r.sys, [r.cx, r.cy], r.t);
        const pres = (x, y) => Math.hypot((a - x) * rep.sx, (b - y) * rep.sy) < 12;
        saisi = pres(r.cx, r.cy) || !pres(u, v) ? 'c' : 'image';
        if (saisi === 'image') arrete();
        return true;
      },
      deplace: (a, b) => {
        const [cx, cy] = saisi === 'image' ? flotDe(r.sys, [a, b], -r.t) : [a, b];
        const C = SYSTEMES[r.sys].cadre;
        outils.change({ cx: Number(Math.max(C.x[0], Math.min(C.x[1], cx)).toFixed(2)), cy: Number(Math.max(C.y[0], Math.min(C.y[1], cy)).toFixed(2)) });
        rapide = true;
        dessine();
      },
      // Au lâcher, le calcul complet remplace l'esquisse.
      relache: () => {
        rapide = false;
        dessine();
      },
    });
    const zoneLegende = document.createElement('div');
    barrePlan.prepend(zoneLegende);

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cReg = carte(colonne, 'Instant et ensemble');
    paragraphe(cReg, 'L’ensemble $X$ est le disque de centre $c = (c_1, c_2)$ et de rayon $\\rho$ ; $t$ est l’instant auquel on regarde $\\varphi_t(X)$.', 'note');
    const champT = champ(cReg, { latex: 't', min: T_MIN, max: T_MAX, pas: 0.01, pasFleche: 0.1, valeur: r.t }, (v) => {
      arrete();
      outils.change({ t: v });
      dessine();
    });
    const champRho = champ(cReg, { latex: '\\rho', min: 0.1, max: 1.2, pas: 0.01, pasFleche: 0.05, valeur: r.rho }, (v) => {
      outils.change({ rho: v });
      dessine();
    });
    const centre = champsPoint(
      cReg,
      [
        { latex: 'c_1', min: -4, max: 4 },
        { latex: 'c_2', min: -3, max: 3 },
      ],
      [r.cx, r.cy],
      ([cx, cy]) => {
        outils.change({ cx, cy });
        dessine();
      },
    );
    const cases = document.createElement('div');
    cases.className = 'cases';
    cReg.appendChild(cases);
    const caseAnime = document.createElement('label');
    caseAnime.className = 'case';
    caseAnime.innerHTML = `<input type="checkbox" name="anime"> animer en boucle (t de 0 à ${T_BOUCLE})`;
    const caseMoitie = document.createElement('label');
    caseMoitie.className = 'case';
    const entreeMoitie = document.createElement('input');
    Object.assign(entreeMoitie, { type: 'checkbox', name: 'moitie' });
    const libelle = document.createElement('span');
    outils.rendTexte(libelle, ' montrer $\\varphi_{t/2}(X)$');
    caseMoitie.append(entreeMoitie, libelle);
    cases.append(caseAnime, caseMoitie);
    const entreeAnime = caseAnime.querySelector('input');
    entreeAnime.disabled = outils.mouvementReduit;
    entreeAnime.addEventListener('change', () => {
      prefs.change({ anime: entreeAnime.checked });
      debut = null;
    });
    entreeMoitie.addEventListener('change', () => {
      prefs.change({ moitie: entreeMoitie.checked });
      dessine();
    });
    const texte = paragraphe(cReg, '', 'note texte-fixe');

    const cAire = carte(colonne, 'Aire de $\\varphi_s(X)$');
    boutonInfo(cAire, [
      ['ligne', '--accent', 'L’aire de $\\varphi_s(X)$ divisée par celle de $X$, mesurée sur le bord transporté.'],
      ['tirets', '--texte', 'La prédiction $\\exp\\big(\\int_0^s \\operatorname{tr} f\'\\big) = e^{cs}$.'],
      ['tirets', '--perturbation', 'L’instant $t$ : cliquez ou faites glisser pour le changer.'],
    ]);
    const canvasAire = toile(cAire, '16 / 9', () => dessine());
    canvasAire.classList.add('saisissable');
    const repAire = new Repere(canvasAire, { x: [T_MIN, T_MAX], y: [0, 2] });
    glisse(canvasAire, repAire, {
      deplace: (t) => {
        arrete();
        outils.change({ t: Number(Math.max(T_MIN, Math.min(T_MAX, t)).toFixed(2)) });
        champT.fixe(r.t);
        dessine();
      },
    });
    const noteAire = paragraphe(cAire, '', 'note conclusion-fixe');

    // ---- Transport, gardé pour un ensemble et un système donnés ------------------------------------------
    // Pendant un glisser (`rapide`), une esquisse : moins de points, pas
    // quatre fois plus grand ; environ dix fois moins de calcul.
    let rapide = false;
    let cle = '';
    let images = null;
    let courbeAire = [];
    function calcule() {
      const k = JSON.stringify([r.sys, r.cx, r.cy, r.rho, rapide]);
      if (k === cle) return;
      cle = k;
      // Les rayons s'étirent aussi : 80 points chacun (6 pendant un glisser).
      const { rayons } = ensemble([r.cx, r.cy], r.rho, 12, rapide ? 6 : 80);
      // Le bord suit l'étirement du flot ; l'esquisse du glisser en garde moins.
      const bord = rapide ? bordRaffine(r.sys, [r.cx, r.cy], r.rho, { n: 90, seuil: 0.4, max: 600 }) : bordRaffine(r.sys, [r.cx, r.cy], r.rho);
      const options = rapide ? { h: 0.025, garde: 2 } : {};
      images = { bord: transporte(r.sys, bord, options), rayons: rayons.map((ray) => transporte(r.sys, ray, options)) };
      const a0 = aire(bord);
      courbeAire = [];
      for (let s = T_MIN; s <= T_MAX + 1e-9; s += 0.1) courbeAire.push([s, aire(images.bord.map((g) => g(s))) / a0]);
    }

    function figure(t, style) {
      const bord = images.bord.map((g) => g(t));
      const ctx = rep.ctx;
      if (style.remplit) {
        ctx.save();
        rep.decoupe();
        ctx.fillStyle = style.remplit;
        ctx.beginPath();
        bord.forEach(([x, y], k) => (k ? ctx.lineTo(rep.X(x), rep.Y(y)) : ctx.moveTo(rep.X(x), rep.Y(y))));
        ctx.fill();
        ctx.restore();
      }
      rep.trace(bord, { couleur: style.couleur, largeur: style.largeur, tirets: style.tirets ?? [] });
      for (const ray of images.rayons) rep.trace(ray.map((g) => g(t)), { couleur: style.couleur, largeur: style.largeur * 0.6, tirets: style.tirets ?? [], alpha: 0.8 });
    }

    function dessine() {
      const col = couleurs();
      const S = SYSTEMES[r.sys];
      choix.fixe(r.sys);
      entreeAnime.checked = prefs.valeurs.anime && !outils.mouvementReduit;
      entreeMoitie.checked = prefs.valeurs.moitie;
      calcule();
      centre.fixe([r.cx, r.cy]);
      outils.rendTexte(texte, S.rappel);
      const cadre = zoomPlan.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        rep.axes({ noms: ['x₁', 'x₂'] });
        rep.champ((a, b) => S.f([a, b]), { n: 21 });
        figure(0, { couleur: col.discret, largeur: 1.4, tirets: [4, 4] });
        if (prefs.valeurs.moitie) figure(r.t / 2, { couleur: col.series[0], largeur: 1.4 });
        figure(r.t, { couleur: col.accent, largeur: 2, remplit: col.zone });
        rep.point(r.cx, r.cy, { rayon: 5, couleur: col.perturbation });
        const [u, v] = flotDe(r.sys, [r.cx, r.cy], r.t);
        rep.point(u, v, { rayon: 4.5, couleur: col.accent });
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, [
        { texte: '$X$', couleur: col.discret, tirets: true },
        ...(prefs.valeurs.moitie ? [{ texte: '$\\varphi_{t/2}(X)$', couleur: col.series[0] }] : []),
        { texte: '$\\varphi_t(X)$', couleur: col.accent },
      ]);

      // ---- Aire ----
      const pred = courbeAire.map(([s]) => [s, Math.exp(S.div * s)]);
      const ys = courbeAire.map(([, v]) => v).concat(pred.map(([, v]) => v));
      repAire.fixeCadre([T_MIN, T_MAX], [0, Math.min(6, Math.max(1.6, ...ys) * 1.05)]);
      if (repAire.prepare()) {
        repAire.axes({ noms: ['s', ''] });
        repAire.trace(pred, { couleur: col.trait, largeur: 1.4, tirets: [6, 4] });
        repAire.trace(courbeAire, { couleur: col.accent, largeur: 2 });
        repAire.trace([[r.t, -10], [r.t, 10]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
      }
      const a0 = Math.PI * r.rho * r.rho;
      const at = aire(images.bord.map((g) => g(r.t)));
      outils.rendTexte(noteAire, `En $t = ${latexNombreFixe(r.t, 2)}$ : aire mesurée $/$ aire de $X = ${latexNombreFixe(at / aire(images.bord.map((g) => g(0))), 3)}$, prédiction ${S.div === 0 ? '$1$ (aire conservée)' : `$e^{${String(S.div).replace('.', '{,}')}\\,t} = ${latexNombreFixe(Math.exp(S.div * r.t), 3)}$`}. Aire de $X$ : $\\pi\\rho^2 = ${latexNombreFixe(a0, 3)}$.`);
    }

    // ---- Animation en boucle --------------------------------------------------------------------------------
    let debut = null;
    const arrete = () => {
      if (prefs.valeurs.anime) prefs.change({ anime: false });
      entreeAnime.checked = false;
    };
    const anime = (maintenant) => {
      if (prefs.valeurs.anime) {
        if (debut === null) debut = maintenant;
        const s = ((maintenant - debut) / 1000) % (T_BOUCLE + 0.6);
        const t = Number(Math.min(s, T_BOUCLE).toFixed(2));
        if (t !== r.t) {
          outils.change({ t });
          champT.fixe(t);
          dessine();
        }
      } else debut = null;
      requestAnimationFrame(anime);
    };
    if (!outils.mouvementReduit) requestAnimationFrame(anime);

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champT.fixe(r.t);
        champRho.fixe(r.rho);
        debut = null;
        dessine();
      },
    };
  },
};
