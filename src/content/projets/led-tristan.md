---
featured: true
titre: LED Tristan,
titreAccent: la musique en lumière
chiffres:
  - valeur: "180"
    libelle: bandes de fréquences analysées
  - valeur: "~30"
    libelle: images par seconde
  - valeur: "300"
    libelle: LED pilotées
  - valeur: "0"
    libelle: ligne de code par effet
stack:
  - Python
  - numpy
  - FastAPI
  - React Flow
  - ESP32 (C++)
liens: {}
graphe:
  legende: fig. — un effet = un graphe
  description: "Exemple de graphe d'effet : une playlist passe par l'analyse des fréquences, la détection du kick et un dégradé de couleur avant d'arriver au ruban LED"
  noeuds:
    - categorie: Source
      titre: Playlist SoundCloud
    - categorie: Analyse
      titre: FFT · 180 bandes
      spectre: true
    - categorie: Transformation
      titre: KickDecay
      detail: détection du kick + décroissance
    - categorie: Couleur
      titre: Dégradé
    - categorie: Sortie
      titre: ESP32 · 300 LED
spectre:
  graves: 20 Hz · graves
  centre: 180 bandes de fréquences (FFT)
  aigus: aigus · 5 000 Hz
  legende: fig. — le spectre pilote le ruban
  debit: ~30 images/s · jusqu'à 300 LED
etapes:
  - titre: Écouter
    texte: Playlist SoundCloud, fichier audio ou micro.
    stack: yt-dlp · sounddevice
  - titre: Analyser
    texte: Spectre des graves aux aigus, détection du kick, de la caisse claire, des montées d'énergie.
    stack: numpy · scipy · FFT 2048
  - titre: Composer
    texte: "Un éditeur de blocs : basses → lissage → arc-en-ciel → ruban, réglables en direct."
    stack: React Flow · FastAPI · WebSocket
  - titre: Afficher
    texte: Envoi en Wi-Fi à un ESP32 qui allume le ruban WS2812B.
    stack: C++ · UDP / DDP
---

La musique pilote un ruban de LED en temps réel. Chaque effet est un **graphe de blocs** qu'on compose à l'écran, sans code : la source, l'analyse, la transformation, la couleur, puis le ruban.
