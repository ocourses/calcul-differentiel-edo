// Carte du cours : les thèmes, dans l'ordre du poly, et leurs illustrations.
// `disponible` indique qu'un module js/illustrations/<id>.js existe ; les
// autres sont annoncées sur la page d'accueil.

export const themes = [
  {
    id: 'differentiable',
    titre: 'Applications différentiables',
    source: 'Poly, partie « Calcul différentiel »',
    illustrations: [
      {
        id: 'tangence',
        titre: 'Dérivable, c’est être tangent à une application affine',
        resume: 'On zoome sur le graphe : une application dérivable devient sa tangente, et le reste est un petit o de h.',
        source: 'Poly, différentielle de Fréchet',
        disponible: true,
      },
      {
        id: 'directionnelle',
        titre: 'Dérivées directionnelles sans différentiabilité',
        resume: 'L’exemple du poly : toutes les dérivées directionnelles sont nulles en 0, et pourtant f n’y est pas continue.',
        source: 'Poly, dérivée directionnelle',
        disponible: true,
      },
      {
        id: 'jacobienne',
        titre: 'La différentielle déforme une petite grille',
        resume: 'Un petit carré autour de x est envoyé presque sur un parallélogramme : f′(x) en action, et la règle des composées.',
        source: 'Poly, matrice jacobienne ; dérivation des composées',
        disponible: true,
      },
      {
        id: 'taylor',
        titre: 'Formules de Taylor',
        resume: 'La surface z = f(x), son plan tangent et sa quadrique : l’erreur décroît comme ‖h‖² puis ‖h‖³.',
        source: 'Poly, formules de Taylor',
        disponible: true,
      },
      {
        id: 'differences-finies',
        titre: 'Dérivées numériques : le « V » de l’erreur',
        resume: 'Différences finies avant, centrées et pas complexe : l’erreur de troncature contre l’erreur d’arrondi.',
        source: 'TP « Calcul de dérivées »',
        disponible: true,
      },
    ],
  },
  {
    id: 'existence',
    titre: 'Existence et unicité des solutions',
    source: 'Poly, chapitre « Théorèmes d’existence et d’unicité »',
    illustrations: [
      {
        id: 'cauchy',
        titre: 'Le problème de Cauchy, d’un clic',
        resume: 'On clique un point (t₀, x₀) : la solution maximale part dans les deux sens, jusqu’à exploser ou atteindre le bord.',
        source: 'Poly, solutions maximales et globales ; temps de vie',
        disponible: true,
      },
      {
        id: 'peano',
        titre: 'Peano : des polygones d’Euler à une solution',
        resume: 'Dans le cylindre de sécurité, les polygones d’Euler restent dans un cône et se resserrent : leur limite est une solution, mais laquelle ?',
        source: 'Poly, théorème de Peano (preuve : Demailly, § V.2)',
        disponible: true,
      },
      {
        id: 'non-unicite',
        titre: 'Quand l’unicité tombe',
        resume: 'ẋ = √|x| et ẋ = 3|x|²ᐟ³ : un second membre continu mais pas lipschitzien, et une infinité de solutions maximales.',
        source: 'Poly, théorèmes de Peano et de Cauchy-Lipschitz',
        disponible: true,
      },
      {
        id: 'echappement',
        titre: 'Théorème d’échappement',
        resume: 'La courbe intégrale sort de tout compact : vers l’infini si Ω = ℝⁿ, vers la frontière si Ω est borné.',
        source: 'Poly, théorème d’échappement',
        disponible: true,
      },
      {
        id: 'picard',
        titre: 'Approximations successives et Grönwall',
        resume: 'Les itérées de Picard convergent vers la solution ; deux solutions voisines s’écartent au plus comme eᵏᵗ.',
        source: 'Poly, équation intégrale ; Cauchy-Lipschitz ; Grönwall',
        disponible: true,
      },
    ],
  },
  {
    id: 'lineaire',
    titre: 'Équations différentielles linéaires',
    source: 'Poly, chapitre « Équations différentielles linéaires »',
    illustrations: [
      {
        id: 'exponentielle',
        titre: 'Exponentielle de matrice',
        resume: 'Les sommes partielles de la série convergent vers eᵗᴬ ; la solution x(t) = eᵗᴬx₀ ; et eᴬeᴮ ≠ eᴬ⁺ᴮ.',
        source: 'Poly, exponentielle de matrice',
        disponible: true,
      },
      {
        id: 'duhamel',
        titre: 'Variation de la constante',
        resume: 'La solution avec second membre est la somme de la réponse libre et des réponses à chaque instant de b.',
        source: 'Poly, solution du problème de Cauchy général',
        disponible: true,
      },
    ],
  },
  {
    id: 'flot',
    titre: 'Flot d’une équation différentielle',
    source: 'Poly, chapitre « Flot d’une équation différentielle ordinaire »',
    illustrations: [
      {
        id: 'flot',
        titre: 'Le flot transporte les ensembles',
        resume: 'Un ensemble de conditions initiales emporté par φₜ : formule du flot, retour en arrière, aire et déterminant.',
        source: 'Poly, définition du flot ; formule de Liouville',
        disponible: true,
      },
      {
        id: 'pendule',
        titre: 'Le pendule simple, qu’on attrape',
        resume: 'On saisit le pendule et on le lâche : son point suit une orbite du portrait de phase, oscillation ou rotation.',
        source: 'Poly, orbites et portraits de phase',
        disponible: true,
      },
      {
        id: 'variationnelle',
        titre: 'Équation linéarisée : la dérivée du flot',
        resume: 'Une solution perturbée de ε δx₀ s’écarte de ε δx(t), donné par l’équation variationnelle, avec l’ordre 1 tracé à côté de la vraie solution.',
        source: 'Poly, linéarisation et perturbation du flot',
        disponible: true,
      },
      {
        id: 'sensibilite',
        titre: 'Dériver une solution calculée',
        resume: 'Différences finies externes ou internes, ou équation variationnelle : laquelle donne ∂x(T)/∂x₀ au plus près, et pourquoi les différences finies butent vers 10⁻⁸.',
        source: 'Hors poly : TP « Calcul de dérivées », « Estimation de paramètres », à partir de la linéarisation du flot',
        disponible: true,
      },
    ],
  },
  {
    id: 'numerique',
    titre: 'Intégration numérique',
    source: 'Poly, chapitre « Intégration numérique »',
    illustrations: [
      {
        id: 'euler-pas',
        titre: 'Euler, pas à pas',
        resume: 'Chaque pas suit la tangente : erreurs locales de consistance, puis leur propagation en erreur globale.',
        source: 'Poly, consistance, stabilité et convergence',
        disponible: true,
      },
      {
        id: 'ordre',
        titre: 'Ordre de convergence et tableau de Butcher',
        resume: 'On modifie le tableau de Butcher et on lit l’ordre sur la pente de l’erreur en échelle log-log.',
        source: 'Poly, méthodes de Runge-Kutta explicites',
        disponible: true,
      },
      {
        id: 'implicite',
        titre: 'Schémas implicites',
        resume: 'Chaque pas résout une équation, par point fixe ou par Newton ; et le pas que tolère un schéma explicite.',
        source: 'Poly, méthodes de Runge-Kutta implicites',
        disponible: true,
      },
    ],
  },
  {
    id: 'annexes',
    titre: 'Grands théorèmes',
    source: 'Poly, annexe « Grands théorèmes »',
    illustrations: [
      {
        id: 'fonctions-implicites',
        titre: 'Inversion locale et fonctions implicites',
        resume: 'Une ligne de niveau est localement un graphe tant que ∂f/∂y ≠ 0 ; on déplace le point jusqu’à ce que cela casse.',
        source: 'Poly, théorèmes d’inversion locale et des fonctions implicites',
        disponible: true,
      },
    ],
  },
];

