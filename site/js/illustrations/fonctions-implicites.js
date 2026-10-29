// Inversion locale et fonctions implicites (poly, annexe « Grands
// théorèmes »). Pour g : ℝ² → ℝ et un point P = (x̄, ȳ), la ligne de niveau
// {g = g(P)} est, près de P, le graphe d'une fonction y = φ(x) dès que
// ∂_y g(P) ≠ 0, avec φ'(x) = −∂_x g / ∂_y g. On suit cette fonction depuis P
// (par continuation et méthode de Newton) jusqu'à ce que ∂_y g s'annule : le
// voisinage U où elle existe se réduit quand P approche d'un point à tangente
// verticale. Là, si ∂_x g ≠ 0, c'est x qui est fonction de y. Pour
// g(x, y) = y³ + y − x, φ est la réciproque de y ↦ y³ + y : c'est l'inversion
// locale, ici globale.

import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, champsPoint, choixRadios, glisse, paragraphe, toile, zoomable } from './commun.js';

export const FONCTIONS = {
  cercle: {
    latex: 'g(x, y) = x^2 + y^2',
    g: (x, y) => x * x + y * y,
    gx: (x) => 2 * x,
    gy: (x, y) => 2 * y,
    gyy: () => 2,
    cadre: { x: [-2, 2], y: [-2, 2] },
    P: [0.6, 0.8],
  },
  cubique: {
    latex: 'g(x, y) = y^3 + y - x',
    g: (x, y) => y * y * y + y - x,
    gx: () => -1,
    gy: (x, y) => 3 * y * y + 1,
    gyy: (x, y) => 6 * y,
    cadre: { x: [-3, 3], y: [-2, 2] },
    P: [1, 0.68232780382],
  },
  folium: {
    latex: 'g(x, y) = x^3 + y^3 - 3xy',
    g: (x, y) => x ** 3 + y ** 3 - 3 * x * y,
    gx: (x, y) => 3 * x * x - 3 * y,
    gy: (x, y) => 3 * y * y - 3 * x,
    gyy: (x, y) => 6 * y,
    cadre: { x: [-2.2, 2.2], y: [-2.2, 2.2] },
    P: [1.5, 1.5],
  },
};

const SEUIL = 1e-3;

// Suit la fonction implicite y = φ(x) de la fonction F = { g, gx, gy } depuis
// P, vers la droite (sens = 1) ou vers la gauche (−1), par pas dx, avec Newton
// en y. S'arrête quand |∂_y g| devient petit (tangente verticale), quand
// Newton échoue ou au bord.
export function continue_(F, P, sens, { dx = 0.005, xMax = 4, seuil = 0.05 } = {}) {
  const c = F.g(...P);
  const pts = [P.slice()];
  let [x, y] = P;
  for (let k = 0; k < xMax / dx; k++) {
    // Prédiction par la pente φ' = −g_x/g_y, puis correction de Newton.
    const pente = -F.gx(x, y) / F.gy(x, y);
    const xn = x + sens * dx;
    let yn = y + sens * dx * pente;
    let ok = false;
    for (let i = 0; i < 30; i++) {
      const d = F.gy(xn, yn);
      if (Math.abs(d) < 1e-12) break;
      const pas = (F.g(xn, yn) - c) / d;
      yn -= pas;
      if (Math.abs(pas) < 1e-13) {
        ok = true;
        break;
      }
    }
    if (!ok || Math.abs(yn - y) > 20 * dx * (1 + Math.abs(pente)) || Math.abs(F.gy(xn, yn)) < seuil * Math.max(1, Math.abs(F.gx(xn, yn)))) break;
    [x, y] = [xn, yn];
    pts.push([x, y]);
  }
  return pts;
}

// Graphe local de φ autour de P : les deux continuations recollées.
// `echange` : la même chose pour x = ψ(y), en échangeant les rôles de x et y.
export const echange = (F) => ({ g: (u, v) => F.g(v, u), gx: (u, v) => F.gy(v, u), gy: (u, v) => F.gx(v, u) });

export function graphe(F, P, options) {
  const gauche = continue_(F, P, -1, options).reverse();
  const droite = continue_(F, P, 1, options);
  return [...gauche, ...droite.slice(1)];
}

// Aimantation : si ∂_y g(P) est presque nul, on cherche par Newton (en y)
// le point voisin où il s'annule exactement, puis on garde ce point.
export function aimante(cle, x, y, tolerance) {
  const F = FONCTIONS[cle];
  if (Math.abs(F.gy(x, y)) > tolerance) return [x, y];
  let yy = y;
  for (let i = 0; i < 40; i++) {
    const d = F.gyy(x, yy);
    if (Math.abs(d) < 1e-12) break;
    const pas = F.gy(x, yy) / d;
    yy -= pas;
    if (Math.abs(pas) < 1e-14) break;
  }
  return Math.abs(yy - y) < 0.2 ? [x, yy] : [x, y];
}

export default {
  etat: { fn: 'cercle', px: 0.6, py: 0.8 },

  choix: { fn: Object.keys(FONCTIONS) },

  termes: ['difféomorphisme', 'dérivée partielle'],

  rappel: [
    'Théorème des fonctions implicites : soit $f$ de classe $C^k$ sur un ouvert de $E \\times F$ et $(\\bar x, \\bar y)$ tel que $\\partial_y f(\\bar x, \\bar y)$ soit bijective. Il existe un voisinage $U \\times V$ de $(\\bar x, \\bar y)$ et une unique application $\\varphi \\colon U \\to V$ de classe $C^k$ telle que',
    '$$x \\in U,\\ y \\in V,\\ f(x, y) = f(\\bar x, \\bar y) \\iff x \\in U,\\ y = \\varphi(x),$$',
    'et',
    '$$\\varphi\'(x) = -\\big(\\partial_y f(x, \\varphi(x))\\big)^{-1} \\circ \\partial_x f(x, \\varphi(x)).$$',
    'Il se démontre par le théorème d’inversion locale : si $f\'(x)$ est bijective, $f$ est un $C^k$-difféomorphisme d’un voisinage de $x$ sur un voisinage de $f(x)$.',
  ],

  essais: [
    { texte: 'Cercle : déplacez $P$ vers $(1, 0)$. Le voisinage $U$ où $y = \\varphi(x)$ existe rétrécit, et en $(1, 0)$, $\\partial_y g = 0$ : la tangente est verticale.', etat: { fn: 'cercle', px: 0.6, py: 0.8 } },
    { texte: 'En $(1, 0)$, $\\partial_x g \\neq 0$ : c’est $x$ qui est fonction de $y$ près de ce point, $x = \\sqrt{1 - y^2}$.', etat: { fn: 'cercle', px: 1, py: 0 } },
    { texte: '$g(x, y) = y^3 + y - x$ : $\\partial_y g = 3y^2 + 1 > 0$ partout. La fonction implicite est définie sur tout $\\mathbb R$ : c’est la réciproque de $y \\mapsto y^3 + y$.', etat: { fn: 'cubique', px: 1, py: 0.68232780382 } },
    { texte: 'Folium de Descartes : approchez $P$ de $(0, 0)$. Les deux dérivées partielles s’annulent, la courbe se croise : ni $y(x)$ ni $x(y)$.', etat: { fn: 'folium', px: 0.3, py: 0.05 } },
    { texte: 'Comparez la pente de la tangente à la formule $\\varphi\'(\\bar x) = -\\partial_x g / \\partial_y g$ affichée sous la figure.', etat: { fn: 'folium', px: 1.5, py: 1.5 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'fn',
      options: Object.entries(FONCTIONS).map(([valeur, { latex }]) => ({ valeur, latex })),
      change: (valeur) => {
        const P = FONCTIONS[valeur].P;
        outils.change({ fn: valeur, px: P[0], py: P[1] });
        zoomPlan.reinitialise();
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    const cPlan = carte(grille, 'La ligne de niveau $\\{g = g(P)\\}$');
    boutonInfo(cPlan, [
      ['ligne', '--discret', 'D’autres lignes de niveau de $g$.'],
      ['ligne', '--texte', 'La ligne de niveau qui passe par $P$.'],
      ['ligne', '--accent', 'Le graphe de la fonction implicite $y = \\varphi(x)$, suivi depuis $P$ tant que $\\partial_y g \\neq 0$ (ou de $x = \\psi(y)$, quand $\\partial_y g(P) = 0$).'],
      ['zone', '--zone-stable', 'Le voisinage $U \\times V$ sur lequel la fonction a été suivie.'],
      ['tirets', '--accent', 'La tangente en $P$, de pente $-\\partial_x g / \\partial_y g$.'],
      ['point', '--perturbation', 'Le point $P$ : faites-le glisser. Il se colle aux points où $\\partial_y g = 0$. La molette zoome : près de $P$, la ligne de niveau se confond avec un graphe.'],
    ]);
    const canvas = toile(cPlan, '1 / 1', () => dessine());
    canvas.classList.add('saisissable');
    const rep = new Repere(canvas, FONCTIONS[r.fn].cadre);
    const barrePlan = document.createElement('div');
    barrePlan.className = 'barre-legende';
    cPlan.appendChild(barrePlan);
    const zoomPlan = zoomable(canvas, rep, { barre: barrePlan, auto: () => FONCTIONS[r.fn].cadre, redessine: () => dessine(), deplacer: false });
    glisse(canvas, rep, {
      deplace: (x, y) => {
        const [a, b] = aimante(r.fn, x, y, 8 / rep.sy);
        outils.change({ px: Number(a.toFixed(4)), py: Number(b.toPrecision(12)) });
        dessine();
      },
    });

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cForm = carte(colonne, 'Au point $P$');
    const formule = document.createElement('div');
    formule.className = 'formule';
    cForm.appendChild(formule);
    const point = champsPoint(
      cForm,
      [
        { latex: '\\bar x', min: -2, max: 2 },
        { latex: '\\bar y', min: -2, max: 2 },
      ],
      [r.px, r.py],
      ([px, py]) => {
        outils.change({ px, py });
        dessine();
      },
    );
    const verdict = paragraphe(cForm, '', 'note texte-fixe six-lignes');

    function dessine() {
      const col = couleurs();
      const F = FONCTIONS[r.fn];
      choix.fixe(r.fn);
      const P = [r.px, r.py];
      point.bornes(0, ...F.cadre.x);
      point.bornes(1, ...F.cadre.y);
      point.fixe(P);
      const c = F.g(...P);
      const [gx, gy] = [F.gx(...P), F.gy(...P)];
      const ech = Math.max(1, Math.abs(gx), Math.abs(gy));
      const regulierY = Math.abs(gy) > SEUIL * ech;
      const regulierX = Math.abs(gx) > SEUIL * ech;

      // La fonction implicite : y = φ(x), ou x = ψ(y) en échangeant les rôles.
      let courbe = [];
      if (regulierY) courbe = graphe(F, P);
      else if (regulierX) courbe = graphe(echange(F), [P[1], P[0]]).map(([u, v]) => [v, u]);

      const cadre = zoomPlan.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        if (courbe.length > 1) {
          const xs = courbe.map(([a]) => a);
          const ys = courbe.map(([, b]) => b);
          const [xa, xb, ya, yb] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
          rep.region((u, v) => u >= xa && u <= xb && v >= ya && v <= yb, { couleur: col.zone, pas: 3 });
        }
        rep.axes({ noms: ['x', 'y'] });
        for (const k of [-3, -2, -1, -0.5, 0.5, 1, 2, 3]) rep.isoligne((u, v) => F.g(u, v), c + k * 0.6, { couleur: col.discret, largeur: 0.8, n: 140 });
        rep.isoligne((u, v) => F.g(u, v), c, { couleur: col.trait, largeur: 1.4, n: 220 });
        rep.trace(courbe, { couleur: col.accent, largeur: 3.2 });
        if (regulierY) rep.droite(P[0], P[1], 1, -gx / gy, { couleur: col.accent, largeur: 1.2, tirets: [6, 4] });
        else if (regulierX) rep.droite(P[0], P[1], -gy / gx, 1, { couleur: col.accent, largeur: 1.2, tirets: [6, 4] });
        rep.point(P[0], P[1], { rayon: 5.5, couleur: col.perturbation });
      }

      outils.rend(
        formule,
        `\\begin{gathered} \\partial_x g(P) = ${latexNombreFixe(gx, 3)}, \\quad \\partial_y g(P) = ${latexNombreFixe(gy, 3)} \\\\ ${regulierY ? `\\varphi'(\\bar x) = -\\dfrac{\\partial_x g}{\\partial_y g} = ${latexNombreFixe(-gx / gy, 3)}` : regulierX ? `\\psi'(\\bar y) = -\\dfrac{\\partial_y g}{\\partial_x g} = ${latexNombreFixe(-gy / gx, 3)}` : '\\nabla g(P) = 0'} \\end{gathered}`,
      );
      outils.rendTexte(
        verdict,
        regulierY
          ? `$\\partial_y g(P) \\neq 0$ : près de $P$, la ligne de niveau est le graphe d’une fonction $y = \\varphi(x)$, de classe $C^\\infty$. On l’a suivie sur $U = [${latexNombreFixe(courbe[0][0], 2)}, ${latexNombreFixe(courbe[courbe.length - 1][0], 2)}]$, jusqu’à une tangente verticale ou au bord.`
          : regulierX
            ? '$\\partial_y g(P) = 0$ : la tangente est verticale, pas de fonction $y = \\varphi(x)$. Mais $\\partial_x g(P) \\neq 0$ : près de $P$, c’est $x$ qui est fonction de $y$, $x = \\psi(y)$.'
            : 'Les deux dérivées partielles sont nulles : le théorème ne s’applique pas. Au folium, deux branches de la courbe se croisent en $(0, 0)$.',
      );
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        zoomPlan.reinitialise();
        dessine();
      },
    };
  },
};
