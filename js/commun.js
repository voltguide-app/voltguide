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
  texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Texte sans accents ni majuscules, pour la recherche
const normaliser = (texte) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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
