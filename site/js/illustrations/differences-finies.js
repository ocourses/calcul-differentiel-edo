// Dérivées numériques : le « V » de l'erreur (TP « Calcul de dérivées »). On
// approche f'(x)·v, ici pour f = cos en x = π/3, par
//   différences avant    (f(x + h) − f(x))/h,             erreur h|f''|/2 + 2 eps|f|/h ;
//   différences centrées (f(x + h) − f(x − h))/(2h),      erreur h²|f'''|/6 + eps|f|/h ;
//   pas complexe         Im f(x + ih)/h,                  erreur h²|f'''|/6, sans soustraction ;
// et l'on trace l'erreur réellement obtenue en virgule flottante en fonction
// de h : la troncature décroît avec h, l'arrondi croît quand h → 0, d'où le V
// et le pas optimal 2√η ou ∛(3η) (valeurs du TP), η l'erreur relative
// d'évaluation de f. Le pas complexe n'a pas de soustraction, donc pas d'arrondi
// qui explose. La fonction bruitée du TP montre que η n'est pas toujours eps :
// avec un bruit relatif de 10⁻⁸, η = 10⁻⁸ et le V se déplace (pas optimal vers
// 10⁻⁴), alors que le pas complexe garde l'erreur à son niveau, sans l'amplifier.

import { champ } from '../../socle/js/ui/controls.js';
import { latexScientifiqueFixe, nombreScientifique } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, boutonVue, carte, choixRadios, glisse, legende, paragraphe, tableau, toile, zoomable } from './commun.js';

export const EPS = 2 ** -52;
export const X0 = Math.PI / 3;

// Erreur relative d'évaluation de f (le eps_mach L_f du TP, ramené à |f|) :
// la précision machine, ou le bruit de la fonction bruitée.
export const ETA = { cos: EPS, bruit: 1e-8 };

// Pas optimaux du TP pour une erreur d'évaluation η (L_f ≃ M ≃ |f|).
export const pasOptimaux = (eta) => ({ avant: 2 * Math.sqrt(eta), centre: Math.cbrt(3 * eta) });

// Générateur pseudo-aléatoire reproductible (mulberry32) et loi normale
// (Box-Muller), pour le bruit de la fonction du TP.
export function generateur(graine) {
  let a = graine >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-300)) * Math.cos(2 * Math.PI * u());
}

// cos sur les complexes : cos(a + ib) = cos a cosh b − i sin a sinh b.
const cosComplexe = ([a, b]) => [Math.cos(a) * Math.cosh(b), -Math.sin(a) * Math.sinh(b)];

// Les fonctions : évaluation réelle et complexe ; `bruit` multiplie par
// (1 + 10⁻⁸ N(0, 1)), sur les parties réelle et imaginaire (TP).
export function fonction(cle, aleatoire = generateur(1)) {
  const facteur = () => (cle === 'bruit' ? 1 + 1e-8 * aleatoire() : 1);
  return {
    reel: (x) => Math.cos(x) * facteur(),
    complexe: (z) => {
      const [re, im] = cosComplexe(z);
      const k = facteur();
      return [re * k, im * k];
    },
  };
}

export const derivee = (x) => -Math.sin(x);

// Les trois schémas, pour un pas h.
export function schemas(F, x, h) {
  return {
    avant: (F.reel(x + h) - F.reel(x)) / h,
    centre: (F.reel(x + h) - F.reel(x - h)) / (2 * h),
    complexe: F.complexe([x, h])[1] / h,
  };
}

// Modèles d'erreur du TP, pour f = cos en x et une erreur d'évaluation η :
// [troncature, arrondi] de chaque schéma ; `modeles` en fait la somme.
export function parts(x, h, eta = EPS) {
  const [f, f2, f3] = [Math.abs(Math.cos(x)), Math.abs(Math.cos(x)), Math.abs(Math.sin(x))];
  return {
    avant: [(h / 2) * f2, (2 * eta * f) / h],
    centre: [((h * h) / 6) * f3, (eta * f) / h],
    complexe: [((h * h) / 6) * f3, eta * Math.abs(Math.sin(x))],
  };
}

export function modeles(x, h, eta = EPS) {
  return Object.fromEntries(Object.entries(parts(x, h, eta)).map(([k, [t, a]]) => [k, t + a]));
}

const STYLES = {
  avant: { texte: 'différences avant', couleur: (c) => c.series[0] },
  centre: { texte: 'différences centrées', couleur: (c) => c.series[1] },
  complexe: { texte: 'pas complexe', couleur: (c) => c.series[2] },
};

export default {
  etat: { fn: 'cos', lh: -5 },

  choix: { fn: ['cos', 'bruit'] },

  termes: ['Taylor-Lagrange', 'dérivée directionnelle'],

  rappel: [
    'Avec $g(h) = f(x + hv)$, $g\'(0) = f\'(x)\\cdot v$ est la dérivée directionnelle de $f$ en $x$ selon $v$. La formule de Taylor donne',
    '$$\\frac{g(h) - g(0)}{h} = g\'(0) + \\frac{h}{2} g\'\'(0) + o(h),$$',
    '$$\\frac{g(h) - g(-h)}{2h} = g\'(0) + \\frac{h^2}{6} g\'\'\'(0) + o(h^2) :$$',
    'les différences avant sont d’ordre $1$, les centrées d’ordre $2$ (erreur de troncature, majorée par Taylor-Lagrange).',
    'Chaque évaluation de $f$ est entachée d’une erreur relative $\\eta$, divisée ici par $h$ : l’erreur d’arrondi croît quand $h \\to 0$. Sur machine, $\\eta = \\mathrm{eps} \\approx 2{,}2 \\cdot 10^{-16}$ ; pour une fonction bruitée, $\\eta$ est le niveau du bruit. Le meilleur pas fait la balance entre les deux, comme dans le TP :',
    '$$h^*_{\\text{avant}} \\approx 2\\sqrt{\\eta}, \\qquad h^*_{\\text{centré}} \\approx \\sqrt[3]{3\\,\\eta}.$$',
    'Le pas complexe, $\\operatorname{Im} f(x + ih)/h$, est d’ordre $2$ sans aucune soustraction : on peut prendre $h$ aussi petit qu’on veut.',
  ],

  essais: [
    { texte: 'Repérez le fond du V de chaque courbe. Pour les différences avant, il est vers $h \\approx 10^{-8}$, et l’erreur y vaut environ $10^{-8}$.', etat: { fn: 'cos', lh: -8 } },
    { texte: 'Différences centrées : le pas optimal est plus grand, vers $10^{-5}$, et l’erreur y descend vers $10^{-11}$. Lisez-le dans le tableau.', etat: { fn: 'cos', lh: -5.2 } },
    { texte: 'Pas complexe : faites descendre $h$ jusqu’à $10^{-16}$. L’erreur reste au niveau de la précision machine.', etat: { fn: 'cos', lh: -16 } },
    { texte: 'Fonction bruitée du TP : ce n’est plus $\\mathrm{eps}$ qui compte mais le bruit, $\\eta = 10^{-8}$. Le fond du V des différences avant passe en $2\\sqrt{\\eta} = 2 \\cdot 10^{-4}$, à une erreur vers $10^{-4}$ ; le pas complexe ne descend plus sous $10^{-8}$.', etat: { fn: 'bruit', lh: -3.7 } },
    { texte: 'À droite du V, l’erreur suit la troncature : pente $1$ (avant) ou $2$ (centrées, complexe). À gauche, l’arrondi : pente $-1$.', etat: { fn: 'cos', lh: -2 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'fn',
      options: [
        { valeur: 'cos', latex: 'f(x) = \\cos x,\\ x = \\pi/3' },
        { valeur: 'bruit', latex: 'f(x) = \\cos x\\,(1 + 10^{-8}\\,\\mathcal N(0, 1))' },
      ],
      change: (valeur) => {
        outils.change({ fn: valeur });
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-large principale';
    zone.appendChild(grille);

    const cErr = carte(grille, 'Erreur en fonction du pas $h$');
    boutonInfo(cErr, [
      ['ligne', '--serie-1', 'Différences avant : l’erreur réellement obtenue, en échelle log-log.'],
      ['ligne', '--serie-2', 'Différences centrées.'],
      ['ligne', '--serie-3', 'Pas complexe.'],
      ['tirets', '--discret', 'Les modèles d’erreur du TP, troncature plus arrondi, de la même couleur ; les verticales grises sont les pas optimaux $2\\sqrt{\\eta}$ et $\\sqrt[3]{3\\,\\eta}$.'],
      ['tirets', '--perturbation', 'Le pas $h$ choisi : cliquez ou faites glisser sur la figure. La molette zoome, le clic droit déplace la vue.'],
    ]);
    const canvas = toile(cErr, '16 / 10', () => dessine());
    const CADRE = { x: [-17, 0], y: [-17.2, 0] };
    const rep = new Repere(canvas, CADRE);
    const barre = document.createElement('div');
    barre.className = 'barre-legende';
    cErr.appendChild(barre);
    const zoneLegende = document.createElement('div');
    barre.appendChild(zoneLegende);
    // Bouton gauche : le pas h ; bouton droit : la vue.
    const zoom = zoomable(canvas, rep, { barre, auto: () => CADRE, redessine: () => dessine(), deplacer: 'droit' });
    glisse(canvas, rep, {
      prend: (lh, e, ev) => !boutonVue(ev),
      deplace: (lh) => {
        outils.change({ lh: Number(Math.max(-17, Math.min(0, lh)).toFixed(1)) });
        champH.fixe(r.lh);
        dessine();
      },
    });

    const colonne = document.createElement('div');
    colonne.className = 'colonne-cartes';
    grille.appendChild(colonne);
    const cPas = carte(colonne, 'Valeurs pour le pas $h$');
    const champH = champ(cPas, { latex: '\\log_{10} h', min: -17, max: 0, pas: 0.1, pasFleche: 1, valeur: r.lh }, (v) => {
      outils.change({ lh: v });
      dessine();
    });
    const zoneTable = document.createElement('div');
    cPas.appendChild(zoneTable);
    const note = paragraphe(cPas, '', 'note conclusion-fixe');

    // Les deux termes du modèle au pas h : lequel domine dit de quel côté du V on est.
    const cParts = carte(colonne, 'Troncature ou arrondi ?');
    boutonInfo(cParts, [['ligne', '--texte', 'Les deux termes du modèle d’erreur du TP au pas $h$ : la troncature (Taylor) et l’arrondi ($\\eta$ divisé par $h$). Le plus grand des deux est en gras : c’est lui qui fait l’erreur.']]);
    const zoneParts = document.createElement('div');
    cParts.appendChild(zoneParts);
    const noteParts = paragraphe(cParts, '', 'note conclusion-fixe');

    function dessine() {
      const col = couleurs();
      choix.fixe(r.fn);
      const exacte = derivee(X0);
      const F = fonction(r.fn, generateur(12345));
      const eta = ETA[r.fn];
      const nomEta = r.fn === 'bruit' ? 'η' : 'eps';

      const lhs = Array.from({ length: 341 }, (_, k) => -17 + (17 * k) / 340);
      const courbes = { avant: [], centre: [], complexe: [] };
      const modele = { avant: [], centre: [], complexe: [] };
      for (const lh of lhs) {
        const h = 10 ** lh;
        const s = schemas(F, X0, h);
        const m = modeles(X0, h, eta);
        for (const k of Object.keys(courbes)) {
          courbes[k].push([lh, Math.log10(Math.max(Math.abs(s[k] - exacte), 1e-17))]);
          modele[k].push([lh, Math.log10(m[k])]);
        }
      }
      const cadre = zoom.cadre();
      rep.fixeCadre(cadre.x, cadre.y);
      if (rep.prepare()) {
        rep.axes({ noms: [[['log₁₀ ', false], ['h', true]], [['log₁₀ erreur', false]]], nomsAuBord: true, enL: true });
        for (const k of Object.keys(courbes)) {
          const c = STYLES[k].couleur(col);
          rep.trace(modele[k], { couleur: c, largeur: 1, tirets: [5, 4], alpha: 0.8 });
          rep.trace(courbes[k], { couleur: c, largeur: 1.8 });
        }
        // Pas optimaux du TP, en verticales sur toute la hauteur : quel que soit
        // le zoom, on voit le fond du V tomber dessus.
        const opt = pasOptimaux(eta);
        for (const [v, t] of [[opt.avant, `2√${nomEta}`], [opt.centre, `∛(3 ${nomEta})`]]) {
          rep.trace([[Math.log10(v), -30], [Math.log10(v), 30]], { couleur: col.discret, largeur: 1, tirets: [2, 3] });
          rep.texte(Math.log10(v), cadre.y[1] - 0.025 * (cadre.y[1] - cadre.y[0]), t, { couleur: col.discret, align: 'center', fond: true });
        }
        rep.trace([[r.lh, -30], [r.lh, 30]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, Object.keys(STYLES).map((k) => ({ texte: STYLES[k].texte, couleur: STYLES[k].couleur(col) })));

      // ---- Tableau au pas h ----
      const h = 10 ** r.lh;
      const s = schemas(fonction(r.fn, generateur(777)), X0, h);
      const nouveau = document.createElement('div');
      // Largeur fixe (WEB5) : valeurs à 10 décimales, erreurs en notation scientifique.
      const fr = (v) => v.toFixed(10).replace('.', ',').replace('-', '−');
      tableau(nouveau, ['schéma', 'valeur', 'erreur'], [...Object.keys(STYLES).map((k) => [STYLES[k].texte, fr(s[k]), nombreScientifique(Math.abs(s[k] - exacte), 1)]), ['exacte −sin(π/3)', fr(exacte), '']]);
      zoneTable.replaceChildren(...nouveau.childNodes);
      const p = parts(X0, h, eta);
      const tParts = document.createElement('div');
      tableau(tParts, ['schéma', 'troncature', 'arrondi'], Object.keys(STYLES).map((k) => [STYLES[k].texte, ...p[k].map((v) => nombreScientifique(v, 1))]));
      tParts.querySelectorAll('tbody tr').forEach((tr, i) => {
        const [t, a] = p[Object.keys(STYLES)[i]];
        tr.children[t >= a ? 1 : 2].style.fontWeight = '700';
      });
      zoneParts.replaceChildren(...tParts.childNodes);
      const [ta, aa] = p.avant;
      outils.rendTexte(
        noteParts,
        ta >= aa
            ? 'Différences avant : la troncature domine, on est à droite du V. Diminuer $h$ réduit l’erreur.'
            : 'Différences avant : l’arrondi domine, on est à gauche du V. Diminuer $h$ augmente l’erreur.',
      );
      const opt = pasOptimaux(eta);
      const tex = r.fn === 'bruit' ? '\\eta' : '\\mathrm{eps}';
      outils.rendTexte(note, `Pas $h = ${latexScientifiqueFixe(h, 2)}$. Fond du V : $2\\sqrt{${tex}} = ${latexScientifiqueFixe(opt.avant, 2)}$ (avant), $\\sqrt[3]{3\\,${tex}} = ${latexScientifiqueFixe(opt.centre, 2)}$ (centré)${r.fn === 'bruit' ? ', avec $\\eta = 10^{-8}$' : ''}.`);
    }

    outils.surTheme(dessine);
    dessine();
    return {
      applique() {
        champH.fixe(r.lh);
        zoom.reinitialise();
        dessine();
      },
    };
  },
};
