// =====================================================================
//  Test automatique de VoltGuide dans un navigateur simulé (jsdom)
//
//  Utilisation :
//    NODE_PATH=~/.local/opt/voltguide-test/node_modules \
//      ~/.local/opt/node/bin/node outils/test_app.js [fichier.html]
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
  const comptes = [...d.querySelectorAll("#resultat-tableau .compteur")].map((c) => c.textContent);
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

  // Plan électrique
  clic(d.querySelector("#liste-chantiers .resultat-recherche"));
  await attendre(300);
  clic(d.getElementById("ouvrir-plan"));
  verifier(!d.getElementById("vue-plan").hidden && d.getElementById("vue-chantier").hidden, "Plan ouvert depuis le chantier");
  verifier(d.querySelectorAll("#outils-plan button").length === 16, "16 outils (naviguer, déplacer, pièce, échelle + 12 symboles)");
  w.eval(`
    plan.pieces.push({ id: "s1", type: "sejour", nom: "", x: 1, y: 1, w: 6, h: 5 });
    plan.pieces.push({ id: "c1", type: "chambre", nom: "Chambre 1", x: 7, y: 1, w: 3.5, h: 3 });
    changement();
    for (let i = 0; i < 5; i++) ajouterSymbole("prise", 2 + i * 0.5, 2);
    ajouterSymbole("lumiere", 4, 3.5);
    ajouterSymbole("prise-specialisee", 8, 2);
  `);
  let verif = d.getElementById("verif-plan").textContent;
  verifier(verif.includes("Prises 16 A : 5 sur 8 minimum") && verif.includes("✘"), "Séjour 30 m² avec 5 prises → ✘ 5 sur 8");
  verifier(verif.includes("sans appareil choisi"), "Prise spécialisée sans appareil signalée");
  w.eval(`for (let i = 0; i < 3; i++) ajouterSymbole("prise", 2 + i * 0.5, 4);`);
  verif = d.getElementById("verif-plan").textContent;
  verifier(verif.includes("Prises 16 A : 8 sur 8 minimum"), "Séjour avec 8 prises → ✔");
  const avant = w.eval("plan.symboles.length");
  clic(d.getElementById("plan-annuler"));
  verifier(w.eval("plan.symboles.length") === avant - 1, "Le bouton Annuler retire le dernier symbole");
  verifier(d.getElementById("liste-achat").textContent.includes("Prise 2P+T 16 A"), "Liste d'achat : prises");
  verifier(d.getElementById("liste-achat").textContent.includes("Place le tableau"), "Sans tableau : demande de placer le tableau");
  verifier(d.querySelectorAll("#svg-plan .plan-piece").length === 2 && d.querySelectorAll("#svg-plan .plan-symbole").length === avant - 1, "Pièces et symboles dessinés");
  w.eval(`selection = plan.symboles.find((s) => s.type === "prise-specialisee").id; afficherProprietes();`);
  const repere = d.getElementById("ps-repere");
  repere.value = "LL"; repere.dispatchEvent(new w.Event("change"));
  verifier(!d.getElementById("verif-plan").textContent.includes("sans appareil"), "Repère LL choisi pour la prise spécialisée");

  // Liste d'achat avec le tableau placé
  w.eval(`ajouterSymbole("tableau", 1.5, 1.5)`);
  let liste = d.getElementById("liste-achat").textContent.replace(/\s+/g, " ");
  verifier(liste.includes("Gaine ICTA préfilée 3G1,5") && liste.includes("Gaine ICTA préfilée 3G2,5"), "Gaines préfilées 1,5 et 2,5 mm² calculées");
  verifier(liste.includes("Coffret") && liste.includes("Disjoncteur 20 A") && liste.includes("Interrupteur différentiel"), "Tableau dans la liste d'achat");
  verifier(liste.includes("Boîte DCL plafond") && liste.includes("Bornes de connexion"), "Boîtes DCL et petites fournitures");
  const calc = w.eval(`circuitsDuPlan({ hauteurPlafond: 2.5, pieces: [], symboles: [
    { id: "t", type: "tableau", x: 0, y: 0 }, { id: "p", type: "prise", x: 3, y: 4 } ] })`);
  verifier(Math.abs(calc.circuits[0].longueur - 12.65) < 0.01, "Longueur de gaine : (1,5 + 7 + 2,5) × 1,15 = 12,65 m");
  const champ = d.querySelector("#liste-achat input[data-cle]");
  champ.value = "42"; champ.dispatchEvent(new w.Event("change", { bubbles: true }));
  verifier(d.querySelector(`#liste-achat input[data-cle="${champ.dataset.cle}"]`).value === "42" && d.querySelector("#liste-achat .ligne-achat.modifiee"), "Quantité corrigée à la main et gardée");
  clic(d.getElementById("copier-liste"));
  await attendre(100);
  verifier(d.getElementById("texte-liste").value.includes("Liste de matériel") && d.getElementById("texte-liste").value.includes("42"), "Texte de la liste prêt à copier");
  clic(d.getElementById("reinitialiser-liste"));
  verifier(!d.querySelector("#liste-achat .ligne-achat.modifiee"), "Quantités remises aux valeurs calculées");

  // Mise à l'échelle : un trait de 6 m qui mesure en vrai 12 m → tout est doublé
  w.eval(`traitEchelle = { x0: 1, y0: 1, x1: 7, y1: 1 }; afficherProprietes();`);
  d.getElementById("longueur-reelle").value = "12";
  clic(d.getElementById("appliquer-echelle"));
  verifier(w.eval("plan.largeur") === 24 && w.eval('plan.pieces.find((p) => p.id === "s1").w') === 12, "Échelle appliquée : plan et pièces doublés");
  clic(d.getElementById("plan-annuler"));
  verifier(w.eval("plan.largeur") === 12, "Annuler l'échelle");
  if (w.VOLTGUIDE_SANS_IMPRESSION) {
    verifier(d.getElementById("plan-pdf").hidden, "Bouton PDF du plan caché (page Claude)");
  } else {
    clic(d.getElementById("plan-pdf"));
    verifier(d.getElementById("rapport").textContent.includes("Plan électrique") && d.querySelector("#rapport svg .plan-piece"), "PDF du plan préparé");
  }
  clic(d.getElementById("retour-plan"));
  await attendre(300);
  verifier(d.getElementById("resume-plan").textContent.includes("2 pièce(s)"), "Plan enregistré avec le chantier");
  clic(d.getElementById("ouvrir-plan"));
  clic(d.getElementById("plan-vers-tableau"));
  verifier(d.getElementById("calculs").classList.contains("actif") && d.getElementById("t-chambres").value === "1" && d.getElementById("t-ll").checked, "Plan → générateur de tableau prérempli (1 chambre, lave-linge)");
  verifier(d.getElementById("resultat-tableau").textContent.includes("Différentiel"), "Tableau généré depuis le plan");
  clic(d.querySelector('nav button[data-onglet="chantiers"]'));
  clic(d.getElementById("retour-plan"));
  await attendre(300);
  clic(d.getElementById("retour-chantiers"));
  await attendre(300);

  // Suppression en deux appuis
  clic(d.querySelector("#liste-chantiers .resultat-recherche"));
  await attendre(300);
  const sup = d.getElementById("supprimer-chantier");
  clic(sup);
  verifier(sup.textContent.includes("Touche encore"), "1er appui : demande de confirmation");
  clic(sup);
  await attendre(300);
  verifier(d.getElementById("liste-chantiers").textContent.includes("Aucun chantier"), "2e appui : chantier supprimé");

  // Onglet Plan
  clic(d.querySelector('nav button[data-onglet="plans"]'));
  await attendre(300);
  verifier(d.getElementById("plans").classList.contains("actif") && d.getElementById("liste-plans").textContent.includes("Aucun plan"), "Onglet Plan : liste vide");
  clic(d.getElementById("nouveau-plan"));
  await attendre(300);
  verifier(d.getElementById("plans").contains(d.getElementById("vue-plan")) && !d.getElementById("vue-plan").hidden, "Nouveau plan ouvert dans l'onglet Plan");
  verifier(d.getElementById("retour-plan").textContent.includes("Tous les plans"), "Bouton retour vers la liste des plans");
  saisir(d.getElementById("plan-nom"), "Plan Test");
  w.eval(`plan.pieces.push({ id: "p1", type: "chambre", nom: "", x: 1, y: 1, w: 3, h: 3 }); changement();`);
  clic(d.getElementById("retour-plan"));
  await attendre(400);
  verifier(d.getElementById("liste-plans").textContent.includes("Plan Test") && d.getElementById("liste-plans").textContent.includes("1 pièce(s)"), "Plan enregistré et listé dans l'onglet Plan");
  clic(d.querySelector('nav button[data-onglet="chantiers"]'));
  await attendre(300);
  verifier(d.getElementById("liste-chantiers").textContent.includes("Plan Test"), "Le plan apparaît aussi dans Chantiers");
  clic(d.querySelector("#liste-chantiers .resultat-recherche"));
  await attendre(300);
  clic(d.getElementById("ouvrir-plan"));
  await attendre(300);
  verifier(d.getElementById("chantiers").contains(d.getElementById("vue-plan")) && !d.getElementById("vue-plan").hidden, "Le plan s'ouvre aussi depuis le chantier");
  verifier(!d.getElementById("vue-liste-plans").hidden, "L'onglet Plan revient à sa liste");
  clic(d.getElementById("retour-plan"));
  await attendre(300);
  verifier(!d.getElementById("vue-chantier").hidden, "Retour au chantier depuis le plan");

  // Bouton avis : caché tant que le lien n'est pas réglé
  verifier(d.getElementById("bloc-avis").hidden === !w.VOLTGUIDE_CONFIG.lienAvis, "Bouton « Donner mon avis » " + (w.VOLTGUIDE_CONFIG.lienAvis ? "visible" : "caché (pas encore de lien)"));

  // Check-list Consuel dans le chantier (le chantier « Plan Test » est ouvert)
  verifier(d.querySelectorAll("#carte-checklist .point").length > 15, "Check-list Consuel dans le chantier");
  const premiere = d.querySelector("#carte-checklist .point input");
  premiere.checked = true; premiere.dispatchEvent(new w.Event("change"));
  verifier(/^1\//.test(d.getElementById("progression-courte").textContent), "Case cochée → 1 point vérifié");
  verifier(!d.querySelector('nav button[data-onglet="checklist"]'), "Plus d'onglet Check-list dans la barre");

  // Gammes d'appareillage
  clic(d.querySelector('nav button[data-onglet="gammes"]'));
  verifier(d.querySelectorAll("#liste-gammes .gamme").length === 11, "11 gammes affichées");
  clic(d.querySelector('#filtres-gammes [data-marque="Hager"]'));
  verifier(d.querySelectorAll("#liste-gammes .gamme").length === 2, "Filtre Hager → 2 gammes");
  clic(d.querySelector('#filtres-gammes [data-marque="Toutes"]'));
  clic(d.querySelector('nav button[data-onglet="chantiers"]'));
  clic(d.getElementById("choisir-gamme"));
  verifier(d.getElementById("gammes").classList.contains("actif") && !d.getElementById("bandeau-choix").hidden, "Choix de gamme ouvert depuis le chantier");
  clic(d.querySelector('[data-gamme="schneider-odace"][data-finition="2"]'));
  verifier(d.querySelector("#gamme-schneider-odace .finition-nom").textContent === "Laiton", "Finition Laiton affichée");
  clic(d.querySelector('.choisir-gamme[data-gamme="schneider-odace"]'));
  await attendre(400);
  verifier(d.getElementById("resume-appareillage").textContent.includes("Schneider Odace · finition Laiton"), "Choix enregistré dans le chantier");
  verifier(d.getElementById("bandeau-choix").hidden, "Mode choix terminé");
  saisir(d.getElementById("recherche"), "ovalis");
  verifier(d.getElementById("resultats-recherche").textContent.includes("Schneider Ovalis"), "Recherche trouve les gammes");
  saisir(d.getElementById("recherche"), "");

  verifier(erreurs.length === 0, "Aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
  w.close();
})();
