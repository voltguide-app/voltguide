// =====================================================================
//  CHECK-LIST CONSUEL — dans chaque chantier
//  Les cases cochées sont enregistrées avec le chantier.
// =====================================================================

const TOTAL_POINTS = R.checklist.reduce((t, g) => t + g.points.length, 0);
const pointsCoches = (c) => Object.values(c.checklist || {}).filter(Boolean).length;

function afficherChecklistChantier() {
  const c = chantierOuvert;
  c.checklist = c.checklist || {};
  const conteneur = $("liste-checklist");
  conteneur.innerHTML = "";

  R.checklist.forEach((groupe, g) => {
    const bloc = document.createElement("div");
    bloc.innerHTML = `<h3>${groupe.groupe}</h3>`;
    groupe.points.forEach((texte, p) => {
      const id = `${g}-${p}`;
      const ligne = document.createElement("label");
      ligne.className = "point";
      ligne.innerHTML = `<input type="checkbox" ${c.checklist[id] ? "checked" : ""}> <span>${texte}</span>`;
      ligne.querySelector("input").addEventListener("change", (e) => {
        c.checklist[id] = e.target.checked;
        sauverBientot();
        majProgression();
      });
      bloc.appendChild(ligne);
    });
    conteneur.appendChild(bloc);
  });
  majProgression();
}

function majProgression() {
  const faits = pointsCoches(chantierOuvert);
  $("progression").textContent = faits === TOTAL_POINTS
    ? `✅ ${faits} / ${TOTAL_POINTS} : prêt pour le Consuel !`
    : `${faits} / ${TOTAL_POINTS} points vérifiés`;
  $("progression-courte").textContent = `${faits}/${TOTAL_POINTS}`;
  $("barre-remplie").style.width = `${(faits / TOTAL_POINTS) * 100}%`;
}

$("reset-checklist").addEventListener("click", (e) =>
  confirmerAvant(e.currentTarget, "Touche encore pour tout décocher", () => {
    chantierOuvert.checklist = {};
    sauverBientot();
    afficherChecklistChantier();
  }));

// ---------------------------------------------------------------------
//  Mode hors-ligne (fonctionne seulement via un serveur, pas en double-clic)
// ---------------------------------------------------------------------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {}); // pas grave si refusé : l'app marche quand même
}
