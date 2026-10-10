// =====================================================================
//  ONGLET CHECK-LIST — autocontrôle avant le Consuel
//  Les cases cochées sont mémorisées dans le navigateur.
// =====================================================================

let cochees = lireMemoire("voltguide-checklist", {});

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
        ecrireMemoire("voltguide-checklist", cochees);
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
  ecrireMemoire("voltguide-checklist", cochees);
  afficherChecklist();
});

afficherChecklist();

// ---------------------------------------------------------------------
//  Mode hors-ligne (fonctionne seulement via un serveur, pas en double-clic)
// ---------------------------------------------------------------------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js");
}
