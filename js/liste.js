// =====================================================================
//  LISTE DU MATÉRIEL À ACHETER — calculée à partir du plan électrique
//
//  1. Les symboles du plan sont regroupés en circuits (règles NF C 15-100).
//  2. La longueur de gaine de chaque circuit est estimée sur le plan :
//     tableau → point le plus proche → point suivant… (trajets le long
//     des murs), plus les descentes, plus une marge.
//  3. On en déduit la liste complète : tableau, gaines, appareillage,
//     boîtes, sécurité, petites fournitures.
//
//  Les longueurs sont des ESTIMATIONS (± 15-20 %).
// =====================================================================

const DEPART_TABLEAU = 1.5;  // m de gaine dans le tableau et pour en sortir
const MARGE_GAINE = 1.15;    // +15 %

// Longueur verticale ajoutée pour chaque point (m), selon la hauteur sous plafond
function descente(type, hp) {
  return {
    lumiere: 0.5, vmc: 0.5,
    applique: Math.max(0.5, hp - 2 + 0.5),
    interrupteur: hp - 1.1 + 0.3, "va-et-vient": hp - 1.1 + 0.3, poussoir: hp - 1.1 + 0.3, volet: hp - 1.1 + 0.3,
    prise: hp, "prise-specialisee": hp, rj45: hp,
  }[type] || 0.5;
}

// Trajet le long des murs (on ne passe pas en diagonale à travers les pièces)
const trajet = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Longueur pour relier tous les points en partant du tableau, en allant toujours au plus proche
function longueurChaine(depart, points) {
  let position = depart, reste = [...points], total = 0;
  while (reste.length) {
    let i = 0;
    reste.forEach((p, j) => { if (trajet(position, p) < trajet(position, reste[i])) i = j; });
    total += trajet(position, reste[i]);
    position = reste.splice(i, 1)[0];
  }
  return total;
}

const paquets = (liste, taille) =>
  Array.from({ length: Math.ceil(liste.length / taille) }, (_, i) => liste.slice(i * taille, (i + 1) * taille));

// Circuits des prises spécialisées selon l'appareil
const SPECIALISES = {
  P: { nom: "Plaque de cuisson", section: 6, calibre: 32, typeA: true },
  LL: { nom: "Lave-linge", section: 2.5, calibre: 20, typeA: true },
  VE: { nom: "Prise renforcée véhicule", section: 2.5, calibre: 20, typeA: true },
  F: { nom: "Four", section: 2.5, calibre: 20 },
  LV: { nom: "Lave-vaisselle", section: 2.5, calibre: 20 },
  SL: { nom: "Sèche-linge", section: 2.5, calibre: 20 },
  CG: { nom: "Congélateur", section: 2.5, calibre: 20 },
  CE: { nom: "Chauffe-eau (via contacteur HC)", section: 2.5, calibre: 20 },
};

// ---------------------------------------------------------------------
//  1 et 2 : circuits et longueurs
// ---------------------------------------------------------------------
function circuitsDuPlan(pl) {
  const hp = pl.hauteurPlafond || 2.5;
  const tableau = pl.symboles.find((s) => s.type === "tableau") || null;
  const de = (...types) => pl.symboles.filter((s) => types.includes(s.type));
  const parPiece = (liste) => [...liste].sort((a, b) =>
    (pieceDe(pl, a)?.id || "~").localeCompare(pieceDe(pl, b)?.id || "~") || a.x - b.x || a.y - b.y);
  const circuits = [];
  const ajouter = (nom, section, calibre, points, typeA = false) =>
    circuits.push({ nom, section, calibre, points, commandes: [], typeA, longueur: null });

  // Éclairage : 8 points max par circuit
  paquets(parPiece(de("lumiere", "applique")), 8).forEach((pts, i, tous) =>
    ajouter(`Éclairage${tous.length > 1 ? " " + (i + 1) : ""}`, 1.5, 16, pts));

  // Interrupteurs et poussoirs : rattachés au circuit de la lumière la plus proche
  const eclairages = circuits.slice();
  de("interrupteur", "va-et-vient", "poussoir").forEach((cmd) => {
    let meilleur = null, distance = Infinity;
    eclairages.forEach((c) => c.points.forEach((l) => {
      const d = trajet(cmd, l) + (pieceDe(pl, cmd) === pieceDe(pl, l) ? 0 : 1000); // même pièce d'abord
      if (d < distance) { distance = d; meilleur = c; }
    }));
    if (meilleur) meilleur.commandes.push(cmd);
  });

  // Prises : circuit dédié cuisine (6 max), les autres par 8 en 2,5 mm²
  const prises = de("prise");
  const enCuisine = (s) => pieceDe(pl, s)?.type === "cuisine";
  paquets(parPiece(prises.filter((s) => !enCuisine(s))), 8).forEach((pts, i, tous) =>
    ajouter(`Prises${tous.length > 1 ? " " + (i + 1) : ""}`, 2.5, 20, pts));
  paquets(parPiece(prises.filter(enCuisine)), 6).forEach((pts, i, tous) =>
    ajouter(`Prises cuisine${tous.length > 1 ? " " + (i + 1) : ""}`, 2.5, 20, pts));

  // Prises spécialisées : un circuit chacune
  de("prise-specialisee").forEach((s) => {
    const sp = SPECIALISES[s.repere] || { nom: "Prise spécialisée (appareil à préciser)", section: 2.5, calibre: 20 };
    ajouter(sp.nom, sp.section, sp.calibre, [s], !!sp.typeA);
  });

  if (de("volet").length) ajouter("Volets roulants", 1.5, 16, de("volet"));
  de("vmc").forEach((s) => ajouter("VMC", 1.5, 2, [s]));

  // Longueurs (seulement si le tableau est placé)
  if (tableau) {
    circuits.forEach((c) => {
      let longueur = DEPART_TABLEAU + longueurChaine(tableau, c.points);
      c.points.forEach((p) => (longueur += descente(p.type, hp)));
      c.commandes.forEach((cmd) => {
        const lumiere = c.points.reduce((a, b) => (trajet(cmd, a) <= trajet(cmd, b) ? a : b));
        longueur += trajet(cmd, lumiere) + descente(cmd.type, hp);
      });
      c.longueur = longueur * MARGE_GAINE;
    });
  }

  // Câbles RJ45 : un câble par prise, en étoile depuis le tableau
  const rj45 = tableau
    ? de("rj45").reduce((t, r) => t + (DEPART_TABLEAU + trajet(tableau, r) + descente("rj45", hp)) * MARGE_GAINE, 0)
    : null;

  return { circuits, tableau: !!tableau, rj45 };
}

// ---------------------------------------------------------------------
//  3 : liste d'achat
// ---------------------------------------------------------------------
const arrondirA = (v, pas) => Math.ceil(v / pas) * pas;

function listeAchat(pl, chantier) {
  const { circuits, tableau, rj45 } = circuitsDuPlan(pl);
  const lignes = [];
  const ajouter = (categorie, nom, qte, unite = "") => { if (qte > 0) lignes.push({ categorie, cle: nom, nom, qte, unite }); };
  const nb = (type, repere) => pl.symboles.filter((s) => s.type === type && (!repere || s.repere === repere)).length;
  const reperes = pl.symboles.filter((s) => s.type === "prise-specialisee").map((s) => s.repere);
  const avecRepere = (...codes) => reperes.filter((r) => codes.includes(r)).length;

  // --- Tableau électrique
  if (circuits.length) {
    const tous = [...circuits, { nom: "Tableau de communication", section: 1.5, calibre: 16, typeA: false, longueur: 0 }];
    const surface = pl.pieces.reduce((t, p) => t + p.w * p.h, 0) || 50;
    const t = completerTableau(tous, { surface, chauffeEau: reperes.includes("CE") });
    ajouter("Tableau électrique", `Coffret ${t.rangees} rangée(s) de 13 modules`, 1);
    Object.entries(t.inter).forEach(([k, n]) => ajouter("Tableau électrique", `Interrupteur différentiel 30 mA ${k}`, n));
    Object.entries(t.disjoncteurs).sort((a, b) => a[0] - b[0])
      .forEach(([cal, n]) => ajouter("Tableau électrique", `Disjoncteur ${cal} A (phase + neutre)`, n));
    ajouter("Tableau électrique", "Peigne d'alimentation", t.rangees);
    if (reperes.includes("CE")) {
      ajouter("Tableau électrique", "Contacteur jour/nuit 20 A", 1);
      ajouter("Tableau électrique", "Disjoncteur 2 A (commande du contacteur)", 1);
    }
    const piecesAvecPoussoirs = new Set(pl.symboles.filter((s) => s.type === "poussoir").map((s) => pieceDe(pl, s)?.id || "hors"));
    ajouter("Tableau électrique", "Télérupteur", piecesAvecPoussoirs.size);
  }

  // --- Gaines et câbles
  if (tableau) {
    const parSection = {};
    circuits.forEach((c) => (parSection[c.section] = (parSection[c.section] || 0) + c.longueur));
    Object.entries(parSection).sort((a, b) => a[0] - b[0]).forEach(([s, m]) =>
      ajouter("Gaines et câbles", `Gaine ICTA préfilée 3G${fr(parseFloat(s))} mm²`, arrondirA(m, 5), "m"));
    ajouter("Gaines et câbles", "Câble RJ45 grade 3TV sous gaine", arrondirA(rj45, 5), "m");
  }

  // --- Appareillage (dans la gamme choisie par le client, si elle l'est)
  const gamme = chantier?.appareillage ? ` — ${chantier.appareillage.marque} ${chantier.appareillage.gamme} ${chantier.appareillage.finition.toLowerCase()}` : "";
  const mecanismes = [
    ["Prise 2P+T 16 A", nb("prise") + avecRepere("LL", "LV", "F", "SL", "CG", "?") + reperes.filter((r) => !r).length],
    ["Sortie de câble 32 A (plaque de cuisson)", avecRepere("P")],
    ["Sortie de câble (chauffe-eau)", avecRepere("CE")],
    ["Prise renforcée véhicule électrique", avecRepere("VE")],
    ["Interrupteur simple allumage", nb("interrupteur")],
    ["Interrupteur va-et-vient", nb("va-et-vient")],
    ["Bouton poussoir", nb("poussoir")],
    ["Interrupteur de volet roulant", nb("volet")],
    ["Prise RJ45", nb("rj45")],
    ["Sortie de câble (VMC)", nb("vmc")],
  ];
  mecanismes.forEach(([nom, n]) => ajouter("Appareillage", nom + gamme, n));
  const totalMecanismes = mecanismes.reduce((t, [, n]) => t + n, 0);
  ajouter("Appareillage", "Plaque de finition simple" + gamme, totalMecanismes);

  // --- Boîtes et points lumineux
  ajouter("Boîtes et points lumineux", "Boîte d'encastrement simple (placo ou maçonnerie selon le support)", totalMecanismes);
  ajouter("Boîtes et points lumineux", "Boîte DCL plafond + douille DCL", nb("lumiere"));
  ajouter("Boîtes et points lumineux", "Boîte DCL murale + douille DCL", nb("applique"));

  // --- Sécurité
  ajouter("Sécurité", "Détecteur de fumée (DAAF, NF EN 14604)", nb("daaf"));

  // --- Petites fournitures
  const boites = totalMecanismes + nb("lumiere") + nb("applique");
  ajouter("Petites fournitures", "Bornes de connexion rapide (environ 3 par boîte)", arrondirA(boites * 3, 10));
  if (circuits.length) ajouter("Petites fournitures", "Étiquettes de repérage du tableau", 1, "lot");

  // Quantités corrigées à la main par l'électricien
  const ajustements = chantier?.ajustements || {};
  lignes.forEach((l) => {
    l.calcule = l.qte;
    if (ajustements[l.cle] !== undefined) l.qte = ajustements[l.cle];
  });

  return { lignes, tableau, nbCircuits: circuits.length };
}

// ---------------------------------------------------------------------
//  Affichage dans le plan
// ---------------------------------------------------------------------
function afficherListeAchat() {
  const zone = $("liste-achat");
  const { lignes, tableau } = listeAchat(plan, chantierOuvert);

  if (!lignes.length) {
    zone.innerHTML = `<p class="intro">Pose des symboles sur le plan : la liste se remplit toute seule.</p>`;
    return;
  }
  const categories = [...new Set(lignes.map((l) => l.categorie))];
  zone.innerHTML = `
    ${tableau ? "" : `<p class="info">⚠️ Place le <strong>tableau électrique</strong> sur le plan pour calculer les longueurs de gaine.</p>`}
    ${categories.map((cat) => `
      <h3>${cat}</h3>
      <div class="lignes-achat">
        ${lignes.filter((l) => l.categorie === cat).map((l) => `
          <label class="ligne-achat${l.qte !== l.calcule ? " modifiee" : ""}">
            <span>${echapper(l.nom)}</span>
            <input type="number" min="0" step="1" value="${l.qte}" data-cle="${echapper(l.cle)}" aria-label="Quantité : ${echapper(l.nom)}">
            <small>${l.unite}</small>
          </label>`).join("")}
      </div>`).join("")}
    <p class="source">Longueurs de gaine estimées depuis le plan (trajets le long des murs, descentes, +15 %). Corrige les quantités si besoin : tes changements sont gardés.</p>`;
}

$("liste-achat").addEventListener("change", (e) => {
  const champ = e.target.closest("input[data-cle]");
  if (!champ) return;
  chantierOuvert.ajustements = chantierOuvert.ajustements || {};
  chantierOuvert.ajustements[champ.dataset.cle] = Math.max(0, parseFloat(champ.value) || 0);
  sauverBientot();
  afficherListeAchat();
});

$("reinitialiser-liste").addEventListener("click", () => {
  chantierOuvert.ajustements = {};
  sauverBientot();
  afficherListeAchat();
});

// Texte prêt à envoyer au fournisseur
function texteListeAchat() {
  const { lignes } = listeAchat(plan, chantierOuvert);
  let texte = `Liste de matériel — ${chantierOuvert.nom || "Chantier"}\n`;
  [...new Set(lignes.map((l) => l.categorie))].forEach((cat) => {
    texte += `\n${cat.toUpperCase()}\n`;
    lignes.filter((l) => l.categorie === cat && l.qte > 0)
      .forEach((l) => (texte += `- ${l.qte}${l.unite ? " " + l.unite : " ×"} ${l.nom}\n`));
  });
  return texte;
}

$("copier-liste").addEventListener("click", async () => {
  const texte = texteListeAchat();
  try {
    await navigator.clipboard.writeText(texte);
    $("message-liste").textContent = "✔ Liste copiée : colle-la dans un SMS, WhatsApp ou un e-mail.";
    $("texte-liste").hidden = true;
  } catch {
    // Copie refusée : on affiche le texte, sélectionné, pour une copie à la main
    $("texte-liste").hidden = false;
    $("texte-liste").value = texte;
    $("texte-liste").select();
    $("message-liste").textContent = "Copie automatique impossible : le texte est sélectionné, copie-le à la main.";
  }
});

function listeAchatHTML() {
  const { lignes } = listeAchat(plan, chantierOuvert);
  return [...new Set(lignes.map((l) => l.categorie))].map((cat) => `
    <h3>${cat}</h3>
    <ul>${lignes.filter((l) => l.categorie === cat && l.qte > 0)
      .map((l) => `<li>${l.qte}${l.unite ? " " + l.unite : " ×"} ${echapper(l.nom)}</li>`).join("")}</ul>`).join("");
}
