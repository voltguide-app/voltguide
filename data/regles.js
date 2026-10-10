// =====================================================================
//  BASE DE RÈGLES VOLTGUIDE
//  Ce fichier contient TOUTES les données affichées par l'application.
//  Plus tard, c'est ce fichier que le robot de mise à jour modifiera.
//
//  ⚠️ Contenu de prototype, rédigé d'après la NF C 15-100.
//  Chaque règle doit être vérifiée avec la version en vigueur
//  avant toute utilisation professionnelle.
// =====================================================================

window.REGLES = {
  version: "0.1 (prototype)",
  miseAJour: "2026-10-09",

  // ---------------------------------------------------------------
  //  Guide pièce par pièce (logement)
  // ---------------------------------------------------------------
  pieces: [
    {
      id: "sejour",
      nom: "Séjour",
      source: "NF C 15-100, partie 7-771 (locaux d'habitation)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🛋️",
      demandeSurface: true,
      regles: [
        "Prises 16 A : 1 par tranche de 4 m², avec un minimum de 5",
        "Au moins 1 point d'éclairage en plafond, commandé",
        "Au moins 1 prise de communication RJ45",
      ],
      // Calcul spécial : nombre de prises selon la surface
      calcul: "sejour",
    },
    {
      id: "chambre",
      nom: "Chambre",
      source: "NF C 15-100, partie 7-771 (locaux d'habitation)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🛏️",
      regles: [
        "Prises 16 A : minimum 3",
        "Au moins 1 point d'éclairage, commandé",
        "Au moins 1 prise de communication RJ45",
      ],
    },
    {
      id: "cuisine",
      nom: "Cuisine",
      source: "NF C 15-100, partie 7-771 (locaux d'habitation)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🍳",
      demandeSurface: true,
      regles: [
        "Prises 16 A : 6 minimum, dont 4 au-dessus du plan de travail (3 minimum si la cuisine fait 4 m² ou moins)",
        "Aucune prise au-dessus de l'évier ou des plaques de cuisson",
        "Circuit spécialisé plaque de cuisson : 6 mm² / 32 A (monophasé)",
        "Circuit spécialisé four : 2,5 mm² / 20 A",
        "Circuit spécialisé lave-vaisselle : 2,5 mm² / 20 A",
        "Au moins 1 point d'éclairage en plafond, commandé",
      ],
      calcul: "cuisine",
    },
    {
      id: "sdb",
      nom: "Salle de bain",
      source: "NF C 15-100, partie 7-701 (locaux contenant une baignoire ou une douche)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🛁",
      regles: [
        "Respecter les volumes 0, 1 et 2 (voir le schéma)",
        "Volume 0 : aucun appareil sauf TBTS 12 V",
        "Volume 1 : uniquement TBTS 12 V ou chauffe-eau adapté",
        "Volume 2 : luminaires et chauffages de classe II, rasoir avec transformateur de séparation",
        "Prises 16 A : uniquement hors volumes",
        "Liaison équipotentielle supplémentaire (LES) obligatoire",
        "Au moins 1 point d'éclairage",
      ],
      schema: "volumes",
    },
    {
      id: "wc",
      nom: "WC",
      source: "NF C 15-100, partie 7-771 (locaux d'habitation)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🚽",
      regles: ["Au moins 1 point d'éclairage, commandé"],
    },
    {
      id: "entree",
      nom: "Entrée / couloir",
      source: "NF C 15-100, partie 7-771 (locaux d'habitation)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🚪",
      demandeSurface: true,
      regles: [
        "Au moins 1 point d'éclairage, commandé",
        "1 prise 16 A si la surface dépasse 4 m²",
      ],
      calcul: "entree",
    },
    {
      id: "buanderie",
      nom: "Buanderie / cellier",
      source: "NF C 15-100, partie 7-771 (locaux d'habitation)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🧺",
      regles: [
        "Circuit spécialisé lave-linge : 2,5 mm² / 20 A",
        "Circuit spécialisé sèche-linge : 2,5 mm² / 20 A",
        "Au moins 1 point d'éclairage",
      ],
    },
    {
      id: "exterieur",
      nom: "Extérieur",
      source: "NF C 15-100 (canalisations et matériel extérieur)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🌳",
      regles: [
        "Matériel avec indice de protection adapté (IP44 minimum pour les prises)",
        "Protection par différentiel 30 mA obligatoire",
        "Câbles enterrés : sous gaine rouge TPC, avec grillage avertisseur rouge au-dessus",
      ],
    },
  ],

  // ---------------------------------------------------------------
  //  Circuits : section et protection (cuivre, logement)
  // ---------------------------------------------------------------
  circuits: [
    { nom: "Éclairage", section: "1,5 mm²", protection: "16 A", limite: "8 points lumineux max" },
    { nom: "Prises 16 A", section: "1,5 mm²", protection: "16 A", limite: "5 prises max" },
    { nom: "Prises 16 A", section: "2,5 mm²", protection: "20 A", limite: "8 prises max" },
    { nom: "Volets roulants", section: "1,5 mm²", protection: "16 A", limite: "" },
    { nom: "Plaque de cuisson (mono)", section: "6 mm²", protection: "32 A", limite: "Circuit spécialisé" },
    { nom: "Four", section: "2,5 mm²", protection: "20 A", limite: "Circuit spécialisé" },
    { nom: "Lave-vaisselle", section: "2,5 mm²", protection: "20 A", limite: "Circuit spécialisé" },
    { nom: "Lave-linge", section: "2,5 mm²", protection: "20 A", limite: "Circuit spécialisé" },
    { nom: "Sèche-linge", section: "2,5 mm²", protection: "20 A", limite: "Circuit spécialisé" },
    { nom: "Chauffe-eau", section: "2,5 mm²", protection: "20 A", limite: "Circuit spécialisé" },
    { nom: "Chauffage ≤ 3 500 W", section: "1,5 mm²", protection: "16 A", limite: "" },
    { nom: "Chauffage ≤ 4 500 W", section: "2,5 mm²", protection: "20 A", limite: "" },
    { nom: "Prises de la cuisine", section: "2,5 mm²", protection: "20 A", limite: "Circuit dédié, 6 prises max" },
    { nom: "Congélateur", section: "2,5 mm²", protection: "20 A", limite: "Circuit spécialisé conseillé" },
    { nom: "VMC", section: "1,5 mm²", protection: "2 A", limite: "Circuit spécialisé" },
    { nom: "Tableau de communication", section: "1,5 mm²", protection: "16 A", limite: "Circuit dédié" },
    { nom: "Borne de recharge 7,4 kW", section: "10 mm²", protection: "40 A", limite: "Circuit dédié, différentiel type A ou B" },
  ],

  // Section minimale (mm²) pour chaque calibre de disjoncteur (cuivre)
  sectionParCalibre: { 10: 1.5, 16: 1.5, 20: 2.5, 25: 4, 32: 6, 40: 10, 63: 16 },

  // ---------------------------------------------------------------
  //  Interrupteurs différentiels 30 mA selon la surface du logement
  //  ⚠️ À vérifier : la révision 2024 de la NF C 15-100 fait évoluer
  //  les types de différentiels exigés.
  // ---------------------------------------------------------------
  differentiels: [
    { surfaceMax: 35, texte: "1 × 25 A type AC + 1 × 40 A type A", nombre: 2 },
    { surfaceMax: 100, texte: "2 × 40 A type AC + 1 × 40 A type A", nombre: 3 },
    { surfaceMax: Infinity, texte: "3 × 40 A type AC + 1 × 40 A type A", nombre: 4 },
  ],
  circuitsMaxParDifferentiel: 8,

  // ---------------------------------------------------------------
  //  Appareils courants pour le bilan de puissance (puissances typiques)
  // ---------------------------------------------------------------
  appareils: [
    { nom: "Plaque de cuisson", puissance: 6000 },
    { nom: "Four", puissance: 2500 },
    { nom: "Lave-linge", puissance: 2200 },
    { nom: "Lave-vaisselle", puissance: 2000 },
    { nom: "Sèche-linge", puissance: 2500 },
    { nom: "Chauffe-eau", puissance: 2200 },
    { nom: "Réfrigérateur", puissance: 150 },
    { nom: "Congélateur", puissance: 200 },
    { nom: "Micro-ondes", puissance: 1000 },
    { nom: "Éclairage (total)", puissance: 500 },
    { nom: "Pompe à chaleur", puissance: 3000 },
    { nom: "Borne de recharge 7,4 kW", puissance: 7400 },
  ],
  abonnements: [3, 6, 9, 12, 15, 18, 24, 30, 36], // puissances souscrites (kVA)

  // ---------------------------------------------------------------
  //  Fiches techniques (onglet « Fiches »)
  //  Chaque fiche contient des blocs : soit une liste, soit un tableau.
  // ---------------------------------------------------------------
  fiches: [
    {
      titre: "Tableau des circuits",
      source: "NF C 15-100, partie 7-771 (locaux d'habitation)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "📋",
      blocs: [
        {
          tableau: {
            entetes: ["Circuit", "Section", "Protection", "Limite"],
            // Rempli automatiquement à partir de la liste « circuits » plus haut
            depuis: "circuits",
          },
        },
      ],
    },
    {
      titre: "Différentiels 30 mA",
      source: "NF C 15-100, partie 7-771 — révision 2024 à vérifier",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🛡️",
      blocs: [
        {
          titre: "Nombre minimum selon la surface",
          tableau: {
            entetes: ["Surface", "Différentiels"],
            lignes: [
              ["≤ 35 m²", "1 × 25 A type AC + 1 × 40 A type A"],
              ["35 à 100 m²", "2 × 40 A type AC + 1 × 40 A type A"],
              ["> 100 m²", "3 × 40 A type AC + 1 × 40 A type A"],
            ],
          },
        },
        {
          titre: "Règles",
          liste: [
            "8 circuits maximum par interrupteur différentiel",
            "Type A obligatoire pour la plaque de cuisson et le lave-linge",
            "Type AC : courants alternatifs classiques (éclairage, prises, chauffage)",
            "Type A : détecte aussi les courants avec composante continue (électronique)",
            "Type F : comme le type A, plus les variateurs de fréquence (pompe à chaleur, clim)",
            "Type B : détecte les courants continus lisses (certaines bornes de recharge)",
            "⚠️ À vérifier avec la révision 2024 de la NF C 15-100",
          ],
        },
      ],
    },
    {
      titre: "Habilitations (NF C 18-510)",
      source: "NF C 18-510",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🪪",
      blocs: [
        {
          titre: "Lettres et chiffres",
          tableau: {
            entetes: ["Symbole", "Signification"],
            lignes: [
              ["B", "Basse tension (BT et TBT)"],
              ["H", "Haute tension (HTA, HTB)"],
              ["0", "Travaux non électriques (peintre, maçon…)"],
              ["1", "Exécutant de travaux électriques"],
              ["2", "Chargé de travaux électriques"],
              ["V", "Travaux au voisinage des pièces nues sous tension"],
              ["R", "Intervention BT générale (dépannage, raccordement)"],
              ["S", "Intervention BT élémentaire (remplacement à l'identique)"],
              ["C", "Chargé de consignation"],
              ["E", "Opérations spécifiques : essai, mesurage, vérification, manœuvre"],
              ["P", "Opérations sur installations photovoltaïques"],
              ["T", "Travaux sous tension"],
              ["F", "Travaux non électriques en fouille / chantier"],
            ],
          },
        },
        {
          titre: "À retenir",
          liste: [
            "L'habilitation est délivrée par l'employeur, après une formation",
            "Recyclage recommandé tous les 3 ans",
            "Exemple : un électricien de dépannage en habitat a souvent B1V, B2V, BR, BC",
          ],
        },
      ],
    },
    {
      titre: "Borne de recharge (IRVE)",
      source: "NF C 15-100, partie 7-722 et guide UTE C 15-722",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🚗",
      blocs: [
        {
          titre: "Règles principales",
          liste: [
            "Référence : NF C 15-100 partie 7-722 et guide UTE C 15-722",
            "Circuit dédié, protégé par un différentiel 30 mA",
            "Différentiel type A minimum ; type B si la borne ne détecte pas elle-même les défauts en courant continu (6 mA DC)",
            "Prise renforcée : 2,5 mm², disjoncteur 20 A",
            "Borne 7,4 kW monophasé : disjoncteur 40 A, câble 10 mm² en général (vérifier la notice et la chute de tension)",
            "Qualification IRVE obligatoire pour installer une borne de plus de 3,7 kW",
          ],
        },
      ],
    },
    {
      titre: "Photovoltaïque",
      source: "Guide UTE C 15-712-1",
      verifie: false, // passer à true quand un électricien a relu
      icone: "☀️",
      blocs: [
        {
          titre: "Règles principales",
          liste: [
            "Référence : guide UTE C 15-712-1",
            "Partie courant continu (DC) : câbles et matériel spécifiques PV",
            "Sectionneur / interrupteur DC avant l'onduleur",
            "Parafoudre selon la zone et la longueur des câbles",
            "Étiquetage obligatoire (« Attention : 2 sources de tension »)",
            "Attestation Consuel obligatoire avant raccordement au réseau",
            "Habilitation BP pour les opérations sur la partie PV",
            "Qualification QualiPV souvent demandée pour les aides",
          ],
        },
      ],
    },
    {
      titre: "Couleurs des conducteurs",
      source: "NF C 15-100, partie 5-51 (identification des conducteurs)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🎨",
      blocs: [
        {
          tableau: {
            entetes: ["Conducteur", "Couleur"],
            lignes: [
              ["Terre (PE)", "Vert / jaune, et uniquement pour la terre"],
              ["Neutre (N)", "Bleu clair"],
              ["Phase (L)", "Toute autre couleur : marron, noir, rouge, gris…"],
            ],
          },
        },
        {
          liste: [
            "⚠️ La couleur d'un fil indique sa fonction (phase, neutre, terre), PAS sa section",
            "Un fil rouge peut être du 1,5 mm², du 2,5 mm² ou plus : la section est écrite sur la gaine ou la bobine",
          ],
        },
      ],
    },
    {
      titre: "Câbles R2V : liseré de couleur par section",
      source: "Brochures Nexans (2023 et 2025) et fiches revendeurs",
      verifie: false, // passer à true quand un électricien a relu
      icone: "🌈",
      blocs: [
        {
          liste: [
            "La gaine d'un câble U-1000 R2V est noire. Certains fabricants y ajoutent un liseré (bande) de couleur qui indique la section",
            "⚠️ Ce code est propre à chaque fabricant : ce n'est pas une règle de la norme. La section est toujours écrite sur la gaine (ex. « 3G1,5 »)",
          ],
        },
        {
          titre: "Nexans DISTINGO et DISTINGO NX'TAG",
          tableau: {
            entetes: ["Section", "Liseré"],
            lignes: [
              ["1,5 mm²", "🔴 Rose / rouge"],
              ["2,5 mm²", "🟡 Jaune"],
              ["4 mm²", "🟣 Violet (à confirmer)"],
              ["6 mm²", "🔵 Bleu"],
              ["10 mm²", "🟤 Marron"],
              ["16 mm²", "🔘 Gris"],
            ],
          },
        },
        {
          titre: "Couleur des conducteurs à l'intérieur",
          tableau: {
            entetes: ["Câble", "Conducteurs"],
            lignes: [
              ["3G", "Bleu, marron, vert/jaune"],
              ["4G", "Marron, noir, gris, vert/jaune"],
              ["5G", "Bleu, marron, noir, gris, vert/jaune"],
              ["G / X", "G = avec vert/jaune · X = sans vert/jaune"],
            ],
          },
        },
      ],
    },
    {
      titre: "Indices IP",
      source: "NF EN 60529",
      verifie: false, // passer à true quand un électricien a relu
      icone: "💧",
      blocs: [
        {
          titre: "1er chiffre : poussières / objets",
          tableau: {
            entetes: ["Chiffre", "Protection"],
            lignes: [
              ["0", "Aucune"],
              ["2", "Contre les doigts (12,5 mm)"],
              ["4", "Contre les objets > 1 mm"],
              ["5", "Contre la poussière (protégé)"],
              ["6", "Totalement étanche à la poussière"],
            ],
          },
        },
        {
          titre: "2e chiffre : eau",
          tableau: {
            entetes: ["Chiffre", "Protection"],
            lignes: [
              ["0", "Aucune"],
              ["1", "Gouttes verticales"],
              ["3", "Pluie"],
              ["4", "Projections d'eau"],
              ["5", "Jets d'eau"],
              ["7", "Immersion temporaire"],
              ["8", "Immersion prolongée"],
            ],
          },
        },
      ],
    },
    {
      titre: "Hauteurs d'installation",
      source: "NF C 15-100, partie 7-771 et règles d'accessibilité (logements neufs)",
      verifie: false, // passer à true quand un électricien a relu
      icone: "📏",
      blocs: [
        {
          liste: [
            "Prises 16 A et 20 A : axe à 5 cm minimum du sol fini",
            "Prises 32 A : axe à 12 cm minimum du sol fini",
            "Tableau : organes de commande entre 1 m et 1,80 m",
            "Logement neuf (accessibilité PMR) : interrupteurs et une prise par pièce entre 0,90 m et 1,30 m",
          ],
        },
      ],
    },
  ],

  // ---------------------------------------------------------------
  //  Check-list d'autocontrôle avant la visite du Consuel
  // ---------------------------------------------------------------
  checklist: [
    {
      groupe: "Mise à la terre",
      points: [
        "Prise de terre mesurée : résistance ≤ 100 Ω",
        "Conducteur de terre en cuivre isolé, 16 mm² minimum",
        "Barrette de coupure présente et accessible",
        "Liaison équipotentielle principale (6 mm² minimum)",
        "Liaison équipotentielle supplémentaire dans la salle de bain",
      ],
    },
    {
      groupe: "Tableau électrique",
      points: [
        "Tous les circuits protégés par un différentiel 30 mA",
        "8 circuits maximum par interrupteur différentiel",
        "Différentiel de type A pour la plaque de cuisson et le lave-linge",
        "Circuits repérés (étiquettes)",
        "Réserve d'au moins 20 % de place libre",
        "Organes de commande entre 1 m et 1,80 m du sol",
        "Gaine technique logement (GTL) présente (logement neuf)",
      ],
    },
    {
      groupe: "Circuits et appareillage",
      points: [
        "Section des conducteurs adaptée au calibre de chaque disjoncteur",
        "Nombre de points par circuit respecté",
        "Prises avec obturateurs (éclats)",
        "Aucun conducteur sans protection mécanique",
        "Volumes de la salle de bain respectés",
      ],
    },
    {
      groupe: "Essais",
      points: [
        "Test du bouton de chaque différentiel : déclenchement OK",
        "Mesure de continuité des conducteurs de protection",
        "Mesure d'isolement",
        "Attestation de conformité Consuel remplie",
      ],
    },
  ],
};
