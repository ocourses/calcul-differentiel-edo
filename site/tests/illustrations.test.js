// Tests des illustrations du cours : cohérence du catalogue et du glossaire, et
// résultats mathématiques des pages, vérifiés contre le poly et les TP.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { themes } from '../js/illustrations/catalogue.js';
import { GLOSSAIRE } from '../js/illustrations/glossaire.js';

export const proche = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

// ---- Glossaire : les règles propres au cours -------------------------------------
// (la forme des entrées est vérifiée par verifieCours, socle.test.js)

test('glossaire : chaque définition cite sa source dans le poly', () => {
  for (const [cle, { source, definition }] of Object.entries(GLOSSAIRE)) {
    assert.match(source, /^Poly/, cle);
    // Les formules sont bien fermées.
    assert.equal((definition.match(/\$/g) ?? []).length % 2, 0, cle);
  }
});

// ---- Problème de Cauchy ------------------------------------------------------------

import { EQUATIONS, solutionMaximale } from '../js/illustrations/cauchy.js';

test('cauchy : chaque solution vérifie la condition initiale et l’équation', () => {
  const conditions = { 'moins-carre': [[0, 1], [1, -0.5], [-2, 2]], 'carre-plus-un': [[0, 0], [1, 2]], unite: [[0, 0.3], [-1, 0.9]], lineaire: [[0, 0], [1, -0.5]], xlnx: [[0, 1], [0, Math.E], [0.5, 10], [-1, -3]] };
  for (const [eq, liste] of Object.entries(conditions)) {
    for (const [t0, x0] of liste) {
      const s = solutionMaximale(eq, t0, x0);
      proche(s.x(t0), x0, 1e-9);
      // ẋ = f(t, x) par différences centrées, en quelques instants de ]a, b[.
      for (const u of [0.15, 0.4, 0.6, 0.85]) {
        const a = Math.max(s.a, t0 - 1.5);
        const b = Math.min(s.b, t0 + 1.5);
        const t = a + u * (b - a);
        const d = 1e-6;
        const derivee = (s.x(t + d) - s.x(t - d)) / (2 * d);
        const f = EQUATIONS[eq].f(t, s.x(t));
        assert.ok(Math.abs(derivee - f) <= 1e-4 * Math.max(1, Math.abs(f)), `${eq} (${t0}, ${x0}) en t = ${t} : ${derivee} ≠ ${f}`);
      }
    }
  }
});

test('cauchy : intervalles maximaux du poly', () => {
  // ẋ = −x² : I(t₀, x₀) = ]t₀ − 1/x₀, +∞[ si x₀ > 0.
  const s = solutionMaximale('moins-carre', 0, 2);
  assert.equal(s.a, -0.5);
  assert.equal(s.b, Infinity);
  // ẋ = 1 + x², x(0) = 0 : tan t sur ]−π/2, π/2[.
  const tan = solutionMaximale('carre-plus-un', 0, 0);
  proche(tan.a, -Math.PI / 2);
  proche(tan.b, Math.PI / 2);
  // ẋ = 1 sur ]0, 1[ : la solution atteint 0 et 1 aux bornes.
  const u = solutionMaximale('unite', 0.2, 0.7);
  proche(u.x(u.a), 0);
  proche(u.x(u.b), 1);
  // ẋ = 2t(1 + x), x(0) = 0 : e^{t²} − 1 (exercice du poly), globale.
  const l = solutionMaximale('lineaire', 0, 0);
  proche(l.x(1.3), Math.exp(1.69) - 1, 1e-12);
  assert.equal(l.a, -Infinity);
  // ẋ = x ln x au-delà de e : exp((ln x₀) eᵗ) pour x₀ > e (corrigé du poly).
  const x = solutionMaximale('xlnx', 0, 10);
  proche(x.x(0.7), Math.exp(Math.log(10) * Math.exp(0.7)), 1e-9);
  proche(x.tau, Math.log(1 / Math.log(10)), 1e-12);
});

// ---- Non-unicité ----------------------------------------------------------------------

import { EQUATIONS as EQ_NU, ajuste, penteMaximale, solution as solutionNU } from '../js/illustrations/non-unicite.js';

test('non-unicité : chaque solution (a ≤ b) vérifie l’équation et passe par (t₀, x₀)', () => {
  for (const eq of Object.keys(EQ_NU)) {
    for (const [t0, x0] of [[1.5, 1], [0, 0], [-1, -0.8]]) {
      for (const [a0, b0] of [[-3, 2], [-1, 0.5], [0, 4]]) {
        const { a, b } = ajuste(eq, t0, x0, a0, b0);
        assert.ok(a <= b, `${eq} : a ≤ b`);
        const x = solutionNU(eq, a, b);
        proche(x(t0), x0, 1e-9);
        for (const t of [a - 1.3, (a + b) / 2, b + 0.7, b + 2]) {
          const d = 1e-6;
          proche((x(t + d) - x(t - d)) / (2 * d), EQ_NU[eq].f(x(t)), 1e-5);
        }
      }
    }
  }
});

test('non-unicité : le poly, b = t₀ − x₀^{1/3} pour ẋ = 3|x|^{2/3} et x₀ > 0', () => {
  const { b } = ajuste('cube', 2, 8, -10, 10);
  proche(b, 0);
  // Pente des cordes : finie hors de 0, infinie en 0.
  assert.equal(penteMaximale('racine', 0, 0.5), Infinity);
  // Pour √x en p = 1 sur [0,5 ; 1,5], la corde la plus raide va vers 0,5.
  proche(penteMaximale('racine', 1, 0.5), (1 - Math.sqrt(0.5)) / 0.5, 1e-9);
});

// ---- Pendule ----------------------------------------------------------------------------

import { amplitude, champPendule, energie, nature as naturePendule, periode } from '../js/illustrations/pendule.js';
import { rk4 } from '../socle/js/core/ode.js';

test('pendule : période des oscillations (intégrale elliptique)', () => {
  const w2 = 9.81;
  const T0 = (2 * Math.PI) / Math.sqrt(w2);
  // Petite amplitude : T → 2π/ω ; à 90°, T = 1,18034 T₀ (valeur classique).
  proche(periode(1e-4, w2) / T0, 1, 1e-8);
  proche(periode(Math.PI / 2, w2) / T0, 1.180341, 1e-6);
  assert.equal(periode(Math.PI, w2), Infinity);
  // L'amplitude se lit sur l'énergie : cos θ_max = −E/ω².
  proche(amplitude(energie([1.2, 0], w2), w2), 1.2, 1e-12);
});

test('pendule : l’énergie est constante le long des trajectoires, et la période mesurée est la bonne', () => {
  const w2 = 4;
  const F = champPendule(w2);
  let x = [2, 0];
  const E0 = energie(x, w2);
  let t = 0;
  const h = 1e-3;
  // Le pendule repasse par θ̇ = 0 côté θ > 0 au bout d'une période.
  let passage = null;
  while (t < 10 && passage === null) {
    const y = rk4(F, t, x, h);
    if (t > 0.5 && x[1] > 0 && y[1] <= 0) passage = t + (h * x[1]) / (x[1] - y[1]);
    x = y;
    t += h;
    proche(energie(x, w2), E0, 1e-9);
  }
  proche(passage, periode(2, w2), 1e-6);
  assert.equal(naturePendule([2, 0], w2), 'oscillation');
  assert.equal(naturePendule([0, 2.5 * Math.sqrt(w2)], w2), 'rotation');
  assert.equal(naturePendule([0, 2 * Math.sqrt(w2)], w2), 'separatrice');
});

// ---- Équation variationnelle ------------------------------------------------------------

import { integre, poignee, variationDe } from '../js/illustrations/variationnelle.js';

test('variationnelle : exemple du poly, ∂x₁/∂b (t) = sinh t', () => {
  const ech = integre('poly', { x0: [1, 0.2], d: [0, 1], eps: 0.1, T: 2 });
  for (const { t, dx, xb, xp } of ech.filter((_, k) => k % 100 === 0)) {
    proche(dx[0], Math.sinh(t), 1e-8);
    proche(dx[1], Math.exp(t), 1e-8);
    // Système linéaire : l'écart est exactement ε δx(t).
    proche((xp[0] - xb[0]) / 0.1, dx[0], 1e-8);
  }
});

test('variationnelle : pendule, l’écart réel divisé par ε tend vers δx(t) (erreur en O(ε))', () => {
  const ecart = (eps) => {
    const ech = integre('pendule', { x0: [2, 0], d: [1, 0], eps, T: 8 });
    const { xb, xp, dx } = ech[ech.length - 1];
    return Math.hypot((xp[0] - xb[0]) / eps - dx[0], (xp[1] - xb[1]) / eps - dx[1]);
  };
  const [e1, e2] = [ecart(1e-2), ecart(1e-3)];
  assert.ok(e2 < e1 / 5, `${e1} → ${e2}`);
  // Perturbation du paramètre ω² : même convergence.
  const ech = integre('pendule', { x0: [2, 0], d: [0, 0], eps: 1e-5, mode: 'lambda', T: 8 });
  const { xb, xp, dx } = ech[ech.length - 1];
  proche((xp[0] - xb[0]) / 1e-5, dx[0], 1e-3 * Math.max(1, Math.abs(dx[0])));
});

test('variationnelle : la flèche ε δx(t) pointe sur l’écart réel pour ε petit, plus quand la linéarisation décroche', () => {
  const angle = (cle, x0, ang, eps, T) => {
    const ech = integre(cle, { x0, d: [Math.cos(ang), Math.sin(ang), 0].slice(0, x0.length), eps, T, m: 300 });
    const { xb, xp, dx } = ech.at(-1);
    const D = xp.map((v, k) => v - xb[k]);
    return Math.acos(D.reduce((s, v, k) => s + v * dx[k], 0) / (Math.hypot(...D) * Math.hypot(...dx)));
  };
  assert.ok(angle('pendule', [2, 0], 0, 1e-4, 10) < 0.01);
  assert.ok(angle('pendule', [2, 0], 0, 0.3, 12) > 0.3);
});

test('variationnelle : la poignée de la variation donne α et ε, bornés ; x̄₀ passe avant si les points se confondent', () => {
  const v = variationDe([1, 2], [1 + 1e-3, 2], 77);
  proche(v.ang, 0, 1e-9);
  proche(v.leps, -3, 1e-9);
  proche(variationDe([0, 0], [0, 5], 0).ang, 90, 1e-9);
  assert.equal(variationDe([0, 0], [5, 0], 0).leps, 0);
  assert.equal(variationDe([0, 0], [1e-12, 0], 0).leps, -7);
  assert.equal(variationDe([3, 3], [3, 3], 42).ang, 42);
  // 100 px par unité : le bout est à 30 px de x̄₀.
  const [x0, bout, e] = [[0, 0], [0.3, 0], [100, 100]];
  assert.equal(poignee([0.28, 0], x0, bout, e), 'variation');
  assert.equal(poignee([0.02, 0], x0, bout, e), 'x0');
  assert.equal(poignee([1, 1], x0, bout, e), null);
  // Les deux à moins de 8 px : x̄₀, même près du bout.
  assert.equal(poignee([0.05, 0], x0, [0.05, 0], e), 'x0');
  assert.equal(poignee([0.01, 0], x0, null, e), 'x0');
});

// ---- Ordre et tableau de Butcher ------------------------------------------------------------

import { SCHEMAS as RK, erreurs as erreursRK, lisNombre, ordreTheorique, penteMesuree, tableau as tableauRK } from '../js/illustrations/ordre.js';

test('ordre : fractions lues au clavier', () => {
  assert.equal(lisNombre('1/3'), 1 / 3);
  assert.equal(lisNombre('-1/3'), -1 / 3);
  assert.equal(lisNombre('0,25'), 0.25);
  assert.ok(Number.isNaN(lisNombre('abc')));
});

test('ordre : les schémas du poly ont l’ordre annoncé, par les conditions et par la pente', () => {
  for (const [cle, S] of Object.entries(RK)) {
    const t = tableauRK(S.A, S.b);
    assert.equal(ordreTheorique(t), S.ordre, cle);
    const pente = penteMesuree(erreursRK(t, [20, 30, 40, 60, 100, 150, 200]));
    assert.ok(Math.abs(pente - S.ordre) < 0.2, `${cle} : pente ${pente}`);
  }
  // Exercice du poly : b₁ + b₂ = 1 et b₂a₂₁ = 1/2 donnent l'ordre 2.
  assert.equal(ordreTheorique(tableauRK('1', '1/2, 1/2')), 2);
  assert.equal(ordreTheorique(tableauRK('1/2', '1/2, 1/2')), 1);
  assert.equal(ordreTheorique(tableauRK('', '0.9')), 0);
});

test('ordre : un tableau modifié traverse l’URL sans perdre ses coefficients', async () => {
  const { ecrit, aimante } = await import('../js/illustrations/ordre.js');
  const t = tableauRK('1/2; 0, 1/2; 0, 0, 1', '0.2, 1/3, 1/3, 1/6');
  assert.equal(t.s, 4);
  assert.equal(t.b[0], 0.2);
  const A = t.A.slice(1).map((l, i) => l.slice(0, i + 1).map((v) => ecrit(v, '.')).join(', ')).join('; ');
  const b = t.b.map((v) => ecrit(v, '.')).join(', ');
  assert.deepEqual(tableauRK(A, b), t);
  // Un pas de 1/12 arrondi au millionième redevient exactement 1/12.
  assert.equal(aimante(Number((1 / 12).toFixed(6))), 1 / 12);
});

// ---- Théorème d'échappement ------------------------------------------------------------

import { compact, derniereSortie } from '../js/illustrations/echappement.js';
import { solutionMaximale as solMax } from '../js/illustrations/cauchy.js';

test('échappement : tan t sort de Kₙ en arctan(2n), qui tend vers π/2', () => {
  const sol = solMax('carre-plus-un', 0, 0);
  proche(derniereSortie(sol, compact('carre-plus-un', 0, 0, 1), 0), 1, 1e-9); // par le côté t = 1
  for (const n of [3, 5, 8]) proche(derniereSortie(sol, compact('carre-plus-un', 0, 0, n), 0), Math.atan(2 * n), 1e-9);
  // Vers le passé, par symétrie : −arctan(2n).
  for (const n of [3, 5, 8]) proche(derniereSortie(sol, compact('carre-plus-un', 0, 0, n), 0, 1e-3, -1), -Math.atan(2 * n), 1e-9);
  // Ω = ]0, 1[ : la courbe sort par le haut des compacts, qui tendent vers x = 1.
  const u = solMax('unite', 0, 0.3);
  const K = compact('unite', 0, 0.3, 4);
  proche(u.x(derniereSortie(u, K, 0)), K.x[1], 1e-9);
});

test('échappement : sans symétrie, τₖ⁻ ≤ t₀ ≤ τₖ⁺, et chacun tend vers sa borne', () => {
  for (const [eq, t0, x0] of [['moins-carre', 0, 0.5], ['moins-carre', 0, -0.5], ['unite', 0, 0.3], ['lineaire', 1, 0.5]]) {
    const sol = solMax(eq, t0, x0);
    let [avant, apres] = [t0, t0];
    for (let k = 1; k <= 8; k++) {
      const K = compact(eq, t0, x0, k);
      const [moins, plus] = [derniereSortie(sol, K, t0, 1e-3, -1), derniereSortie(sol, K, t0)];
      assert.ok(sol.a < moins && moins <= avant && plus >= apres && plus < sol.b, `${eq} x0=${x0} k=${k} : ${moins}, ${plus}`);
      [avant, apres] = [moins, plus];
    }
  }
});

// ---- Approximations successives -----------------------------------------------------------------

import { EQUATIONS as EQ_PICARD, bornesPicard, gronwall, iterees } from '../js/illustrations/picard.js';

test('picard : l’erreur des itérées reste sous les deux bornes, point fixe (q < 1) et factorielle', () => {
  for (const [cle, x0, T] of [['lineaire', 1, 0.8], ['lineaire', 1, 3], ['poly', 0, 0.6], ['poly', 0, 1.6]]) {
    const E = EQ_PICARD[cle];
    const { ts, resultat } = iterees(cle, x0, T, 10);
    const exacte = ts.map((t) => E.exacte(t, x0));
    const d = Math.max(...resultat[1].map((v, i) => Math.abs(v - resultat[0][i])));
    const q = E.L(T) * T;
    resultat.forEach((xj, j) => {
      const e = Math.max(...xj.map((v, i) => Math.abs(v - exacte[i])));
      const b = bornesPicard(q, d, j);
      assert.ok(e <= b.factorielle * (1 + 1e-9) + 1e-12, `${cle} T=${T} j=${j} : ${e} > ${b.factorielle}`);
      if (q < 1) assert.ok(e <= b.pointFixe * (1 + 1e-9) + 1e-12);
      else assert.equal(b.pointFixe, Infinity);
    });
  }
});

test('picard : itérées du poly, x⁽³⁾ = t² + t⁴/2 + t⁶/6, et quadrature cohérente', () => {
  const { ts, resultat } = iterees('poly', 0, 1.2, 3);
  const i = 1000;
  const t = ts[i];
  proche(resultat[1][i], t ** 2, 1e-12);
  proche(resultat[3][i], t ** 2 + t ** 4 / 2 + t ** 6 / 6, 1e-12);
  // Les itérées par quadrature (ẋ = 1 + x²) : x⁽²⁾ = t + t³/3.
  const q = iterees('tangente', 0, 1, 2);
  proche(q.resultat[2][q.ts.length - 1], 1 + 1 / 3, 1e-6);
});

test('picard : Grönwall, l’écart reste sous la borne, avec égalité pour ẋ = x', () => {
  for (const cle of ['poly', 'lineaire', 'tangente']) {
    for (const p of gronwall(cle, cle === 'lineaire' ? 1 : 0, 0.1, 1.2)) assert.ok(p.ecart <= p.borne * (1 + 1e-6), `${cle} t = ${p.t}`);
  }
  const g = gronwall('lineaire', 1, 1.1, 2);
  proche(g[g.length - 1].ecart, g[g.length - 1].borne, 1e-9);
});

// ---- Exponentielle de matrice ------------------------------------------------------------------------

import { MATRICES, frobenius, produit as produitM, queue, sommesPartielles, instantLePlusProche } from '../js/illustrations/exponentielle.js';

test('exponentielle : l’instant retrouvé d’un point de la trajectoire', () => {
  const A = [[-0.3, 2], [-1, -0.5]];
  for (const s of [-2, 0.4, 1.3, 5]) {
    const p = appliqueM(expo2(A, s), [1, 0.5]);
    proche(instantLePlusProche(A, [1, 0.5], p), s, 0.02);
  }
});
import { applique as appliqueM, exponentielle as expo2 } from '../socle/js/core/dim2.js';

test('exponentielle : les sommes partielles convergent, sous la majoration du poly', () => {
  for (const { A } of Object.values(MATRICES)) {
    for (const t of [-1, 0.5, 3]) {
      const E = expo2(A, t);
      const S = sommesPartielles(A, t, 40);
      const ecart = (M) => frobenius(M.map((l, i) => l.map((v, j) => v - E[i][j])));
      assert.ok(ecart(S[40]) < 1e-10);
      const nA = frobenius(A) * Math.abs(t);
      for (let N = 0; N <= 20; N++) assert.ok(ecart(S[N]) <= queue(nA, N) * (1 + 1e-9) + 1e-14, `N = ${N}`);
    }
  }
  // Nilpotente : exacte dès N = 1.
  const S = sommesPartielles(MATRICES.nilpotente.A, 2, 3);
  assert.deepEqual(S[1], [[1, 2], [0, 1]]);
  // Contre-exemple du poly : e^A e^B = [[2, 1], [1, 1]].
  assert.deepEqual(produitM(expo2([[0, 1], [0, 0]], 1), expo2([[0, 0], [1, 0]], 1)), [[2, 1], [1, 1]]);
});

// ---- Variation de la constante -----------------------------------------------------------------

import { SECONDS_MEMBRES, decomposition } from '../js/illustrations/duhamel.js';

test('duhamel : la formule de variation de la constante redonne la solution (RK4)', () => {
  for (const cle of ['constant', 'sinus']) {
    const b = SECONDS_MEMBRES[cle].b;
    const [a, x0, T] = [-0.7, 0.8, 3];
    let x = [x0];
    const h = 1e-3;
    for (let k = 0; k < T / h - 1e-9; k++) x = rk4((t, [y]) => [a * y + b(t)], k * h, x, h);
    proche(decomposition(cle, a, x0, T).total, x[0], 1e-6);
  }
  // Créneau : RK4 qui s'arrête aux discontinuités de b, puis repart.
  for (const a of [-0.7, 0, 0.4]) {
    let [x, t0] = [[0.5], 0];
    for (const t1 of [1, 2, 4]) {
      const n = Math.round((t1 - t0) / 1e-3);
      const h = (t1 - t0) / n;
      // Au milieu de chaque morceau, b est constant : on l'évalue là.
      const bm = SECONDS_MEMBRES.creneau.b((t0 + t1) / 2);
      for (let k = 0; k < n; k++) x = rk4((t, [y]) => [a * y + bm], t0 + k * h, x, h);
      t0 = t1;
    }
    proche(decomposition('creneau', a, 0.5, 4).total, x[0], 1e-9);
  }
  // b = 1 : partie forcée (e^{at} − 1)/a.
  proche(decomposition('constant', -0.5, 0, 2).forcee, (Math.exp(-1) - 1) / -0.5, 1e-6);
});

// ---- Flot ----------------------------------------------------------------------------------------

import { SYSTEMES as SYS_FLOT, aire as aireFlot, bordRaffine, ensemble, transporte, flotDe } from '../js/illustrations/flot.js';

test('flot : φ_{−t} ∘ φ_t = id, le retour en arrière du glisser', () => {
  for (const cle of ['pendule', 'amorti']) {
    for (const t of [0.7, 3, -2]) {
      const p = [0.8, -0.4];
      const q = flotDe(cle, flotDe(cle, p, t), -t);
      proche(q[0], p[0], 1e-8);
      proche(q[1], p[1], 1e-8);
    }
  }
});

test('flot : le bord raffiné suit l’étirement, l’aire du pendule reste conservée jusqu’à t = 8', () => {
  // Disque près de la séparatrice : à t = 8, 240 points régulièrement répartis
  // laissent des côtés de plus de 3 unités ; le bord raffiné n'en a plus de > 0,1.
  const [c, rho] = [[2.39, -0.66], 0.6];
  const bord = bordRaffine('pendule', c, rho);
  const images = transporte('pendule', bord);
  const im = images.map((g) => g(8));
  const cote = Math.max(...im.slice(1).map((p, i) => Math.hypot(p[0] - im[i][0], p[1] - im[i][1])));
  assert.ok(cote < 0.1, `plus grand côté ${cote}`);
  proche(aireFlot(im) / aireFlot(bord), 1, 1e-3);
  // Le bord est fermé et reste sur le cercle.
  proche(bord[0][0], bord.at(-1)[0], 1e-12);
  proche(bord[0][1], bord.at(-1)[1], 1e-12);
  for (const p of bord) proche(Math.hypot(p[0] - c[0], p[1] - c[1]), rho, 1e-12);
});

test('flot : l’aire de φ_t(X) suit exp(t tr f′), et φ_{−t} ∘ φ_t = id', () => {
  for (const [cle, S] of Object.entries(SYS_FLOT)) {
    const { bord } = ensemble(S.centre, 0.5, 400);
    const g = transporte(cle, bord);
    const a0 = aireFlot(bord);
    for (const t of [-1, 1.5, 3]) proche(aireFlot(g.map((h) => h(t))) / a0, Math.exp(S.div * t), 2e-3);
  }
  // Formule du flot : partir de φ₂(x₀) et transporter de −2 redonne x₀.
  const [x] = transporte('pendule', [[1, 0.3]]);
  const [y] = transporte('pendule', [x(2)]);
  const z = y(-2);
  proche(z[0], 1, 1e-6);
  proche(z[1], 0.3, 1e-6);
});

// ---- Euler pas à pas ------------------------------------------------------------------------------

import { PROBLEMES as PB_EULER, erreursLocales, euler as eulerPas } from '../js/illustrations/euler-pas.js';

test('euler : erreurs locales en O(h²), erreur globale en O(h), sous la borne de stabilité', () => {
  for (const [cle, P] of Object.entries(PB_EULER)) {
    const x = P.exacte(P.t0, P.xi0);
    const globale = (N) => Math.max(...eulerPas(cle, N).map(([t, v]) => Math.abs(v - x(t))));
    const locale = (N) => Math.max(...erreursLocales(cle, N).map(Math.abs));
    proche(locale(200) / locale(400), 4, 0.1);
    proche(globale(200) / globale(400), 2, 0.05);
    for (const N of [4, 16, 64]) {
      const somme = erreursLocales(cle, N).reduce((s, v) => s + Math.abs(v), 0);
      assert.ok(globale(N) <= Math.exp(P.L * (P.tf - P.t0)) * somme);
    }
  }
});

// ---- Schémas implicites --------------------------------------------------------------------------

import { G as Gimp, dG, iterations, racine, raide, raideExacte } from '../js/illustrations/implicite.js';

test('implicite : le point fixe converge si |G′(k*)| < 1, Newton converge plus vite', () => {
  const p = { h: 0.3, beta: 1, lambda: 1 };
  const k = racine(p);
  proche(k, Gimp(k, p), 1e-12);
  assert.ok(Math.abs(dG(k, p)) < 1);
  const pf = iterations('point-fixe', p, 40);
  proche(pf[pf.length - 1], k, 1e-8);
  const nw = iterations('newton', p, 6);
  proche(nw[nw.length - 1], k, 1e-12);
  // h = 0,8 : |G′(k*)| > 1, le point fixe s'éloigne ; Newton converge.
  const q = { h: 0.8, beta: 1, lambda: 1 };
  assert.ok(Math.abs(dG(racine(q), q)) > 1);
  const pf2 = iterations('point-fixe', q, 30);
  assert.ok(Math.abs(pf2[pf2.length - 1] - racine(q)) > 1e-3);
  proche(iterations('newton', q, 8).at(-1), racine(q), 1e-10);
  // β = 0 : une itération donne la pente explicite f(x₀) = −λ.
  assert.equal(iterations('point-fixe', { h: 0.3, beta: 0, lambda: 2 }, 3)[1], -2);
  // Point milieu au même pas : contractant.
  const m = { h: 0.8, beta: 0.5, lambda: 1 };
  assert.ok(Math.abs(dG(racine(m), m)) < 1);
});

test('implicite : problème raide, Euler explicite explose si h|μ| > 2, l’implicite converge', () => {
  const exp = raide('explicite', -20, 0.12);
  const imp = raide('implicite', -20, 0.12);
  assert.ok(Math.abs(exp.at(-1)[1]) > 100);
  proche(imp.at(-1)[1], raideExacte(imp.at(-1)[0], -20, 1.5), 0.05);
});

// ---- Tangence ------------------------------------------------------------------------------------

import { reste } from '../js/illustrations/tangence.js';

test('tangence : le reste divisé par |h| tend vers 0 si et seulement si f est dérivable', () => {
  assert.ok(reste('sinus', 0.8, 1e-4) < 1e-4);
  assert.ok(reste('carreSinus', 0, 1e-5) <= 1e-5);
  proche(reste('abs', 0, 1e-6), 1, 1e-12);
  proche(reste('abs', 0, -1e-6), 1, 1e-12);
  assert.ok(reste('cubique', 0, 1e-6) > 1e3);
  assert.ok(reste('abs', 0.3, 1e-6) < 1e-9);
});

// ---- Dérivées directionnelles ------------------------------------------------------------------

import { FONCTIONS as FN_DIR, directionDe, rencontre, surLaDroite } from '../js/illustrations/directionnelle.js';

test('directionnelle : contre-exemple du poly, f(tv) = 0 près de 0 mais f(s, s²) = 1', () => {
  for (const al of [5, 30, 60, 120, -40]) {
    const v = [Math.cos((al * Math.PI) / 180), Math.sin((al * Math.PI) / 180)];
    const ts = rencontre(v);
    // Taux d'accroissement nul pour |t| < |t*|.
    for (const t of [1e-3, -1e-3, 1e-6]) if (ts === null || Math.abs(t) < Math.abs(ts)) assert.equal(Math.abs(surLaDroite('poly', v, t) / t), 0);
  }
  for (const s of [0.5, 1e-3, 1e-6]) assert.equal(FN_DIR.poly.f([s, s * s]), 1);
  assert.equal(FN_DIR.poly.f([0, 0]), 0);
});

test('directionnelle : la direction choisie par t* coupe la parabole en t*, du côté demandé', () => {
  for (const ts of [0.05, 0.4, 1.3, -0.7, -1.5]) {
    for (const signe of [1, -1]) {
      const al = (directionDe(ts, signe) * Math.PI) / 180;
      const v = [Math.cos(al), Math.sin(al)];
      proche(rencontre(v), ts, 1e-12);
      assert.equal(Math.sign(v[0]), signe);
    }
  }
});

// ---- Jacobienne -----------------------------------------------------------------------------------

import { APPLICATIONS, G as G_JAC, aire as aireJac, antecedent, jacobienneNumerique, produit as produitJac, det as detJac, quadrillage } from '../js/illustrations/jacobienne.js';

test('jacobienne : antécédent local par Newton, et échec où det J = 0', () => {
  for (const A of Object.values(APPLICATIONS)) {
    const x = A.x0;
    const fx = A.f(x);
    const y = [fx[0] + 0.05, fx[1] - 0.03];
    const p = antecedent(A, x, y);
    const fp = A.f(p);
    proche(fp[0], y[0], 1e-9);
    proche(fp[1], y[1], 1e-9);
    assert.ok(Math.hypot(p[0] - x[0], p[1] - x[1]) < 0.2);
  }
  // En r = 0, les polaires écrasent tout sur l'origine : pas d'inverse local.
  assert.equal(antecedent(APPLICATIONS.polaires, [0, 0.3], [0.1, 0.1]), null);
});

test('jacobienne : formules exactes, règle des composées et facteur d’aire', () => {
  for (const A of Object.values(APPLICATIONS)) {
    const x = A.x0;
    const num = jacobienneNumerique(A.f, x);
    A.J(x).flat().forEach((v, i) => proche(v, num.flat()[i], 1e-7));
    const gf = (p) => G_JAC.g(A.f(p));
    produitJac(G_JAC.J(A.f(x)), A.J(x)).flat().forEach((v, i) => proche(v, jacobienneNumerique(gf, x).flat()[i], 1e-6));
  }
  // Polaires : l'image d'un petit carré a une aire ≈ r × (2ε)².
  const P = APPLICATIONS.polaires;
  const eps = 1e-3;
  const bord = [];
  for (let k = 0; k < 400; k++) {
    const u = (k % 100) / 100;
    const c = [[-eps + 2 * eps * u, -eps], [eps, -eps + 2 * eps * u], [eps - 2 * eps * u, eps], [-eps, eps - 2 * eps * u]][Math.floor(k / 100)];
    bord.push(P.f([1.5 + c[0], 0.8 + c[1]]));
  }
  proche(aireJac(bord) / (4 * eps * eps), detJac(P.J([1.5, 0.8])), 1e-3);
  assert.equal(quadrillage([0, 0], 1).length, 10);
});

// ---- Taylor -----------------------------------------------------------------------------------------

import { FONCTIONS as FN_TAYLOR, taylor } from '../js/illustrations/taylor.js';

test('taylor : exercice du poly, gradients et hessiennes, ordres 2 et 3 de l’erreur', () => {
  // f(h) = h₂ + h₁h₂ + o(‖h‖²) en 0.
  proche(taylor('poly', [0, 0], 2, [0.3, -0.2]), -0.2 + 0.3 * -0.2, 1e-15);
  for (const [cle, F] of Object.entries(FN_TAYLOR)) {
    const a = [0.3, -0.4];
    const d = 1e-5;
    const gNum = [0, 1].map((j) => (F.f(a.map((v, i) => v + (i === j ? d : 0))) - F.f(a.map((v, i) => v - (i === j ? d : 0)))) / (2 * d));
    F.grad(a).forEach((v, i) => proche(v, gNum[i], 1e-8));
    const H = F.hess(a);
    proche(H[0][1], H[1][0], 1e-15); // Schwarz
    // Erreur : rapport ≈ 2^{k+1} quand s est divisé par 2 (sauf quadratique à l'ordre 2).
    const u = [0.6, 0.8];
    const err = (k, s) => Math.abs(F.f([a[0] + s * u[0], a[1] + s * u[1]]) - taylor(cle, a, k, [s * u[0], s * u[1]]));
    proche(err(1, 1e-2) / err(1, 5e-3), 4, 0.1);
    if (cle === 'quadratique') assert.ok(err(2, 0.5) < 1e-14);
    else proche(err(2, 1e-2) / err(2, 5e-3), 8, 0.3);
  }
});

// ---- Différences finies -------------------------------------------------------------------------

import { EPS as EPS_DF, ETA as ETA_DF, X0 as X0_DF, derivee as deriveeDF, fonction as fonctionDF, modeles as modelesDF, pasOptimaux, schemas } from '../js/illustrations/differences-finies.js';

test('différences finies : ordres, pas optimaux et pas complexe (TP)', () => {
  const F = fonctionDF('cos');
  const e = (h, k) => Math.abs(schemas(F, X0_DF, h)[k] - deriveeDF(X0_DF));
  // Troncature : ordre 1, ordre 2.
  proche(e(1e-3, 'avant') / e(1e-4, 'avant'), 10, 0.5);
  proche(e(1e-2, 'centre') / e(1e-3, 'centre'), 100, 5);
  // Fond du V : avant vers √eps, centré vers ∛(3 eps) ; le complexe descend à eps.
  assert.ok(e(Math.sqrt(EPS_DF), 'avant') < 1e-7);
  assert.ok(e(Math.cbrt(3 * EPS_DF), 'centre') < 1e-10);
  assert.ok(e(1e-12, 'avant') > 1e-5);
  assert.ok(e(1e-16, 'complexe') <= 1e-15);
  // Bruit relatif de 1e-8 : divisé par h dans les différences finies, gardé à
  // son niveau par le pas complexe.
  const B = fonctionDF('bruit');
  const eb = Math.abs(schemas(B, X0_DF, 1e-10).complexe - deriveeDF(X0_DF));
  assert.ok(eb > 1e-11 && eb < 1e-7);
  assert.ok(Math.abs(schemas(B, X0_DF, 1e-10).avant - deriveeDF(X0_DF)) > 1e-3);
});

test('différences finies : le pas optimal suit l’erreur d’évaluation η, pas eps', () => {
  for (const eta of Object.values(ETA_DF)) {
    // Le modèle des différences avant est minimal en 2√η (|f| = |f''| en π/3).
    const lhs = Array.from({ length: 3401 }, (_, k) => -17 + k / 200);
    const m = (lh) => modelesDF(X0_DF, 10 ** lh, eta).avant;
    const lmin = lhs.reduce((a, b) => (m(b) < m(a) ? b : a));
    proche(lmin, Math.log10(pasOptimaux(eta).avant), 0.01);
  }
  // Fonction bruitée : l’erreur au pas optimal 2√η est de l’ordre de √η = 10⁻⁴.
  const B = fonctionDF('bruit');
  const e = Math.abs(schemas(B, X0_DF, pasOptimaux(ETA_DF.bruit).avant).avant - deriveeDF(X0_DF));
  assert.ok(e > 1e-5 && e < 3e-4);
});

// ---- Fonctions implicites ------------------------------------------------------------------------

import { FONCTIONS as FN_IMP, aimante as aimanteImp, graphe as grapheImp } from '../js/illustrations/fonctions-implicites.js';

test('fonctions implicites : le graphe suivi reste sur la ligne de niveau et s’arrête à la tangente verticale', () => {
  const C = FN_IMP.cercle;
  const pts = grapheImp(C, [0.6, 0.8]);
  for (const [x, y] of pts) proche(C.g(x, y), 1, 1e-10);
  // Sur le cercle unité, φ(x) = √(1 − x²) s'arrête avant x = ±1.
  assert.ok(pts[0][0] > -1 && pts[0][0] < -0.95);
  assert.ok(pts.at(-1)[0] < 1 && pts.at(-1)[0] > 0.95);
  // y³ + y − x : défini sur tout le cadre, réciproque de y ↦ y³ + y.
  const K = FN_IMP.cubique;
  const q = grapheImp(K, [1, 0.68232780382], { xMax: 3 });
  for (const [x, y] of q) proche(y ** 3 + y, x, 1e-9);
  assert.ok(q[0][0] < -1.99 && q.at(-1)[0] > 3.99);
  // Aimantation : près de (1, 0,01), ∂_y g s'annule exactement en (1, 0).
  assert.deepEqual(aimanteImp('cercle', 1, 0.01, 0.1), [1, 0]);
});

// ---- Glossaire : les termes employés sont déclarés ------------------------------------------------

test('glossaire : chaque terme du glossaire employé dans le cours ou les essais d’une page y est déclaré', async () => {
  // Homonymes : le mot est employé dans un autre sens que celui du glossaire.
  const homonymes = {
    exponentielle: ['convergente'], // « série absolument convergente »
    variationnelle: ['exponentielle'], // « croissance exponentielle »
    'euler-pas': ['solution globale'], // « erreur globale »
    ordre: ['solution globale'],
    'fonctions-implicites': ['implicite'], // « fonction implicite »
  };
  const LETTRE = /\p{L}/u;
  const contient = (t, f) => {
    for (let i = t.indexOf(f); i >= 0; i = t.indexOf(f, i + 1)) if (!LETTRE.test(t[i - 1] ?? '') && !LETTRE.test(t[i + f.length] ?? '')) return true;
    return false;
  };
  for (const id of themes.flatMap((t) => t.illustrations.filter((i) => i.disponible).map((i) => i.id))) {
    const m = (await import(`../js/illustrations/${id}.js`)).default;
    const texte = [...[].concat(m.rappel ?? []).flat(), ...(m.essais ?? []).map((e) => e.texte)].join(' ').replace(/\$[^$]*\$/g, ' ');
    for (const [cle, { formes }] of Object.entries(GLOSSAIRE)) {
      const present = formes.some((f) => contient(texte, f));
      if (present && !(homonymes[id] ?? []).includes(cle)) assert.ok((m.termes ?? []).includes(cle), `${id} emploie « ${cle} » sans le déclarer`);
      if ((m.termes ?? []).includes(cle)) assert.ok(present, `${id} déclare « ${cle} » sans l’employer`);
    }
  }
});

// ---- Peano --------------------------------------------------------------------------------------------

import { convergence as convergencePeano, cylindre, depart as departPeano, polygone, solutionsExactes, valeur as valeurPolygone } from '../js/illustrations/peano.js';

test('peano : les polygones restent dans le cône de pentes ±M du cylindre', () => {
  for (const [eq, x0, r] of [['carre', 0, 1], ['carre', 0.5, 2], ['racine', -0.3, 1], ['oscille', 0.2, 2], ['oscille', -1, 0.5]]) {
    const { M, T } = cylindre(eq, x0, r);
    assert.ok(T <= r / M + 1e-12);
    for (const N of [1, 4, 32]) {
      polygone(eq, x0, T, N).forEach((x, i) => assert.ok(Math.abs(x - x0) <= (M * T * i) / N + 1e-12, `${eq} N=${N} i=${i}`));
    }
  }
});

test('peano : polygones vers la solution unique, ou vers une solution choisie par l’approximation', () => {
  // Solution unique : erreur en O(h).
  const { T } = cylindre('carre', 0, 1);
  const [x] = solutionsExactes('carre', 0);
  const err = (N) => Math.max(...polygone('carre', 0, T, N).map((v, i) => Math.abs(v - x((T * i) / N))));
  assert.ok(err(512) < err(256) / 1.8 && err(512) < 1e-2);
  // Sans unicité : départ exact → solution nulle ; départ perturbé → t²/4.
  const T2 = cylindre('racine', 0, 1).T;
  assert.ok(polygone('racine', 0, T2, 256).every((v) => v === 0));
  const [, plusGrande] = solutionsExactes('racine', 0);
  const p = polygone('racine', departPeano(0, 1, 4096, true), T2, 4096);
  proche(valeurPolygone(p, T2, T2), plusGrande(T2), 5e-3);
  // L'écart entre polygones successifs et le défaut décroissent.
  const s = convergencePeano('carre', 0, 1, T, false, 8);
  assert.ok(s[8].ecart < s[4].ecart / 8 && s[8].defaut < s[4].defaut / 8);
});

test('peano : équation oscillante, solution exacte et polygones d’ordre 1', () => {
  const { T } = cylindre('oscille', 0.3, 2);
  const [x] = solutionsExactes('oscille', 0.3);
  // La solution exacte vérifie l'équation et la condition initiale.
  proche(x(0), 0.3, 1e-12);
  for (const t of [0.1, 0.5, 0.9]) proche((x(t + 1e-6) - x(t - 1e-6)) / 2e-6, 2 * Math.cos(4 * t) - x(t) / 2, 1e-6);
  // À N = 2 le polygone est loin (> 0,1) ; l'écart est divisé par ≈ 2 à chaque doublement.
  const err = (N) => Math.max(...polygone('oscille', 0.3, T, N).map((v, i) => Math.abs(v - x((T * i) / N))));
  assert.ok(err(2) > 0.1 && err(1024) < 2e-3);
  const s = convergencePeano('oscille', 0.3, 2, T, false, 10);
  proche(s[9].ecart / s[10].ecart, 2, 0.1);
});

// ---- Dériver une solution calculée ---------------------------------------------------------------------

import { SYSTEMES as SYS_SENS, adaptatif, derivees, fixe as fixeRK4, reference as referenceSens } from '../js/illustrations/sensibilite.js';

test('sensibilité : Dormand-Prince et RK4 atteignent la solution exacte de la logistique', () => {
  const S = SYS_SENS.logistique;
  const exacte = (S.x0[0] * Math.exp(S.T)) / (1 - S.x0[0] + S.x0[0] * Math.exp(S.T));
  proche(adaptatif((t, y) => S.f(y), S.x0, S.T, 1e-10).y[0], exacte, 1e-8);
  proche(fixeRK4((t, y) => S.f(y), S.x0, S.T, 1024)[0], exacte, 1e-10);
});

test('sensibilité : la variationnelle suit la tolérance, les différences finies butent vers √eps', () => {
  for (const sys of ['logistique', 'pendule']) {
    const ref = referenceSens(sys);
    const v = derivees(sys, { delta: 1e-7, tol: 1e-12, N: 4096 }).variationnelle;
    assert.ok(Math.abs(v - ref) < 1e-10, `${sys} : variationnelle`);
    let meilleure = Infinity;
    for (let ld = -12; ld <= -3; ld += 0.5) {
      const d = derivees(sys, { delta: 10 ** ld, tol: 1e-12, N: 4096 });
      meilleure = Math.min(meilleure, Math.abs(d.fixe - ref), Math.abs(d.adaptatif - ref));
    }
    assert.ok(meilleure > 1e-11, `${sys} : différences externes ${meilleure}`);
  }
});

import { bilan as bilanEuler } from '../js/illustrations/euler-pas.js';

test('euler-pas : consistance en h, stabilité bornée par S, convergence sous la borne de Lax', () => {
  for (const pb of ['poly', 'croissance']) {
    const [a, b] = [bilanEuler(pb, 32, 1e-2), bilanEuler(pb, 64, 1e-2)];
    proche(a.somme / b.somme, 2, 0.15);
    proche(a.maxLocale / b.maxLocale, 4, 0.4);
    for (const q of [a, b]) {
      assert.ok(q.ecartPerturbe <= q.S * q.perturbations);
      assert.ok(q.globale <= q.borne);
    }
    proche(a.globale / b.globale, 2, 0.2);
  }
});
