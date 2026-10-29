// Le cours respecte le contrat du socle : configuration, modules des
// illustrations, parcours et glossaire (verifieCours), gabarits identiques aux
// modèles (verifieModeles).

import { test } from 'node:test';

import { verifieCours } from '../socle/js/config.js';
import { verifieModeles } from '../socle/js/modeles.js';
import config from '../site.config.js';

test('le cours respecte le contrat du socle', () => verifieCours(config));
test('les gabarits sont ceux du socle', () => verifieModeles(new URL('../', import.meta.url)));
