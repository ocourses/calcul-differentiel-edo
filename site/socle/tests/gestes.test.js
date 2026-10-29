// Gestes à la souris : bouton gauche pour l'objet, bouton droit (ou Maj) pour
// la vue, sur un graphe zoomable (2D) et sur une caméra 3D.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fauxCanevas } from './aides/faux-canevas.js';
import { el, evenement, installeDom, installeStyleCalcule } from './aides/faux-dom.js';

installeDom();
installeStyleCalcule();
const { boutonVue, glisse, zoomable } = await import('../js/briques/interaction.js');
const { Repere } = await import('../js/ui/repere.js');
const { Camera } = await import('../js/ui/camera3d.js');
const { Vue3D } = await import('../js/ui/vue3d.js');

const GAUCHE = { button: 0, shiftKey: false };
const DROIT = { button: 2, shiftKey: false };
const MAJ = { button: 0, shiftKey: true };

function appui(canevas, bouton, depart, arrivee) {
  canevas.dispatchEvent(evenement('pointerdown', { ...bouton, pointerId: 1, clientX: depart[0], clientY: depart[1] }));
  canevas.dispatchEvent(evenement('pointermove', { clientX: arrivee[0], clientY: arrivee[1] }));
  canevas.dispatchEvent(evenement('pointerup', {}));
}

test('boutonVue : bouton droit ou Maj, pas le bouton gauche seul', () => {
  assert.equal(boutonVue(GAUCHE), false);
  assert.equal(boutonVue(DROIT), true);
  assert.equal(boutonVue(MAJ), true);
});

test('glisse : `prend` reçoit l’événement, pour filtrer le bouton', () => {
  const canevas = fauxCanevas();
  const rep = new Repere(canevas, { x: [0, 10], y: [0, 4] });
  assert.ok(rep.prepare());
  const recus = [];
  glisse(canevas, rep, { prend: (x, y, ev) => !boutonVue(ev), deplace: (x) => recus.push(x) });
  appui(canevas, DROIT, [100, 100], [200, 100]);
  assert.equal(recus.length, 0);
  appui(canevas, GAUCHE, [100, 100], [200, 100]);
  assert.equal(recus.length, 2);
});

test('zoomable, deplacer: "droit" : le droit déplace la vue, le gauche reste à la figure', () => {
  const canevas = fauxCanevas();
  const rep = new Repere(canevas, { x: [0, 10], y: [0, 4] });
  const barre = el('div');
  const zoom = zoomable(canevas, rep, { barre, auto: () => ({ x: [0, 10], y: [0, 4] }), redessine: () => {}, deplacer: 'droit' });
  assert.ok(rep.prepare());
  const reglages = [];
  glisse(canevas, rep, { prend: (x, y, ev) => !boutonVue(ev), deplace: (x) => reglages.push(x) });

  appui(canevas, GAUCHE, [100, 100], [200, 100]);
  assert.deepEqual(zoom.cadre().x, [0, 10]);
  assert.equal(reglages.length, 2);

  for (const bouton of [DROIT, MAJ]) {
    zoom.reinitialise();
    appui(canevas, bouton, [100, 100], [200, 100]);
    assert.ok(zoom.cadre().x[0] < 0, 'la vue suit le pointeur vers la droite');
  }
  assert.equal(reglages.length, 2);
  assert.match(barre.children[0].innerHTML, /clic droit : déplacer/);

  const menu = evenement('contextmenu', {});
  canevas.dispatchEvent(menu);
  assert.ok(menu.defaultPrevented);
});

test('Camera.attache, tourne: boutonVue : le bouton gauche ne fait pas tourner', () => {
  const canevas = fauxCanevas();
  const c = new Camera({ azimut: 0, elevation: 0.5 }).attache(canevas, () => {}, { tourne: boutonVue });
  appui(canevas, GAUCHE, [0, 0], [100, 0]);
  assert.equal(c.azimut, 0);
  appui(canevas, DROIT, [0, 0], [100, 0]);
  assert.ok(Math.abs(c.azimut - 1) < 1e-12);
});

test('Vue3D.pointDuPlan : l’inverse de projette à hauteur fixée ; null si la vue est rasante', () => {
  const vue = new Vue3D(fauxCanevas({ largeur: 340, hauteur: 300 }), { x: [-1, 2], y: [0, 3], zmin: -1, zmax: 2, azimut: 0.7, elevation: 0.6 });
  assert.ok(vue.prepare());
  for (const [x, y, z] of [[0, 1, 0.5], [1.7, 0.2, -1], [-0.5, 2.9, 2]]) {
    const { px, py } = vue.projette(x, y, z);
    const [rx, ry] = vue.pointDuPlan(px, py, z);
    assert.ok(Math.abs(rx - x) < 1e-9 && Math.abs(ry - y) < 1e-9, `${rx}, ${ry}`);
  }
  vue.camera.elevation = 0;
  assert.equal(vue.pointDuPlan(10, 10, 0), null);
});

test('Repere.axes : `enL` trace les axes à gauche et en bas, sinon en x = 0 et y = 0', () => {
  const [r1, r2] = [0, 1].map(() => {
    const canevas = fauxCanevas({ largeur: 400, hauteur: 300 });
    const r = new Repere(canevas, { x: [-3, -1], y: [-5, 2] });
    assert.ok(r.prepare());
    return r;
  });
  r1.axes();
  r2.axes({ enL: true });
  // Les deux derniers `moveTo` sont les débuts de l'axe horizontal et de l'axe vertical.
  const debuts = (r) => r.ctx.appels.filter((a) => a.nom === 'moveTo').slice(-2).map((a) => a.args);
  const [[, yH1], [xV1]] = debuts(r1);
  const [[, yH2], [xV2]] = debuts(r2);
  assert.ok(Math.abs(yH1 - r1.Y(0)) < 1e-9 && Math.abs(xV1 - r1.X(-1)) < 1e-9, 'par défaut : y = 0 et le bord droit');
  assert.ok(Math.abs(yH2 - r2.Y(-5)) < 1e-9 && Math.abs(xV2 - r2.X(-3)) < 1e-9, 'enL : le bas et la gauche');
});
