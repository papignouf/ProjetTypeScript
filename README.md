 Ce projet est un puissance 4 en TypeScript, jouable directement dans le terminal.
 Le but est simple : deux joueurs s'affrontent pour aligner 4 jetons identiques à l'horizontale, verticale ou diagonale.

 - Règles du jeu :
 2 joueurs : Joueur 1 (Rouge) et et Joueur 2 (Jaune)
 À chaque tour, un joueur choisit une colonne entre 1 et 7
 Le pion tombe au plus bas de la colonne choisie
 Le premier à aligner 4 pions consécutifs (horizontal, vertical ou diagonal) gagne la partie
 Si la grille est pleine et qu’il n’y a pas de gagnant → Match nul.

 - Structure du projet :
   puissance4.ts → le fichier principal qui contient :
   - L'initialisation de la grille vide
   - La boucle de jeu (gestion des tours)
   - Les contrôles utilisateurs (avec clavier)
   - Les vérifications de victoire
   README.me → fichier explicatif

- Fonctionnalités principales :
  - Affichage d'une grille lisible en console (6 l x 7 c)
  - Gestion du tour par tour entre les deux joueurs
  - Vérification des conditions de victoire après chaque coup
  - Gestion des erreurs de saisie :
        - Colonne inexistante
        - Colonne déjà pleine
  - Fin de partie avec annonce claire du résultat

- Améliorations possibles :
   - Sauvegarder les scores dans un fichier
   - Personnaliser les symboles (R / J) pour les joueurs
   - Rendre l’affichage coloré (rouge et jaune) pour plus de lisibilité

 Gabriel PIGNON, B2CS3.
