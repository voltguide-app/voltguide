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
$("form-differentiels").addEventListener("submit", (e) => {
  e.preventDefault();

  const surface = parseFloat($("d-surface").value);
  const circuits = parseInt($("d-circuits").value, 10);
  const regle = R.differentiels.find((d) => surface <= d.surfaceMax);
  const supplementaires = Math.max(0, Math.ceil(circuits / R.circuitsMaxParDifferentiel) - regle.nombre);

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
