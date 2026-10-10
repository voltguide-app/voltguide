// =====================================================================
//  SCHÉMAS DE CÂBLAGE
//  Chaque schéma : un dessin (SVG) + les étapes de raccordement.
//  Couleurs des traits : rouge = phase, bleu = neutre,
//  orange = retour lampe / commande, violet = navette.
//  La terre (vert/jaune) n'est pas dessinée pour garder le schéma lisible.
// =====================================================================

// Petits morceaux de dessin réutilisés
const LAMPE = (x, y) => `
  <circle cx="${x}" cy="${y}" r="16" class="sch-composant"/>
  <line x1="${x - 11}" y1="${y - 11}" x2="${x + 11}" y2="${y + 11}" class="sch-composant"/>
  <line x1="${x - 11}" y1="${y + 11}" x2="${x + 11}" y2="${y - 11}" class="sch-composant"/>`;

window.SCHEMAS = [
  {
    id: "simple-allumage",
    titre: "Simple allumage",
    source: "Pratique courante, NF C 15-100",
    verifie: false,
    svg: `
      <svg viewBox="0 0 360 200" role="img" aria-label="Schéma simple allumage">
        <text x="10" y="45">L</text><text x="10" y="165">N</text>
        <line x1="25" y1="40" x2="140" y2="40" class="sch-phase"/>
        <circle cx="140" cy="40" r="4" class="sch-borne"/>
        <line x1="140" y1="40" x2="185" y2="22" class="sch-composant"/>
        <circle cx="190" cy="40" r="4" class="sch-borne"/>
        <text x="135" y="75">Interrupteur</text>
        <polyline points="190,40 300,40 300,84" class="sch-retour"/>
        ${LAMPE(300, 100)}
        <text x="322" y="105">Lampe</text>
        <polyline points="25,160 300,160 300,116" class="sch-neutre"/>
      </svg>`,
    etapes: [
      "Phase (rouge/marron) du tableau vers une borne de l'interrupteur",
      "Retour lampe (orange) : de l'autre borne de l'interrupteur vers la lampe",
      "Neutre (bleu) du tableau directement vers la lampe",
      "Terre (vert/jaune) vers la borne de terre du point lumineux",
    ],
  },
  {
    id: "va-et-vient",
    titre: "Va-et-vient",
    source: "Pratique courante, NF C 15-100",
    verifie: false,
    svg: `
      <svg viewBox="0 0 420 230" role="img" aria-label="Schéma va-et-vient">
        <text x="5" y="105">L</text><text x="5" y="215">N</text>
        <line x1="20" y1="100" x2="90" y2="100" class="sch-phase"/>
        <rect x="90" y="60" width="60" height="80" rx="6" class="sch-boite"/>
        <text x="96" y="155">Va-et-vient 1</text>
        <line x1="95" y1="100" x2="145" y2="80" class="sch-composant"/>
        <text x="96" y="96" class="sch-petit">C</text>
        <line x1="150" y1="80" x2="250" y2="80" class="sch-navette"/>
        <line x1="150" y1="120" x2="250" y2="120" class="sch-navette"/>
        <text x="175" y="74" class="sch-petit">navette 1</text>
        <text x="175" y="114" class="sch-petit">navette 2</text>
        <rect x="250" y="60" width="60" height="80" rx="6" class="sch-boite"/>
        <text x="252" y="155">Va-et-vient 2</text>
        <line x1="255" y1="80" x2="305" y2="100" class="sch-composant"/>
        <text x="296" y="96" class="sch-petit">C</text>
        <polyline points="310,100 370,100 370,134" class="sch-retour"/>
        ${LAMPE(370, 150)}
        <polyline points="20,210 370,210 370,166" class="sch-neutre"/>
      </svg>`,
    etapes: [
      "Phase (rouge/marron) du tableau vers le commun (C, ou L) du va-et-vient 1",
      "2 navettes : borne 1 du VV1 vers borne 1 du VV2, et borne 2 du VV1 vers borne 2 du VV2",
      "Retour lampe (orange) : du commun (C) du va-et-vient 2 vers la lampe",
      "Neutre (bleu) du tableau directement vers la lampe",
      "Terre (vert/jaune) vers le point lumineux",
    ],
  },
  {
    id: "telerupteur",
    titre: "Télérupteur",
    source: "Pratique courante, NF C 15-100",
    verifie: false,
    svg: `
      <svg viewBox="0 0 400 280" role="img" aria-label="Schéma télérupteur">
        <text x="5" y="35">L</text><text x="5" y="265">N</text>
        <line x1="20" y1="30" x2="300" y2="30" class="sch-phase"/>
        <line x1="70" y1="30" x2="70" y2="48" class="sch-phase"/>
        <line x1="130" y1="30" x2="130" y2="48" class="sch-phase"/>
        <rect x="56" y="48" width="28" height="14" rx="3" class="sch-boite"/><text x="61" y="59" class="sch-petit">BP</text>
        <rect x="116" y="48" width="28" height="14" rx="3" class="sch-boite"/><text x="121" y="59" class="sch-petit">BP</text>
        <text x="20" y="110" class="sch-petit">Boutons poussoirs (en parallèle)</text>
        <polyline points="70,62 70,85 240,85 240,110" class="sch-retour"/>
        <line x1="130" y1="62" x2="130" y2="85" class="sch-retour"/>
        <rect x="215" y="110" width="110" height="80" rx="6" class="sch-boite"/>
        <text x="222" y="208">Télérupteur</text>
        <rect x="232" y="130" width="16" height="40" class="sch-composant"/>
        <text x="222" y="126" class="sch-petit">A1</text><text x="222" y="186" class="sch-petit">A2</text>
        <polyline points="300,30 300,110" class="sch-phase"/>
        <line x1="300" y1="135" x2="312" y2="160" class="sch-composant"/>
        <text x="305" y="126" class="sch-petit">1</text><text x="305" y="186" class="sch-petit">2</text>
        <line x1="300" y1="110" x2="300" y2="135" class="sch-phase"/>
        <polyline points="300,165 300,190 370,190 370,209" class="sch-retour"/>
        ${LAMPE(370, 225)}
        <polyline points="240,170 240,260" class="sch-neutre"/>
        <polyline points="20,260 370,260 370,241" class="sch-neutre"/>
      </svg>`,
    etapes: [
      "Phase vers tous les boutons poussoirs, qui sont câblés en parallèle",
      "Fil de commande (orange) : de la sortie des poussoirs vers la borne A1 de la bobine du télérupteur",
      "Borne A2 de la bobine vers le neutre",
      "Phase vers la borne 1 du contact du télérupteur",
      "Borne 2 du contact vers les lampes (retour lampe)",
      "Neutre et terre vers les lampes",
      "Vérifier la tension de la bobine (230 V en général)",
    ],
  },
  {
    id: "contacteur-hc",
    titre: "Contacteur heures creuses (chauffe-eau)",
    source: "Pratique courante, NF C 15-100",
    verifie: false,
    svg: `
      <svg viewBox="0 0 420 300" role="img" aria-label="Schéma contacteur heures creuses">
        <text x="10" y="20" class="sch-titre">Puissance</text>
        <rect x="10" y="35" width="80" height="44" rx="6" class="sch-boite"/><text x="18" y="62">Disj. 20 A</text>
        <line x1="90" y1="50" x2="170" y2="50" class="sch-phase"/>
        <line x1="90" y1="66" x2="170" y2="66" class="sch-neutre"/>
        <rect x="170" y="30" width="100" height="90" rx="6" class="sch-boite"/>
        <text x="178" y="105">Contacteur</text><text x="178" y="118" class="sch-petit">jour / nuit</text>
        <line x1="270" y1="50" x2="330" y2="50" class="sch-phase"/>
        <line x1="270" y1="66" x2="330" y2="66" class="sch-neutre"/>
        <rect x="330" y="35" width="80" height="44" rx="6" class="sch-boite"/><text x="336" y="62">Chauffe-eau</text>
        <text x="10" y="170" class="sch-titre">Commande</text>
        <rect x="10" y="185" width="80" height="44" rx="6" class="sch-boite"/><text x="18" y="212">Disj. 2 A</text>
        <line x1="90" y1="200" x2="130" y2="200" class="sch-phase"/>
        <rect x="130" y="185" width="90" height="44" rx="6" class="sch-boite"/><text x="136" y="207">Linky</text><text x="136" y="222" class="sch-petit">contact C1-C2</text>
        <polyline points="220,200 240,200 240,120" class="sch-retour"/>
        <text x="245" y="140" class="sch-petit">A1</text>
        <polyline points="90,216 110,216 110,270 200,270 200,120" class="sch-neutre"/>
        <text x="180" y="140" class="sch-petit">A2</text>
      </svg>`,
    etapes: [
      "Puissance : disjoncteur 20 A, puis bornes d'entrée du contacteur, puis bornes de sortie vers le chauffe-eau (2,5 mm²)",
      "Commande : disjoncteur 2 A, puis contact heures creuses du compteur Linky (C1 et C2), puis borne A1 de la bobine",
      "Borne A2 de la bobine vers le neutre",
      "Mettre le sélecteur du contacteur sur « Auto » (positions : Auto / Marche forcée / Arrêt)",
    ],
  },
];
