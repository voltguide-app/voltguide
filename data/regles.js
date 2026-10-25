// =====================================================================
//  BASE DE RÈGLES VOLTGUIDE
//  Ce fichier contient TOUTES les données affichées par l'application.
//  Plus tard, c'est ce fichier que le robot de mise à jour modifiera.
//
//  Mise à jour du 25/10/2026 d'après la NF C 15-100 version 2024.
//  « verifie: true » = vérifié avec une source fiable et à jour
//  (guide Legrand d'août 2026, textes officiels…).
// =====================================================================

window.REGLES = {
  version: "0.2",
  miseAJour: "2026-10-25",

  // Source principale de cette mise à jour : guide Legrand « NF C 15-100,
  // révision 23 août 2024 — points clés » (édition août 2026), qui résume
  // la NF C 15-100 version 2024, obligatoire pour les chantiers dont le
  // permis, la déclaration préalable ou le marché date d'après le 23/08/2025.

  // ---------------------------------------------------------------
  //  Guide pièce par pièce (logement)
  // ---------------------------------------------------------------
  pieces: [
    {
      id: "sejour",
      nom: "Séjour",
      source: "NF C 15-100-10 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🛋️",
      demandeSurface: true,
      regles: [
        "Prises 16 A : jusqu'à 28 m², 1 par tranche de 4 m² avec un minimum de 5 ; au-delà de 28 m², 7 minimum, réparties en périphérie",
        "+ 2 prises de courant pour le multimédia (en priorité dans le séjour), à côté des prises RJ45",
        "1 point de centre équipé d'un DCL, commandé près de chaque accès",
        "2 prises RJ45 juxtaposées, à proximité d'une prise de courant",
      ],
      calcul: "sejour",
    },
    {
      id: "chambre",
      nom: "Chambre",
      source: "NF C 15-100-10 et -11 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🛏️",
      regles: [
        "Prises 16 A : 3 minimum",
        "1 point de centre équipé d'un DCL, commandé près de chaque accès",
        "RJ45 hors séjour : 1 au total dans un T2, 2 au total dans un T3 et plus (à répartir dans les autres pièces)",
      ],
    },
    {
      id: "cuisine",
      nom: "Cuisine",
      source: "NF C 15-100-10 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🍳",
      demandeSurface: true,
      regles: [
        "Prises 16 A : 6 minimum dont 4 au-dessus du plan de travail, sur un circuit dédié (6 prises max) ; 3 minimum si la cuisine fait 4 m² ou moins",
        "En option : 1 prise pour la hotte, à 1,80 m minimum du sol",
        "Aucune prise au-dessus de l'évier ou des plaques de cuisson",
        "Plaque de cuisson : circuit dédié 6 mm² / 32 A, sur un différentiel de type A ou F",
        "Four, lave-vaisselle, congélateur, micro-ondes : 1 circuit dédié 2,5 mm² / 20 A par appareil",
        "1 point de centre équipé d'un DCL",
      ],
      calcul: "cuisine",
    },
    {
      id: "sdb",
      nom: "Salle de bain",
      source: "NF C 15-100-7-701 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🛁",
      regles: [
        "Volume 0 (intérieur de la baignoire ou du receveur, IPX7) : uniquement de la TBTS 12 V",
        "Volume 1 (au-dessus, jusqu'à 2,25 m, IPX5 ; 1,20 m autour du pommeau pour une douche à l'italienne) : TBTS 12 V, chauffe-eau adapté",
        "Volume 2 (0,60 m autour du volume 1, IPX4) : luminaires et chauffages de classe II, prise rasoir avec transformateur de séparation",
        "Prises de courant avec terre : uniquement hors volumes",
        "Volume caché (sous la baignoire ou le receveur) : aucun appareil électrique",
        "Point d'éclairage en volume 2 : DCL avec obturateur IPX4 ou luminaire IPX4",
        "Tous les circuits protégés par un différentiel 30 mA",
        "Liaison équipotentielle locale (canalisations, masses métalliques… reliées à la terre)",
      ],
      schema: "volumes",
    },
    {
      id: "wc",
      nom: "WC",
      source: "NF C 15-100-10 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🚽",
      regles: [
        "Au-delà de 4 m² : 1 point de centre ou applique équipé d'un DCL",
        "En dessous de 4 m² : pas de minimum imposé (un point lumineux reste conseillé)",
        "Pas de prise imposée dans les WC",
      ],
    },
    {
      id: "entree",
      nom: "Entrée / couloir",
      source: "NF C 15-100-10 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🚪",
      demandeSurface: true,
      regles: [
        "Au-delà de 4 m² : 1 prise 16 A minimum",
        "Au-delà de 4 m² : 1 point de centre ou applique équipé d'un DCL",
        "Un point de commande près de chaque accès (entre 0,90 m et 1,30 m)",
      ],
      calcul: "entree",
    },
    {
      id: "buanderie",
      nom: "Buanderie / cellier",
      source: "NF C 15-100-10 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🧺",
      regles: [
        "Lave-linge et sèche-linge : 1 circuit dédié 2,5 mm² / 20 A chacun, sur un différentiel de type A ou F",
        "Au-delà de 4 m² : 1 prise 16 A et 1 point de centre ou applique équipé d'un DCL",
      ],
    },
    {
      id: "exterieur",
      nom: "Extérieur",
      source: "NF C 15-100-10 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🌳",
      regles: [
        "1 point d'éclairage au-dessus de chaque accès (entrée principale ou de service)",
        "Matériel avec un indice de protection adapté (IP44 minimum pour les prises)",
        "Protection par différentiel 30 mA",
        "Câbles enterrés : sous gaine rouge TPC, avec grillage avertisseur rouge au-dessus",
      ],
    },
  ],

  // ---------------------------------------------------------------
  //  Circuits : section et protection (cuivre, logement)
  // ---------------------------------------------------------------
  circuits: [
    { nom: "Éclairage", section: "1,5 mm²", protection: "10 ou 16 A", limite: "8 points max (prises commandées comprises) ; au moins 2 circuits par logement (1 seul pour un studio ou un T1)" },
    { nom: "Prises 16 A", section: "1,5 mm²", protection: "16 A", limite: "8 prises max" },
    { nom: "Prises 16 A", section: "2,5 mm²", protection: "20 A", limite: "12 prises max" },
    { nom: "Prises de la cuisine", section: "2,5 mm²", protection: "20 A", limite: "Circuit dédié, 6 prises max" },
    { nom: "Volets roulants", section: "1,5 mm² (ou 2,5 mm²)", protection: "16 A (ou 20 A)", limite: "Au moins 1 circuit dédié ; 2 circuits conseillés" },
    { nom: "Lave-linge, sèche-linge", section: "2,5 mm²", protection: "20 A", limite: "1 circuit par appareil, différentiel type A ou F" },
    { nom: "Four, lave-vaisselle, congélateur, micro-ondes, chauffe-eau", section: "2,5 mm²", protection: "20 A", limite: "1 circuit par appareil ; au moins 3 circuits spécialisés par logement" },
    { nom: "Plaque de cuisson", section: "6 mm²", protection: "32 A", limite: "Circuit dédié, différentiel type A ou F" },
    { nom: "Chauffage ≤ 3 500 W", section: "1,5 mm²", protection: "16 A", limite: "Circuit dédié au chauffage" },
    { nom: "Chauffage ≤ 4 500 W", section: "2,5 mm²", protection: "20 A", limite: "Circuit dédié au chauffage" },
    { nom: "Chauffage ≤ 5 750 W", section: "4 mm²", protection: "25 A", limite: "Circuit dédié au chauffage" },
    { nom: "Chauffage ≤ 7 250 W", section: "6 mm²", protection: "32 A", limite: "Circuit dédié au chauffage" },
    { nom: "Prise renforcée véhicule électrique", section: "2,5 mm²", protection: "20 A", limite: "Circuit dédié, différentiel type A ou F" },
    { nom: "Borne de recharge", section: "Selon la borne", protection: "Selon la borne", limite: "Circuit dédié, dimensionné d'après la notice de la borne (souvent 40 A / 10 mm² en 7,4 kW)" },
    { nom: "VMC", section: "1,5 mm²", protection: "2 A", limite: "Circuit dédié" },
  ],

  // Section minimale (mm²) pour chaque calibre de disjoncteur (cuivre)
  sectionParCalibre: { 10: 1.5, 16: 1.5, 20: 2.5, 25: 4, 32: 6, 40: 10, 63: 16 },

  // ---------------------------------------------------------------
  //  Interrupteurs différentiels 30 mA (NF C 15-100 version 2024)
  //  Au moins 2 par logement, dont au moins 1 de type A.
  //  Calibre choisi par la « règle de l'aval » :
  //    1 × (chauffage + chauffe-eau) + 0,5 × (tous les autres circuits)
  // ---------------------------------------------------------------
  differentiels: { minimum: 2, calibres: [25, 40, 63] },
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
  //  Éclairement (lux)
  //  lux = éclairement moyen à maintenir sur le plan de travail
  //  minimum = valeur minimale imposée par le Code du travail (R4223-4)
  // ---------------------------------------------------------------
  eclairement: {
    // Logement : aucune norme, ce sont des recommandations courantes
    logement: [
      { nom: "Séjour", lux: 200 },
      { nom: "Cuisine", lux: 300, note: "500 lux conseillés sur le plan de travail" },
      { nom: "Chambre", lux: 150 },
      { nom: "Salle de bain", lux: 200, note: "500 lux conseillés au miroir" },
      { nom: "Entrée / couloir", lux: 100 },
      { nom: "WC", lux: 100 },
      { nom: "Bureau à domicile", lux: 500 },
      { nom: "Garage / atelier", lux: 300 },
    ],
    // Locaux de travail : NF EN 12464-1 (2021) + minimum du Code du travail
    pro: [
      { nom: "Bureau : écriture, lecture, informatique", lux: 500, minimum: 120, ref: "34.2", verifie: true },
      { nom: "Salle de réunion", lux: 500, minimum: 120, ref: "34.5.1", verifie: true },
      { nom: "Dessin industriel", lux: 750, minimum: 120, ref: "34.3", verifie: true },
      { nom: "Accueil / réception", lux: 300, minimum: 120, ref: "34.6", verifie: true },
      { nom: "Classement, photocopie", lux: 300, minimum: 120, ref: "34.1", verifie: true },
      { nom: "Archives", lux: 200, minimum: 120, ref: "34.7", verifie: true },
      { nom: "Circulation, couloir", lux: 100, minimum: 40 },
      { nom: "Escaliers", lux: 150, minimum: 60 },
      { nom: "Sanitaires, vestiaires", lux: 200, minimum: 120 },
      { nom: "Salle de pause", lux: 200, minimum: 120 },
      { nom: "Entrepôt, stockage", lux: 100, minimum: 60 },
      { nom: "Atelier : travail grossier", lux: 300, minimum: 120 },
      { nom: "Atelier : travail fin, montage", lux: 500, minimum: 120 },
      { nom: "Commerce : zone de vente", lux: 300, minimum: 120 },
      { nom: "Commerce : caisse", lux: 500, minimum: 120 },
      { nom: "Salle de classe", lux: 300, minimum: 120 },
      { nom: "Cuisine professionnelle", lux: 500, minimum: 120 },
      { nom: "Parking intérieur", lux: 75, minimum: 40 },
    ],
    // Code du travail, article R4223-4 : valeurs minimales
    codeDuTravail: [
      ["Voies de circulation intérieures", "40 lux"],
      ["Escaliers et entrepôts", "60 lux"],
      ["Locaux de travail, vestiaires, sanitaires", "120 lux"],
      ["Locaux aveugles affectés à un travail permanent", "200 lux"],
      ["Zones et voies de circulation extérieures", "10 lux"],
      ["Espaces extérieurs avec travaux permanents", "40 lux"],
    ],
  },

  // ---------------------------------------------------------------
  //  Fiches techniques (onglet « Fiches »)
  //  Chaque fiche contient des blocs : soit une liste, soit un tableau.
  // ---------------------------------------------------------------
  fiches: [
    {
      titre: "Nouvelle NF C 15-100 (version 2024)",
      source: "Guide Legrand « NF C 15-100, révision 23 août 2024 » (août 2026), Consuel, Apave",
      verifie: true,
      icone: "🆕",
      blocs: [
        {
          titre: "Dates",
          liste: [
            "Publiée le 23 août 2024, avec 12 mois de transition : l'ancienne version (2002 + amendements) est restée valable jusqu'au 23 août 2025",
            "Elle s'applique selon la date du permis de construire, de la déclaration préalable ou de la signature du marché",
          ],
        },
        {
          titre: "Une série de 21 normes",
          tableau: {
            entetes: ["Partie", "Contenu"],
            lignes: [
              ["NF C 15-100-1", "Exigences générales"],
              ["NF C 15-100-10", "Installations des logements"],
              ["NF C 15-100-11", "Réseaux numériques des logements"],
              ["NF C 15-100-7-701", "Salles d'eau"],
              ["NF C 15-100-7-722", "Recharge des véhicules électriques"],
              ["NF C 15-100-8-1", "Efficacité énergétique"],
            ],
          },
        },
        {
          titre: "Ce qui change sur le terrain",
          liste: [
            "Au moins 2 interrupteurs différentiels 30 mA par logement, dont au moins 1 de type A (fin du tableau selon la surface)",
            "Lave-linge, sèche-linge et plaque de cuisson : différentiel de type A ou F ; pompe à chaleur, clim, pompe de piscine : type F",
            "Prises : 8 max en 1,5 mm² / 16 A, 12 max en 2,5 mm² / 20 A",
            "GTL obligatoire dans le neuf, dans un espace réservé (ETEL)",
            "Points lumineux équipés d'un DCL, boîtes des points de centre accrochées à la structure",
            "Fixation à griffes interdite dans le neuf (prises et interrupteurs)",
            "Parafoudre : nouveaux cas obligatoires, et protection conseillée des appareils à plus de 10 m du tableau (30 m avant)",
            "Protection contre les arcs électriques (DPDA) recommandée dans certains locaux (hors logement)",
            "Réseau numérique : câblage en étoile, 1 Gbit/s minimum (grade 2 TV)",
            "Faux plafond avec isolant soufflé : boîtes IP55 minimum ou capot",
            "Dès 2027, logements neufs : régulation des températures et isolation des réseaux de chauffage obligatoires (décret 2023-444)",
          ],
        },
      ],
    },
    {
      titre: "Tableau des circuits",
      source: "NF C 15-100 (2024), d'après le guide Legrand août 2026",
      verifie: true,
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
      source: "NF C 15-100 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🛡️",
      blocs: [
        {
          titre: "Nombre",
          liste: [
            "Au moins 2 interrupteurs différentiels 30 mA par logement, dont au moins 1 de type A",
            "8 circuits maximum par interrupteur différentiel",
            "Éclairage et prises répartis sur au moins 2 différentiels (pour ne pas tout perdre en cas de défaut)",
          ],
        },
        {
          titre: "Quel type pour quel circuit",
          tableau: {
            entetes: ["Circuit", "Type minimum"],
            lignes: [
              ["Éclairage, prises, volets, chauffage, chauffe-eau, four, lave-vaisselle", "AC (ou A, F, B)"],
              ["Lave-linge, sèche-linge, plaque de cuisson", "A (ou F)"],
              ["Pompe à chaleur, climatisation, pompe de piscine", "F"],
              ["Recharge VE monophasée (prise renforcée ou borne)", "A ou F"],
              ["Recharge VE triphasée", "A ou F + détection 6 mA, ou B"],
              ["Appareils triphasés à variateur de vitesse", "B"],
            ],
          },
        },
        {
          titre: "Calibre de l'interrupteur différentiel",
          liste: [
            "Règle de l'amont : calibre ≥ calibre du disjoncteur d'abonné (+ production photovoltaïque éventuelle)",
            "Ou règle de l'aval : calibre ≥ 1 × (chauffage + chauffe-eau) + 0,5 × (tous les autres circuits)",
            "Exemple : chauffage 20 A + prises 16 A + éclairage 10 A → 20 + 8 + 5 = 33 A → différentiel 40 A",
          ],
        },
        {
          titre: "Les types en bref",
          liste: [
            "AC : usage général",
            "A : appareils qui créent des défauts « mono-alternance » (électronique)",
            "F : appareils à variateur de vitesse monophasé",
            "B : redresseurs ou variateurs triphasés",
          ],
        },
      ],
    },
    {
      titre: "GTL et tableau électrique",
      source: "NF C 15-100-10 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🗄️",
      blocs: [
        {
          liste: [
            "GTL : 60 cm de large et 25 cm de profondeur minimum, du sol au plafond, dans un espace réservé (ETEL)",
            "Emplacement pour les équipements de communication : 24 × 30 cm minimum, 20 cm de profondeur, avec au moins 1 prise de courant",
            "Réserve au tableau : 20 % d'emplacements libres en maison individuelle, 6 modules minimum en logement collectif",
            "Réserve conseillée en bout de rangée, pour ajouter facilement des disjoncteurs",
            "Manettes du disjoncteur d'abonné : entre 0,90 m et 1,80 m du sol",
            "Manettes des disjoncteurs : entre 0,90 m et 1,80 m (coffret sans porte), ou 0,50 m minimum (coffret avec porte)",
            "1 disjoncteur par circuit ; coupe-circuits à fusible interdits en neuf et en grosse rénovation",
            "Local indépendant de plusieurs pièces : son propre dispositif de coupure d'urgence",
            "Schéma détaillé avec repérage des circuits à fournir à la fin des travaux",
          ],
        },
      ],
    },
    {
      titre: "Réseau numérique (RJ45)",
      source: "NF C 15-100-11 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🌐",
      blocs: [
        {
          titre: "Nombre minimum de prises RJ45",
          tableau: {
            entetes: ["Logement", "Total", "Séjour", "Autres pièces"],
            lignes: [
              ["T1", "2", "2 juxtaposées", "—"],
              ["T2", "3", "2 juxtaposées", "1"],
              ["T3 et plus", "4", "2 juxtaposées", "2"],
            ],
          },
        },
        {
          liste: [
            "Câblage en étoile obligatoire depuis le coffret de communication",
            "Câble et prises RJ45 catégorie 6 blindées, grade 2 TV minimum (1 Gbit/s) ; grade 3 TV pour 10 Gbit/s",
            "Chaque prise RJ45 à proximité d'une prise de courant",
            "Coffret : bandeau de brassage (4 RJ45 minimum), dispositif de terminaison (DTI cuivre et/ou DTIo fibre), répartiteur TV, mise à la terre",
            "Conseillé : lien de déport pour installer la box fibre dans le séjour",
          ],
        },
      ],
    },
    {
      titre: "Parafoudre",
      source: "NF C 15-100 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "⚡",
      blocs: [
        {
          titre: "Obligatoire au tableau (logement)",
          liste: [
            "Bâtiment équipé d'un paratonnerre (partout en France)",
            "Zone AQ2 (forte activité orageuse) avec alimentation électrique aérienne, même en partie",
            "Zone AQ2 avec alimentation enterrée, si des équipements servent à la sécurité des personnes (médical à domicile, alarmes…)",
            "Réseau numérique en cuivre : parafoudre aussi sur ce réseau s'il y en a un sur l'installation électrique",
          ],
        },
        {
          titre: "Recommandé",
          liste: [
            "Bâtiment à moins de 50 m d'un bâtiment avec paratonnerre",
            "Parafoudre supplémentaire pour les appareils à plus de 10 m du tableau (30 m auparavant)",
            "Hors zone AQ2 : analyse des risques (informatique, congélateur…)",
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
      source: "NF C 15-100-7-722 (2024), d'après le guide Legrand août 2026",
      verifie: true,
      icone: "🚗",
      blocs: [
        {
          titre: "Règles principales",
          liste: [
            "1 circuit dédié par point de recharge",
            "Mode 2 (prise renforcée) monophasé : différentiel 30 mA type A ou F ; prise renforcée sur 2,5 mm² / 20 A",
            "Mode 3 (borne) monophasé : différentiel 30 mA type A ou F",
            "Mode 3 triphasé : type A ou F + dispositif de détection 6 mA (souvent intégré à la borne), ou type B",
            "Câbles et protections dimensionnés d'après les valeurs indiquées sur la borne",
            "Obturateurs pour les socles et prises jusqu'à 32 A",
            "Qualification IRVE obligatoire pour installer une borne de plus de 3,7 kW",
          ],
        },
      ],
    },
    {
      titre: "Photovoltaïque",
      source: "Guide UTE C 15-712-1 (juillet 2013), toujours la référence en 2026 ; complément d'experts publié en 2024",
      verifie: false, // passer à true quand un électricien a relu
      icone: "☀️",
      blocs: [
        {
          titre: "Règles principales",
          liste: [
            "Référence : guide UTE C 15-712-1 (2013), en attente de révision par l'AFNOR ; un guide complémentaire d'experts est paru en 2024",
            "Le PV sans stockage se protège par un différentiel de type A minimum",
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
      source: "NF C 15-100-1 (identification des conducteurs)",
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
      titre: "Éclairement (lux)",
      source: "Code du travail R4223-4 ; NF EN 12464-1 (2021), valeurs bureaux citées par l'INRS (déc. 2025)",
      verifie: false, // valeurs bureaux et Code du travail vérifiées, les autres non
      icone: "💡",
      blocs: [
        {
          titre: "Minimums obligatoires (Code du travail, R4223-4)",
          tableau: { entetes: ["Local", "Minimum"], depuis: "eclairement-code" },
        },
        {
          titre: "Valeurs recommandées en locaux de travail (NF EN 12464-1)",
          tableau: { entetes: ["Activité", "Éclairement"], depuis: "eclairement-pro" },
        },
        {
          titre: "Logement (recommandations, pas de norme)",
          tableau: { entetes: ["Pièce", "Éclairement"], depuis: "eclairement-logement" },
        },
        {
          liste: [
            "Ce sont des éclairements moyens à maintenir : ils doivent être atteints même quand les luminaires vieillissent et s'encrassent",
            "Mesure au luxmètre sur le plan de travail (environ 0,85 m) ou au sol pour les circulations",
            "La norme NF EN 12464-1 fixe aussi l'uniformité, l'éblouissement (UGR) et le rendu des couleurs (Ra)",
          ],
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
      source: "NF C 15-100-10 (2024) et règles d'accessibilité, d'après le guide Legrand août 2026",
      verifie: true,
      icone: "📏",
      blocs: [
        {
          liste: [
            "Prises jusqu'à 20 A : axe à 5 cm minimum du sol fini",
            "Prises de plus de 20 A : axe à 12 cm minimum du sol fini",
            "Prise de hotte (option) : 1,80 m minimum",
            "Interrupteurs et commandes de volets : entre 0,90 m et 1,30 m (accessibilité)",
            "Disjoncteur d'abonné et disjoncteurs du tableau : entre 0,90 m et 1,80 m (0,50 m minimum pour un coffret avec porte)",
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
        "Prise de terre mesurée : résistance ≤ 100 Ω avec un disjoncteur de branchement 500 mA",
        "Conducteur de terre en cuivre isolé, 16 mm² minimum (25 mm² en cuivre nu)",
        "Barrette de coupure présente et accessible",
        "Liaison équipotentielle principale (6 mm² minimum)",
        "Liaison équipotentielle locale dans la salle de bain",
      ],
    },
    {
      groupe: "Tableau électrique",
      points: [
        "Tous les circuits protégés par un différentiel 30 mA",
        "8 circuits maximum par interrupteur différentiel",
        "Lave-linge, sèche-linge et plaque de cuisson sur un différentiel de type A ou F",
        "Circuits repérés (étiquettes)",
        "Réserve d'au moins 20 % (maison) ou 6 modules (appartement)",
        "Manettes entre 0,90 m et 1,80 m du sol (0,50 m minimum avec porte)",
        "Gaine technique logement (GTL) présente (logement neuf)",
        "Au moins 2 interrupteurs différentiels 30 mA, dont 1 de type A",
        "Schéma électrique avec repérage des circuits remis au client",
      ],
    },
    {
      groupe: "Circuits et appareillage",
      points: [
        "Section des conducteurs adaptée au calibre de chaque disjoncteur",
        "Nombre de points par circuit respecté (8 lumières, 8 ou 12 prises, 6 en cuisine)",
        "Prises avec obturateurs (éclats)",
        "Aucun conducteur sans protection mécanique",
        "Volumes de la salle de bain respectés",
        "Points lumineux équipés de DCL, points de centre accrochés à la structure",
        "Pas de fixation à griffes (logement neuf)",
        "Au moins 2 circuits d'éclairage (sauf studio ou T1)",
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
