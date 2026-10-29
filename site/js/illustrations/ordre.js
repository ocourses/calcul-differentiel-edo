// Ordre de convergence et tableau de Butcher (poly, chapitre « Intégration
// numérique », méthodes de Runge-Kutta explicites). On choisit un schéma
// classique ou l'on modifie les coefficients du tableau ; la page vérifie les
// conditions d'ordre (Σ bᵢ = 1, Σ bᵢcᵢ = 1/2…) et mesure l'ordre sur l'exemple
// du poly, ẋ = (1 − 2t) x, x(0) = 1 sur [0, 3], de solution x(t) = e^{t − t²} :
// l'erreur globale en fonction de h, en échelle log-log, est une droite de
// pente p. Convention du poly : c₁ = 0 et cⱼ = aⱼ₁ + … + aⱼ,ⱼ₋₁.

import { ajoutePas, champ } from '../../socle/js/ui/controls.js';
import { chiffresEntiers, latexNombreFixe, latexPositifFixe, latexScientifiqueFixe } from '../../socle/js/ui/format.js';
import { Repere } from '../../socle/js/ui/repere.js';
import { couleurs } from '../../socle/js/ui/theme.js';
import { barreOutils, boutonInfo, carte, choixRadios, glisse, legende, paragraphe, toile } from './commun.js';

// Les schémas de l'exemple du poly : A (lignes 2 à s, sous la diagonale) et b,
// en fractions écrites comme dans le poly.
export const SCHEMAS = {
  euler: { nom: 'Euler', A: '', b: '1', ordre: 1 },
  runge: { nom: 'Runge', A: '1/2', b: '0, 1', ordre: 2 },
  heun: { nom: 'Heun', A: '1/3; 0, 2/3', b: '1/4, 0, 3/4', ordre: 3 },
  rk4: { nom: 'RK4', A: '1/2; 0, 1/2; 0, 0, 1', b: '1/6, 2/6, 2/6, 1/6', ordre: 4 },
  rk38: { nom: 'RK4, règle 3/8', A: '1/3; -1/3, 1; 1, -1, 1', b: '1/8, 3/8, 3/8, 1/8', ordre: 4 },
};

// Nombre écrit au clavier : décimal (virgule ou point) ou fraction p/q.
export function lisNombre(texte) {
  const t = String(texte).trim().replace(/,/g, '.').replace('−', '-');
  if (t === '') return 0;
  const m = t.match(/^(-?[\d.]+)\s*\/\s*([\d.]+)$/);
  const v = m ? Number(m[1]) / Number(m[2]) : Number(t);
  return Number.isFinite(v) ? v : NaN;
}

// Tableau { s, A, b, c } à partir des chaînes de l'URL : « a21; a31, a32; … » et
// « b1, b2, … », décimaux écrits avec un point. Le nombre d'étages s est la
// longueur de b (quatre au plus) ; un coefficient illisible vaut 0.
export function tableau(chaineA, chaineB) {
  const lit = (x) => {
    const v = lisNombre(x);
    return Number.isFinite(v) ? v : 0;
  };
  const b = chaineB.split(',').slice(0, 4).map(lit);
  const s = b.length;
  const lignes = chaineA ? chaineA.split(';').map((l) => l.split(',').map(lit)) : [];
  const A = Array.from({ length: s }, (_, i) => Array.from({ length: s }, (_, j) => (j < i ? (lignes[i - 1]?.[j] ?? 0) : 0)));
  const c = A.map((ligne) => ligne.reduce((x, y) => x + y, 0));
  return { s, A, b, c };
}

// Les conditions d'ordre jusqu'à 4 pour un schéma explicite avec
// cⱼ = Σₖ aⱼₖ : { ordre, expression, valeur, cible }.
export function conditions({ s, A, b, c }) {
  const somme = (f) => {
    let v = 0;
    for (let i = 0; i < s; i++) v += f(i);
    return v;
  };
  const Ac = (i) => somme((j) => A[i][j] * c[j]);
  const Ac2 = (i) => somme((j) => A[i][j] * c[j] * c[j]);
  const AAc = (i) => somme((j) => A[i][j] * Ac(j));
  return [
    { ordre: 1, expression: '\\sum_i b_i', valeur: somme((i) => b[i]), cible: 1 },
    { ordre: 2, expression: '\\sum_i b_i c_i', valeur: somme((i) => b[i] * c[i]), cible: 1 / 2 },
    { ordre: 3, expression: '\\sum_i b_i c_i^2', valeur: somme((i) => b[i] * c[i] ** 2), cible: 1 / 3 },
    { ordre: 3, expression: '\\sum_{i,j} b_i a_{ij} c_j', valeur: somme((i) => b[i] * Ac(i)), cible: 1 / 6 },
    { ordre: 4, expression: '\\sum_i b_i c_i^3', valeur: somme((i) => b[i] * c[i] ** 3), cible: 1 / 4 },
    { ordre: 4, expression: '\\sum_{i,j} b_i c_i a_{ij} c_j', valeur: somme((i) => b[i] * c[i] * Ac(i)), cible: 1 / 8 },
    { ordre: 4, expression: '\\sum_{i,j} b_i a_{ij} c_j^2', valeur: somme((i) => b[i] * Ac2(i)), cible: 1 / 12 },
    { ordre: 4, expression: '\\sum_{i,j,k} b_i a_{ij} a_{jk} c_k', valeur: somme((i) => b[i] * AAc(i)), cible: 1 / 24 },
  ];
}

// Ordre donné par les conditions : le plus grand p dont toutes les conditions
// d'ordre ≤ p sont vérifiées (0 si le schéma n'est pas consistant). Au-delà de
// 4, on ne vérifie pas : « au moins 4 ».
export function ordreTheorique(t, tol = 1e-10) {
  const cs = conditions(t);
  let p = 0;
  for (let q = 1; q <= 4; q++) {
    if (cs.filter((x) => x.ordre === q).every((x) => Math.abs(x.valeur - x.cible) <= tol)) p = q;
    else break;
  }
  return p;
}

// Un pas de la méthode de Runge-Kutta explicite pour un problème scalaire.
export function pas({ s, A, b, c }, f, t, x, h) {
  const k = [];
  for (let i = 0; i < s; i++) {
    let xi = x;
    for (let j = 0; j < i; j++) xi += h * A[i][j] * k[j];
    k.push(f(t + c[i] * h, xi));
  }
  return x + h * b.reduce((v, bi, i) => v + bi * k[i], 0);
}

// Exemple du poly.
export const PROBLEME = { f: (t, x) => (1 - 2 * t) * x, exacte: (t) => Math.exp(t - t * t), t0: 0, tf: 3, x0: 1 };

// Solution approchée sur [t₀, t_f] avec N pas uniformes.
export function resout(t, N) {
  const { f, t0, tf, x0 } = PROBLEME;
  const h = (tf - t0) / N;
  const pts = [[t0, x0]];
  let x = x0;
  for (let i = 0; i < N; i++) {
    x = pas(t, f, t0 + i * h, x, h);
    pts.push([t0 + (i + 1) * h, x]);
  }
  return pts;
}

// Erreur globale max |x(tᵢ) − xᵢ| pour une suite de nombres de pas.
export function erreurs(t, Ns) {
  return Ns.map((N) => {
    const pts = resout(t, N);
    return { h: (PROBLEME.tf - PROBLEME.t0) / N, erreur: Math.max(...pts.map(([ti, xi]) => Math.abs(xi - PROBLEME.exacte(ti)))) };
  });
}

// Pente mesurée : moindres carrés sur les points dont l'erreur est au-dessus
// des erreurs d'arrondi (1e-12) et dans la zone asymptotique (h ≤ 0,1).
export function penteMesuree(points) {
  const q = points.filter((p) => p.erreur > 1e-12 && p.h <= 0.1 + 1e-12).map((p) => [Math.log10(p.h), Math.log10(p.erreur)]);
  if (q.length < 2) return NaN;
  const mx = q.reduce((s, [x]) => s + x, 0) / q.length;
  const my = q.reduce((s, [, y]) => s + y, 0) / q.length;
  const num = q.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
  const den = q.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  return num / den;
}

const NS = [6, 8, 12, 15, 20, 30, 40, 60, 100, 150, 200, 300, 500, 1000, 2000];
// Borne du curseur de N ; l'URL va jusqu'à 2000, mais aucun geste n'y mène.
const N_MAX = 200;

// Une valeur très proche d'une fraction simple (après un pas de 1/12 arrondi
// au millionième) est remplacée par cette fraction, exactement.
export function aimante(v) {
  for (const q of [1, 2, 3, 4, 6, 8, 12, 24]) {
    const p = Math.round(v * q);
    if (Math.abs(p / q - v) < 1e-6) return p / q;
  }
  return v;
}

// Écriture d'un coefficient : la fraction du poly si la valeur en est une
// simple, sinon le décimal, avec une virgule (`decimal` = ',') dans sa case ou
// un point dans l'URL, où la virgule sépare les coefficients.
export function ecrit(v, decimal = ',') {
  for (const q of [1, 2, 3, 4, 6, 8, 12, 24]) {
    const p = Math.round(v * q);
    if (Math.abs(p / q - v) < 1e-12) return q === 1 ? String(p) : `${p}/${q}`;
  }
  return String(Number(v.toPrecision(6))).replace('.', decimal);
}

export default {
  etat: { schema: 'rk4', A: SCHEMAS.rk4.A, b: SCHEMAS.rk4.b, N: 15 },

  choix: { schema: [...Object.keys(SCHEMAS), 'perso'] },

  termes: ['tableau de Butcher', 'ordre de consistance', 'erreur globale', 'consistante', 'méthode à un pas', 'erreur locale de consistance', 'méthode stable'],

  rappel: [
    'Une méthode de Runge-Kutta explicite à $s$ étages, une méthode à un pas, est donnée par son tableau de Butcher : les $c_i$, les $a_{ij}$ ($j < i$) et les $b_i$, avec $c_1 = 0$ et $c_j = a_{j1} + \\cdots + a_{j,j-1}$.',
    'Elle est consistante si et seulement si $\\sum_i b_i = 1$. Son ordre de consistance est $p$ si l’erreur locale de consistance est en $O(h^{p+1})$, uniformément.',
    'Pour une méthode stable d’ordre $p$, l’erreur globale est majorée par $M h_{\\max}^p$. En échelle log-log,',
    '$$\\log E = \\log M + p \\log h :$$',
    'une droite de pente $p$. L’ordre de convergence est l’ordre de consistance.',
    'Les conditions d’ordre se trouvent par développement de Taylor. À deux étages, l’ordre $2$ demande $b_1 + b_2 = 1$ et $b_2 a_{21} = 1/2$ (exercice du poly) ; les conditions d’ordre $3$ et $4$ sont admises.',
  ],

  essais: [
    { texte: 'RK4 : l’erreur globale est une droite de pente $4$. Divisez $h$ par $10$ : par combien l’erreur est-elle divisée ?', etat: { schema: 'rk4', A: SCHEMAS.rk4.A, b: SCHEMAS.rk4.b, N: 15 } },
    { texte: 'Euler, Runge, Heun : retrouvez les ordres $1$, $2$ et $3$ du poly, sur la pente et dans la liste des conditions.', etat: { schema: 'runge', A: SCHEMAS.runge.A, b: SCHEMAS.runge.b, N: 15 } },
    { texte: 'Partez de Runge et remplacez $b = (0, 1)$ par $(1/2, 1/2)$ : est-ce encore d’ordre $2$ ? Essayez ensuite $a_{21} = 1$ (la méthode de Heun d’ordre $2$).', etat: { schema: 'runge', A: SCHEMAS.runge.A, b: SCHEMAS.runge.b, N: 15 } },
    { texte: 'Partez de RK4 et changez $b_1$ en $0{,}2$ : $\\sum b_i \\neq 1$, la méthode n’est plus consistante. Que devient l’erreur quand $h \\to 0$ ?', etat: { schema: 'rk4', A: SCHEMAS.rk4.A, b: SCHEMAS.rk4.b, N: 15 } },
    { texte: 'Avec RK4, $N = 15$ pas donnent une erreur de l’ordre de $2 \\cdot 10^{-4}$. Combien de pas faut-il à Euler pour la même précision ? Lisez-le sur les courbes.', etat: { schema: 'euler', A: SCHEMAS.euler.A, b: SCHEMAS.euler.b, N: 15 } },
  ],

  monte(zone, outils) {
    const r = outils.etat;

    const choix = choixRadios(barreOutils(zone), {
      nom: 'schema',
      options: [...Object.entries(SCHEMAS).map(([valeur, { nom }]) => ({ valeur, texte: nom })), { valeur: 'perso', texte: 'modifié' }],
      change: (valeur) => {
        if (valeur === 'perso') return;
        outils.change({ schema: valeur, A: SCHEMAS[valeur].A, b: SCHEMAS[valeur].b });
        construitTableau();
        dessine();
      },
    });

    const grille = document.createElement('div');
    grille.className = 'grille-2 principale';
    zone.appendChild(grille);
    const gauche = document.createElement('div');
    gauche.className = 'colonne-cartes';
    grille.appendChild(gauche);
    // À droite, l'ordre lu sur l'erreur, puis l'exemple qui la produit.
    const droite = document.createElement('div');
    droite.className = 'colonne-cartes';
    grille.appendChild(droite);

    // ---- Tableau de Butcher modifiable ----------------------------------------------------------------
    const cTableau = carte(gauche, 'Tableau de Butcher');
    const zoneTableau = document.createElement('div');
    zoneTableau.className = 'butcher';
    cTableau.appendChild(zoneTableau);
    const zoneConditions = document.createElement('div');
    cTableau.appendChild(zoneConditions);
    const verdict = paragraphe(cTableau, '', 'note conclusion-fixe');

    // Les coefficients en chaînes, modifiés case par case.
    function ecritEtat(t) {
      const A = t.A.slice(1).map((ligne, i) => ligne.slice(0, i + 1).map((v) => ecrit(v, '.')).join(', ')).join('; ');
      const b = t.b.map((v) => ecrit(v, '.')).join(', ');
      const preset = Object.entries(SCHEMAS).find(([, S]) => {
        const u = tableau(S.A, S.b);
        return u.s === t.s && u.b.every((v, i) => Math.abs(v - t.b[i]) < 1e-12) && u.A.flat().every((v, i) => Math.abs(v - t.A.flat()[i]) < 1e-12);
      });
      outils.change({ A, b, schema: preset ? preset[0] : 'perso' });
    }

    // Le tableau n'est reconstruit que si sa structure change (schéma, étages). Une
    // case modifiée est mise à jour en place : reconstruire retirerait de la page le
    // bouton ▲ ▼ tenu, qui ne recevrait plus son « relâché », et la case varierait
    // sans fin.
    function construitTableau() {
      const t = tableau(r.A, r.b);
      const table = document.createElement('table');
      const colonneC = [];
      const caseNombre = (v, change, nom) => {
        let courante = v;
        const input = document.createElement('input');
        Object.assign(input, { type: 'text', inputMode: 'decimal', value: ecrit(v) });
        input.setAttribute('aria-label', nom);
        input.addEventListener('change', () => {
          const x = aimante(lisNombre(input.value));
          if (!Number.isFinite(x)) {
            input.value = ecrit(courante);
            return;
          }
          courante = x;
          input.value = ecrit(x);
          change(x);
          t.c = t.A.map((ligne) => ligne.reduce((a, b) => a + b, 0));
          colonneC.forEach((td, i) => (td.textContent = ecrit(t.c[i])));
          ecritEtat(t);
          dessine();
        });
        const td = document.createElement('td');
        td.appendChild(input);
        ajoutePas(input, { pas: 1 / 12, nom, lis: lisNombre });
        return td;
      };
      for (let i = 0; i < t.s; i++) {
        const tr = document.createElement('tr');
        const tc = document.createElement('td');
        tc.className = 'c';
        tc.textContent = ecrit(t.c[i]);
        tc.title = `c${i + 1} = somme de la ligne`;
        colonneC.push(tc);
        tr.appendChild(tc);
        for (let j = 0; j < t.s; j++) {
          if (j < i) tr.appendChild(caseNombre(t.A[i][j], (x) => (t.A[i][j] = x), `a${i + 1}${j + 1}`));
          else tr.appendChild(document.createElement('td'));
        }
        table.appendChild(tr);
      }
      const tb = document.createElement('tr');
      tb.className = 'ligne-b';
      tb.appendChild(document.createElement('td'));
      for (let j = 0; j < t.s; j++) tb.appendChild(caseNombre(t.b[j], (x) => (t.b[j] = x), `b${j + 1}`));
      table.appendChild(tb);
      // Nombre d'étages : on ajoute ou retire un étage (nul).
      const etages = document.createElement('div');
      etages.className = 'zoom';
      etages.innerHTML = '<span class="petit">étages :</span><button type="button" data-e="-1" aria-label="Retirer un étage">−</button><button type="button" data-e="1" aria-label="Ajouter un étage">+</button>';
      etages.addEventListener('click', (ev) => {
        const e = Number(ev.target.closest('button')?.dataset.e);
        if (!e) return;
        const s = Math.max(1, Math.min(4, t.s + e));
        if (s === t.s) return;
        const u = { s, A: Array.from({ length: s }, (_, i) => Array.from({ length: s }, (_, j) => t.A[i]?.[j] ?? 0)), b: Array.from({ length: s }, (_, j) => t.b[j] ?? 0) };
        ecritEtat(u);
        construitTableau();
        dessine();
      });
      zoneTableau.replaceChildren(table, etages);
    }

    // ---- Solution approchée ------------------------------------------------------------------------------
    const cSol = carte(droite, 'Exemple du poly : $\\dot x = (1 - 2t)\\,x$, $x(0) = 1$');
    boutonInfo(cSol, [
      ['ligne', '--texte', 'La solution exacte $x(t) = e^{t - t^2}$.'],
      ['point', '--accent', 'Les valeurs $x_i$ du schéma, avec $N$ pas sur $[0, 3]$.'],
    ]);
    const canvasSol = toile(cSol, '16 / 7', () => dessine());
    const repSol = new Repere(canvasSol, { x: [0, 3], y: [-0.2, 1.5] });
    const champN = champ(cSol, { latex: 'N', min: 2, max: N_MAX, pas: 1, valeur: r.N }, (v) => {
      outils.change({ N: Math.max(1, Math.round(v)) });
      dessine();
    });

    // ---- Ordre : erreur globale en log-log ---------------------------------------------------------------
    const cOrdre = carte(droite, 'Erreur globale en fonction de $h$');
    droite.prepend(cOrdre);
    boutonInfo(cOrdre, [
      ['ligne', '--accent', 'L’erreur globale $\\max_i |x(t_i) - x_i|$ du schéma choisi, en échelle log-log.'],
      ['ligne', '--discret', 'Celles des schémas classiques : Euler, Runge, Heun, RK4, chacune nommée au début de sa courbe, en couleur pour le schéma choisi, en gris pour les autres.'],
      ['tirets', '--perturbation', 'Le pas $h = 3/N$ de la solution affichée à gauche : cliquez ou faites glisser pour le changer.'],
    ]);
    const canvasOrdre = toile(cOrdre, '16 / 10', () => dessine());
    canvasOrdre.classList.add('saisissable');
    const repOrdre = new Repere(canvasOrdre, { x: [-3.4, -0.2], y: [-16, 1] });
    // log₁₀ h choisi sur la figure : N = 3/h, entier, dans les bornes du curseur.
    glisse(canvasOrdre, repOrdre, {
      deplace: (lh) => {
        outils.change({ N: Math.max(2, Math.min(N_MAX, Math.round(3 / 10 ** lh))) });
        champN.fixe(r.N);
        dessine();
      },
    });
    const zoneLegende = document.createElement('div');
    cOrdre.appendChild(zoneLegende);
    const mesure = paragraphe(cOrdre, '', 'note conclusion-fixe');

    // Nom écrit le long d'une courbe (pixels), au premier point fini, penché selon sa
    // pente ; `decalage` px au-dessus (< 0) ou au-dessous (> 0).
    function nomme(rep, xy, nom, couleur, gras, decalage) {
      // Du plus petit h au plus grand : le texte part de la gauche et se lit à l'endroit.
      const pts = xy.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b)).toSorted((u, v) => u[0] - v[0]);
      if (pts.length < 3) return;
      const [[x1, y1], [x2, y2]] = [pts[0], pts[2]];
      const [px, py] = [rep.X(x1), rep.Y(y1)];
      const angle = Math.atan2(rep.Y(y2) - py, rep.X(x2) - rep.X(x1));
      const ctx = rep.ctx;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.font = `${gras ? '700 ' : ''}12px system-ui, sans-serif`;
      ctx.fillStyle = couleur;
      ctx.textAlign = 'left';
      ctx.fillText(nom, 6, decalage);
      ctx.restore();
    }

    // Courbes des schémas classiques, calculées une fois.
    const reference = Object.fromEntries(['euler', 'runge', 'heun', 'rk4'].map((k) => [k, erreurs(tableau(SCHEMAS[k].A, SCHEMAS[k].b), NS)]));

    function dessine() {
      const col = couleurs();
      // N lu dans l'URL : entier entre 1 et 2000.
      if (!Number.isInteger(r.N) || r.N < 1 || r.N > 2000) outils.change({ N: Math.max(1, Math.min(2000, Math.round(r.N) || 15)) });
      choix.fixe(r.schema);
      const t = tableau(r.A, r.b);

      // ---- Conditions d'ordre ----
      const p = ordreTheorique(t);
      const nouveau = document.createElement('div');
      const table = document.createElement('table');
      table.className = 'valeurs conditions';
      for (const x of conditions(t)) {
        const tr = document.createElement('tr');
        const ok = Math.abs(x.valeur - x.cible) <= 1e-10;
        const cellules = [`\\text{ordre } ${x.ordre}`, `${x.expression} = ${latexNombreFixe(x.valeur, 4)}`, `\\text{cible } ${ecrit(x.cible).replace('/', '/')}`];
        for (const l of cellules) {
          const td = document.createElement('td');
          outils.rend(td, l, false);
          tr.appendChild(td);
        }
        const td = document.createElement('td');
        td.textContent = ok ? '✓' : '✗';
        td.className = ok ? 'vrai' : 'faux';
        tr.appendChild(td);
        table.appendChild(tr);
      }
      nouveau.appendChild(table);
      zoneConditions.replaceChildren(...nouveau.childNodes);
      outils.rendTexte(verdict, p === 0 ? 'Non consistante : $\\sum_i b_i \\neq 1$.' : p === 4 ? 'Conditions vérifiées jusqu’à l’ordre $4$ : ordre au moins $4$.' : `Ordre $${p}$ : les conditions d’ordre $${p + 1}$ ne sont pas toutes vérifiées.`);

      // ---- Solution approchée ----
      const N = r.N;
      const pts = resout(t, N);
      const ys = pts.map(([, x]) => x).filter(Number.isFinite);
      repSol.fixeCadre([0, 3], [Math.min(-0.1, ...ys) - 0.1, Math.max(1.4, ...ys) + 0.1]);
      if (repSol.prepare()) {
        repSol.axes({ noms: ['t', 'x'] });
        repSol.trace(Array.from({ length: 301 }, (_, k) => [k / 100, PROBLEME.exacte(k / 100)]), { couleur: col.trait, largeur: 1.6 });
        repSol.trace(pts, { couleur: col.accent, largeur: 1, alpha: 0.6 });
        for (const [ti, xi] of pts) repSol.point(ti, xi, { rayon: 3.5, couleur: col.accent });
      }

      // ---- Log-log ----
      const ers = erreurs(t, NS);
      const toutes = [...ers, ...Object.values(reference).flat()].map((q) => Math.log10(q.erreur)).filter(Number.isFinite);
      repOrdre.fixeCadre([-3.4, -0.2], [Math.max(-16.5, Math.floor(Math.min(...toutes)) - 0.5), Math.min(3, Math.ceil(Math.max(...toutes)) + 0.5)]);
      if (repOrdre.prepare()) {
        repOrdre.axes({ noms: [[['log₁₀ ', false], ['h', true]], [['log₁₀ erreur', false]]], nomsAuBord: true, enL: true });
        for (const pts2 of Object.values(reference)) repOrdre.trace(pts2.map((q) => [Math.log10(q.h), Math.log10(q.erreur)]), { couleur: col.discret, largeur: 1, alpha: 0.6 });
        const xy = ers.map((q) => [Math.log10(q.h), Math.log10(q.erreur)]);
        repOrdre.trace(xy, { couleur: col.accent, largeur: 2.4 });
        // Le nom de chaque schéma au début de sa courbe (petits h), penché comme elle :
        // en couleur si c'est le schéma choisi, en gris sinon ; un schéma qui n'est pas
        // l'un des quatre classiques (3/8, modifié) est nommé sous sa courbe.
        for (const [cle, pts2] of Object.entries(reference)) nomme(repOrdre, pts2.map((q) => [Math.log10(q.h), Math.log10(q.erreur)]), SCHEMAS[cle].nom, r.schema === cle ? col.accent : col.discret, r.schema === cle, -7);
        if (!(r.schema in reference)) nomme(repOrdre, xy, r.schema === 'perso' ? 'schéma modifié' : SCHEMAS[r.schema].nom, col.accent, true, 15);
        for (const [a, b] of xy) if (Number.isFinite(b)) repOrdre.point(a, b, { rayon: 3, couleur: col.accent });
        const lh = Math.log10(3 / N);
        repOrdre.trace([[lh, -30], [lh, 30]], { couleur: col.perturbation, largeur: 1, tirets: [4, 4] });
      }
      zoneLegende.replaceChildren();
      legende(zoneLegende, [
        { texte: r.schema === 'perso' ? 'schéma modifié' : SCHEMAS[r.schema].nom, couleur: col.accent },
        { texte: 'schémas classiques', couleur: col.discret },
      ]);
      const pm = penteMesuree(ers);
      const E = ers.find((q) => Math.abs(q.h - 3 / N) < 1e-12)?.erreur ?? Math.max(...pts.map(([ti, xi]) => Math.abs(xi - PROBLEME.exacte(ti))));
      outils.rendTexte(mesure, `Pente mesurée : $${Number.isFinite(pm) ? latexNombreFixe(pm, 2) : '—'}$. Avec $N = ${latexPositifFixe(N, 0, chiffresEntiers(N_MAX))}$ pas, erreur globale $${latexScientifiqueFixe(E)}$.`);
    }

    function applique() {
      champN.fixe(r.N);
      construitTableau();
      dessine();
    }

    outils.surTheme(dessine);
    applique();
    return { applique };
  },
};
