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
      icone: "🚽",
      regles: ["Au moins 1 point d'éclairage, commandé"],
    },
    {
      id: "entree",
      nom: "Entrée / couloir",
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
  ],

  // Section minimale (mm²) pour chaque calibre de disjoncteur (cuivre)
  sectionParCalibre: { 10: 1.5, 16: 1.5, 20: 2.5, 25: 4, 32: 6, 40: 10, 63: 16 },

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
