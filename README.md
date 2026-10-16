# ♪ Bard Academia

**Composez l’ambiance de vos parties, puis faites-la évoluer au fil de l’aventure.**

Bard Academia est un module pour **Foundry Virtual Tabletop**, conçu pour permettre au maître du jeu de gérer musiques, fonds sonores et effets depuis une même fenêtre.

Une taverne calme devient animée, puis dégénère en bagarre. Une forêt passe du jour à la nuit, avant l’arrivée d’un orage. Préparez les sons de chaque situation, puis changez d’atmosphère pendant la partie.

[Dernière version](https://github.com/justinchaban/Bard_Academia/releases/latest) · [Signaler un problème](https://github.com/justinchaban/Bard_Academia/issues) · [Licence MIT](LICENSE)

## Fonctionnalités

- **Carnet de lieux** : retrouvez vos ambiances sous forme de cartes illustrées, avec recherche et filtres.
- **Catégories personnalisables** : ajoutez, renommez ou supprimez vos catégories — Nature, Grottes, Espace, etc.
- **États personnalisables par lieu** : ajoutez, renommez ou retirez des états comme Calme, Combat, Nuit ou Orage.
- **Transitions progressives** : mélangez les niveaux de deux états voisins avec le curseur d’intensité.
- **Musique et fond indépendants** : réglez leurs volumes et, si nécessaire, leurs intensités séparément.
- **Couches de fond sonore** : ajustez ou coupez individuellement une foule, un feu, du vent ou de la pluie.
- **Effets ponctuels** : déclenchez une porte, un cri ou un coup de tonnerre pendant que l’ambiance continue.
- **Fichiers personnels** : ajoutez vos propres sons et choisissez une image pour chaque lieu.
- **Playlists organisées** : les playlists gérées par le module sont regroupées dans un dossier **Bard Academia**.

Les commandes sont réservées au MJ. La diffusion des sons repose sur les playlists natives de Foundry.

## Compatibilité

Le module cible **Foundry VTT v14**. Le manifeste déclare **14.368** comme version vérifiée.

Le projet est en développement. Les derniers correctifs ont fait l’objet de contrôles automatisés avec un environnement simulé ; ils ne constituent pas une validation complète en session Foundry, notamment côté joueurs.

## Installation

### Depuis Foundry

1. Dans l’écran de configuration, ouvrez **Modules complémentaires**, puis **Installer un module**.
2. Collez cette adresse dans le champ **URL du manifeste** :

   ```text
   https://github.com/justinchaban/Bard_Academia/releases/latest/download/module.json
   ```

3. Installez le module.
4. Ouvrez votre monde et activez **Bard Academia** dans **Gérer les modules**.

Cette adresse nécessite une release publiée contenant les fichiers `module.json` et `bard-academia.zip`.

### Installation manuelle

1. Téléchargez **`bard-academia.zip`** dans les fichiers joints de la [dernière release](https://github.com/justinchaban/Bard_Academia/releases/latest).
2. Fermez Foundry.
3. Extrayez son contenu dans **`Data/modules/bard-academia/`**.
4. Vérifiez que le manifeste se trouve directement à cet emplacement :

   ```text
   Data/modules/bard-academia/module.json
   ```

5. Redémarrez Foundry et activez le module dans votre monde.

Le dossier doit s’appeler **`bard-academia`**, avec un tiret. Utilisez l’archive du module fournie dans la release, plutôt que l’archive « Source code » générée par GitHub.

## Premiers pas

1. Connectez-vous avec un compte MJ.
2. Cliquez sur l’icône **♪** dans les outils de gauche, ou utilisez **Alt+B**.
3. Dans **Lieux**, cliquez sur **Créer** et donnez un nom à votre ambiance.
4. Dans **Personnaliser**, choisissez sa catégorie, son image et les noms de ses états.
5. Ajoutez vos fichiers avec **＋ Musique**, **＋ Fond** ou **＋ Effet**.
6. Réglez la présence de chaque piste dans les différents états.
7. Cliquez sur **Terminer**, puis **Lancer**.

Le module démarre sans lieux préfabriqués ni fichiers audio fournis.

## Composer les états d’une ambiance

Chaque état décrit un mélange de pistes. Pour chaque musique ou fond sonore :

| Présence | Résultat |
| --- | --- |
| `0` | Piste absente de cet état |
| `50` | Piste à la moitié de son niveau de référence |
| `100` | Piste à son niveau de référence |

Le volume final dépend aussi des volumes du mixeur et des réglages audio de Foundry.

Exemple pour une taverne :

| Piste | Calme | Animée | Bagarre |
| --- | --- | --- | --- |
| Musique douce | 100 | 30 | 0 |
| Brouhaha | 20 | 80 | 40 |
| Musique de combat | 0 | 0 | 100 |
| Bruits de bagarre | 0 | 0 | 80 |

Cliquez sur un état pour le sélectionner, ou déplacez le curseur pour mélanger progressivement les états voisins.

**Les états sont des étapes ordonnées du curseur.** Nuit et Orage peuvent être des états distincts, mais ne sont pas des interrupteurs indépendants que l’on cumule. Pour superposer de la pluie à une ambiance, utilisez une piste de fond.

### Ajouter ou supprimer un état

Dans **Personnaliser → Les états** :

- Cliquez sur **Ajouter un état** pour créer une nouvelle étape.
- Modifiez son nom directement dans son champ.
- Cliquez sur **×** pour le supprimer après confirmation.

Un nouvel état commence avec toutes les pistes à **0** : réglez ensuite leurs niveaux. Au moins un état doit être conservé. Supprimer un état conserve les pistes et les niveaux des autres états.

## Organiser ses lieux

Dans **Lieux → Catégories**, créez, renommez ou supprimez les catégories communes au monde.

Pour classer un lieu, ouvrez **Personnaliser → Catégorie**. La suppression d’une catégorie conserve ses lieux dans **Sans catégorie**, avec leurs sons et leurs réglages.

## Gérer ses fichiers audio

Conservez de préférence vos sons en dehors du dossier du module, par exemple :

```text
Data/audio/bard-academia/
```

Vous évitez ainsi de les mêler aux fichiers remplacés lors des mises à jour. Dans Foundry, le chemin correspondant commence par `audio/bard-academia/`.

- Utilisez les boutons d’ajout du module pour sélectionner vos fichiers.
- Pour remplacer le fichier d’une piste existante, modifiez son chemin dans les playlists Foundry : ses réglages Bard Academia restent associés à la piste.
- Retirer une piste du module ne supprime pas le fichier audio de votre disque.
- Les musiques et fonds ajoutés par le module sont configurés pour boucler ; les effets ponctuels ne le sont pas.

Le module ne raccourcit ni ne convertit automatiquement les fichiers audio.

### Bibliothèque en ligne facultative

Une fenêtre de recherche permet d’utiliser **Freesound** et **Jamendo**, avec vos propres identifiants API. Le code limite les imports aux aperçus CC0 pour Freesound et aux fichiers téléchargeables sous CC0 ou CC BY pour Jamendo.

Ces intégrations dépendent de la disponibilité et des conditions des services. Vérifiez la licence de chaque fichier et conservez les crédits requis. Aucune clé API n’est nécessaire pour utiliser vos fichiers locaux.

## Mises à jour

Une fois le module installé avec son URL de manifeste, les nouvelles versions publiées peuvent être récupérées depuis la gestion des modules de Foundry.

Pour une mise à jour manuelle, fermez Foundry et remplacez les fichiers du module par ceux du nouveau ZIP. Conservez vos fichiers audio et sauvegardez votre monde avant une mise à jour importante.

### Anciennes installations Ambiance Forge

L’identifiant actuel est **`bard-academia`**. Désactivez l’ancien module avant d’activer Bard Academia.

Une migration récupère les anciens réglages des playlists et des pistes. Les chemins audio pointant encore vers `modules/ambiance-forge/audio/` doivent être corrigés dans les playlists Foundry après déplacement des fichiers.

## Signaler un problème

Ouvrez une [issue](https://github.com/justinchaban/Bard_Academia/issues) en indiquant :

- les versions de Foundry et de Bard Academia ;
- les étapes permettant de reproduire le problème ;
- le résultat attendu et ce qui se produit ;
- le message d’erreur ou une capture, si disponible.

Ne joignez pas vos clés API, vos données de connexion ou des fichiers audio dont vous ne pouvez pas autoriser la redistribution.

## Licence et crédits

**Auteur : Rin.**

Le code et la documentation sont distribués sous **licence MIT**. Consultez le fichier [LICENSE](LICENSE) pour le texte de référence.

Cette licence autorise l’utilisation, la modification, la redistribution et la vente du code, sous réserve de conserver les mentions de copyright et de licence. Elle prévoit une exclusion de garantie et de responsabilité ; elle n’interdit pas les usages commerciaux.

Les illustrations et les fichiers audio personnels ou tiers ne sont pas couverts par cette licence du code. Leurs droits et licences respectifs restent applicables. **Aucun fichier audio n’est fourni avec le module.**

Bard Academia est un projet indépendant, sans affiliation avec Pocket Bard ni Foundry Gaming LLC.
