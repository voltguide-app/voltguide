// =====================================================================
//  GAMMES D'APPAREILLAGE (showroom pour présenter au client)
//
//  Informations générales sur les gammes, d'après les sites des fabricants
//  et des distributeurs (octobre 2026). Les dessins et les couleurs sont
//  INDICATIFS : pour les références exactes, voir le catalogue du fabricant.
//
//  forme : "carre", "carre-arrondi", "rectangle" ou "ovale" (pour le dessin)
//  prix  : 1 = entrée de gamme … 4 = luxe (positionnement indicatif)
// =====================================================================

window.GAMMES = [
  // ----- Legrand -----
  {
    id: "legrand-celiane", marque: "Legrand", nom: "Céliane", prix: 3, forme: "carre-arrondi", site: "legrand.fr",
    description: "La gamme la plus personnalisable de Legrand : un très grand choix de fonctions et de finitions, jusqu'aux matières nobles.",
    points: ["Très nombreuses fonctions", "Finitions combinables", "Matières nobles : bois, métal…", "Versions connectées"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Effet métal", plaque: "#b9bcc0" },
      { nom: "Effet bois", plaque: "#a87b51" },
      { nom: "Noir", plaque: "#2b2b2d" },
    ],
  },
  {
    id: "legrand-dooxie", marque: "Legrand", nom: "Dooxie", prix: 2, forme: "carre-arrondi", site: "legrand.fr",
    description: "Style moderne et épuré, pensé pour une pose rapide. Formes rondes ou carrées.",
    points: ["Design moderne", "Pose rapide", "Bon rapport qualité / prix", "Versions connectées"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Noir", plaque: "#2b2b2d" },
    ],
  },
  {
    id: "legrand-mosaic", marque: "Legrand", nom: "Mosaic", prix: 2, forme: "rectangle", site: "legrand.fr",
    description: "Gamme modulaire au design sobre, très utilisée en tertiaire (bureaux, commerces).",
    points: ["Plus de 70 fonctions", "Système modulaire", "Idéal tertiaire"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Noir mat", plaque: "#2b2b2d" },
    ],
  },
  {
    id: "legrand-niloe", marque: "Legrand", nom: "Niloé", prix: 1, forme: "carre-arrondi", site: "legrand.fr",
    description: "Gamme simple et économique, éco-conçue.",
    points: ["Prix accessible", "Éco-conception"],
    finitions: [{ nom: "Blanc", plaque: "#f4f4f2" }],
  },

  // ----- Schneider Electric -----
  {
    id: "schneider-unica", marque: "Schneider", nom: "Unica", prix: 3, forme: "carre", site: "se.com",
    description: "Design carré haut de gamme et intemporel, aux contours raffinés. La version Unica Déco propose des matériaux nobles.",
    points: ["Design premium", "Couleurs contemporaines", "Unica Déco : matériaux exclusifs"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Anthracite", plaque: "#3a3d41" },
      { nom: "Effet métal", plaque: "#b9bcc0" },
      { nom: "Effet bois", plaque: "#a87b51" },
    ],
  },
  {
    id: "schneider-odace", marque: "Schneider", nom: "Odace", prix: 2, forme: "carre-arrondi", site: "se.com",
    description: "Lignes épurées et modulaires, à un prix accessible. Équipe plus de 3 millions de logements en France.",
    points: ["Très répandue", "Grand choix de couleurs, motifs et textures", "Plaques métal (laiton, titane)"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Anthracite", plaque: "#3a3d41" },
      { nom: "Laiton", plaque: "#c9a85a" },
      { nom: "Titane", plaque: "#8e9196" },
    ],
  },
  {
    id: "schneider-ovalis", marque: "Schneider", nom: "Ovalis", prix: 1, forme: "ovale", site: "se.com",
    description: "Design ovale sobre, pour le neuf comme la rénovation. Jusqu'à 65 % de matière recyclée.",
    points: ["Design sobre", "Certifiée Cradle to Cradle", "Anneaux effet laiton ou chrome"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Anthracite, anneau laiton", plaque: "#3a3d41", anneau: "#c9a85a" },
      { nom: "Anthracite, anneau chrome", plaque: "#3a3d41", anneau: "#c8ccd1" },
    ],
  },

  // ----- Hager -----
  {
    id: "hager-gallery", marque: "Hager", nom: "gallery", prix: 3, forme: "carre", site: "hager.com",
    description: "Gamme combinable et polyvalente, avec un très grand choix de plaques de finition.",
    points: ["Nombreuses finitions", "Verre, aluminium, bois, cuir, pierre, inox", "Compatible avec les supports essensya"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Verre noir", plaque: "#1f2124" },
      { nom: "Aluminium", plaque: "#b9bcc0" },
      { nom: "Bois", plaque: "#a87b51" },
    ],
  },
  {
    id: "hager-essensya", marque: "Hager", nom: "essensya", prix: 1, forme: "carre-arrondi", site: "hager.com",
    description: "L'entrée de gamme de Hager. Son support accepte aussi les mécanismes gallery pour monter en gamme.",
    points: ["Prix accessible", "Évolutive vers gallery"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Anthracite", plaque: "#3a3d41" },
    ],
  },

  // ----- Arnould (groupe Legrand) -----
  {
    id: "arnould-espace-evolution", marque: "Arnould", nom: "Espace Evolution", prix: 2, forme: "rectangle", site: "",
    description: "Plaques rectangulaires au design épuré, avec un très large choix de décors.",
    points: ["24 blancs décorés", "7 couleurs unies", "12 décors", "Clipsage breveté"],
    finitions: [
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Noir mat", plaque: "#2b2b2d" },
      { nom: "Jaune", plaque: "#f2c230" },
    ],
  },
  {
    id: "arnould-art", marque: "Arnould", nom: "Art d'Arnould", prix: 4, forme: "carre", site: "",
    description: "Le haut de gamme d'Arnould, sur-mesure, pensé pour les intérieurs de prestige.",
    points: ["4 univers : Mémoire, Épure, Rétro, Fusion", "Finitions sur-mesure"],
    finitions: [
      { nom: "Laiton", plaque: "#c9a85a" },
      { nom: "Blanc", plaque: "#f4f4f2" },
      { nom: "Noir", plaque: "#2b2b2d" },
    ],
  },
];

window.NIVEAUX_PRIX = ["", "Entrée de gamme", "Milieu de gamme", "Haut de gamme", "Luxe"];
