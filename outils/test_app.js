// =====================================================================
//  Test automatique de VoltGuide dans un navigateur simulé (jsdom)
//
//  Utilisation :
//    NODE_PATH=<dossier node_modules avec jsdom et fake-indexeddb> \
//      node outils/test_app.js [fichier.html]
//  Sans fichier, teste index.html.
// =====================================================================
const { JSDOM, VirtualConsole } = require("jsdom");
const path = require("path");
require("fake-indexeddb/auto");

const fichier = process.argv[2] || path.join(__dirname, "..", "index.html");
const erreurs = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => erreurs.push(e.message + (e.detail ? " " + e.detail : "")));
vc.on("error", (e) => erreurs.push(String(e)));

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const verifier = (cond, msg) => { console.log((cond ? "✔ " : "✘ ") + msg); if (!cond) process.exitCode = 1; };

(async () => {
  const dom = await JSDOM.fromFile(fichier, {
    contentType: "text/html; charset=utf-8", runScripts: "dangerously", resources: "usable", virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) {
      w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange;
      w.print = () => { w.__imprime = true; };
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.scrollTo = () => {};
    },
  });
  const w = dom.window, d = w.document;
  await new Promise((r) => w.addEventListener("load", r));
  await attendre(200);
  const clic = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
  const saisir = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); };
  const envoyer = (id) => d.getElementById(id).dispatchEvent(new w.Event("submit", { cancelable: true }));

  // Pièces
  verifier(d.querySelectorAll(".bouton-piece").length === 8, "8 pièces affichées");
  clic(d.querySelector('[data-piece="sejour"]'));
  saisir(d.getElementById("surface"), "30");
  verifier(d.getElementById("resultat-piece").textContent.includes("8"), "Séjour 30 m² → 8 prises");
  verifier(d.querySelector("#detail-piece .source").textContent.includes("7-771"), "Source affichée sur la pièce");

  // Générateur de tableau
  clic(d.querySelector('nav button[data-onglet="calculs"]'));
  envoyer("form-tableau");
  const res = d.getElementById("resultat-tableau").textContent.replace(/\s+/g, " ");
  verifier(res.includes("Différentiel 1") && res.includes("type A"), "Tableau généré avec différentiels");
  const comptes = [...d.querySelectorAll(".compteur")].map((c) => c.textContent);
  verifier(comptes.every((c) => parseInt(c) <= 8), "8 circuits max par différentiel : " + comptes.join(", "));
  const diffA = [...d.querySelectorAll(".differentiel")].find((x) => x.textContent.includes("type A"));
  verifier(diffA.textContent.includes("Plaque") && diffA.textContent.includes("Lave-linge"), "Plaque + lave-linge sur le type A");

  // Éclairage : bureau 6 × 4 m, 500 lux, dalles 3600 lm
  clic(d.querySelector('[data-calcul="calc-lux"]'));
  const type = d.getElementById("l-type");
  type.value = "pro"; type.dispatchEvent(new w.Event("change"));
  verifier(d.getElementById("l-lux").value === "500" && d.getElementById("l-flux").value === "3600", "Local pro : bureau 500 lux, dalle 3600 lm");
  envoyer("form-lux");
  const lux = d.getElementById("resultat-lux").textContent.replace(/\s+/g, " ");
  const nbLum = parseInt(lux.match(/Luminaires : (\d+)/)[1]);
  verifier(nbLum >= 7 && nbLum <= 8, `Bureau 24 m² à 500 lux → ${nbLum} dalles`);
  verifier(lux.includes("✔ Minimum du Code du travail"), "Minimum du Code du travail respecté");

  // Section de câble
  clic(d.querySelector('[data-calcul="calc-section"]'));
  envoyer("form-section");
  verifier(d.getElementById("resultat-section").textContent.includes("16 A"), "Section : 3000 W → 16 A");

  // Fiches, schémas, favoris
  clic(d.querySelector('nav button[data-onglet="fiches"]'));
  verifier(d.querySelectorAll("#liste-fiches details").length === 10, "10 fiches");
  verifier(d.querySelectorAll("#liste-schemas details").length === 4, "4 schémas");
  verifier(d.getElementById("fiche-eclairement-lux")?.textContent.includes("120 lux"), "Fiche éclairement");
  clic(d.querySelector('[data-favori="schema:va-et-vient"]'));
  verifier(d.querySelector("#liste-favoris .pastille-favori")?.textContent.includes("Va-et-vient"), "Favori ajouté");
  verifier(!d.getElementById("schema-va-et-vient").open, "L'étoile n'ouvre pas la fiche");
  clic(d.querySelector("#liste-favoris .pastille-favori"));
  verifier(d.getElementById("schema-va-et-vient").open, "Le favori ouvre le schéma");

  // Recherche
  const r = d.getElementById("recherche");
  saisir(r, "salle de bain");
  verifier(d.querySelectorAll(".resultat-recherche").length > 0, "Recherche « salle de bain »");
  saisir(r, "telerupteur");
  clic(d.querySelector("#resultats-recherche .resultat-recherche"));
  verifier(d.getElementById("schema-telerupteur").open && r.value === "", "Un résultat ouvre le schéma");

  // Chantiers
  clic(d.querySelector('nav button[data-onglet="chantiers"]'));
  clic(d.getElementById("nouveau-chantier"));
  await attendre(300);
  saisir(d.querySelector('[data-champ="nom"]'), "Maison Test");
  saisir(d.querySelector('[data-champ="mesures.terre"]'), "150");
  verifier(d.getElementById("verdict-terre").textContent.includes("Non conforme"), "Terre 150 Ω → non conforme");
  saisir(d.querySelector('[data-champ="mesures.terre"]'), "40");
  verifier(d.getElementById("verdict-terre").textContent.includes("Conforme"), "Terre 40 Ω → conforme");
  if (w.VOLTGUIDE_SANS_IMPRESSION) {
    verifier(d.getElementById("rapport-chantier").hidden, "Bouton PDF caché (page Claude)");
  } else {
    clic(d.getElementById("rapport-chantier"));
    verifier(w.__imprime && d.getElementById("rapport").textContent.includes("Maison Test"), "Rapport PDF généré");
  }
  clic(d.getElementById("retour-chantiers"));
  await attendre(300);
  verifier(d.getElementById("liste-chantiers").textContent.includes("Maison Test"), "Chantier enregistré");

  // Suppression en deux appuis
  clic(d.querySelector("#liste-chantiers .resultat-recherche"));
  await attendre(300);
  const sup = d.getElementById("supprimer-chantier");
  clic(sup);
  verifier(sup.textContent.includes("Touche encore"), "1er appui : demande de confirmation");
  clic(sup);
  await attendre(300);
  verifier(d.getElementById("liste-chantiers").textContent.includes("Aucun chantier"), "2e appui : chantier supprimé");

  // Check-list
  clic(d.querySelector('nav button[data-onglet="checklist"]'));
  verifier(d.querySelectorAll(".point").length > 15, "Check-list affichée");

  verifier(erreurs.length === 0, "Aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
  w.close();
})();
