# Bard_Academia
Module Foundry VTT pour créer et piloter des ambiances sonores évolutives : musiques, bruits de fond et effets, avec réglage d’intensité.

Bard Academia 0.3.4 — édition sans audio
Module pour Foundry VTT 14. Auteur : Rin.
Cette distribution contient le code et les illustrations, mais aucun fichier audio.
Créez vos ambiances avec Lieux > Créer, puis Personnaliser > Musique / Fond / Effet.
Les sons restent à fournir par chaque utilisateur. La banque de départ est vide.

PROTÉGER LES SONS AVANT MISE À JOUR
1. COPIER les sons personnels dans Data/module/bard-academia/audio.
2. Dans les playlists du monde, modifier le chemin de chaque piste pour pointer
   vers audio/bard-academia/nom.ogg. Modifier la piste existante conserve ses réglages.
   Ne pas supprimer les anciens fichiers avant d'avoir vérifié les nouveaux chemins.
3. Sauvegarder aussi votre starter.json personnalisé hors du module.
La mise à jour du module ne change pas les playlists du monde, mais elle remplace
les fichiers du module. Les chemins des pistes ne sont PAS migrés automatiquement.
Les banques personnelles externes ne sont pas encore prises en charge par le bouton
Banque de départ de cette version.

La compatibilité verified 14.368 est reprise du manifeste fourni par l'auteur.
Module testé sur Foundry 14.368 et opérationnel.
