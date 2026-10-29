// Ce qui distingue ce cours ; le reste vient du socle (socle/docs/conception.md).

import { themes } from './js/illustrations/catalogue.js';
import { GLOSSAIRE } from './js/illustrations/glossaire.js';

export default {
  id: 'calcul-differentiel-edo',
  titre: 'Calcul différentiel et EDO',
  sousTitre: 'Calcul différentiel et équations différentielles ordinaires — parcours ModIA, INP-ENSEEIHT et INSA Toulouse',
  intro: [
    "Des illustrations interactives du poly et des TP, rangées par thème dans l'ordre du cours. Chacune rappelle le résultat du cours, propose des choses à essayer et garde ses réglages dans son lien. On y manipule les objets du cours : on clique une condition initiale, on saisit un pendule, on modifie un tableau de Butcher, et l'on regarde ce que dit le théorème.",
  ],
  depotIssues: 'ocourses/calcul-differentiel-edo',
  themes,
  glossaire: GLOSSAIRE,
  charge: (id) => import(`./js/illustrations/${id}.js`),
};
