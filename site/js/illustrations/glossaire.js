// Glossaire des illustrations : les définitions du poly, reprises au plus près
// de leur énoncé (chapitre indiqué dans `source`). Une page déclare les termes
// qu'elle emploie (`termes` dans son module) ; le gabarit souligne leur
// première occurrence dans « Ce que dit le cours » et dans « À essayer », et la
// définition s'affiche en infobulle.
//
// Chaque entrée donne les formes du terme telles qu'elles apparaissent dans les
// textes (casse, accord, apostrophe typographique), de la plus longue à la plus
// courte.

const DIFF = 'Poly, chapitre « Applications différentiables »';
const ORDRE_SUP = 'Poly, chapitre « Applications différentiables d’ordre supérieur »';
const EXISTENCE = 'Poly, chapitre « Théorèmes d’existence et d’unicité »';
const LINEAIRE = 'Poly, chapitre « Équations différentielles linéaires »';
const FLOT = 'Poly, chapitre « Flot d’une équation différentielle ordinaire »';
const NUMERIQUE = 'Poly, chapitre « Intégration numérique »';
const ANNEXE = 'Poly, annexe « Grands théorèmes »';

export const GLOSSAIRE = {
  // ---- Calcul différentiel ----------------------------------------------------------
  'petit o': {
    formes: ['petit o'],
    definition:
      '$g(v) = o(v^p)$ si, pour tout $\\varepsilon > 0$, il existe $\\eta_\\varepsilon > 0$ tel que $\\|v\\| \\le \\eta_\\varepsilon$ entraîne $\\|g(v)\\| \\le \\varepsilon\\,\\|v\\|^p$ : $g$ est négligeable devant $\\|v\\|^p$ près de $0$.',
    source: DIFF,
  },
  différentiable: {
    formes: ['différentiable', 'dérivable'],
    definition:
      '$f$ est différentiable en $x$ s’il existe une application linéaire continue $f’(x)$ telle que $f(x + v) - f(x) - f’(x)\\cdot v = o(v)$. Cette application, unique, est la différentielle de Fréchet de $f$ en $x$.',
    source: DIFF,
  },
  différentielle: {
    formes: ['différentielle de Fréchet', 'différentielle'],
    definition:
      'L’application linéaire continue $f’(x)$ telle que $f(x + v) = f(x) + f’(x)\\cdot v + o(v)$. On lit $f’(x)\\cdot v$ « la différentielle de $f$ en $x$ appliquée au vecteur $v$ ».',
    source: DIFF,
  },
  'dérivée directionnelle': {
    formes: ['dérivées directionnelles', 'dérivée directionnelle'],
    definition:
      '$D_v f(x) = \\lim_{t \\to 0} \\big(f(x + tv) - f(x)\\big)/t$, la dérivée en $t = 0$ de $t \\mapsto f(x + tv)$. Si $f$ est dérivable en $x$, $D_v f(x) = f’(x)\\cdot v$ ; la réciproque est fausse.',
    source: DIFF,
  },
  'dérivée partielle': {
    formes: ['dérivées partielles', 'dérivée partielle'],
    definition:
      'Dérivée de $f$ par rapport à l’une de ses variables, les autres étant fixées. En dimension finie, $\\partial f/\\partial x_i(x) = D_{e_i} f(x)$, dérivée directionnelle selon le $i$-ème vecteur de la base canonique.',
    source: DIFF,
  },
  'classe C1': {
    formes: ['de classe C¹', 'classe C¹'],
    definition: '$f$ est de classe $C^1$ sur $U$ si elle y est dérivable et si l’application dérivée $x \\mapsto f’(x)$ est continue.',
    source: DIFF,
  },
  'matrice jacobienne': {
    formes: ['matrices jacobiennes', 'matrice jacobienne', 'jacobienne'],
    definition:
      'Pour $f \\colon \\mathbb R^n \\to \\mathbb R^m$, la matrice $J_f(x)$ de taille $m \\times n$ des dérivées partielles $\\partial f_j/\\partial x_i(x)$. On a $f’(x)\\cdot v = J_f(x)\\,v$.',
    source: DIFF,
  },
  jacobien: {
    formes: ['jacobien'],
    definition: 'Si $m = n$, le déterminant $\\det J_f(x)$ de la matrice jacobienne.',
    source: DIFF,
  },
  gradient: {
    formes: ['gradient'],
    definition: 'Pour $f \\colon \\mathbb R^n \\to \\mathbb R$, le vecteur colonne $\\nabla f(x) = J_f(x)^T$ des dérivées partielles : $f’(x)\\cdot v = \\langle \\nabla f(x), v\\rangle$.',
    source: DIFF,
  },
  'dérivation des composées': {
    formes: ['dérivation des applications composées', 'Dérivation des composées', 'dérivation des composées', 'règle des composées'],
    definition: 'Si $f$ est dérivable en $x$ et $g$ en $f(x)$, alors $g \\circ f$ est dérivable en $x$ et $(g \\circ f)’(x) = g’(f(x)) \\circ f’(x)$.',
    source: DIFF,
  },
  hessienne: {
    formes: ['matrice hessienne', 'hessienne'],
    definition:
      'Pour $f \\colon \\mathbb R^n \\to \\mathbb R$ deux fois dérivable, la matrice $\\nabla^2 f(x)$ des dérivées partielles secondes ; elle est symétrique (Schwarz) et $f’’(x)\\cdot(h, k) = \\langle \\nabla^2 f(x)\\,h, k\\rangle$.',
    source: ORDRE_SUP,
  },
  'Taylor-Young': {
    formes: ['Taylor-Young'],
    definition:
      'Si $f$ est $k$ fois différentiable en $x$, $f(x + h) = \\sum_{j=0}^{k} \\frac{1}{j!} f^{(j)}(x)\\cdot h^j + o(h^k)$ : un reste négligeable devant $\\|h\\|^k$, sans borne explicite.',
    source: ORDRE_SUP,
  },
  'Taylor-Lagrange': {
    formes: ['Taylor-Lagrange'],
    definition:
      'Si $f$ est de classe $C^{k+1}$ et $\\|f^{(k+1)}\\| \\le M$ sur $[x, x + h]$, l’écart entre $f(x + h)$ et son polynôme de Taylor d’ordre $k$ est au plus $\\frac{M}{(k+1)!}\\|h\\|^{k+1}$.',
    source: ORDRE_SUP,
  },

  // ---- Existence et unicité ---------------------------------------------------------------
  'champ de vecteurs': {
    formes: ['champs de vecteurs', 'champ de vecteurs'],
    definition:
      'Une application continue $f \\colon I \\times \\Omega \\to \\mathbb R^n$ qui à $(t, x)$ associe un vecteur $f(t, x)$ : le second membre de l’équation $\\dot x(t) = f(t, x(t))$.',
    source: EXISTENCE,
  },
  autonome: {
    formes: ['non autonome', 'autonomes', 'autonome'],
    definition: 'Le champ $f$ est autonome s’il ne dépend pas explicitement du temps : on note alors $f(x)$ au lieu de $f(t, x)$.',
    source: EXISTENCE,
  },
  'problème de Cauchy': {
    formes: ['problèmes de Cauchy', 'problème de Cauchy'],
    definition: 'L’équation différentielle munie d’une condition initiale : $\\dot x(t) = f(t, x(t))$, $x(t_0) = x_0$.',
    source: EXISTENCE,
  },
  'courbe intégrale': {
    formes: ['courbes intégrales', 'courbe intégrale'],
    definition: 'Le graphe $\\{(t, \\varphi(t))\\}$ d’une solution $\\varphi$, dans l’espace des phases élargi.',
    source: EXISTENCE,
  },
  'espace des phases élargi': {
    formes: ['espace des phases élargi'],
    definition: 'Le produit de l’axe des temps et de l’espace des phases, de dimension $n + 1$ : c’est là que vivent les courbes intégrales.',
    source: EXISTENCE,
  },
  orbite: {
    formes: ['orbites', 'orbite'],
    definition:
      'L’orbite de $x_0$ est l’ensemble $\\{\\varphi_t(x_0),\\ t \\in I(x_0)\\}$, la courbe tracée dans l’espace des phases par la solution maximale passant par $x_0$. Deux orbites distinctes ne se croisent pas.',
    source: FLOT,
  },
  'solution maximale': {
    formes: ['solutions maximales', 'solution maximale', 'maximales', 'maximale'],
    definition:
      'Une solution qui n’admet aucun prolongement strict : on ne peut pas l’étendre à un intervalle plus grand en restant solution. Sous Cauchy-Lipschitz, elle est unique et notée $(I(t_0, x_0), \\varphi(\\cdot, t_0, x_0))$.',
    source: EXISTENCE,
  },
  'solution globale': {
    formes: ['solutions globales', 'solution globale', 'globales', 'globale'],
    definition: 'Une solution définie sur tout l’intervalle de temps $I$ de l’équation. Toute solution globale est maximale ; la réciproque est fausse.',
    source: EXISTENCE,
  },
  'équation intégrale': {
    formes: ['Équation intégrale', 'équation intégrale'],
    definition: '$\\varphi$ est solution du problème de Cauchy si et seulement si $\\varphi(t) = x_0 + \\int_{t_0}^t f(s, \\varphi(s))\\,\\mathrm ds$ pour tout $t$ de son intervalle.',
    source: EXISTENCE,
  },
  lipschitzienne: {
    formes: ['localement lipschitzienne', 'globalement lipschitzienne', 'lipschitzienne', 'lipschitzien'],
    definition:
      '$f$ est localement lipschitzienne en $x$ si, près de chaque point, il existe $k \\ge 0$ tel que $\\|f(t, x_1) - f(t, x_2)\\| \\le k\\,\\|x_1 - x_2\\|$. Globalement si $k$ ne dépend pas de $x$. C’est le cas si $\\partial f/\\partial x$ est continue.',
    source: EXISTENCE,
  },
  'explosion en temps fini': {
    formes: ['explosion en temps fini', 'explosent en temps fini', 'explose en temps fini'],
    definition: 'Une solution maximale définie sur $]t^-, t^+[$ avec $t^+ < +\\infty$ et $\\|x(t)\\| \\to +\\infty$ quand $t \\to t^+$ : elle n’est pas globale.',
    source: EXISTENCE,
  },
  'croissance linéaire': {
    formes: ['croissance linéaire'],
    definition: '$\\|f(t, x)\\| \\le \\alpha(t) + \\beta(t)\\,\\|x\\|$ avec $\\alpha$, $\\beta$ continues : toute solution maximale est alors globale.',
    source: EXISTENCE,
  },
  'lemme de Grönwall': {
    formes: ['lemme de Grönwall', 'Grönwall'],
    definition:
      'Si $u(t) \\le a + \\int_{t_0}^t k(s)\\,u(s)\\,\\mathrm ds$ avec $u$, $k \\ge 0$ continues, alors $u(t) \\le a\\,\\exp\\big(\\int_{t_0}^t k(s)\\,\\mathrm ds\\big)$.',
    source: EXISTENCE,
  },
  contractante: {
    formes: ['contractante'],
    definition: 'Lipschitzienne de rapport $k < 1$. Sur un espace métrique complet, une application contractante a un unique point fixe (Picard), limite des itérées.',
    source: ANNEXE,
  },

  // ---- Linéaire ------------------------------------------------------------------------------
  exponentielle: {
    formes: ['exponentielle de matrice', 'exponentielle'],
    definition: '$e^A = \\sum_{k \\ge 0} A^k/k!$, série absolument convergente. La solution de $\\dot x = Ax$, $x(0) = x_0$, est $x(t) = e^{tA}x_0$.',
    source: LINEAIRE,
  },
  homogène: {
    formes: ['non homogène', 'homogène'],
    definition: 'L’équation $\\dot x(t) = A(t)\\,x(t) + b(t)$ est homogène si $b = 0$ ; non homogène, ou avec second membre, sinon.',
    source: LINEAIRE,
  },
  résolvante: {
    formes: ['résolvante'],
    definition:
      'L’application linéaire $R(t, t_0)$ telle que $R(t, t_0)\\,x_0 = \\varphi(t, t_0, x_0)$ pour $\\dot x = A(t)\\,x$ : la solution de $\\dot X = A(t)\\,X$, $X(t_0) = I_n$. Si $A$ est constante, $R(t, t_0) = e^{(t - t_0)A}$.',
    source: LINEAIRE,
  },

  // ---- Flot ----------------------------------------------------------------------------------
  flot: {
    formes: ['flot'],
    definition:
      'L’application $(t, t_0, x_0) \\mapsto \\varphi(t, t_0, x_0)$, valeur au temps $t$ de la solution maximale telle que $x(t_0) = x_0$. Pour $t$ fixé, $\\varphi_t$ transporte à l’instant $t$ ce qui était en $x_0$.',
    source: FLOT,
  },
  'point d’équilibre': {
    formes: ['points d’équilibre', 'point d’équilibre', 'équilibres', 'équilibre'],
    definition: 'Un point $x_0$ tel que $f(x_0) = 0$ : son orbite est réduite à $\\{x_0\\}$.',
    source: FLOT,
  },
  'orbite périodique': {
    formes: ['orbites périodiques', 'orbite périodique', 'périodique'],
    definition: 'Une orbite fermée : il existe $T > 0$ avec $\\varphi_T(x) = x$, et la solution est $T$-périodique.',
    source: FLOT,
  },
  'portrait de phase': {
    formes: ['portraits de phase', 'portrait de phase'],
    definition: 'La partition de $\\Omega$ en orbites, pour un champ autonome.',
    source: FLOT,
  },
  séparatrice: {
    formes: ['séparatrices', 'séparatrice'],
    definition: 'Pour le pendule, les orbites qui séparent les oscillations des rotations : elles relient les positions d’équilibre hautes.',
    source: FLOT,
  },
  'équation linéarisée': {
    formes: ['équation linéarisée', 'équation variationnelle', 'équations variationnelles'],
    definition:
      'Le long d’une solution $\\bar x(\\cdot)$ : $\\dot{\\delta x}(t) = f’(\\bar x(t))\\cdot\\delta x(t)$. Sa solution issue de $\\delta x_0$ est $\\varphi_t’(\\bar x_0)\\cdot\\delta x_0 = R(t, 0)\\,\\delta x_0$.',
    source: FLOT,
  },

  // ---- Intégration numérique -------------------------------------------------------------------
  'méthode à un pas': {
    formes: ['méthodes à un pas', 'méthode à un pas'],
    definition: 'Une méthode qui calcule $x_{i+1} = x_i + h_i\\,\\Phi(t_i, x_i, h_i)$ à partir de $t_i$, $h_i$ et $x_i$ seulement.',
    source: NUMERIQUE,
  },
  'schéma d’Euler': {
    formes: ['schéma d’Euler', 'méthode d’Euler'],
    definition: 'Le schéma explicite $x_{i+1} = x_i + h_i\\,f(t_i, x_i)$ : $\\Phi(t, x, h) = f(t, x)$, l’intégrale sur un pas approchée par un rectangle.',
    source: NUMERIQUE,
  },
  'tableau de Butcher': {
    formes: ['tableaux de Butcher', 'tableau de Butcher'],
    definition: 'Le tableau des coefficients $c_i$, $a_{ij}$ et $b_j$ qui définissent une méthode de Runge-Kutta à $s$ étages.',
    source: NUMERIQUE,
  },
  'erreur locale de consistance': {
    formes: ['erreurs locales de consistance', 'erreur locale de consistance', 'erreurs locales', 'erreur locale'],
    definition:
      '$e_i = x(t_{i+1}) - x(t_i) - h_i\\,\\Phi(t_i, x(t_i), h_i)$ : l’erreur commise en un pas quand on injecte la solution exacte dans le schéma.',
    source: NUMERIQUE,
  },
  consistante: {
    formes: ['consistantes', 'consistante'],
    definition: 'Une méthode est consistante si $\\sum_i \\|e_i\\| \\to 0$ quand $h_{\\max} \\to 0$. Pour Runge-Kutta explicite : $\\sum_i b_i = 1$.',
    source: NUMERIQUE,
  },
  'ordre de consistance': {
    formes: ['ordre de consistance'],
    definition: 'Le schéma est d’ordre $p$ si l’erreur locale vérifie $E_i(h) = O(h^{p+1})$, uniformément en $t_i$.',
    source: NUMERIQUE,
  },
  'méthode stable': {
    formes: ['méthode stable', 'stable'],
    definition:
      'Il existe $S$, indépendante des pas, telle que perturber chaque pas de $\\varepsilon_i$ écarte les suites d’au plus $S\\,(\\|x_0 - y_0\\| + \\sum_j \\|\\varepsilon_j\\|)$.',
    source: NUMERIQUE,
  },
  convergente: {
    formes: ['convergente'],
    definition: 'Une méthode est convergente si l’erreur globale $\\max_i \\|x(t_i) - x_i\\|$ tend vers $0$ quand $h_{\\max} \\to 0$. Stable et consistante entraîne convergente (Lax).',
    source: NUMERIQUE,
  },
  'erreur globale': {
    formes: ['erreur globale de convergence', 'erreur globale'],
    definition: '$\\max_{0 \\le i \\le N} \\|x(t_i) - x_i\\|$ : l’écart maximal entre la solution exacte et le schéma aux points de discrétisation. Pour un schéma stable d’ordre $p$, elle est en $O(h_{\\max}^p)$.',
    source: NUMERIQUE,
  },
  implicite: {
    formes: ['méthode implicite', 'schémas implicites', 'schéma implicite', 'implicite'],
    definition: 'Une méthode où $x_{i+1}$ apparaît des deux côtés de l’égalité : chaque pas demande de résoudre une équation, par point fixe ou par Newton.',
    source: NUMERIQUE,
  },

  // ---- Annexes ---------------------------------------------------------------------------------
  difféomorphisme: {
    formes: ['difféomorphisme'],
    definition: 'Une bijection dérivable dont l’inverse est dérivable ; un $C^k$-difféomorphisme est de classe $C^k$ ainsi que son inverse.',
    source: ANNEXE,
  },
};

