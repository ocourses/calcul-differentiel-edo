<!-- LTeX: language=fr-FR -->
# Travaux pratiques

Les travaux pratiques sont des notebooks [Julia](https://julialang.org).

- [`install.ipynb`](install.ipynb) — installation de l'environnement Julia
  commun aux TPs (à exécuter une fois en premier) ;
- [`derivees.ipynb`](derivees.ipynb) — calcul de dérivées ;
- [`runge-kutta.ipynb`](runge-kutta.ipynb) — méthodes de Runge–Kutta pour les
  équations différentielles ordinaires ;
- [`systemes-dynamiques.ipynb`](systemes-dynamiques.ipynb) — systèmes
  dynamiques.

Les prochains TPs seront ajoutés progressivement dans ce répertoire.

## Exécuter les TPs en ligne avec Binder

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/ocourses/calcul-differentiel-edo/HEAD?urlpath=lab)

Sans rien installer, vous pouvez exécuter les notebooks dans le navigateur via
[Binder](https://mybinder.org) : cliquez sur le badge ci-dessus, attendez la
construction de l'environnement (plusieurs minutes la première fois), puis
ouvrez les notebooks du répertoire `tp/`.

Limites : les fichiers ne sont pas sauvegardés entre les sessions (téléchargez
vos notebooks modifiés), la session s'arrête après une dizaine de minutes
d'inactivité et les ressources sont limitées. Pour un usage régulier,
l'installation locale décrite ci-dessous reste recommandée.

## Installer Julia et préparer les TPs

Nous allons utiliser le langage [Julia](https://julialang.org) pour les TPs.
Il faut effectuer les étapes suivantes :

1. Installer [Julia](https://julialang.org/downloads/) en version **1.12.x**.

   L'environnement du cours (`tp/Manifest.toml`) est figé pour cette version
   mineure. Une autre version de Julia fonctionne aussi, mais demande une étape
   supplémentaire (voir le point 5). N'installez pas Julia via conda.

2. Le plus simple est d'utiliser
   [VSCode](https://code.visualstudio.com/download) pour faire tourner les TPs.

   - Installer VSCode.
   - Installer les extensions suivantes dans VSCode :
     [Julia](https://marketplace.visualstudio.com/items?itemName=julialang.language-julia)
     et
     [Jupyter](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter).

3. Installer le paquet `IJulia` depuis un terminal. Il est nécessaire pour
   démarrer le noyau Julia des notebooks. Utilisez la même version de Julia que
   celle qui sera sélectionnée dans VSCode :

   ```bash
   julia -e 'using Pkg; Pkg.add("IJulia"); using IJulia; installkernel("Julia")'
   ```

   Cette commande doit être exécutée dans un terminal, avant de lancer le
   premier notebook. Elle installe `IJulia` dans l'environnement général de
   Julia et enregistre le noyau Julia pour Jupyter.

4. Ouvrir le dépôt cloné dans VSCode : **File > Open Folder...**, puis
   sélectionner le répertoire `calcul-differentiel-edo`.

5. Ouvrir le notebook [`install.ipynb`](install.ipynb), puis choisir le noyau
   Julia installé avec **Select Kernel** en haut à droite. Si plusieurs
   versions de Julia sont installées, sélectionner celle avec laquelle `IJulia`
   a été installé. Exécuter ensuite les cellules dans l'ordre.

   L'environnement Julia du cours est décrit par deux fichiers déjà présents
   dans `tp/` :

   - `Project.toml` liste les packages utilisés directement par les TPs ;
   - `Manifest.toml` enregistre les versions exactes de ces packages et de
     leurs dépendances.

   Le notebook active cet environnement et installe, avec `Pkg.instantiate()`,
   les versions enregistrées dans `Manifest.toml`. L'installation et la
   précompilation peuvent prendre plusieurs minutes la première fois. Le
   notebook affiche ensuite la liste des packages et un message confirmant que
   l'installation est réussie.

   Ces fichiers peuvent évoluer lorsqu'un nouveau TP nécessite un package :
   récupérez alors la mise à jour avec `git pull`, puis réexécutez
   [`install.ipynb`](install.ipynb).

   Si vous utilisez une version de Julia autre que 1.12 et que
   `Pkg.instantiate()` signale un problème de version, exécutez une fois
   `Pkg.resolve()` puis relancez `Pkg.instantiate()` : Julia recalcule alors
   les versions à partir de `Project.toml`.

6. Ouvrir et exécuter les notebooks de TP. Ils activent normalement
   automatiquement l'environnement du cours. Si vous travaillez dans une
   session Julia interactive, activez-le avec :

   ```julia
   using Pkg
   Pkg.activate("chemin/vers/calcul-differentiel-edo/tp")
   ```

   Les fichiers `Project.toml` et `Manifest.toml` sont propres à l'environnement
   du cours : ne les supprimez pas et ne les remplacez pas par ceux d'un autre
   projet Julia.
