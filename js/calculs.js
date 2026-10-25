// =====================================================================
//  ONGLET CALCULS — calculateurs
// =====================================================================

// Pastilles pour choisir le calculateur
document.querySelectorAll("#choix-calcul button").forEach((bouton) => {
  bouton.addEventListener("click", () => {
    document.querySelectorAll("#choix-calcul button, .sous-calcul").forEach((el) => el.classList.remove("actif"));
    bouton.classList.add("actif");
    $(bouton.dataset.calcul).classList.add("actif");
  });
});

// ---------------------------------------------------------------------
//  Section de câble et chute de tension
// ---------------------------------------------------------------------
const CALIBRES = [10, 16, 20, 25, 32, 40, 63];           // disjoncteurs courants (A)
const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35];        // sections normalisées (mm²)
const RESISTIVITE_CUIVRE = 0.023;                          // Ω·mm²/m (cuivre en service)

// Calcul pur (sans affichage), réutilisable et testable
function calculSection(puissance, longueur, tri, chuteMax) {
  const tension = tri ? 400 : 230;
  const intensite = tri ? puissance / (Math.sqrt(3) * tension) : puissance / tension;
  const calibre = CALIBRES.find((c) => c >= intensite);
  if (!calibre) return { intensite, calibre: null };

  const sectionMini = R.sectionParCalibre[calibre];
  const facteur = tri ? Math.sqrt(3) : 2;
  const chute = (s) => ((facteur * RESISTIVITE_CUIVRE * longueur * intensite) / s / tension) * 100;

  let section = SECTIONS.find((s) => s >= sectionMini);
  while (chute(section) > chuteMax && section < SECTIONS[SECTIONS.length - 1]) {
    section = SECTIONS[SECTIONS.indexOf(section) + 1];
  }
  return { intensite, calibre, sectionMini, section, chute: chute(section), conforme: chute(section) <= chuteMax };
}

$("form-section").addEventListener("submit", (e) => {
  e.preventDefault();
  const chuteMax = parseFloat($("c-type").value);
  const r = calculSection(
    parseFloat($("c-puissance").value),
    parseFloat($("c-longueur").value),
    $("c-reseau").value === "tri",
    chuteMax
  );

  if (!r.calibre) {
    $("resultat-section").innerHTML = `<div class="carte resultat erreur">Intensité de ${fr(r.intensite)} A : au-delà de 63 A, une étude spécifique est nécessaire.</div>`;
    return;
  }

  $("resultat-section").innerHTML = `
    <div class="carte resultat">
      <p>Intensité : <strong>${fr(r.intensite)} A</strong></p>
      <p>Disjoncteur : <span class="chiffre">${r.calibre} A</span></p>
      <p>Section de câble : <span class="chiffre">${fr(r.section)} mm²</span></p>
      ${r.section > r.sectionMini
        ? `<p class="info">ℹ️ Section augmentée (au lieu de ${fr(r.sectionMini)} mm²) à cause de la longueur.</p>`
        : ""}
      <p class="${r.conforme ? "ok" : "erreur"}">
        Chute de tension : <strong>${fr(r.chute, 2)} %</strong>
        (${r.conforme ? "conforme" : "trop élevée"}, max ${chuteMax} %)
      </p>
      <p class="source">⚠️ Calcul simplifié : ne tient pas compte du mode de pose, de la température ni du regroupement des câbles.</p>
    </div>`;
});

// ---------------------------------------------------------------------
//  Interrupteurs différentiels
// ---------------------------------------------------------------------
// Nombre d'interrupteurs différentiels (NF C 15-100 version 2024)
function nombreDifferentiels(circuits, circuitsA) {
  const max = R.circuitsMaxParDifferentiel;
  const typeA = Math.max(1, Math.ceil(circuitsA / max));
  const placeRestanteA = typeA * max - circuitsA;
  const autres = Math.max(R.differentiels.minimum - typeA, Math.ceil(Math.max(0, circuits - circuitsA - placeRestanteA) / max));
  return { typeA, autres };
}

$("form-differentiels").addEventListener("submit", (e) => {
  e.preventDefault();
  const circuits = parseInt($("d-circuits").value, 10);
  const circuitsA = Math.min(circuits, parseInt($("d-type-a").value, 10) || 0);
  const n = nombreDifferentiels(circuits, circuitsA);

  $("resultat-differentiels").innerHTML = `
    <div class="carte resultat">
      <p>Pour ${circuits} circuits :</p>
      <p class="chiffre">${n.typeA} × type A + ${n.autres} × type AC</p>
      <p>Soit ${n.typeA + n.autres} interrupteurs différentiels 30 mA (8 circuits max chacun).</p>
      <p class="info">Calibre de chaque différentiel (règle de l'aval) : 1 × (chauffage + chauffe-eau) + 0,5 × (tous les autres circuits), puis choisir 25, 40 ou 63 A.
        Exemple : chauffage 20 A + prises 16 A + éclairage 10 A → 33 A → différentiel 40 A.</p>
      <p>Rappels : lave-linge, sèche-linge et plaque sur le type A (ou F) ; pompe à chaleur ou clim sur un type F ; éclairage et prises répartis sur au moins 2 différentiels.</p>
    </div>`;
});

// ---------------------------------------------------------------------
//  Bilan de puissance
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

  const kva = (total * coef) / 1000;
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
//  Loi d'Ohm (U = R × I, P = U × I)
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
