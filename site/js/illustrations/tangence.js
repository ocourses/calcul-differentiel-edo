// Dérivable, c'est être tangent à une application affine (poly, chapitre
// « Applications différentiables », différentielle de Fréchet, cas d'une
// fonction réelle de la variable réelle). On zoome sur le graphe de f autour
// de a : si f est dérivable en a, le graphe se confond avec sa tangente
// T(x) = f(a) + f'(a)(x − a), et le reste |f(a + h) − f(a) − f'(a)h| / |h| tend
// vers 0. Sinon, aucune droite ne convient : le graphe garde un coin, oscille
// ou devient vertical, à toutes les échelles.

import { champ } from '../../socle/js/ui/controls.js';
import { latexNombreFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, glisse, molette, paragraphe, toile } from './commun.js';

// Fonctions : f, sa dérivée (NaN où f n'est pas dérivable) et un mot sur le
// point remarquable 0.
export const FONCTIONS = {
  sinus: {
    latex: '\\sin x',
    f: Math.sin,
    df: Math.cos,
    note: '$\\sin$ est dérivable partout : à toute échelle assez fine, son graphe est une droite.',
  },
  abs: {
    latex: '|x|',
    f: Math.abs,
    df: (x) => (x === 0 ? NaN : Math.sign(x)),
    note: 'En $0$, le graphe garde un coin à toutes les échelles : les pentes à gauche et à droite diffèrent, aucune droite n’est tangente.',
  },
  carreSinus: {
    latex: 'x^2 \\sin(1/x)',
    f: (x) => (x === 0 ? 0 : x * x * Math.sin(1 / x)),
    df: (x) => (x === 0 ? 0 : 2 * x * Math.sin(1 / x) - Math.cos(1 / x)),
    note: 'En $0$, $|f(h)| \\le h^2 = o(h)$ : $f$ est dérivable et $f\'(0) = 0$, malgré les oscillations. Mais $f\'$ n’est pas continue en $0$ : $f$ n’est pas de classe C¹.',
  },
  xSinus: {
    latex: 'x \\sin(1/x)',
    f: (x) => (x === 0 ? 0 : x * Math.sin(1 / x)),
    df: (x) => (x === 0 ? NaN : Math.sin(1 / x) - Math.cos(1 / x) / x),
    note: 'En $0$, le taux d’accroissement $\\sin(1/h)$ oscille entre $-1$ et $1$ : $f$ est continue mais pas dérivable.',
  },
  cubique: {
    latex: '\\sqrt[3]{x}',
    f: Math.cbrt,
    df: (x) => (x === 0 ? NaN : 1 / (3 * Math.cbrt(x * x))),
    note: 'En $0$, la tangente est verticale : le taux d’accroissement tend vers $+\\infty$, il n’y a pas d’application linéaire $h \\mapsto f\'(0)\\,h$.',
  },
};

// Reste rapporté à |h| : |f(a + h) − f(a) − L h| / |h|, avec L = f'(a) si f est
// dérivable en a, et L = 0 sinon (aucun L ne convient).
export function reste(cle, a, h) {
  const { f, df } = FONCTIONS[cle];
  const L = Number.isFinite(df(a)) ? df(a) : 0;
  return Math.abs(f(a + h) - f(a) - L * h) / Math.abs(h);
}

// Exposant écrit en chiffres supérieurs, pour une étiquette de canevas : « −2,93 » → « ⁻²˒⁹³ ».
const SUP = { '-': '⁻', '.': '˒', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const exposant = (texte) => [...texte].map((c) => SUP[c] ?? c).join('');

// Bornes de log₁₀ r, la taille de la fenêtre de zoom.
const LR = [-6, 0.3];

export default {
  etat: { fn: 'sinus', a: 0.8, lr: -0.3 },

  choix: { fn: Object.keys(FONCTIONS) },

  termes: ['différentiable', 'différentielle', 'petit o'],

  rappel: [
    '$f$ est différentiable (ou dérivable) en $x$ s’il existe une application linéaire continue $f\'(x)$ telle que',
    '$$f(x + v) - f(x) - f\'(x)\\cdot v = o(v).$$',
    'Autrement dit, $f$ est tangente en $x$ à l’application affine $v \\mapsto f(x) + f\'(x)\\cdot v$ : leur différence est un petit o de $v$, négligeable devant $\\|v\\|$. L’application linéaire $f\'(x)$ est la différentielle de $f$ en $x$.',
    'Pour $f \\colon \\mathbb R \\to \\mathbb R$, $f\'(x)\\cdot v = a\\,v$ où $a$ est la dérivée usuelle :',
    '$$f(x + h) = f(x) + a\\,h + o(h).$$',
  ],

  essais: [
    { texte: '$\\sin$ en $a = 0{,}8$ : réduisez la fenêtre de zoom. Le graphe devient une droite, celle de la tangente.', etat: { fn: 'sinus', a: 0.8, lr: 0 } },
    { texte: '$|x|$ en $a = 0$ : zoomez autant que vous voulez, le coin reste. Le reste divisé par $|h|$ ne tend pas vers $0$.', etat: { fn: 'abs', a: 0, lr: 0 } },
    { texte: 'Déplacez $a$ loin de $0$ pour $|x|$ : en tout $a \\neq 0$, la fonction est dérivable.', etat: { fn: 'abs', a: 0.3, lr: -0.5 } },
    { texte: '$x^2 \\sin(1/x)$ en $0$ : les oscillations se tassent dans le cône $|y| \\le x^2$, et le zoom finit par montrer une droite horizontale.', etat: { fn: 'carreSinus', a: 0, lr: -0.5 } },
    { texte: '$x \\sin(1/x)$ en $0$ : le zoom montre toujours la même figure, à toutes les échelles. Pas de tangente.', etat: { fn: 'xSinus', a: 0, lr: -0.5 } },
    { texte: '$\\sqrt[3]{x}$ en $0$ : en zoomant, le graphe se redresse jusqu’à la verticale.', etat: { fn: 'cubique', a: 0, lr: 0 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'fn',
      options: Object.entries(FONCTIONS).map(([valeur, { latex }]) => ({ valeur, latex: `f(x) = ${latex}` })),
      change: (valeur) => {
        outils.change({ fn: valeur });
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-2 principale';
    zone.appendChild(grille);

    const cGraphe = carte(grille, 'Graphe de $f$ et fenêtre de zoom');
    boutonInfo(cGraphe, [
      ['ligne', '--texte', 'Le graphe de $f$.'],
      ['ligne', '--accent', 'La tangente $T(x) = f(a) + f\'(a)(x - a)$, si $f$ est dérivable en $a$.'],
      ['zone', '--zone-stable', 'La fenêtre $[a - r, a + r] \\times [f(a) - r, f(a) + r]$, agrandie à droite ; la molette change sa taille.'],
      ['point', '--perturbation', 'Le point $(a, f(a))$ : faites-le glisser. Il se colle en $a = 0$.'],
    ]);
    const canvas = toile(cGraphe, '1 / 1', () => dessine());
    canvas.classList.add('saisissable');
    const rep = new Repere(canvas, { x: [-2, 2], y: [-2, 2], egal: true });
    glisse(canvas, rep, {
      deplace: (x) => {
        const a = Math.abs(x) * rep.sx < 8 ? 0 : Number(Math.max(-1.9, Math.min(1.9, x)).toFixed(3));
        outils.change({ a });
        dessine();
      },
    });

    const cZoom = carte(grille, 'Zoom autour de $(a, f(a))$');
    boutonInfo(cZoom, [
      ['ligne', '--texte', 'Le graphe de $f$ dans la fenêtre, agrandie au même format quelle que soit sa taille $r$.'],
      ['ligne', '--accent', 'La tangente.'],
      ['fleche', '--discret', 'Glisser déplace $a$ sous la fenêtre ; la molette, ici ou sur le graphe, change $r$.'],
    ]);
    const canvasZoom = toile(cZoom, '1 / 1', () => dessine());
    canvasZoom.classList.add('saisissable');
    const repZoom = new Repere(canvasZoom, { x: [-1, 1], y: [-1, 1], egal: true });
    const champR = champ(cZoom, { latex: '\\log_{10} r', min: LR[0], max: LR[1], pas: 0.05, pasFleche: 0.5, valeur: r.lr }, (v) => {
      outils.change({ lr: v });
      dessine();
    });
    // Glisser dans le zoom fait défiler le graphe sous la fenêtre : le point
    // saisi reste sous le pointeur, a se déplace de la même quantité.
    let prise = null;
    glisse(canvasZoom, repZoom, {
      prend: (u) => {
        prise = { u, a: r.a };
        return true;
      },
      deplace: (u) => {
        const a = prise.a - (u - prise.u) * 10 ** r.lr;
        outils.change({ a: Number(Math.max(-1.9, Math.min(1.9, a)).toPrecision(6)) });
        dessine();
      },
    });
    // La molette, sur le graphe comme sur le zoom, change la taille de la fenêtre.
    for (const c of [canvas, canvasZoom]) molette(c, (d) => fixeR(r.lr + d));

    const cReste = carte(zone, 'Reste $|f(a + h) - f(a) - L\\,h| \\,/\\, |h|$, avec $L = f\'(a)$ si elle existe');
    cReste.classList.add('rangee-basse');
    boutonInfo(cReste, [
      ['ligne', '--accent', 'Le reste rapporté à $|h|$, pour $h > 0$, en échelle log-log : il tend vers $0$ si et seulement si $f$ est dérivable en $a$ (si $f$ n’y est pas dérivable, on prend $L = 0$ : aucune valeur de $L$ ne convient).'],
      ['tirets', '--accent', 'La même chose pour $h < 0$.'],
      ['tirets', '--perturbation', 'La taille $r$ de la fenêtre de zoom : cliquez ou faites glisser pour la changer.'],
    ]);
    const canvasReste = toile(cReste, '16 / 4', () => dessine());
    canvasReste.classList.add('saisissable');
    const repReste = new Repere(canvasReste, { x: LR, y: [-7, 1] });
    // Sur le reste, on choisit l'échelle r d'un clic ou en glissant.
    glisse(canvasReste, repReste, { deplace: (lh) => fixeR(lh) });

    function fixeR(lr) {
      const v = Number(Math.max(LR[0], Math.min(LR[1], lr)).toFixed(2));
      outils.change({ lr: v });
      champR.fixe(v);
      dessine();
    }
    const note = paragraphe(cReste, '', 'note conclusion-fixe');

    function dessine() {
      const col = couleurs();
      const F = FONCTIONS[r.fn];
      choix.fixe(r.fn);
      const fa = F.f(r.a);
      const d = F.df(r.a);
      const derivable = Number.isFinite(d);
      const rr = 10 ** r.lr;

      // ---- Graphe ----
      if (rep.prepare()) {
        rep.axes({ noms: ['x', 'y'] });
        const [x1, x2] = rep.cadre.x;
        rep.region((x, y) => Math.abs(x - r.a) <= rr && Math.abs(y - fa) <= rr, { couleur: col.zone, pas: 2 });
        const n = 3000;
        rep.trace(Array.from({ length: n + 1 }, (_, k) => x1 + ((x2 - x1) * k) / n).map((x) => [x, F.f(x)]), { couleur: col.trait, largeur: 1.8 });
        if (derivable) rep.droite(r.a, fa, 1, d, { couleur: col.accent, largeur: 1.6 });
        rep.point(r.a, fa, { rayon: 5, couleur: col.perturbation });
      }

      // ---- Zoom : coordonnées ramenées à [−1, 1]² ----
      if (repZoom.prepare()) {
        repZoom.axes({ grille: true });
        const n = 4000;
        const pts = Array.from({ length: n + 1 }, (_, k) => -1.2 + (2.4 * k) / n).map((u) => [u, (F.f(r.a + u * rr) - fa) / rr]);
        repZoom.trace(pts, { couleur: col.trait, largeur: 2 });
        if (derivable) repZoom.droite(0, 0, 1, d, { couleur: col.accent, largeur: 1.6, tirets: [6, 4] });
        repZoom.point(0, 0, { rayon: 4, couleur: col.perturbation });
        repZoom.texte(1, -1, `fenêtre de taille r = 10${exposant(r.lr.toFixed(2))}`, { couleur: col.discret, align: 'right', dx: -4, dy: -6, fond: true });
      }

      // ---- Reste ----
      const hs = Array.from({ length: 301 }, (_, k) => LR[0] + ((LR[1] - LR[0]) * k) / 300);
      const droite = hs.map((lh) => [lh, Math.log10(Math.max(reste(r.fn, r.a, 10 ** lh), 1e-16))]);
      const gauche = hs.map((lh) => [lh, Math.log10(Math.max(reste(r.fn, r.a, -(10 ** lh)), 1e-16))]);
      const ys = [...droite, ...gauche].map(([, v]) => v);
      repReste.fixeCadre(LR, [Math.max(-8, Math.floor(Math.min(...ys))), Math.max(1, Math.ceil(Math.max(...ys)))]);
      if (repReste.prepare()) {
        repReste.axes({ noms: [[['log₁₀ ', false], ['h', true]], [['log₁₀ reste/|h|', false]]], nomsAuBord: true, enL: true });
        repReste.trace(gauche, { couleur: col.accent, largeur: 1.4, tirets: [5, 4] });
        repReste.trace(droite, { couleur: col.accent, largeur: 2 });
        repReste.trace([[r.lr, -100], [r.lr, 100]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
      }
      const noteTexte = r.a === 0 ? F.note : derivable ? `En $a = ${latexNombreFixe(r.a, 2)}$, $f$ est dérivable, $f'(a) = ${latexNombreFixe(d, 3)}$ : le reste divisé par $|h|$ tend vers $0$, comme $h$.` : F.note;
      outils.rendTexte(note, noteTexte);
      outils.glossaire(note, ['classe C1']);
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champR.fixe(r.lr);
        dessine();
      },
    };
  },
};
