// =====================================================================
//  ONGLET PIÈCES — guide pièce par pièce
// =====================================================================

R.pieces.forEach((piece) => {
  const bouton = document.createElement("button");
  bouton.className = "bouton-piece";
  bouton.dataset.piece = piece.id;
  bouton.innerHTML = `<span class="emoji">${piece.icone}</span>${piece.nom}`;
  bouton.addEventListener("click", () => ouvrirPiece(piece.id));
  $("liste-pieces").appendChild(bouton);
});

function ouvrirPiece(id) {
  const piece = R.pieces.find((p) => p.id === id);
  allerOnglet("pieces");
  document.querySelectorAll(".bouton-piece").forEach((b) => b.classList.toggle("actif", b.dataset.piece === id));

  let html = `<div class="carte resultat">
    <div class="titre-ligne"><h2>${piece.icone} ${piece.nom}</h2>${etoileHTML("piece:" + piece.id)}</div>`;

  if (piece.demandeSurface) {
    html += `<label>Surface de la pièce (m²)
               <input type="number" id="surface" min="1" step="0.5" placeholder="ex. 25">
             </label>
             <div id="resultat-piece"></div>`;
  }

  html += `<ul class="regles">${piece.regles.map((r) => `<li>${r}</li>`).join("")}</ul>`;
  if (piece.schema === "volumes") html += schemaSalleDeBain();
  html += sourceHTML(piece) + `</div>`;

  const detail = $("detail-piece");
  detail.innerHTML = html;
  activerEtoiles(detail);
  detail.scrollIntoView({ behavior: "smooth" });

  const champSurface = $("surface");
  if (champSurface) {
    champSurface.addEventListener("input", () => {
      const surface = parseFloat(champSurface.value);
      $("resultat-piece").innerHTML = surface > 0
        ? `<p class="info">Pour ${fr(surface)} m² : <span class="chiffre">${prisesMinimum(piece.calcul, surface)}</span> prise(s) 16 A minimum</p>`
        : "";
    });
  }
}

// Nombre minimum de prises selon la surface (aussi utilisé par le générateur de tableau)
function prisesMinimum(type, surface) {
  if (type === "sejour") return Math.max(5, Math.ceil(surface / 4));
  if (type === "cuisine") return surface <= 4 ? 3 : 6;
  if (type === "entree") return surface > 4 ? 1 : 0;
  return 0;
}

// Schéma vu de dessus des volumes de la salle de bain
function schemaSalleDeBain() {
  return `
  <div class="schema">
    <svg viewBox="0 0 400 260" role="img" aria-label="Volumes de la salle de bain, vue de dessus">
      <rect x="10" y="10" width="380" height="240" rx="6" fill="none" stroke="currentColor" stroke-opacity=".3"/>
      <rect x="40" y="40" width="250" height="150" rx="8" fill="#ffc400" fill-opacity=".25" stroke="#ffc400"/>
      <rect x="80" y="80" width="170" height="70" rx="20" fill="#3b82f6" fill-opacity=".35" stroke="#3b82f6"/>
      <text x="165" y="112" text-anchor="middle">Volumes 0 et 1</text>
      <text x="165" y="130" text-anchor="middle" style="font-size:11px">baignoire → 2,25 m</text>
      <text x="165" y="62" text-anchor="middle">Volume 2 (60 cm)</text>
      <text x="340" y="130" text-anchor="middle">Hors</text>
      <text x="340" y="146" text-anchor="middle">volume</text>
      <text x="340" y="170" text-anchor="middle" style="font-size:11px">prises OK</text>
    </svg>
  </div>`;
}
