// =====================================================================
//  RECHERCHE — cherche dans les pièces, fiches, schémas, calculateurs
//  et la check-list
// =====================================================================

// Ouvre un calculateur précis dans l'onglet Calculs
function ouvrirCalcul(id) {
  allerOnglet("calculs");
  document.querySelector(`#choix-calcul button[data-calcul="${id}"]`).click();
}

// --- Construction de l'index : une entrée par élément consultable
const INDEX = [];

R.pieces.forEach((p) => INDEX.push({
  icone: p.icone, titre: p.nom, lignes: p.regles, ouvrir: () => ouvrirPiece(p.id),
}));

R.fiches.forEach((f) => {
  const lignes = [];
  f.blocs.forEach((b) => {
    if (b.titre) lignes.push(b.titre);
    if (b.liste) lignes.push(...b.liste);
    if (b.tableau) lignesTableau(b.tableau).forEach((r) => lignes.push(r.filter(Boolean).join(" · ")));
  });
  INDEX.push({ icone: f.icone, titre: f.titre, lignes, ouvrir: () => ouvrirFiche("fiche:" + f.id) });
});

S.forEach((s) => INDEX.push({
  icone: "🔌", titre: "Schéma : " + s.titre, lignes: s.etapes, ouvrir: () => ouvrirFiche("schema:" + s.id),
}));

[
  ["calc-tableau", "Générateur de tableau électrique", ["coffret tableau circuits répartition différentiels matériel liste"]],
  ["calc-lux", "Calcul d'éclairage (lux)", ["lux éclairement luminaires lumens éclairage bureau atelier pièce"]],
  ["calc-section", "Calcul de section de câble", ["section câble chute de tension longueur disjoncteur calibre"]],
  ["calc-differentiels", "Calcul des différentiels", ["interrupteur différentiel 30 mA type A AC nombre surface"]],
  ["calc-bilan", "Bilan de puissance", ["abonnement kVA puissance compteur appareils"]],
  ["calc-ohm", "Loi d'Ohm", ["tension intensité résistance puissance U I R P"]],
].forEach(([id, titre, lignes]) => INDEX.push({ icone: "🧮", titre, lignes, ouvrir: () => ouvrirCalcul(id) }));

R.checklist.forEach((g) => INDEX.push({
  icone: "✅", titre: "Check-list : " + g.groupe, lignes: g.points, ouvrir: () => allerOnglet("checklist"),
}));

INDEX.push({ icone: "📐", titre: "Plan électrique", lignes: ["plan maison dessin symboles prises implantation PDF"], ouvrir: () => { allerOnglet("plans"); afficherListePlans(); } });
INDEX.push({ icone: "📋", titre: "Carnet de chantier", lignes: ["chantier mesures terre isolement photos rapport PDF"], ouvrir: () => allerOnglet("chantiers") });

// --- Recherche : tous les mots tapés doivent être trouvés
function rechercher(texte) {
  const mots = normaliser(texte).split(/\s+/).filter(Boolean);
  if (!mots.length) return [];

  return INDEX
    .map((entree) => {
      const titre = normaliser(entree.titre);
      const tout = titre + " " + normaliser(entree.lignes.join(" "));
      if (!mots.every((m) => tout.includes(m))) return null;
      const score = mots.filter((m) => titre.includes(m)).length * 10;
      // Extrait : la première ligne qui contient un des mots
      const extrait = entree.lignes.find((l) => mots.some((m) => normaliser(l).includes(m))) || "";
      return { ...entree, score, extrait };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

// --- Affichage
const champRecherche = $("recherche");

champRecherche.addEventListener("input", () => {
  const texte = champRecherche.value.trim();
  document.body.classList.toggle("recherche-active", texte.length > 0);
  if (!texte) return;

  const resultats = rechercher(texte);
  const zone = $("resultats-recherche");
  zone.innerHTML = `<h2>${resultats.length} résultat(s) pour « ${echapper(texte)} »</h2>`;

  if (!resultats.length) {
    zone.insertAdjacentHTML("beforeend", `<p class="intro">Aucun résultat. Essaie un autre mot (ex. « prise », « 32 A », « salle de bain »).</p>`);
    return;
  }
  resultats.forEach((r) => {
    const bouton = document.createElement("button");
    bouton.className = "carte resultat-recherche";
    bouton.innerHTML = `<strong>${r.icone} ${r.titre}</strong>${r.extrait ? `<span>${r.extrait}</span>` : ""}`;
    bouton.addEventListener("click", r.ouvrir);
    zone.appendChild(bouton);
  });
});

function fermerRecherche() {
  champRecherche.value = "";
  document.body.classList.remove("recherche-active");
}
