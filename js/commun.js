// =====================================================================
//  OUTILS COMMUNS — utilisés par tous les autres fichiers
// =====================================================================

const R = window.REGLES;
const S = window.SCHEMAS;

// Raccourci pour trouver un élément de la page par son id
const $ = (id) => document.getElementById(id);

// Affiche un nombre à la française : 2,5 au lieu de 2.5
const fr = (n, dec = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: dec });

// Transforme un titre en identifiant : "Indices IP" → "indices-ip"
const slug = (texte) =>
  texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Texte sans accents ni majuscules, pour la recherche
const normaliser = (texte) => texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Évite que du texte saisi par l'utilisateur soit interprété comme du HTML
const echapper = (texte) =>
  String(texte).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Lecture / écriture dans la mémoire du navigateur (sans planter si elle est bloquée)
function lireMemoire(cle, defaut) {
  try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; }
}
function ecrireMemoire(cle, valeur) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch {}
}

// Impression / PDF : impossible quand l'app est publiée sur une page Claude
const IMPRESSION_POSSIBLE = !window.VOLTGUIDE_SANS_IMPRESSION;

// Confirmation en deux temps : 1er appui → le bouton demande confirmation,
// 2e appui dans les 4 secondes → l'action est faite.
// (Les fenêtres confirm() ne fonctionnent pas partout.)
function confirmerAvant(bouton, texteConfirmation, action) {
  if (bouton.dataset.confirmer === "oui") {
    bouton.dataset.confirmer = "";
    action();
    return;
  }
  const texteInitial = bouton.textContent;
  bouton.dataset.confirmer = "oui";
  bouton.textContent = texteConfirmation;
  bouton.classList.add("a-confirmer");
  setTimeout(() => {
    bouton.dataset.confirmer = "";
    bouton.textContent = texteInitial;
    bouton.classList.remove("a-confirmer");
  }, 4000);
}

// Lignes d'un tableau de fiche : écrites directement, ou construites à partir des données
function lignesTableau(tableau) {
  const E = R.eclairement;
  const marque = (x) => (x.verifie ? "" : " (à vérifier)");
  switch (tableau.depuis) {
    case "circuits": return R.circuits.map((c) => [c.nom, c.section, c.protection, c.limite]);
    case "eclairement-code": return E.codeDuTravail;
    case "eclairement-pro": return E.pro.map((x) => [x.nom, `${x.lux} lux${marque(x)}`]);
    case "eclairement-logement": return E.logement.map((x) => [x.nom, `${x.lux} lux${x.note ? " · " + x.note : ""}`]);
    default: return tableau.lignes;
  }
}

// Ligne « Source » affichée sous chaque fiche, pièce ou schéma
function sourceHTML(element) {
  if (!element.source) return "";
  const date = new Date(element.maj || R.miseAJour).toLocaleDateString("fr-FR");
  const statut = element.verifie
    ? `<span class="badge ok-badge">✔ Vérifié</span>`
    : `<span class="badge alerte-badge">⚠️ À vérifier</span>`;
  return `<p class="source">📖 ${element.source} · mis à jour le ${date} ${statut}</p>`;
}

// ---------------------------------------------------------------------
//  Navigation entre les onglets
// ---------------------------------------------------------------------
function allerOnglet(nom) {
  document.querySelectorAll("nav button, .onglet").forEach((el) => el.classList.remove("actif"));
  document.querySelector(`nav button[data-onglet="${nom}"]`).classList.add("actif");
  $(nom).classList.add("actif");
  fermerRecherche();
  window.scrollTo(0, 0);
}

document.querySelectorAll("nav button").forEach((bouton) => {
  bouton.addEventListener("click", () => allerOnglet(bouton.dataset.onglet));
});

// ---------------------------------------------------------------------
//  Favoris (étoiles) — liste d'identifiants comme "fiche:indices-ip"
// ---------------------------------------------------------------------
let favoris = lireMemoire("voltguide-favoris", []);

const estFavori = (cle) => favoris.includes(cle);

function basculerFavori(cle) {
  favoris = estFavori(cle) ? favoris.filter((f) => f !== cle) : [...favoris, cle];
  ecrireMemoire("voltguide-favoris", favoris);
  document.querySelectorAll(`[data-favori="${cle}"]`).forEach(majEtoile);
  afficherFavoris();
}

function majEtoile(bouton) {
  const actif = estFavori(bouton.dataset.favori);
  bouton.textContent = actif ? "★" : "☆";
  bouton.classList.toggle("actif", actif);
  bouton.setAttribute("aria-label", actif ? "Retirer des favoris" : "Ajouter aux favoris");
}

// Bouton étoile à placer dans le HTML
const etoileHTML = (cle) => `<button type="button" class="etoile" data-favori="${cle}">☆</button>`;

// Un seul écouteur pour toutes les étoiles de la page
document.addEventListener("click", (e) => {
  const etoile = e.target.closest(".etoile");
  if (!etoile) return;
  e.preventDefault();      // évite d'ouvrir/fermer la fiche en même temps
  e.stopPropagation();
  basculerFavori(etoile.dataset.favori);
});

function activerEtoiles(conteneur) {
  conteneur.querySelectorAll(".etoile").forEach(majEtoile);
}

$("version").textContent = R.version;
$("maj").textContent = new Date(R.miseAJour).toLocaleDateString("fr-FR");
