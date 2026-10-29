// Quand l'unicité tombe (poly, théorèmes de Peano et de Cauchy-Lipschitz) :
// pour ẋ = √|x| et ẋ = 3|x|^{2/3}, seconds membres continus mais pas
// lipschitziens en 0, une infinité de solutions maximales passent par le même
// point. Toutes sont de la forme
//   arrivée sur l'axe en a (x < 0), repos sur [a, b], départ en b (x > 0),
// avec a ≤ b ; selon la condition initiale, a, b ou les deux sont libres. À
// côté, la condition du double cône du poly, sur le graphe de x ↦ f(x) : le
// cône de pentes ±k, de sommet P, que le graphe doit éviter.

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, champsPoint, choixRadios, glisse, molette, paragraphe, toile, zoomable } from './commun.js';

// Pour chaque équation : f, la solution « qui part de 0 à l'instant b » et
// « qui arrive en 0 à l'instant a », et le temps mis pour aller de 0 à x.
export const EQUATIONS = {
  racine: {
    latex: '\\dot x = \\sqrt{|x|}',
    f: (x) => Math.sqrt(Math.abs(x)),
    depart: (t, b) => ((t - b) ** 2) / 4,
    arrivee: (t, a) => -((a - t) ** 2) / 4,
    duree: (x) => 2 * Math.sqrt(Math.abs(x)),
    morceaux: ['-\\tfrac14 (a - t)^2', '\\tfrac14 (t - b)^2'],
    coneY: [-0.3, 1.6],
    poly: 'Exemple du poly : avec $x(0) = 0$, la fonction nulle et $t \\mapsto t^2/4$ pour $t > 0$ (nulle avant) sont deux solutions maximales, définies sur $\\mathbb R$.',
  },
  cube: {
    latex: '\\dot x = 3|x|^{2/3}',
    f: (x) => 3 * Math.cbrt(x * x),
    depart: (t, b) => (t - b) ** 3,
    arrivee: (t, a) => (t - a) ** 3,
    duree: (x) => Math.cbrt(Math.abs(x)),
    morceaux: ['(t - a)^3', '(t - b)^3'],
    coneY: [-0.5, 5],
    poly: 'Exemple du poly (Demailly) : pour $x_0 > 0$, $b = t_0 - x_0^{1/3}$ est imposé, mais $a$ peut prendre toute valeur de $]-\\infty, b]$ : une infinité de solutions maximales, toutes globales.',
  },
};

// Bornes de a et b permises par la condition initiale : la solution vaut 0
// exactement sur [a, b]. Pour x₀ > 0, b est imposé ; pour x₀ < 0, a est imposé ;
// pour x₀ = 0, il faut a ≤ t₀ ≤ b.
export function contraintes(eq, t0, x0) {
  const d = EQUATIONS[eq].duree(x0);
  if (x0 > 0) return { aMax: t0 - d, bFixe: t0 - d };
  if (x0 < 0) return { aFixe: t0 + d, bMin: t0 + d };
  return { aMax: t0, bMin: t0 };
}

// Ramène (a, b) dans les valeurs permises.
export function ajuste(eq, t0, x0, a, b) {
  const c = contraintes(eq, t0, x0);
  if (c.aFixe !== undefined) a = c.aFixe;
  if (c.bFixe !== undefined) b = c.bFixe;
  if (c.aMax !== undefined) a = Math.min(a, c.aMax);
  if (c.bMin !== undefined) b = Math.max(b, c.bMin);
  return { a, b };
}

// La solution maximale de paramètres a ≤ b.
export function solution(eq, a, b) {
  const E = EQUATIONS[eq];
  return (t) => (t < a ? E.arrivee(t, a) : t > b ? E.depart(t, b) : 0);
}

// Plus grande pente des cordes issues de P = (p, f(p)) sur [p − δ, p + δ] : la
// plus petite constante k pour laquelle le graphe évite le double cône de
// sommet P. Infinie en p = 0 (tangente verticale).
export function penteMaximale(eq, p, delta, n = 400) {
  const f = EQUATIONS[eq].f;
  if (p === 0) return Infinity;
  let k = 0;
  for (let i = 1; i <= n; i++) {
    for (const s of [-1, 1]) {
      const x = p + (s * delta * i) / n;
      k = Math.max(k, Math.abs(f(x) - f(p)) / Math.abs(x - p));
    }
  }
  return k;
}

const fr = (v) => String(Number(v.toPrecision(3))).replace('.', ',').replace('-', '−');

export default {
  etat: { eq: 'racine', t0: 0, x0: 0, a: -1, b: 1, p: 0, k: 2, delta: 0.5 },

  choix: { eq: Object.keys(EQUATIONS) },

  termes: ['solution maximale', 'lipschitzienne', 'courbe intégrale'],

  rappel: [
    'Peano : si $f$ est continue, par tout point $(t_0, x_0)$ il passe au moins une solution maximale. La continuité seule ne donne pas l’unicité.',
    'Lipschitzienne, globalement ou localement : $x \\mapsto f(t, x)$ est $k$-lipschitzienne si',
    '$$\\|f(t, x_1) - f(t, x_2)\\| \\le k\\,\\|x_1 - x_2\\|$$',
    'pour tous les points $x_1, x_2$ considérés. C’est global si une même constante $k$ convient sur tout $\\Omega$, local si chaque point a un voisinage (ici $[p - \\delta, p + \\delta]$) où $f$ est $k$-lipschitzienne, avec un $k$ qui peut dépendre du voisinage. Ainsi $x \\mapsto x^2$ est localement lipschitzienne, avec un $k$ qui grandit avec le voisinage, sans l’être globalement.',
    'Cauchy-Lipschitz : si de plus $f$ est localement lipschitzienne en $x$, cette solution maximale est unique, et les courbes intégrales ne se coupent pas. Le local suffit : pas besoin d’une constante pour tout $\\Omega$.',
    'Condition du double cône : $f(t, \\cdot)$ est $k$-lipschitzienne si et seulement si, depuis tout point $P$ de son graphe, le graphe évite le double cône ouvert de pentes $\\pm k$ et de sommet $P$. Pour la version locale, on ne regarde que le voisinage $[p - \\delta, p + \\delta]$ de $P$ : $\\delta$ en est la demi-largeur, et $k$ la pente testée.',
    '$x \\mapsto \\sqrt{|x|}$ a une tangente verticale en $0$ : son graphe pénètre dans tout cône de sommet $(0, 0)$, quelle que soit la pente $k$, même sur un voisinage aussi petit qu’on veut. Elle n’est pas localement lipschitzienne en $0$, d’où la non-unicité.',
  ],

  essais: [
    { texte: '$\\dot x = \\sqrt{|x|}$, $x(0) = 0$ : la fonction nulle est solution. Faites glisser $b$ : chaque $b \\ge 0$ donne une autre solution maximale.', etat: { eq: 'racine', t0: 0, x0: 0, a: -6, b: 0 } },
    { texte: 'Cliquez un point au-dessus de l’axe : l’instant $b$ où la solution quitte $0$ est imposé, mais pas $a$. Combien de solutions maximales passent par ce point ?', etat: { eq: 'cube', t0: 1.5, x0: 1, a: -1, b: 0.5 } },
    { texte: 'Dans le cône, placez $P$ en $0$ et augmentez $k$ : le graphe entre toujours dans le cône. Déplacez $P$ en $x = 1$ : quelle pente suffit sur le voisinage ?', etat: { eq: 'racine', p: 0, k: 2, delta: 0.5 } },
    { texte: 'Réduisez le voisinage $\\delta$ autour de $P = 0{,}2$ : la constante nécessaire diminue, mais grandit sans borne quand $P$ s’approche de $0$.', etat: { eq: 'racine', p: 0.2, k: 1, delta: 0.15 } },
    { texte: 'Hors de l’axe $x = 0$, $f$ est de classe $C^1$, donc localement lipschitzienne : une courbe intégrale qui ne touche pas l’axe est la seule par ses points.', etat: { eq: 'cube', t0: 0, x0: 2, a: -2, b: -1.26 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'eq',
      options: Object.entries(EQUATIONS).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        outils.change({ eq: valeur, ...ajuste(valeur, r.t0, r.x0, r.a, r.b) });
        applique();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    // ---- Les solutions dans le plan (t, x) -------------------------------------------------------
    const cPlan = carte(grille, 'Solutions maximales par $(t_0, x_0)$');
    boutonInfo(cPlan, [
      ['fleche', '--discret', 'Le champ de directions.'],
      ['tirets', '--accent', 'D’autres solutions maximales par le même point : elles se détachent de l’axe $x = 0$ à d’autres instants.'],
      ['ligne', '--accent', 'La solution maximale de paramètres $a \\le b$ : nulle exactement sur $[a, b]$.'],
      ['point', '--equilibre', 'Les instants $a$ et $b$, où la solution arrive sur l’axe et le quitte : faites-les glisser le long de l’axe, s’ils sont libres.'],
      ['point', '--perturbation', 'La condition initiale : cliquez ou faites glisser. Le point se colle à l’axe $x = 0$.'],
    ]);
    const canvas = toile(cPlan, '16 / 10', () => dessine());
    canvas.classList.add('cliquable');
    const CADRE = { x: [-5, 5], y: [-3, 3] };
    const rep = new Repere(canvas, CADRE);
    const barrePlan = document.createElement('div');
    barrePlan.className = 'barre-legende';
    cPlan.appendChild(barrePlan);
    const zoomPlan = zoomable(canvas, rep, { barre: barrePlan, auto: () => CADRE, redessine: () => dessine(), deplacer: false });
    // On saisit a ou b près de l'axe (s'il est libre), sinon la condition initiale.
    let saisi = null;
    glisse(canvas, rep, {
      prend: (t, x) => {
        const c = contraintes(r.eq, r.t0, r.x0);
        const pres = (v) => Math.hypot((t - v) * rep.sx, x * rep.sy) < 10;
        saisi = pres(r.b) && c.bFixe === undefined ? 'b' : pres(r.a) && c.aFixe === undefined ? 'a' : 'point';
        return true;
      },
      deplace: (t, x) => {
        if (saisi === 'a' || saisi === 'b') {
          const v = Number(t.toFixed(3));
          outils.change(ajuste(r.eq, r.t0, r.x0, saisi === 'a' ? v : r.a, saisi === 'b' ? v : r.b));
        } else {
          const x0 = Math.abs(x) * rep.sy < 8 ? 0 : Number(x.toFixed(3));
          const t0 = Number(t.toFixed(3));
          outils.change({ t0, x0, ...ajuste(r.eq, t0, x0, r.a, r.b) });
        }
        applique();
      },
    });

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);

    // ---- Choix de la solution : a et b ------------------------------------------------------------
    const cChoix = carte(colonne, 'Choisir une solution');
    const point = champsPoint(
      cPlan,
      [
        { latex: 't_0', min: -5, max: 5 },
        { latex: 'x_0', min: -3, max: 3 },
      ],
      [r.t0, r.x0],
      ([t0, x0]) => {
        outils.change({ t0, x0, ...ajuste(r.eq, t0, x0, r.a, r.b) });
        applique();
      },
    );
    const ligneAB = document.createElement('div');
    ligneAB.className = 'reglages-2';
    cPlan.appendChild(ligneAB);
    const champs = {
      a: champ(ligneAB, { latex: 'a', min: -5, max: 5, pas: 0.01, pasFleche: 0.1, valeur: r.a }, (v) => {
        outils.change(ajuste(r.eq, r.t0, r.x0, v, r.b));
        applique();
      }),
      b: champ(ligneAB, { latex: 'b', min: -5, max: 5, pas: 0.01, pasFleche: 0.1, valeur: r.b }, (v) => {
        outils.change(ajuste(r.eq, r.t0, r.x0, r.a, v));
        applique();
      }),
    };
    const lignes = { a: ligneAB.querySelectorAll('.champ')[0], b: ligneAB.querySelectorAll('.champ')[1] };
    const formule = document.createElement('div');
    formule.className = 'formule';
    cChoix.appendChild(formule);
    const libre = paragraphe(cChoix, '', 'note conclusion-fixe');
    // L'exemple du poly en dernier : sa hauteur réservée reste en bas de la
    // carte au lieu d'écarter le texte de la formule.
    const exemple = paragraphe(cChoix, '', 'note texte-fixe');

    // ---- Double cône -----------------------------------------------------------------------------------
    const cCone = carte(colonne, 'Condition du double cône');
    boutonInfo(cCone, [
      ['ligne', '--texte', 'Le graphe de $x \\mapsto f(x)$. Réglages : $p$ place le sommet $P$ ; $\\delta$ est la demi-largeur du voisinage, ce qui rend la condition locale ; $k$ est la pente du cône, la constante de Lipschitz testée.'],
      ['zone', '--zone-2', 'Le double cône ouvert de sommet $P$ et de pentes $\\pm k$, limité au voisinage $[p - \\delta, p + \\delta]$ de $P$ : c’est cette limite qui rend la condition locale. Sans elle (cône sur tout l’axe), on testerait la lipschitzianité globale.'],
      ['ligne', '--perturbation', 'La partie du graphe qui entre dans le cône : $k$ ne convient pas.'],
      ['point', '--accent', 'Le sommet $P = (p, f(p))$ : faites-le glisser le long du graphe. La condition locale demande de tester le cône depuis tous les points du voisinage : déplacez $P$ pour les parcourir. La molette ouvre ou ferme le cône (la pente $k$).'],
    ]);
    const canvasCone = toile(cCone, '16 / 9', () => dessine());
    canvasCone.classList.add('saisissable');
    const repCone = new Repere(canvasCone, { x: [-2, 2], y: [-0.5, 2.8] });
    glisse(canvasCone, repCone, {
      deplace: (x) => {
        const p = Math.abs(x) * repCone.sx < 8 ? 0 : Number(Math.max(-1.9, Math.min(1.9, x)).toFixed(3));
        outils.change({ p });
        dessine();
      },
    });
    molette(canvasCone, (d) => {
      outils.change({ k: Number(Math.max(0.1, Math.min(20, r.k * 10 ** -d)).toPrecision(3)) });
      champK.fixe(r.k);
      dessine();
    });
    const champsCone = document.createElement('div');
    cCone.appendChild(champsCone);
    const champP = champ(champsCone, { latex: 'p', min: -1.9, max: 1.9, pas: 0.01, pasFleche: 0.1, valeur: r.p }, (v) => {
      outils.change({ p: Math.max(-1.9, Math.min(1.9, v)) });
      dessine();
    });
    const champK = champ(champsCone, { latex: 'k', min: 0.1, max: 20, pas: 0.1, valeur: r.k }, (v) => {
      outils.change({ k: v });
      dessine();
    });
    const champDelta = champ(champsCone, { latex: '\\delta', min: 0.02, max: 1, pas: 0.01, pasFleche: 0.05, valeur: r.delta }, (v) => {
      outils.change({ delta: v });
      dessine();
    });
    const verdictCone = paragraphe(cCone, '', 'note conclusion-fixe');

    function dessine() {
      const col = couleurs();
      const E = EQUATIONS[r.eq];
      choix.fixe(r.eq);
      point.fixe([r.t0, r.x0]);
      champP.fixe(r.p);
      outils.rendTexte(exemple, E.poly);
      const c = contraintes(r.eq, r.t0, r.x0);
      // Les champs imposés par la condition initiale restent en place, grisés.
      for (const [cle, fixe] of [['a', c.aFixe], ['b', c.bFixe]]) {
        lignes[cle].classList.toggle('inactif', fixe !== undefined);
        for (const input of lignes[cle].querySelectorAll('input')) input.disabled = fixe !== undefined;
      }
      outils.rend(formule, `x(t) = \\begin{cases} ${E.morceaux[0]} & t < a \\\\ 0 & a \\le t \\le b \\\\ ${E.morceaux[1]} & t > b \\end{cases}`);
      outils.rendTexte(
        libre,
        r.x0 > 0
          ? '$x_0 > 0$ : $b$ est imposé, $a \\le b$ est libre. Une infinité de solutions maximales.'
          : r.x0 < 0
            ? '$x_0 < 0$ : $a$ est imposé, $b \\ge a$ est libre. Une infinité de solutions maximales.'
            : '$x_0 = 0$ : $a \\le t_0 \\le b$, les deux sont libres.',
      );

      // ---- Plan (t, x) ----
      const cadre = zoomPlan.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        const [t1, t2] = rep.cadre.x;
        rep.axes({ noms: ['t', 'x'] });
        rep.champ((t, x) => [1, E.f(x)], { n: 19 });
        const echantillons = (g) => Array.from({ length: 601 }, (_, k) => t1 + ((t2 - t1) * k) / 600).map((t) => [t, g(t)]);
        // L'éventail : d'autres valeurs du paramètre libre.
        const tirets = { couleur: col.accent, largeur: 1.2, tirets: [5, 4], alpha: 0.6 };
        for (const d of [-3.5, -2.8, -2.1, -1.4, -0.7, 0.7, 1.4, 2.1, 2.8, 3.5]) {
          if (c.aFixe === undefined && r.a + d <= c.aMax) rep.trace(echantillons(solution(r.eq, r.a + d, r.b)), tirets);
          if (c.bFixe === undefined && r.b + d >= c.bMin) rep.trace(echantillons(solution(r.eq, r.a, r.b + d)), tirets);
        }
        rep.trace(echantillons(solution(r.eq, r.a, r.b)), { couleur: col.accent, largeur: 2.8 });
        for (const [v, nom] of [
          [r.a, 'a'],
          [r.b, 'b'],
        ]) {
          rep.point(v, 0, { rayon: 4.5, couleur: col.equilibre });
          rep.texte(v, 0, nom, { couleur: col.equilibre, align: 'center', dy: 18, police: 'italic 15px serif', fond: true });
        }
        rep.point(r.t0, r.x0, { rayon: 5, couleur: col.perturbation });
        rep.texte(r.t0, r.x0, `(t₀, x₀) = (${fr(r.t0)} ; ${fr(r.x0)})`, { couleur: col.perturbation, dx: 9, dy: r.x0 > 0 ? 18 : -10, police: '600 13px system-ui, sans-serif', fond: true });
      }

      // ---- Double cône ----
      repCone.fixeCadre([-2, 2], E.coneY);
      if (repCone.prepare()) {
        const [x1, x2] = repCone.cadre.x;
        const fp = E.f(r.p);
        const dans = (x, y) => Math.abs(x - r.p) <= r.delta && Math.abs(y - fp) > r.k * Math.abs(x - r.p);
        repCone.region(dans, { couleur: col.zone2, pas: 3 });
        repCone.axes({ noms: ['x', ''] });
        for (const s of [-1, 1]) repCone.trace([[r.p - r.delta, fp - s * r.k * r.delta], [r.p + r.delta, fp + s * r.k * r.delta]], { couleur: col.discret, largeur: 1, tirets: [5, 4] });
        const graphe = Array.from({ length: 801 }, (_, i) => x1 + ((x2 - x1) * i) / 800).map((x) => [x, E.f(x)]);
        repCone.trace(graphe, { couleur: col.trait, largeur: 2 });
        // La partie du graphe qui pénètre dans le cône, en orange.
        let morceau = [];
        for (const [x, y] of graphe) {
          if (x !== r.p && dans(x, y)) morceau.push([x, y]);
          else if (morceau.length) {
            repCone.trace(morceau, { couleur: col.perturbation, largeur: 3.5 });
            morceau = [];
          }
        }
        if (morceau.length) repCone.trace(morceau, { couleur: col.perturbation, largeur: 3.5 });
        repCone.point(r.p, fp, { rayon: 5, couleur: col.accent });
        repCone.texte(r.p, fp, 'P', { couleur: col.accent, dx: 8, dy: -6, police: 'italic 15px serif', fond: true });
      }
      const kMin = penteMaximale(r.eq, r.p, r.delta);
      outils.rendTexte(
        verdictCone,
        kMin === Infinity
          ? 'En $P = 0$, aucune pente $k$ ne convient : le graphe entre dans tout cône.'
          : `Plus grande pente des cordes issues de $P$ sur le voisinage : $${latexNombreFixe(kMin, 2, 2)}$. ${r.k >= kMin ? 'Le graphe évite le cône.' : 'Le graphe entre dans le cône.'}`,
      );
    }

    function applique() {
      champs.a.fixe(r.a);
      champs.b.fixe(r.b);
      champK.fixe(r.k);
      champDelta.fixe(r.delta);
      dessine();
    }

    outils.surTheme(dessine);
    dessine();
    return { applique };
  },
};
