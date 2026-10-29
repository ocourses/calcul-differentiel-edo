// Formats d'affichage : nombres, polynômes, vecteurs, nombres à largeur fixe
// (la place réservée dépend de ce que la grandeur peut devenir, pas d'un défaut).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  chiffresEntiers,
  etiquettesAxe,
  latexComplexe,
  latexComplexeFixe,
  latexIntervalle,
  latexMatriceFixe,
  latexNombre,
  latexNombreFinal,
  latexNombreFixe,
  latexPositifFixe,
  latexScientifique,
  latexScientifiqueFixe,
  latexVecteur,
  nombreCourt,
  nombreScientifique,
  polynomeLatex,
  separateur,
  texte,
  typographie,
} from '../js/ui/format.js';

test('nombreCourt : 4 chiffres, virgule française, notation scientifique aux extrêmes', () => {
  assert.equal(nombreCourt(0), '0');
  assert.equal(nombreCourt(0.0021), '0,0021');
  assert.equal(nombreCourt(-12.3456789), '−12,35');
  assert.equal(nombreCourt(2.34e-5), '2,34e-5');
  assert.equal(nombreCourt(-2.5e-7), '−2,5e-7');
  assert.equal(nombreCourt(123456), '1,235e5');
  assert.equal(nombreCourt(NaN), '—');
});

test('polynomeLatex : signes, coefficients unitaires et termes nuls', () => {
  assert.equal(polynomeLatex([1, 5, 10.2]), '\\lambda^{2} + 5\\lambda + 10{,}2');
  assert.equal(polynomeLatex([1, 0, -3]), '\\lambda^{2} - 3');
  assert.equal(polynomeLatex([1, 0, 0, 0, 1]), '\\lambda^{4} + 1');
  assert.equal(polynomeLatex([1, -1]), '\\lambda - 1');
});

test('latexVecteur : un scalaire sans parenthèses, un vecteur séparé par « ; »', () => {
  assert.equal(latexVecteur([7.04]), '7{,}04');
  assert.equal(latexVecteur([0.8, 0]), '\\left(0{,}8\\ ;\\ 0\\right)');
});

test('nombres fixes : une grandeur positive ne réserve ni signe ni chiffre inutile', () => {
  // Pas de place pour le signe, pas de chiffre de plus devant 2,772.
  assert.equal(latexPositifFixe(2.772), '2{,}772');
  // Une grandeur signée garde la place du signe quand elle est positive.
  assert.equal(latexNombreFixe(2.772, 3), '\\phantom{-}2{,}772');
  assert.equal(latexNombreFixe(-2.772, 3), '-2{,}772');
  // Une grandeur qui peut passer 10 réserve le chiffre demandé, pas davantage.
  assert.equal(latexPositifFixe(2.772, 3, 2), '\\phantom{0}2{,}772');
  assert.equal(latexPositifFixe(13.437, 3, 2), '13{,}437');
  // Zéro négatif arrondi : jamais « −0,00 ».
  assert.equal(latexNombreFixe(-0.0001, 2), '\\phantom{-}0{,}00');
});

test('nombres fixes : le chiffre réservé suit le plus grand nombre atteignable', () => {
  assert.deepEqual([0.4, 9.99, 10, 21.3, 150].map(chiffresEntiers), [1, 1, 2, 2, 3]);
});

test('nombres fixes : +∞ garde la largeur d’un nombre fini', () => {
  assert.equal(latexPositifFixe(Infinity, 3, 1), '\\phantom{000}+\\infty');
});

test('nombres fixes : en fin de phrase, le signe n’est écrit que s’il est négatif', () => {
  assert.equal(latexNombreFinal(0.7854, 4), '0{,}7854');
  assert.equal(latexNombreFinal(-0.7854, 4), '-0{,}7854');
  assert.equal(latexNombreFinal(-0.00001, 3), '0{,}000');
});

test('séparateur : la virgule pour des entiers, le point-virgule dès qu’un décimal s’écrit', () => {
  assert.equal(separateur([0, 1]), ',\\ ');
  assert.equal(separateur([1.5, 2]), '\\,;\\ ');
  assert.equal(separateur([1.0004, 2], 3), ',\\ ');
  assert.equal(latexIntervalle(0, 6), '[0,\\ 6]');
  assert.equal(latexIntervalle(1.5, 2.5, { chiffres: 2 }), '[1{,}5\\,;\\ 2{,}5]');
});

test('latexScientifique : notation scientifique aux extrêmes, nombre ordinaire sinon', () => {
  assert.equal(latexScientifique(0.00001234, 3), '1{,}23 \\cdot 10^{-5}');
  assert.equal(latexScientifique(12345678, 3), '1{,}23 \\cdot 10^{7}');
  assert.equal(latexScientifique(2.5, 3), '2{,}5');
  assert.equal(latexScientifique(Infinity), '+\\infty');
});

test('latexScientifique : l’arrondi qui donne 10 passe à la puissance suivante', () => {
  assert.equal(latexScientifique(9.9996e-6, 3), '1 \\cdot 10^{-5}');
  assert.equal(latexScientifique(-9.9996e7, 3), '-1 \\cdot 10^{8}');
});

test('texte : trois chiffres significatifs, virgule et vrai moins', () => {
  assert.equal(texte(3.14159), '3,14');
  assert.equal(texte(-2.5), '−2,5');
  assert.equal(texte(0), '0');
  assert.equal(texte(-1e-15), '0');
});

test('latexNombre : virgule LaTeX, zéro négatif écrit 0', () => {
  assert.equal(latexNombre(2.5), '2{,}5');
  assert.equal(latexNombre(-0.0004), '-0{,}0004');
  assert.equal(latexNombre(-0), '0');
});

test('latexComplexe : partie réelle, signe et partie imaginaire', () => {
  assert.equal(latexComplexe({ re: 1, im: 0 }), '1');
  assert.equal(latexComplexe({ re: 1, im: 2 }), '1 + 2\\,i');
  assert.equal(latexComplexe({ re: 1, im: -2 }), '1 - 2\\,i');
  assert.equal(latexComplexe({ re: 0, im: 2 }).trim(), '2\\,i');
  assert.equal(latexComplexe({ re: 0, im: -2 }).trim(), '- 2\\,i');
});

test('typographie : espace insécable avant « : ; ! ? » et dans les guillemets', () => {
  assert.equal(typographie('a : b'), 'a\u00a0: b');
  assert.equal(typographie('« oui »'), '«\u00a0oui\u00a0»');
});

test('nombreScientifique : signe, mantisse et exposant de largeur constante', () => {
  assert.equal(nombreScientifique(0.0123), '+1,23e−02');
  assert.equal(nombreScientifique(-12345), '−1,23e+04');
  assert.equal(nombreScientifique(0), '+0,00e+00');
  assert.equal(nombreScientifique(Infinity).length, nombreScientifique(1).length);
});

test('etiquettesAxe : même nombre de décimales, notation scientifique aux extrêmes', () => {
  assert.deepEqual(etiquettesAxe([0, 0.5, 1]), ['0', '0,5', '1,0']);
  assert.deepEqual(etiquettesAxe([0, 0, 0]), ['0', '0', '0']);
  assert.ok(etiquettesAxe([0, 2e-5, 4e-5]).every((t) => t === '0' || /e|^\d/.test(t)));
});

test('latexScientifiqueFixe : signe, mantisse et exposant de largeur constante', () => {
  assert.equal(latexScientifiqueFixe(0.0123), '\\phantom{-}1{,}23 \\cdot 10^{-2\\phantom{0}}');
  assert.equal(latexScientifiqueFixe(-12345), '-1{,}23 \\cdot 10^{4\\phantom{-0}}');
  assert.equal(latexScientifiqueFixe(2.5e-12, 1), '\\phantom{-}2{,}5 \\cdot 10^{-12}');
  assert.equal(latexScientifiqueFixe(1e15), '\\phantom{-}1{,}00 \\cdot 10^{15\\phantom{-}}');
  assert.equal(latexScientifiqueFixe(0), '\\phantom{-}0{,}00 \\cdot 10^{0\\phantom{-0}}');
  // L'arrondi peut donner 10 : la mantisse repasse à 1 et l'exposant monte.
  assert.equal(latexScientifiqueFixe(9.999e-5), '\\phantom{-}1{,}00 \\cdot 10^{-4\\phantom{0}}');
  assert.equal(latexScientifiqueFixe(-0), '\\phantom{-}0{,}00 \\cdot 10^{0\\phantom{-0}}');
  assert.equal(latexScientifiqueFixe(Infinity), '+\\infty');
});

test('latexComplexeFixe : partie réelle à place de signe, signe de la partie imaginaire écrit', () => {
  assert.equal(latexComplexeFixe({ re: -1.234, im: 0 }), '-1{,}23');
  assert.equal(latexComplexeFixe({ re: 0.5, im: -2 }), '\\phantom{-}0{,}50 - 2{,}00\\,i');
  assert.equal(latexComplexeFixe({ re: 0, im: 3 }), '\\phantom{-}0{,}00 + 3{,}00\\,i');
});

test('latexMatriceFixe : les coefficients prennent la largeur du plus grand', () => {
  assert.equal(
    latexMatriceFixe([[-0.2, 12.5], [3, -0.004]]),
    '\\begin{pmatrix} -\\phantom{0}0{,}20 & \\phantom{-}12{,}50 \\\\ \\phantom{-}\\phantom{0}3{,}00 & \\phantom{-}\\phantom{0}0{,}00 \\end{pmatrix}',
  );
});

// Largeur : WEB5 demande qu'un nombre qui change ne change pas de largeur. Le gabarit d'une
// sortie LaTeX remplace ce qui est réservé (\phantom{x}) par x, et les signes et chiffres par
// des symboles de même largeur. La largeur est la somme de celles des symboles, dans chaque
// niveau (ligne, exposant) : on compare les symboles triés de chaque niveau, l'ordre ne compte pas.
const symboles = (s) => [...s].sort().join('');
const gabarit = (latex) => {
  const g = latex.replace(/\\phantom\{([^}]*)\}/g, '$1').replace(/[0-9]/g, '0').replace(/[-−+]/g, '±');
  const exposants = [];
  const ligne = g.replace(/\^\{([^}]*)\}/g, (_, x) => (exposants.push(symboles(x)), '^'));
  return [ligne, ...exposants].join(' | ');
};

function memeLargeur(nom, valeurs, fabrique) {
  const gabarits = new Set(valeurs.map((v) => gabarit(fabrique(v))));
  assert.equal(gabarits.size, 1, `${nom} : ${[...gabarits].join(' | ')}`);
}

const pas = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const decades = Array.from({ length: 199 }, (_, i) => i - 99).flatMap((k) => [1, 2.5, 9.99].flatMap((m) => [m * 10 ** k, -m * 10 ** k]));

test('largeur constante sur toute la plage : latexNombreFixe, latexPositifFixe', () => {
  memeLargeur('latexNombreFixe', [...pas(-9.99, 9.99, 400), 0, -0.0001, 0.0001], (v) => latexNombreFixe(v, 2));
  memeLargeur('latexPositifFixe', [...pas(0, 9.99, 400), 0, -3], (v) => latexPositifFixe(v, 3));
});

test('largeur constante sur toute la plage : latexScientifiqueFixe', () => {
  memeLargeur('latexScientifiqueFixe', [...decades, 0, 9.999e-5], (v) => latexScientifiqueFixe(v, 2));
});

test('largeur constante sur toute la plage : nombreScientifique', () => {
  const longueurs = new Set([...decades, 0, Infinity, -Infinity, NaN].map((v) => nombreScientifique(v, 2).length));
  assert.equal(longueurs.size, 1, [...longueurs].join(' | '));
});

test('largeur constante sur toute la plage : latexComplexeFixe, réel ou complexe', () => {
  const parties = pas(-9.99, 9.99, 40);
  memeLargeur('latexComplexeFixe, réel', parties, (re) => latexComplexeFixe({ re, im: 0 }));
  const complexes = parties.flatMap((re) => parties.filter((im) => im !== 0).map((im) => ({ re, im })));
  memeLargeur('latexComplexeFixe, complexe', complexes, (z) => latexComplexeFixe(z));
});

test('largeur constante sur toute la plage : latexMatriceFixe, coefficients sous 10', () => {
  // La largeur suit le plus grand coefficient : constante tant que sa partie
  // entière garde le même nombre de chiffres.
  const v = pas(-9.99, 9.99, 20);
  memeLargeur('latexMatriceFixe', v.flatMap((a) => v.map((b) => [[a, b], [b, -a]])), (M) => latexMatriceFixe(M));
  assert.throws(() => memeLargeur('latexMatriceFixe', [[[9]], [[10]]], (M) => latexMatriceFixe(M)));
});

test('le test de largeur voit une largeur qui change (garde du test lui-même)', () => {
  assert.throws(() => memeLargeur('latexNombre', pas(-9.99, 9.99, 100), (v) => latexNombre(v, 3)));
  assert.throws(() => memeLargeur('latexScientifique', [1e-5, 1e-2], (v) => latexScientifique(v, 3)));
});
