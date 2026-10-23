// =====================================================================
//  ONGLET GAMMES — showroom d'appareillage pour présenter au client
//  Depuis un chantier, on peut aussi enregistrer le choix du client.
// =====================================================================

const G = window.GAMMES;
let filtreMarque = "Toutes";
let modeChoix = false;            // true quand on choisit pour un chantier
const finitionVue = {};           // gamme → numéro de la finition affichée

// Couleur plus claire ou plus foncée, pour le relief du dessin
function nuance(hex, delta) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + delta));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}

// Dessin d'une plaque avec un interrupteur, dans la finition choisie
function apercuPlaque(g, f) {
  const sombre = parseInt(f.plaque.slice(1), 16) < 0x808080;
  const bord = sombre ? nuance(f.plaque, 40) : nuance(f.plaque, -40);
  const touche = sombre ? nuance(f.plaque, 18) : nuance(f.plaque, -12);
  const formes = {
    "carre": { x: 10, y: 10, w: 100, h: 100, r: 3, tx: 32, ty: 32, tw: 56, th: 56, tr: 3 },
    "carre-arrondi": { x: 10, y: 10, w: 100, h: 100, r: 18, tx: 32, ty: 32, tw: 56, th: 56, tr: 10 },
    "rectangle": { x: 18, y: 6, w: 84, h: 108, r: 8, tx: 36, ty: 30, tw: 48, th: 60, tr: 4 },
    "ovale": { x: 10, y: 10, w: 100, h: 100, r: 14, tx: 30, ty: 36, tw: 60, th: 48, tr: 24 },
  };
  const p = formes[g.forme];
  return `<svg viewBox="0 0 120 120" class="apercu-plaque" role="img" aria-label="${g.nom}, finition ${f.nom}">
    <rect x="${p.x + 2}" y="${p.y + 3}" width="${p.w}" height="${p.h}" rx="${p.r}" fill="#000" opacity=".12"/>
    <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.r}" fill="${f.plaque}" stroke="${bord}" stroke-width="1.5"/>
    ${f.anneau ? `<rect x="${p.tx - 6}" y="${p.ty - 6}" width="${p.tw + 12}" height="${p.th + 12}" rx="${p.tr + 6}" fill="none" stroke="${f.anneau}" stroke-width="4"/>` : ""}
    <rect x="${p.tx}" y="${p.ty}" width="${p.tw}" height="${p.th}" rx="${p.tr}" fill="${touche}" stroke="${bord}" stroke-width="1"/>
    <line x1="${p.tx + 8}" y1="${p.ty + p.th / 2}" x2="${p.tx + p.tw - 8}" y2="${p.ty + p.th / 2}" stroke="${bord}" stroke-width="1" opacity=".6"/>
  </svg>`;
}

const prixHTML = (n) => `<span class="prix">${"€".repeat(n)}<span class="prix-vide">${"€".repeat(4 - n)}</span></span>`;

// Texte du lien vers le site officiel (Arnould fait partie du groupe Legrand)
function texteLien(g) {
  const site = g.marque === "Arnould" ? "Legrand" : g.marque;
  return g.lienGeneral ? `🔗 Voir le catalogue ${site}` : `🔗 Voir ${g.nom} sur le site ${site}`;
}

// ---------------------------------------------------------------------
//  Affichage
// ---------------------------------------------------------------------
function afficherGammes() {
  const marques = ["Toutes", ...new Set(G.map((g) => g.marque))];
  $("filtres-gammes").innerHTML = marques.map((m) =>
    `<button type="button" data-marque="${m}" class="${m === filtreMarque ? "actif" : ""}">${m}</button>`).join("");

  $("bandeau-choix").hidden = !modeChoix;
  if (modeChoix) $("choix-pour").textContent = chantierOuvert?.nom || "chantier sans nom";

  $("liste-gammes").innerHTML = G
    .filter((g) => filtreMarque === "Toutes" || g.marque === filtreMarque)
    .map((g) => {
      const i = finitionVue[g.id] || 0;
      const f = g.finitions[i];
      return `<article class="carte gamme" id="gamme-${g.id}">
        <div class="gamme-visuel">${apercuPlaque(g, f)}<p class="finition-nom">${f.nom}</p></div>
        <div class="gamme-infos">
          <p class="gamme-marque">${g.marque}</p>
          <h3>${g.nom}</h3>
          <p class="gamme-niveau">${prixHTML(g.prix)} ${NIVEAUX_PRIX[g.prix]}</p>
          <p>${g.description}</p>
          <div class="finitions" role="group" aria-label="Finitions">
            ${g.finitions.map((x, j) => `<button type="button" class="pastille-finition${j === i ? " actif" : ""}"
                data-gamme="${g.id}" data-finition="${j}" title="${x.nom}" aria-label="${x.nom}">
                <span style="background:${x.plaque}${x.anneau ? `; box-shadow: inset 0 0 0 4px ${x.anneau}` : ""}"></span></button>`).join("")}
          </div>
          <ul class="regles">${g.points.map((p) => `<li>${p}</li>`).join("")}</ul>
          <a class="lien-fabricant" href="${g.lien}" target="_blank" rel="noopener">${texteLien(g)}</a>
          ${modeChoix ? `<button type="button" class="principal choisir-gamme" data-gamme="${g.id}">✔ Choisir ${g.nom} ${f.nom.toLowerCase()}</button>` : ""}
        </div>
      </article>`;
    }).join("");
}

$("filtres-gammes").addEventListener("click", (e) => {
  const b = e.target.closest("[data-marque]");
  if (!b) return;
  filtreMarque = b.dataset.marque;
  afficherGammes();
});

$("liste-gammes").addEventListener("click", (e) => {
  const pastille = e.target.closest(".pastille-finition");
  if (pastille) {
    finitionVue[pastille.dataset.gamme] = Number(pastille.dataset.finition);
    afficherGammes();
    return;
  }
  const choisir = e.target.closest(".choisir-gamme");
  if (choisir) choisirGamme(G.find((g) => g.id === choisir.dataset.gamme));
});

// ---------------------------------------------------------------------
//  Choix du client pour un chantier
// ---------------------------------------------------------------------
function resumeAppareillage(c) {
  const a = c.appareillage;
  return a ? `${a.marque} ${a.gamme} · finition ${a.finition}` : "Pas encore choisi.";
}

function ouvrirChoixGamme() {
  modeChoix = true;
  const actuel = chantierOuvert.appareillage;
  if (actuel) {
    const g = G.find((x) => x.id === actuel.id);
    if (g) finitionVue[g.id] = Math.max(0, g.finitions.findIndex((f) => f.nom === actuel.finition));
  }
  allerOnglet("gammes");
  afficherGammes();
}

async function choisirGamme(g) {
  const f = g.finitions[finitionVue[g.id] || 0];
  chantierOuvert.appareillage = { id: g.id, marque: g.marque, gamme: g.nom, finition: f.nom };
  await sauverChantier(chantierOuvert);
  modeChoix = false;
  afficherGammes();
  allerOnglet("chantiers");
  ouvrirChantier(chantierOuvert.id);
}

$("annuler-choix").addEventListener("click", () => {
  modeChoix = false;
  afficherGammes();
  allerOnglet("chantiers");
});

$("choisir-gamme").addEventListener("click", ouvrirChoixGamme);

afficherGammes();
