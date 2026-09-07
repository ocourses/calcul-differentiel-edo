<!-- LTeX: language=fr-FR -->
# Calcul différentiel et équations différentielles ordinaires

Cours de calcul différentiel et équations différentielles ordinaires pour la formation ModIA.

## Récupérer le dépôt

Le dépôt est public et contient le polycopié, les notebooks de TP et des anciens examens. Pour le récupérer, il faut installer [Git](https://git-scm.com/downloads), puis exécuter les commandes suivantes dans un terminal :

```bash
git clone https://github.com/ocourses/calcul-differentiel-edo.git
cd calcul-differentiel-edo
```

Les prochains TPs seront ajoutés progressivement dans ce dépôt. Pour récupérer les mises à jour, placez-vous dans le répertoire `calcul-differentiel-edo` puis exécutez :

```bash
git pull
```

Si vous avez modifié un notebook, faites-en de préférence une copie personnelle avant de travailler dessus, par exemple `derivees-NOM.ipynb`. Vous pourrez ainsi récupérer les futures versions sans risquer de créer un conflit avec vos modifications.

### En cas de conflit lors d'un `git pull`

Un conflit signifie que Git a trouvé des modifications locales et des modifications distantes au même endroit. La procédure la plus simple pour un notebook est la suivante :

1. Ne supprimez pas le notebook modifié. Si le conflit vient de commencer, annulez la fusion en cours :

   ```bash
   git merge --abort
   ```

2. Faites une copie de votre travail dans un autre répertoire, par exemple :

   ```bash
   cp tp/derivees.ipynb ~/derivees-mon-travail.ipynb
   ```

3. Demandez ensuite la version du dépôt et récupérez les mises à jour :

   ```bash
   git restore tp/derivees.ipynb
   git pull
   ```

4. Ouvrez votre copie personnelle et reportez vos réponses dans la nouvelle version du notebook. Les notebooks sont des fichiers JSON : il est déconseillé de résoudre leurs marqueurs de conflit directement dans un éditeur de texte.

Pour éviter ce problème, faites toujours une copie personnelle des notebooks avant de les modifier, ou enregistrez vos modifications avec un commit local avant de faire un `git pull`. La documentation officielle de Git explique également la [résolution des conflits de fusion](https://git-scm.com/docs/git-merge/fr).

## Organisation du dépôt

- [`cours-cd-edo.pdf`](cours-cd-edo.pdf) contient le polycopié du cours. Les exercices de TD se trouvent dans ce polycopié.
- [`tp/`](tp/) contient les notebooks des travaux pratiques. Le notebook [`tp/install.ipynb`](tp/install.ipynb) sert à installer l'environnement Julia commun aux TPs.
- [`examens/`](examens/) contient d'anciens sujets d'examen pour vous entraîner.

## Cours

Le cours se trouve sur un unique [polycopié](https://github.com/ocourses/calcul-differentiel-edo/blob/main/cours-cd-edo.pdf). Les exercices de TD sont également regroupés dans ce document.

## Installer Julia et préparer les TPs

Nous allons utiliser le langage [Julia](https://julialang.org) pour les TPs. Il faut effectuer les étapes suivantes :

1. Installer la dernière version de [Julia](https://julialang.org/downloads/).

   N'installez pas Julia via conda.

2. Le plus simple est d'utiliser [VSCode](https://code.visualstudio.com/download) pour faire tourner les TPs.

   - Installer VSCode.
   - Installer les extensions suivantes dans VSCode : [Julia](https://marketplace.visualstudio.com/items?itemName=julialang.language-julia) et [Jupyter](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter).

3. Ouvrir le dépôt cloné dans VSCode : **File > Open Folder...**, puis sélectionner le répertoire `calcul-differentiel-edo`.

4. Ouvrir le notebook [`tp/install.ipynb`](tp/install.ipynb). Si nécessaire, choisir un noyau Julia à l'ouverture du notebook, puis exécuter ses cellules dans l'ordre.

   Ce notebook crée dans le répertoire `tp/` deux fichiers qui décrivent l'environnement Julia du cours :

   - `Project.toml` liste les packages utilisés directement par les TPs ;
   - `Manifest.toml` enregistre les versions exactes de ces packages et de leurs dépendances.

   L'installation et la précompilation des packages peuvent prendre plusieurs minutes la première fois. Le notebook affiche ensuite la liste des packages et un message confirmant que l'installation est réussie.

5. Ouvrir et exécuter les notebooks de TP. Ils activent normalement automatiquement l'environnement du cours. Si vous travaillez dans une session Julia interactive, activez-le avec :

   ```julia
   using Pkg
   Pkg.activate("chemin/vers/calcul-differentiel-edo/tp")
   ```

   Les fichiers `Project.toml` et `Manifest.toml` sont propres à l'environnement du cours : ne les supprimez pas et ne les remplacez pas par ceux d'un autre projet Julia.

## Pour aller plus loin

Si vous vous demandez à quoi peut servir le calcul de dérivées et les équations différentielles ordinaires dans une formation sur l'IA et l'apprentissage automatique :

- [The Elements of Differentiable Programming](https://arxiv.org/abs/2403.14606) de Mathieu Blondel et Vincent Roulet (Google). Pour les EDO, cela se passe au chapitre 12.6.

>Artificial intelligence has recently experienced remarkable advances, fueled by large models, vast datasets, accelerated hardware, and, last but not least, the transformative power of differentiable programming. This new programming paradigm enables end-to-end differentiation of complex computer programs (including those with control flows and data structures), making gradient-based optimization of program parameters possible. As an emerging programming paradigm, differentiable programming builds upon several areas of computer science and applied mathematics, including automatic differentiation, graphical models, optimization and statistics. This book presents a comprehensive review of the fundamental concepts useful for differentiable programming. We adopt two main perspectives, that of optimization and that of probability, with clear analogies between the two. Differentiable programming is not merely the differentiation of programs, but also the thoughtful design of programs intended for differentiation. By making programs differentiable, we inherently introduce probability distributions over their execution, providing a means to quantify the uncertainty associated with program outputs.

- [Generalizing Scientific Machine Learning and Differentiable Simulation Beyond Continuous models](https://www.stochasticlifestyle.com/ddps-seminar-talk-generalizing-scientific-machine-learning-and-differentiable-simulation-beyond-continuous-models/) de Christopher Rackauckas (MIT).

>The combination of scientific models into deep learning structures, commonly referred to as scientific machine learning (SciML), has made great strides in the last few years in incorporating models such as ODEs and PDEs into deep learning through differentiable simulation. However, the vast space of scientific simulation also includes models like jump diffusions, agent-based models, and more. Is SciML constrained to the simple continuous cases or is there a way to generalize to more advanced model forms? This talk will dive into the mathematical aspects of generalizing differentiable simulation to discuss chaotic simulations, differentiating stochastic simulations like particle filters and agent-based models, and solving inverse problems of Bayesian inverse problems (i.e. differentiation of Markov Chain Monte Carlo methods). We will then discuss the evolving numerical stability issues, implementation issues, and other interesting mathematical tidbits that are coming to light as these differentiable programming capabilities are being adopted.

- [Partial Differential Equations for Artificial Intelligence: numerical analysis, optimal control and optimal transport](https://pde-ai.math.cnrs.fr).

>PDE-AI is a PEPR project funded by the ANR, which gathers ten major French institutions involved in developing the mathematical analysis of AI, the study of optimization in machine learning, as well as in developing machine learning for numerical analysis and scientific computing. The institutions are Univ. Paris-Dauphine (PSL), Univ. Paris-Cité, Sorbonne Univ., Univ. Paris-Saclay, Univ. Toulouse, Univ. Lyon (CNRS), Univ. Bordeaux, Univ. Côte d’Azur, CREST (ENSAE/Institut Polytechnique de Paris) and Univ. Strasbourg. The project started in September 2023 and will last until 31 August 2027. The project is supported by the “France 2030” programme.
