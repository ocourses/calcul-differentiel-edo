<!-- LTeX: language=fr-FR -->
# Calcul différentiel et équations différentielles ordinaires

Supports du cours de **calcul différentiel et équations différentielles
ordinaires** pour la formation **ModIA** (INP-ENSEEIHT et INSA Toulouse).

Ce dépôt rassemble les ressources accessibles aux étudiants :

- [polycopié du cours](cours/README.md) ;
- [travaux pratiques](tp/README.md) ;
- [sujets d'examen](examens/README.md) ;
- [site web du cours](https://ocourses.github.io/calcul-differentiel-edo/) :
  illustrations interactives du poly et des TP ([documentation](site/README.md)).

## Cloner et mettre à jour le dépôt

Il est recommandé de cloner le dépôt plutôt que de télécharger les fichiers
un par un.

Pour récupérer le dépôt la première fois :

```bash
git clone https://github.com/ocourses/calcul-differentiel-edo.git
cd calcul-differentiel-edo
```

Pour récupérer les mises à jour ensuite :

```bash
cd calcul-differentiel-edo
git pull
```

Si vous avez modifié un notebook, faites-en de préférence une copie personnelle
avant de travailler dessus, par exemple `derivees-NOM.ipynb`. Vous pourrez
ainsi récupérer les futures versions sans risquer de créer un conflit avec vos
modifications.

### En cas de conflit lors d'un `git pull`

Un conflit signifie que Git a trouvé des modifications locales et des
modifications distantes au même endroit. La procédure la plus simple pour un
notebook est la suivante :

1. Ne supprimez pas le notebook modifié. Si le conflit vient de commencer,
   annulez la fusion en cours :

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

4. Ouvrez votre copie personnelle et reportez vos réponses dans la nouvelle
   version du notebook. Les notebooks sont des fichiers JSON : il est
   déconseillé de résoudre leurs marqueurs de conflit directement dans un
   éditeur de texte.

Pour éviter ce problème, faites toujours une copie personnelle des notebooks
avant de les modifier, ou enregistrez vos modifications avec un commit local
avant de faire un `git pull`. La documentation officielle de Git explique
également la [résolution des conflits de
fusion](https://git-scm.com/docs/git-merge/fr).

## Organisation du dépôt

Chaque répertoire possède son propre README avec les informations détaillées
et les liens vers ses ressources. Le dépôt étudiant ne contient que les
supports destinés aux étudiants ; les corrigés et les sources LaTeX sont
conservés dans le dépôt enseignant.

| Répertoire | Contenu |
|---|---|
| [`cours/`](cours/) | Polycopié du cours (les exercices de TD y sont regroupés) |
| [`tp/`](tp/) | Notebooks Julia des travaux pratiques et environnement associé |
| [`examens/`](examens/) | Sujets d'examen classés par année universitaire |
| [`binder/`](binder/) | Environnement Julia pour exécuter les TP en ligne (mybinder) |
| [`site/`](site/) | Site web du cours (illustrations interactives), publié sur GitHub Pages |

## Signaler une erreur

Si vous repérez une erreur dans un support, vous pouvez ouvrir une
[issue](https://github.com/ocourses/calcul-differentiel-edo/issues) en précisant
si possible le document, la page et la section concernés.
