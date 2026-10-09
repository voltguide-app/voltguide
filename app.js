// =====================================================================
//  VOLTGUIDE — logique de l'application
//  Les données (règles) viennent de data/regles.js
// =====================================================================

const R = window.REGLES;

// Affiche un nombre à la française : 2,5 au lieu de 2.5
const fr = (n, dec = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: dec });

// ---------------------------------------------------------------------
//  1. Navigation entre les onglets
// ---------------------------------------------------------------------
document.querySelectorAll("nav button").forEach((bouton) => {
  bouton.addEventListener("click", () => {
    document.querySelectorAll("nav button, .onglet").forEach((el) => el.classList.remove("actif"));
    bouton.classList.add("actif");
    document.getElementById(bouton.dataset.onglet).classList.add("actif");
    window.scrollTo(0, 0);
  });
});

document.getElementById("version").textContent = R.version;
document.getElementById("maj").textContent = new Date(R.miseAJour).toLocaleDateString("fr-FR");

// ---------------------------------------------------------------------
//  2. Guide pièce par pièce
// ---------------------------------------------------------------------
const listePieces = document.getElementById("liste-pieces");
const detailPiece = document.getElementById("detail-piece");

R.pieces.forEach((piece) => {
  const bouton = document.createElement("button");
  bouton.className = "bouton-piece";
  bouton.innerHTML = `<span class="emoji">${piece.icone}</span>${piece.nom}`;
  bouton.addEventListener("click", () => {
    document.querySelectorAll(".bouton-piece").forEach((b) => b.classList.remove("actif"));
    bouton.classList.add("actif");
    afficherPiece(piece);
  });
  listePieces.appendChild(bouton);
});

function afficherPiece(piece) {
  let html = `<div class="carte"><h2>${piece.icone} ${piece.nom}</h2>`;

  if (piece.demandeSurface) {
    html += `<label>Surface de la pièce (m²)
               <input type="number" id="surface" min="1" step="0.5" placeholder="ex. 25">
             </label>
             <div id="resultat-piece"></div>`;
  }

  html += `<ul class="regles">${piece.regles.map((r) => `<li>${r}</li>`).join("")}</ul>`;

  if (piece.schema === "volumes") html += schemaSalleDeBain();
  html += `</div>`;

  detailPiece.innerHTML = html;
  detailPiece.scrollIntoView({ behavior: "smooth" });

  const champSurface = document.getElementById("surface");
  if (champSurface) {
    champSurface.addEventListener("input", () => {
      const surface = parseFloat(champSurface.value);
      document.getElementById("resultat-piece").innerHTML =
        surface > 0 ? calculPiece(piece.calcul, surface) : "";
    });
  }
}

// Calcule le nombre minimum de prises selon la surface
function calculPiece(type, surface) {
  let prises;
  if (type === "sejour") prises = Math.max(5, Math.ceil(surface / 4));
  if (type === "cuisine") prises = surface <= 4 ? 3 : 6;
  if (type === "entree") prises = surface > 4 ? 1 : 0;

  return `<p>Pour ${fr(surface)} m² : <span class="chiffre">${prises}</span> prise(s) 16 A minimum</p>`;
}

// Schéma vu de dessus des volumes de la salle de bain
function schemaSalleDeBain() {
  return `
  <div class="schema">
    <svg viewBox="0 0 400 260" role="img" aria-label="Volumes de la salle de bain, vue de dessus">
      <rect x="10" y="10" width="380" height="240" rx="6" fill="none" stroke="currentColor" stroke-opacity=".3"/>
      <rect x="40" y="40" width="250" height="150" rx="8" fill="#f5b300" fill-opacity=".25" stroke="#f5b300"/>
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

// ---------------------------------------------------------------------
//  3. Calcul de section de câble et de chute de tension
// ---------------------------------------------------------------------
const CALIBRES = [10, 16, 20, 25, 32, 40, 63];           // disjoncteurs courants (A)
const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35];        // sections normalisées (mm²)
const RESISTIVITE_CUIVRE = 0.023;                          // Ω·mm²/m (cuivre en service)

document.getElementById("form-calcul").addEventListener("submit", (e) => {
  e.preventDefault();

  const puissance = parseFloat(document.getElementById("c-puissance").value);
  const longueur = parseFloat(document.getElementById("c-longueur").value);
  const tri = document.getElementById("c-reseau").value === "tri";
  const chuteMax = parseFloat(document.getElementById("c-type").value);
  const sortie = document.getElementById("resultat-calcul");

  // Intensité (on considère une charge résistive, cos φ = 1)
  const tension = tri ? 400 : 230;
  const intensite = tri ? puissance / (Math.sqrt(3) * tension) : puissance / tension;

  // Plus petit disjoncteur supérieur ou égal à l'intensité
  const calibre = CALIBRES.find((c) => c >= intensite);
  if (!calibre) {
    sortie.innerHTML = `<div class="carte erreur">Intensité de ${fr(intensite)} A : au-delà de 63 A, une étude spécifique est nécessaire.</div>`;
    return;
  }

  // Section minimale imposée par le calibre
  const sectionMini = R.sectionParCalibre[calibre];

  // On augmente la section tant que la chute de tension est trop forte
  const facteur = tri ? Math.sqrt(3) : 2;
  const chute = (s) => ((facteur * RESISTIVITE_CUIVRE * longueur * intensite) / s / tension) * 100;

  let section = SECTIONS.find((s) => s >= sectionMini);
  while (chute(section) > chuteMax && section < SECTIONS[SECTIONS.length - 1]) {
    section = SECTIONS[SECTIONS.indexOf(section) + 1];
  }

  const chuteFinale = chute(section);
  const conforme = chuteFinale <= chuteMax;

  sortie.innerHTML = `
    <div class="carte">
      <p>Intensité : <strong>${fr(intensite)} A</strong></p>
      <p>Disjoncteur : <span class="chiffre">${calibre} A</span></p>
      <p>Section de câble : <span class="chiffre">${fr(section)} mm²</span></p>
      ${section > sectionMini
        ? `<p>ℹ️ Section augmentée (au lieu de ${fr(sectionMini)} mm²) à cause de la longueur.</p>`
        : ""}
      <p class="${conforme ? "ok" : "erreur"}">
        Chute de tension : <strong>${fr(chuteFinale, 2)} %</strong>
        (${conforme ? "conforme" : "trop élevée"}, max ${chuteMax} %)
      </p>
    </div>`;
});

// Remplit le tableau des circuits
const corpsTable = document.querySelector("#table-circuits tbody");
R.circuits.forEach((c) => {
  corpsTable.insertAdjacentHTML(
    "beforeend",
    `<tr><td>${c.nom}</td><td>${c.section}</td><td>${c.protection}</td><td>${c.limite}</td></tr>`
  );
});

// ---------------------------------------------------------------------
//  4. Check-list Consuel (les cases cochées sont mémorisées)
// ---------------------------------------------------------------------
const CLE_STOCKAGE = "voltguide-checklist";
let cochees = {};
try { cochees = JSON.parse(localStorage.getItem(CLE_STOCKAGE)) || {}; } catch {}

function sauvegarder() {
  try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(cochees)); } catch {}
}

function afficherChecklist() {
  const conteneur = document.getElementById("liste-checklist");
  conteneur.innerHTML = "";
  let total = 0;

  R.checklist.forEach((groupe, g) => {
    const carte = document.createElement("div");
    carte.className = "carte";
    carte.innerHTML = `<h2>${groupe.groupe}</h2>`;

    groupe.points.forEach((texte, p) => {
      const id = `${g}-${p}`;
      total++;
      const ligne = document.createElement("label");
      ligne.className = "point";
      ligne.innerHTML = `<input type="checkbox" ${cochees[id] ? "checked" : ""}> <span>${texte}</span>`;
      ligne.querySelector("input").addEventListener("change", (e) => {
        cochees[id] = e.target.checked;
        sauvegarder();
        majProgression(total);
      });
      carte.appendChild(ligne);
    });
    conteneur.appendChild(carte);
  });
  majProgression(total);
}

function majProgression(total) {
  const faits = Object.values(cochees).filter(Boolean).length;
  document.getElementById("progression").textContent =
    faits === total ? `✅ ${faits} / ${total} : prêt pour le Consuel !` : `${faits} / ${total} points vérifiés`;
}

document.getElementById("reset-checklist").addEventListener("click", () => {
  cochees = {};
  sauvegarder();
  afficherChecklist();
});

afficherChecklist();

// ---------------------------------------------------------------------
//  5. Mode hors-ligne (fonctionne seulement via un serveur, pas en double-clic)
// ---------------------------------------------------------------------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js");
}
