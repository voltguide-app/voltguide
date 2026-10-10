// =====================================================================
//  ONGLET FICHES — favoris, fiches techniques et schémas de câblage
// =====================================================================

function tableauHTML(tableau) {
  // Le tableau des circuits est construit à partir de R.circuits
  const lignes = tableau.depuis === "circuits"
    ? R.circuits.map((c) => [c.nom, c.section, c.protection, c.limite])
    : tableau.lignes;

  return `<div class="tableau-scroll"><table>
    <thead><tr>${tableau.entetes.map((t) => `<th>${t}</th>`).join("")}</tr></thead>
    <tbody>${lignes.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

// Bloc dépliable commun aux fiches et aux schémas
function accordeonHTML(cle, icone, titre, contenu) {
  return `<details class="carte" id="${cle.replace(":", "-")}">
     <summary><span>${icone}</span> ${titre} ${etoileHTML(cle)}</summary>
     <div class="contenu">${contenu}</div>
   </details>`;
}

// --- Fiches techniques
R.fiches.forEach((fiche) => {
  fiche.id = slug(fiche.titre);
  const contenu = fiche.blocs.map((bloc) => `
    ${bloc.titre ? `<h3>${bloc.titre}</h3>` : ""}
    ${bloc.liste ? `<ul class="regles">${bloc.liste.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}
    ${bloc.tableau ? tableauHTML(bloc.tableau) : ""}
  `).join("") + sourceHTML(fiche);

  $("liste-fiches").insertAdjacentHTML("beforeend", accordeonHTML("fiche:" + fiche.id, fiche.icone, fiche.titre, contenu));
});

// --- Schémas de câblage
S.forEach((schema) => {
  const contenu = `
    <div class="schema">${schema.svg}</div>
    <p class="legende">
      <span class="trait sch-phase-fond"></span>Phase
      <span class="trait sch-neutre-fond"></span>Neutre
      <span class="trait sch-retour-fond"></span>Retour / commande
      <span class="trait sch-navette-fond"></span>Navette
    </p>
    <h3>Raccordement</h3>
    <ol class="regles">${schema.etapes.map((e) => `<li>${e}</li>`).join("")}</ol>
    <p class="source">La terre (vert/jaune) n'est pas dessinée : elle se raccorde à chaque point lumineux et appareil.</p>
    ${sourceHTML(schema)}`;

  $("liste-schemas").insertAdjacentHTML("beforeend", accordeonHTML("schema:" + schema.id, "🔌", schema.titre, contenu));
});

activerEtoiles($("fiches"));

// --- Ouvrir une fiche ou un schéma depuis la recherche ou les favoris
function ouvrirFiche(cle) {
  allerOnglet("fiches");
  const bloc = $(cle.replace(":", "-"));
  if (!bloc) return;
  bloc.open = true;
  bloc.scrollIntoView({ behavior: "smooth", block: "start" });
}

// --- Favoris : retrouve le titre de chaque favori et l'affiche en haut de l'onglet
function infosFavori(cle) {
  const [type, id] = cle.split(":");
  if (type === "piece") {
    const p = R.pieces.find((x) => x.id === id);
    return p && { icone: p.icone, titre: p.nom, ouvrir: () => ouvrirPiece(id) };
  }
  if (type === "fiche") {
    const f = R.fiches.find((x) => x.id === id);
    return f && { icone: f.icone, titre: f.titre, ouvrir: () => ouvrirFiche(cle) };
  }
  if (type === "schema") {
    const s = S.find((x) => x.id === id);
    return s && { icone: "🔌", titre: s.titre, ouvrir: () => ouvrirFiche(cle) };
  }
}

function afficherFavoris() {
  const zone = $("liste-favoris");
  const liste = favoris.map((cle) => [cle, infosFavori(cle)]).filter(([, info]) => info);

  if (!liste.length) {
    zone.innerHTML = `<p class="intro">Touche l'étoile ☆ d'une fiche, d'un schéma ou d'une pièce pour la retrouver ici.</p>`;
    return;
  }
  zone.innerHTML = "";
  liste.forEach(([, info]) => {
    const bouton = document.createElement("button");
    bouton.className = "pastille-favori";
    bouton.textContent = `${info.icone} ${info.titre}`;
    bouton.addEventListener("click", info.ouvrir);
    zone.appendChild(bouton);
  });
}

afficherFavoris();
