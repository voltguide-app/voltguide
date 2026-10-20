// =====================================================================
//  SYMBOLES DU PLAN ÉLECTRIQUE
//  Chaque symbole est dessiné en SVG autour du point (0, 0).
//  L'unité est le mètre : un symbole fait environ 40 cm sur le plan.
//  Dessins simplifiés, inspirés des symboles architecturaux courants.
// =====================================================================

// Repères des prises spécialisées
window.REPERES_SPECIALISES = [
  { code: "P", nom: "Plaque de cuisson" },
  { code: "F", nom: "Four" },
  { code: "LV", nom: "Lave-vaisselle" },
  { code: "LL", nom: "Lave-linge" },
  { code: "SL", nom: "Sèche-linge" },
  { code: "CG", nom: "Congélateur" },
  { code: "CE", nom: "Chauffe-eau" },
  { code: "VE", nom: "Véhicule électrique" },
];

const T = (texte, y = 0.04, taille = 0.13) =>
  `<text x="0" y="${y}" text-anchor="middle" font-size="${taille}" class="sym-texte">${texte}</text>`;

window.SYMBOLES = [
  {
    id: "prise", nom: "Prise 16 A", court: "Prise",
    dessin: () => `<path d="M -0.16 0.06 A 0.16 0.16 0 0 1 0.16 0.06 Z"/><line x1="-0.16" y1="0.12" x2="0.16" y2="0.12"/>`,
  },
  {
    id: "prise-specialisee", nom: "Prise spécialisée", court: "Spécialisée", avecRepere: true,
    dessin: (s) => `<path d="M -0.16 0.06 A 0.16 0.16 0 0 1 0.16 0.06 Z"/><line x1="-0.16" y1="0.12" x2="0.16" y2="0.12"/>${T(s.repere || "?", -0.24)}`,
  },
  {
    id: "lumiere", nom: "Point lumineux (plafond)", court: "Lumière",
    dessin: () => `<circle r="0.16"/><line x1="-0.11" y1="-0.11" x2="0.11" y2="0.11"/><line x1="-0.11" y1="0.11" x2="0.11" y2="-0.11"/>`,
  },
  {
    id: "applique", nom: "Applique murale", court: "Applique",
    dessin: () => `<circle r="0.12"/><line x1="-0.085" y1="-0.085" x2="0.085" y2="0.085"/><line x1="-0.085" y1="0.085" x2="0.085" y2="-0.085"/><line x1="-0.16" y1="0.18" x2="0.16" y2="0.18"/>`,
  },
  {
    id: "interrupteur", nom: "Interrupteur", court: "Inter",
    dessin: () => `<circle r="0.07"/><line x1="0.05" y1="-0.05" x2="0.2" y2="-0.2"/>`,
  },
  {
    id: "va-et-vient", nom: "Va-et-vient", court: "Va-et-vient",
    dessin: () => `<circle r="0.07"/><line x1="0.05" y1="-0.05" x2="0.2" y2="-0.2"/><line x1="-0.05" y1="0.05" x2="-0.2" y2="0.2"/>`,
  },
  {
    id: "poussoir", nom: "Bouton poussoir", court: "Poussoir",
    dessin: () => `<circle r="0.09"/><circle r="0.035" class="sym-plein"/>`,
  },
  {
    id: "rj45", nom: "Prise RJ45", court: "RJ45",
    dessin: () => `<path d="M 0 -0.16 L 0.16 0.12 L -0.16 0.12 Z"/>${T("T", 0.08, 0.12)}`,
  },
  {
    id: "volet", nom: "Volet roulant", court: "Volet",
    dessin: () => `<rect x="-0.17" y="-0.11" width="0.34" height="0.22" rx="0.03"/>${T("VR", 0.045, 0.12)}`,
  },
  {
    id: "vmc", nom: "VMC", court: "VMC",
    dessin: () => `<circle r="0.16"/>${T("V", 0.045, 0.14)}`,
  },
  {
    id: "daaf", nom: "Détecteur de fumée", court: "Détecteur",
    dessin: () => `<rect x="-0.14" y="-0.14" width="0.28" height="0.28" rx="0.06"/>${T("DF", 0.045, 0.12)}`,
  },
  {
    id: "tableau", nom: "Tableau électrique", court: "Tableau",
    dessin: () => `<rect x="-0.22" y="-0.14" width="0.44" height="0.28"/><path d="M -0.22 0.14 L 0.22 -0.14 L 0.22 0.14 Z" class="sym-plein"/>`,
  },
];
