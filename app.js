// =====================================================================
//  VOLTGUIDE — logique de l'application
//  Les données (règles) viennent de data/regles.js
// =====================================================================

const R = window.REGLES;

// Affiche un nombre à la française : 2,5 au lieu de 2.5
const fr = (n, dec = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: dec });
const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------
//  1. Navigation
// ---------------------------------------------------------------------
// Onglets du bas
document.querySelectorAll("nav button").forEach((bouton) => {
  bouton.addEventListener("click", () => {
    document.querySelectorAll("nav button, .onglet").forEach((el) => el.classList.remove("actif"));
    bouton.classList.add("actif");
    $(bouton.dataset.onglet).classList.add("actif");
    window.scrollTo(0, 0);
  });
});

// Pastilles des calculateurs
document.querySelectorAll("#choix-calcul button").forEach((bouton) => {
  bouton.addEventListener("click", () => {
    document.querySelectorAll("#choix-calcul button, .sous-calcul").forEach((el) => el.classList.remove("actif"));
    bouton.classList.add("actif");
    $(bouton.dataset.calcul).classList.add("actif");
  });
});

$("version").textContent = R.version;
$("maj").textContent = new Date(R.miseAJour).toLocaleDateString("fr-FR");

// ---------------------------------------------------------------------
//  2. Guide pièce par pièce
// ---------------------------------------------------------------------
R.pieces.forEach((piece) => {
  const bouton = document.createElement("button");
  bouton.className = "bouton-piece";
  bouton.innerHTML = `<span class="emoji">${piece.icone}</span>${piece.nom}`;
  bouton.addEventListener("click", () => {
    document.querySelectorAll(".bouton-piece").forEach((b) => b.classList.remove("actif"));
    bouton.classList.add("actif");
    afficherPiece(piece);
  });
  $("liste-pieces").appendChild(bouton);
});

function afficherPiece(piece) {
  let html = `<div class="carte resultat"><h2>${piece.icone} ${piece.nom}</h2>`;

  if (piece.demandeSurface) {
    html += `<label>Surface de la pièce (m²)
               <input type="number" id="surface" min="1" step="0.5" placeholder="ex. 25">
             </label>
             <div id="resultat-piece"></div>`;
  }

  html += `<ul class="regles">${piece.regles.map((r) => `<li>${r}</li>`).join("")}</ul>`;

  if (piece.schema === "volumes") html += schemaSalleDeBain();
  html += `</div>`;

  $("detail-piece").innerHTML = html;
  $("detail-piece").scrollIntoView({ behavior: "smooth" });

  const champSurface = $("surface");
  if (champSurface) {
    champSurface.addEventListener("input", () => {
      const surface = parseFloat(champSurface.value);
      $("resultat-piece").innerHTML = surface > 0 ? calculPiece(piece.calcul, surface) : "";
    });
  }
}

// Calcule le nombre minimum de prises selon la surface
function calculPiece(type, surface) {
  let prises;
  if (type === "sejour") prises = Math.max(5, Math.ceil(surface / 4));
  if (type === "cuisine") prises = surface <= 4 ? 3 : 6;
  if (type === "entree") prises = surface > 4 ? 1 : 0;

  return `<p class="info">Pour ${fr(surface)} m² : <span class="chiffre">${prises}</span> prise(s) 16 A minimum</p>`;
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

// ---------------------------------------------------------------------
//  3a. Calculateur : section de câble et chute de tension
// ---------------------------------------------------------------------
const CALIBRES = [10, 16, 20, 25, 32, 40, 63];           // disjoncteurs courants (A)
const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35];        // sections normalisées (mm²)
const RESISTIVITE_CUIVRE = 0.023;                          // Ω·mm²/m (cuivre en service)

$("form-section").addEventListener("submit", (e) => {
  e.preventDefault();

  const puissance = parseFloat($("c-puissance").value);
  const longueur = parseFloat($("c-longueur").value);
  const tri = $("c-reseau").value === "tri";
  const chuteMax = parseFloat($("c-type").value);
  const sortie = $("resultat-section");

  // Intensité (on considère une charge résistive, cos φ = 1)
  const tension = tri ? 400 : 230;
  const intensite = tri ? puissance / (Math.sqrt(3) * tension) : puissance / tension;

  // Plus petit disjoncteur supérieur ou égal à l'intensité
  const calibre = CALIBRES.find((c) => c >= intensite);
  if (!calibre) {
    sortie.innerHTML = `<div class="carte resultat erreur">Intensité de ${fr(intensite)} A : au-delà de 63 A, une étude spécifique est nécessaire.</div>`;
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
    <div class="carte resultat">
      <p>Intensité : <strong>${fr(intensite)} A</strong></p>
      <p>Disjoncteur : <span class="chiffre">${calibre} A</span></p>
      <p>Section de câble : <span class="chiffre">${fr(section)} mm²</span></p>
      ${section > sectionMini
        ? `<p class="info">ℹ️ Section augmentée (au lieu de ${fr(sectionMini)} mm²) à cause de la longueur.</p>`
        : ""}
      <p class="${conforme ? "ok" : "erreur"}">
        Chute de tension : <strong>${fr(chuteFinale, 2)} %</strong>
        (${conforme ? "conforme" : "trop élevée"}, max ${chuteMax} %)
      </p>
    </div>`;
});

// ---------------------------------------------------------------------
//  3b. Calculateur : interrupteurs différentiels
// ---------------------------------------------------------------------
$("form-differentiels").addEventListener("submit", (e) => {
  e.preventDefault();

  const surface = parseFloat($("d-surface").value);
  const circuits = parseInt($("d-circuits").value, 10);
  const max = R.circuitsMaxParDifferentiel;

  const regle = R.differentiels.find((d) => surface <= d.surfaceMax);
  const besoinCircuits = Math.ceil(circuits / max);
  const supplementaires = Math.max(0, besoinCircuits - regle.nombre);

  $("resultat-differentiels").innerHTML = `
    <div class="carte resultat">
      <p>Minimum pour ${fr(surface)} m² :</p>
      <p class="chiffre">${regle.texte}</p>
      ${supplementaires > 0
        ? `<p class="info">⚠️ Avec ${circuits} circuits (8 max par différentiel), il faut ajouter
             <strong>${supplementaires} différentiel(s) 40 A</strong> de plus.</p>`
        : `<p class="ok">✔ ${circuits} circuits : la répartition à 8 circuits max par différentiel est possible.</p>`}
      <p>Rappel : la plaque de cuisson et le lave-linge vont sur le différentiel <strong>type A</strong>.</p>
    </div>`;
});

// ---------------------------------------------------------------------
//  3c. Calculateur : bilan de puissance
// ---------------------------------------------------------------------
R.appareils.forEach((app, i) => {
  $("liste-appareils").insertAdjacentHTML(
    "beforeend",
    `<label class="appareil">
       <input type="checkbox" data-i="${i}">
       <span>${app.nom}</span>
       <input type="number" data-puissance="${i}" value="${app.puissance}" min="0" aria-label="Puissance ${app.nom} en W"> W
     </label>`
  );
});

function calculerBilan() {
  let total = parseFloat($("b-autres").value) || 0;
  document.querySelectorAll("#liste-appareils input[type=checkbox]").forEach((caseACocher) => {
    if (caseACocher.checked) {
      total += parseFloat(document.querySelector(`[data-puissance="${caseACocher.dataset.i}"]`).value) || 0;
    }
  });

  const coef = parseFloat($("b-coef").value);
  $("b-coef-valeur").textContent = fr(coef, 2);

  const puissanceReelle = total * coef;
  const kva = puissanceReelle / 1000;
  const abonnement = R.abonnements.find((a) => a >= kva);

  $("resultat-bilan").innerHTML = `
    <div class="carte resultat">
      <p>Puissance totale installée : <strong>${fr(total / 1000)} kW</strong></p>
      <p>Puissance probable (× ${fr(coef, 2)}) : <strong>${fr(kva)} kW</strong></p>
      <p>Abonnement conseillé : <span class="chiffre">${abonnement ? abonnement + " kVA" : "> 36 kVA"}</span></p>
      ${!abonnement ? `<p class="info">Au-delà de 36 kVA : tarif jaune / branchement spécifique.</p>` : ""}
    </div>`;
}
$("calc-bilan").addEventListener("input", calculerBilan);
calculerBilan();

// ---------------------------------------------------------------------
//  3d. Calculateur : loi d'Ohm (U = R × I, P = U × I)
// ---------------------------------------------------------------------
$("form-ohm").addEventListener("submit", (e) => {
  e.preventDefault();
  const lire = (id) => { const v = parseFloat($(id).value); return v > 0 ? v : null; };
  let U = lire("o-u"), I = lire("o-i"), Rv = lire("o-r"), P = lire("o-p");

  const remplis = [U, I, Rv, P].filter((v) => v !== null).length;
  if (remplis !== 2) {
    $("resultat-ohm").innerHTML = `<div class="carte resultat erreur">Remplis exactement 2 valeurs (tu en as rempli ${remplis}).</div>`;
    return;
  }

  if (U && I) { Rv = U / I; P = U * I; }
  else if (U && Rv) { I = U / Rv; P = (U * U) / Rv; }
  else if (U && P) { I = P / U; Rv = (U * U) / P; }
  else if (I && Rv) { U = I * Rv; P = I * I * Rv; }
  else if (I && P) { U = P / I; Rv = P / (I * I); }
  else if (Rv && P) { U = Math.sqrt(P * Rv); I = Math.sqrt(P / Rv); }

  $("resultat-ohm").innerHTML = `
    <div class="carte resultat">
      <p>Tension U : <span class="chiffre">${fr(U, 2)} V</span></p>
      <p>Intensité I : <span class="chiffre">${fr(I, 2)} A</span></p>
      <p>Résistance R : <span class="chiffre">${fr(Rv, 2)} Ω</span></p>
      <p>Puissance P : <span class="chiffre">${fr(P, 0)} W</span></p>
    </div>`;
});

$("o-effacer").addEventListener("click", () => {
  ["o-u", "o-i", "o-r", "o-p"].forEach((id) => ($(id).value = ""));
  $("resultat-ohm").innerHTML = "";
});

// ---------------------------------------------------------------------
//  4. Fiches techniques
// ---------------------------------------------------------------------
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

R.fiches.forEach((fiche) => {
  const blocs = fiche.blocs.map((bloc) => `
    ${bloc.titre ? `<h3>${bloc.titre}</h3>` : ""}
    ${bloc.liste ? `<ul class="regles">${bloc.liste.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}
    ${bloc.tableau ? tableauHTML(bloc.tableau) : ""}
  `).join("");

  $("liste-fiches").insertAdjacentHTML(
    "beforeend",
    `<details class="carte">
       <summary><span>${fiche.icone}</span> ${fiche.titre}</summary>
       <div class="contenu">${blocs}</div>
     </details>`
  );
});

// ---------------------------------------------------------------------
//  5. Check-list Consuel (les cases cochées sont mémorisées)
// ---------------------------------------------------------------------
const CLE_STOCKAGE = "voltguide-checklist";
let cochees = {};
try { cochees = JSON.parse(localStorage.getItem(CLE_STOCKAGE)) || {}; } catch {}

function sauvegarder() {
  try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(cochees)); } catch {}
}

function afficherChecklist() {
  const conteneur = $("liste-checklist");
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
  $("progression").textContent =
    faits === total ? `✅ ${faits} / ${total} : prêt pour le Consuel !` : `${faits} / ${total} points vérifiés`;
  $("barre-remplie").style.width = `${(faits / total) * 100}%`;
}

$("reset-checklist").addEventListener("click", () => {
  cochees = {};
  sauvegarder();
  afficherChecklist();
});

afficherChecklist();

// ---------------------------------------------------------------------
//  6. Mode hors-ligne (fonctionne seulement via un serveur, pas en double-clic)
// ---------------------------------------------------------------------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js");
}
