// =====================================================================
//  PLAN ÉLECTRIQUE — rattaché à un chantier
//
//  On dessine des pièces (rectangles) sur un quadrillage ou sur la photo
//  d'un plan, puis on pose les symboles. L'app vérifie la NF C 15-100
//  pièce par pièce, compte le matériel, peut préremplir le générateur
//  de tableau et sortir le plan en PDF.
//
//  Toutes les positions sont en mètres.
// =====================================================================

const SYM = window.SYMBOLES;
const symbole = (id) => SYM.find((s) => s.id === id);
const TYPES_PIECES = [...R.pieces.map((p) => ({ id: p.id, nom: p.nom })), { id: "autre", nom: "Autre" }];

const OUTILS = [
  { id: "naviguer", nom: "🖐️ Naviguer", aide: "Fais défiler le plan. Touche une pièce ou un symbole pour le modifier." },
  { id: "deplacer", nom: "✥ Déplacer", aide: "Fais glisser une pièce ou un symbole pour le déplacer." },
  { id: "piece", nom: "▭ Pièce", aide: "Fais glisser ton doigt pour dessiner une pièce." },
  { id: "echelle", nom: "📏 Échelle", aide: "Trace un trait sur une longueur que tu connais (un mur), puis entre sa vraie longueur." },
  ...SYM.map((s) => ({ id: "sym:" + s.id, nom: s.court, symbole: s, aide: `Touche le plan pour poser : ${s.nom}.` })),
];

let plan = null;        // plan du chantier ouvert
let outil = "naviguer";
let selection = null;   // id de la pièce ou du symbole sélectionné
let zoom = 1;
let historique = [];    // pour le bouton « Annuler »
let geste = null;       // dessin ou déplacement en cours
let traitEchelle = null; // trait tracé avec l'outil Échelle, en attente de sa vraie longueur

const nouvelId = () => Math.random().toString(36).slice(2, 9);
const arrondir = (v, pas) => Math.round(v / pas) * pas;
const borner = (v, min, max) => Math.min(max, Math.max(min, v));
const planVide = () => ({ image: null, ratio: null, largeur: 12, hauteur: 9, hauteurPlafond: 2.5, grille: true, pieces: [], symboles: [] });
const estPiece = (el) => el.w !== undefined;
const nomPiece = (p) => p.nom || TYPES_PIECES.find((t) => t.id === p.type).nom;

function trouver(id) {
  return plan.pieces.find((p) => p.id === id) || plan.symboles.find((s) => s.id === id);
}

// La pièce qui contient un symbole (la plus petite si elles se chevauchent)
function pieceDe(pl, s) {
  return pl.pieces
    .filter((p) => s.x >= p.x && s.x <= p.x + p.w && s.y >= p.y && s.y <= p.y + p.h)
    .sort((a, b) => a.w * a.h - b.w * b.h)[0] || null;
}

// ---------------------------------------------------------------------
//  Dessin du plan (SVG)
// ---------------------------------------------------------------------
function contenuSVG(pl, avecSelection) {
  let html = pl.image
    ? `<image href="${pl.image}" x="0" y="0" width="${pl.largeur}" height="${pl.hauteur}" preserveAspectRatio="none"/>`
    : `<rect width="${pl.largeur}" height="${pl.hauteur}" class="plan-fond"/>`;

  if (pl.grille) {
    for (let x = 0.5; x < pl.largeur; x += 0.5)
      html += `<line x1="${x}" y1="0" x2="${x}" y2="${pl.hauteur}" class="${x % 1 ? "grille-fine" : "grille"}"/>`;
    for (let y = 0.5; y < pl.hauteur; y += 0.5)
      html += `<line x1="0" y1="${y}" x2="${pl.largeur}" y2="${y}" class="${y % 1 ? "grille-fine" : "grille"}"/>`;
  }

  pl.pieces.forEach((p) => {
    const sel = avecSelection && p.id === selection ? " selection" : "";
    html += `<g data-id="${p.id}" class="plan-piece${sel}">
      <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/>
      <text x="${p.x + 0.12}" y="${p.y + 0.34}" font-size="0.26" class="piece-nom">${echapper(nomPiece(p))}</text>
      <text x="${p.x + 0.12}" y="${p.y + 0.62}" font-size="0.2" class="piece-surface">${fr(p.w * p.h)} m²</text>
    </g>`;
  });

  pl.symboles.forEach((s) => {
    const sel = avecSelection && s.id === selection ? " selection" : "";
    html += `<g data-id="${s.id}" transform="translate(${s.x} ${s.y})" class="plan-symbole${sel}">
      <circle r="0.3" class="zone-clic"/>${symbole(s.type).dessin(s)}</g>`;
  });

  const trait = geste?.type === "echelle" ? geste : traitEchelle;
  if (avecSelection && trait) {
    html += `<line x1="${trait.x0}" y1="${trait.y0}" x2="${trait.x1}" y2="${trait.y1}" class="trait-echelle"/>
      <circle cx="${trait.x0}" cy="${trait.y0}" r="0.1" class="bout-echelle"/><circle cx="${trait.x1}" cy="${trait.y1}" r="0.1" class="bout-echelle"/>`;
  }

  if (avecSelection && geste?.type === "dessin") {
    const x = Math.min(geste.x0, geste.x1), y = Math.min(geste.y0, geste.y1);
    html += `<rect x="${x}" y="${y}" width="${Math.abs(geste.x1 - geste.x0)}" height="${Math.abs(geste.y1 - geste.y0)}" class="apercu-piece"/>`;
  }
  return html;
}

function dessinerPlan() {
  const svg = $("svg-plan");
  svg.setAttribute("viewBox", `0 0 ${plan.largeur} ${plan.hauteur}`);
  svg.style.width = zoom * 100 + "%";
  svg.style.touchAction = outil === "naviguer" ? "auto" : "none";
  svg.innerHTML = contenuSVG(plan, true);
  $("plan-annuler").disabled = historique.length === 0;
}

// ---------------------------------------------------------------------
//  Barre d'outils
// ---------------------------------------------------------------------
function afficherOutils() {
  $("outils-plan").innerHTML = OUTILS.map((o) => `
    <button type="button" data-outil="${o.id}" class="${o.id === outil ? "actif" : ""}">
      ${o.symbole ? `<svg viewBox="-0.3 -0.32 0.6 0.6" class="mini-symbole" aria-hidden="true">${o.symbole.dessin({ repere: "" })}</svg>` : ""}${o.nom}
    </button>`).join("");
  $("aide-outil").textContent = OUTILS.find((o) => o.id === outil).aide;
}

$("outils-plan").addEventListener("click", (e) => {
  const bouton = e.target.closest("[data-outil]");
  if (!bouton) return;
  outil = bouton.dataset.outil;
  afficherOutils();
  dessinerPlan();
});

// ---------------------------------------------------------------------
//  Gestes sur le plan (souris, doigt ou stylet)
// ---------------------------------------------------------------------
function pointPlan(e) {
  const r = $("svg-plan").getBoundingClientRect();
  return {
    x: borner(((e.clientX - r.left) / r.width) * plan.largeur, 0, plan.largeur),
    y: borner(((e.clientY - r.top) / r.height) * plan.hauteur, 0, plan.hauteur),
  };
}

const svgPlan = $("svg-plan");

svgPlan.addEventListener("pointerdown", (e) => {
  if (!plan) return;
  const p = pointPlan(e);
  const cible = e.target.closest("[data-id]");

  if (outil === "naviguer") {
    geste = { type: "clic", id: cible?.dataset.id || null, cx: e.clientX, cy: e.clientY };
    return;
  }
  e.preventDefault();
  try { svgPlan.setPointerCapture(e.pointerId); } catch {}

  if (outil === "deplacer") {
    if (!cible) { selectionner(null); return; }
    const el = trouver(cible.dataset.id);
    memoriser();
    geste = { type: "deplacer", el, dx: p.x - el.x, dy: p.y - el.y, bouge: false };
    selectionner(el.id);
  } else if (outil === "piece") {
    const x = arrondir(p.x, 0.1), y = arrondir(p.y, 0.1);
    geste = { type: "dessin", x0: x, y0: y, x1: x, y1: y };
  } else if (outil === "echelle") {
    traitEchelle = null;
    geste = { type: "echelle", x0: p.x, y0: p.y, x1: p.x, y1: p.y };
  } else {
    ajouterSymbole(outil.slice(4), p.x, p.y);
  }
});

svgPlan.addEventListener("pointermove", (e) => {
  if (!geste || geste.type === "clic") return;
  const p = pointPlan(e);
  if (geste.type === "deplacer") {
    const el = geste.el, pas = estPiece(el) ? 0.1 : 0.05;
    el.x = borner(arrondir(p.x - geste.dx, pas), 0, plan.largeur - (el.w || 0));
    el.y = borner(arrondir(p.y - geste.dy, pas), 0, plan.hauteur - (el.h || 0));
    geste.bouge = true;
  } else if (geste.type === "dessin") {
    geste.x1 = arrondir(p.x, 0.1);
    geste.y1 = arrondir(p.y, 0.1);
  } else if (geste.type === "echelle") {
    geste.x1 = p.x;
    geste.y1 = p.y;
  }
  dessinerPlan();
});

svgPlan.addEventListener("pointerup", (e) => {
  if (!geste) return;
  const g = geste;
  geste = null;

  if (g.type === "clic") {
    if (Math.hypot(e.clientX - g.cx, e.clientY - g.cy) < 10) selectionner(g.id);
  } else if (g.type === "deplacer") {
    if (g.bouge) changement(); else historique.pop();
  } else if (g.type === "echelle") {
    if (Math.hypot(g.x1 - g.x0, g.y1 - g.y0) > 0.2) {
      traitEchelle = { x0: g.x0, y0: g.y0, x1: g.x1, y1: g.y1 };
      selection = null;
      afficherProprietes();
    }
  } else if (g.type === "dessin") {
    const w = Math.abs(g.x1 - g.x0), h = Math.abs(g.y1 - g.y0);
    if (w >= 0.5 && h >= 0.5) {
      memoriser();
      const piece = { id: nouvelId(), type: "autre", nom: "", x: Math.min(g.x0, g.x1), y: Math.min(g.y0, g.y1), w, h };
      plan.pieces.push(piece);
      selection = piece.id;
      changement();
      afficherProprietes();
    }
  }
  dessinerPlan();
});

svgPlan.addEventListener("pointercancel", () => { geste = null; dessinerPlan(); });

function ajouterSymbole(type, x, y) {
  memoriser();
  const s = { id: nouvelId(), type, x: arrondir(x, 0.05), y: arrondir(y, 0.05) };
  if (symbole(type).avecRepere) s.repere = "?";
  plan.symboles.push(s);
  selection = s.id;
  changement();
  afficherProprietes();
  return s;
}

function selectionner(id) {
  selection = id;
  dessinerPlan();
  afficherProprietes();
}

// Touche « Suppr » sur ordinateur
document.addEventListener("keydown", (e) => {
  if (!plan || $("vue-plan").hidden || !selection) return;
  if ((e.key === "Delete" || e.key === "Backspace") && !e.target.closest("input, select, textarea")) supprimerSelection();
});

function supprimerSelection() {
  memoriser();
  plan.pieces = plan.pieces.filter((p) => p.id !== selection);
  plan.symboles = plan.symboles.filter((s) => s.id !== selection);
  selection = null;
  changement();
  afficherProprietes();
}

// ---------------------------------------------------------------------
//  Annuler, enregistrer
// ---------------------------------------------------------------------
function memoriser() {
  const { image, ...sansImage } = plan; // l'image est lourde : on ne la copie pas
  historique.push(JSON.stringify(sansImage));
  if (historique.length > 50) historique.shift();
}

$("plan-annuler").addEventListener("click", () => {
  if (!historique.length) return;
  plan = { ...JSON.parse(historique.pop()), image: plan.image };
  chantierOuvert.plan = plan;
  selection = null;
  changement();
  afficherProprietes();
});

function changement() {
  dessinerPlan();
  afficherVerification();
  afficherListeAchat();
  chantierOuvert.plan = plan;
  sauverBientot();
}

// ---------------------------------------------------------------------
//  Panneau de la pièce ou du symbole sélectionné
// ---------------------------------------------------------------------
function afficherProprietes() {
  const zone = $("proprietes-plan");
  if (traitEchelle) {
    const actuelle = Math.hypot(traitEchelle.x1 - traitEchelle.x0, traitEchelle.y1 - traitEchelle.y0);
    zone.hidden = false;
    zone.innerHTML = `
      <h3>📏 Mettre le plan à l'échelle</h3>
      <p class="intro">Sur le plan, ce trait mesure actuellement <strong>${fr(actuelle, 2)} m</strong>.</p>
      <label>Sa vraie longueur (m) <input type="number" id="longueur-reelle" min="0.1" step="0.01" placeholder="ex. 4,20"></label>
      <button type="button" id="appliquer-echelle" class="principal">Appliquer l'échelle</button>
      <button type="button" id="annuler-echelle" class="secondaire">Annuler</button>`;
    $("appliquer-echelle").addEventListener("click", () => {
      const reelle = parseFloat($("longueur-reelle").value);
      if (!(reelle > 0)) { $("longueur-reelle").focus(); return; }
      mettreAEchelle(reelle / actuelle);
    });
    $("annuler-echelle").addEventListener("click", () => { traitEchelle = null; afficherProprietes(); dessinerPlan(); });
    return;
  }
  const el = selection && trouver(selection);
  if (!el) { zone.hidden = true; return; }
  zone.hidden = false;

  if (estPiece(el)) {
    zone.innerHTML = `
      <h3>Pièce</h3>
      <div class="deux-colonnes">
        <label>Type <select id="pp-type">${TYPES_PIECES.map((t) =>
          `<option value="${t.id}" ${t.id === el.type ? "selected" : ""}>${t.nom}</option>`).join("")}</select></label>
        <label>Nom affiché <input type="text" id="pp-nom" value="${echapper(el.nom)}" placeholder="${echapper(nomPiece({ ...el, nom: "" }))}"></label>
        <label>Longueur (m) <input type="number" id="pp-w" min="0.5" step="0.1" value="${el.w.toFixed(1)}"></label>
        <label>Largeur (m) <input type="number" id="pp-h" min="0.5" step="0.1" value="${el.h.toFixed(1)}"></label>
      </div>
      <p>Surface : <strong id="pp-surface">${fr(el.w * el.h)} m²</strong></p>
      <button type="button" id="pp-supprimer" class="secondaire danger">Supprimer la pièce</button>`;

    const modifier = (fn) => { memoriser(); fn(); changement(); $("pp-surface").textContent = fr(el.w * el.h) + " m²"; };
    $("pp-type").addEventListener("change", (e) => modifier(() => (el.type = e.target.value)));
    $("pp-nom").addEventListener("change", (e) => modifier(() => (el.nom = e.target.value.trim())));
    $("pp-w").addEventListener("change", (e) => modifier(() => (el.w = Math.max(0.5, parseFloat(e.target.value) || el.w))));
    $("pp-h").addEventListener("change", (e) => modifier(() => (el.h = Math.max(0.5, parseFloat(e.target.value) || el.h))));
  } else {
    const def = symbole(el.type);
    const piece = pieceDe(plan, el);
    zone.innerHTML = `
      <h3>${def.nom}</h3>
      <p class="intro">${piece ? "Dans : " + echapper(nomPiece(piece)) : "⚠️ En dehors de toute pièce"}</p>
      ${def.avecRepere ? `<label>Appareil <select id="ps-repere">
        <option value="?">À choisir…</option>
        ${REPERES_SPECIALISES.map((r) => `<option value="${r.code}" ${r.code === el.repere ? "selected" : ""}>${r.code} · ${r.nom}</option>`).join("")}
      </select></label>` : ""}
      <button type="button" id="pp-supprimer" class="secondaire danger">Supprimer</button>`;
    if (def.avecRepere) {
      $("ps-repere").addEventListener("change", (e) => { memoriser(); el.repere = e.target.value; changement(); });
    }
  }
  $("pp-supprimer").addEventListener("click", supprimerSelection);
}

// ---------------------------------------------------------------------
//  Vérification NF C 15-100 (calcul pur, réutilisable et testable)
// ---------------------------------------------------------------------
const PRISES_MINI = {
  sejour: (s) => prisesMinimum("sejour", s),
  cuisine: (s) => prisesMinimum("cuisine", s),
  entree: (s) => prisesMinimum("entree", s),
  chambre: () => 3,
};

function verifierPlan(pl) {
  const compter = (piece, types) =>
    pl.symboles.filter((s) => types.includes(s.type) && pieceDe(pl, s) === piece).length;

  const pieces = pl.pieces.map((p) => {
    const surface = p.w * p.h;
    const lignes = [];
    const mini = PRISES_MINI[p.type]?.(surface) || 0;
    if (mini) {
      const n = compter(p, ["prise"]);
      lignes.push({ ok: n >= mini, texte: `Prises 16 A : ${n} sur ${mini} minimum` });
    }
    if (!["exterieur", "autre"].includes(p.type)) {
      const n = compter(p, ["lumiere", "applique"]);
      lignes.push({ ok: n >= 1, texte: `Points lumineux : ${n} sur 1 minimum` });
    }
    if (["sejour", "chambre"].includes(p.type)) {
      const n = compter(p, ["rj45"]);
      lignes.push({ ok: n >= 1, texte: `Prises RJ45 : ${n} sur 1 minimum` });
    }
    if (p.type === "sdb") lignes.push({ ok: null, texte: "Vérifie que les prises sont hors des volumes 0, 1 et 2" });
    if (p.type === "autre") lignes.push({ ok: null, texte: "Choisis le type de pièce pour la vérifier" });
    return { piece: p, nom: nomPiece(p), surface, lignes };
  });

  const general = [
    { ok: pl.symboles.some((s) => s.type === "tableau"), texte: "Tableau électrique placé" },
    { ok: pl.symboles.some((s) => s.type === "daaf"), texte: "Au moins 1 détecteur de fumée (obligatoire en logement)" },
  ];
  const sansRepere = pl.symboles.filter((s) => s.type === "prise-specialisee" && (!s.repere || s.repere === "?")).length;
  if (sansRepere) general.push({ ok: false, texte: `${sansRepere} prise(s) spécialisée(s) sans appareil choisi` });
  const dehors = pl.symboles.filter((s) => s.type !== "tableau" && !pieceDe(pl, s)).length;
  if (dehors) general.push({ ok: null, texte: `${dehors} symbole(s) en dehors de toute pièce` });

  return { pieces, general };
}

const iconeEtat = (ok) => (ok === true ? "✔" : ok === false ? "✘" : "ℹ️");
const classeEtat = (ok) => (ok === true ? "ok" : ok === false ? "erreur" : "");

function verificationHTML(v) {
  if (!v.pieces.length) return `<p class="intro">Dessine une pièce avec l'outil ▭ Pièce pour commencer.</p>`;
  return v.pieces.map((r) => `
      <div class="verif-piece">
        <strong>${echapper(r.nom)}</strong> <small>${fr(r.surface)} m²</small>
        <ul>${r.lignes.map((l) => `<li class="${classeEtat(l.ok)}">${iconeEtat(l.ok)} ${l.texte}</li>`).join("")}</ul>
      </div>`).join("")
    + `<ul>${v.general.map((l) => `<li class="${classeEtat(l.ok)}">${iconeEtat(l.ok)} ${l.texte}</li>`).join("")}</ul>`;
}

function afficherVerification() {
  $("verif-plan").innerHTML = verificationHTML(verifierPlan(plan));
}

// ---------------------------------------------------------------------
//  Réglages : fond de plan, dimensions, quadrillage, zoom
// ---------------------------------------------------------------------
function afficherReglages() {
  $("plan-largeur").value = plan.largeur;
  $("plan-hauteur").value = plan.hauteur;
  $("plan-hauteur").disabled = !!plan.image;
  $("plan-grille").checked = plan.grille;
  $("plan-plafond").value = plan.hauteurPlafond;
  $("plan-retirer-fond").hidden = !plan.image;
}

$("plan-fond").addEventListener("change", async (e) => {
  const fichier = e.target.files[0];
  e.target.value = "";
  if (!fichier) return;
  try {
    const image = await reduirePhoto(fichier, 2000);
    const img = new Image();
    await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = image; });
    plan.image = image;
    plan.ratio = img.height / img.width;
    plan.hauteur = Math.round(plan.largeur * plan.ratio * 10) / 10;
    $("message-plan").textContent = "Plan importé. Règle la largeur réelle pour que les surfaces soient justes.";
  } catch {
    $("message-plan").textContent = "Impossible de lire cette image. Essaie une photo en JPEG ou PNG.";
  }
  afficherReglages();
  changement();
});

$("plan-retirer-fond").addEventListener("click", () => {
  plan.image = null;
  plan.ratio = null;
  afficherReglages();
  changement();
});

$("plan-largeur").addEventListener("change", (e) => {
  plan.largeur = Math.max(2, parseFloat(e.target.value) || plan.largeur);
  if (plan.ratio) plan.hauteur = Math.round(plan.largeur * plan.ratio * 10) / 10;
  afficherReglages();
  changement();
});

$("plan-hauteur").addEventListener("change", (e) => {
  plan.hauteur = Math.max(2, parseFloat(e.target.value) || plan.hauteur);
  afficherReglages();
  changement();
});

$("plan-grille").addEventListener("change", (e) => { plan.grille = e.target.checked; changement(); });

$("plan-plafond").addEventListener("change", (e) => {
  plan.hauteurPlafond = Math.max(2, parseFloat(e.target.value) || 2.5);
  afficherReglages();
  changement();
});

// Agrandit ou réduit tout le plan (pièces et symboles compris)
function mettreAEchelle(facteur) {
  memoriser();
  plan.largeur = Math.round(plan.largeur * facteur * 100) / 100;
  plan.hauteur = Math.round(plan.hauteur * facteur * 100) / 100;
  plan.pieces.forEach((p) => { p.x *= facteur; p.y *= facteur; p.w *= facteur; p.h *= facteur; });
  plan.symboles.forEach((s) => { s.x *= facteur; s.y *= facteur; });
  traitEchelle = null;
  outil = "naviguer";
  afficherOutils();
  afficherReglages();
  afficherProprietes();
  changement();
  $("message-plan").textContent = `✔ Plan mis à l'échelle : ${fr(plan.largeur, 2)} m × ${fr(plan.hauteur, 2)} m.`;
}

$("plan-zoom-plus").addEventListener("click", () => { zoom = Math.min(4, zoom * 1.5); dessinerPlan(); });
$("plan-zoom-moins").addEventListener("click", () => { zoom = Math.max(1, zoom / 1.5); dessinerPlan(); });

// ---------------------------------------------------------------------
//  Ouvrir / fermer le plan d'un chantier
// ---------------------------------------------------------------------
// depuis = "chantier" (bouton dans un chantier) ou "plans" (onglet Plan)
let origine = "chantier";

function ouvrirPlan(depuis = "chantier") {
  origine = depuis === "plans" ? "plans" : "chantier";
  // Le même écran d'édition sert aux deux onglets : on le place dans le bon
  const onglet = origine === "plans" ? "plans" : "chantiers";
  $(onglet).appendChild($("vue-plan"));
  if (origine === "plans") {
    $("vue-liste-plans").hidden = true;
    afficherListeChantiers(); // l'onglet Chantiers revient à sa liste
  } else {
    $("vue-chantier").hidden = true;
    afficherListePlans();      // l'onglet Plan revient à sa liste
  }
  $("retour-plan").textContent = origine === "plans" ? "← Tous les plans" : "← Retour au chantier";

  plan = chantierOuvert.plan || planVide();
  chantierOuvert.plan = plan;
  historique = [];
  selection = null;
  traitEchelle = null;
  outil = "naviguer";
  plan.hauteurPlafond = plan.hauteurPlafond || 2.5;
  $("message-liste").textContent = "";
  $("texte-liste").hidden = true;
  zoom = 1;
  $("vue-plan").hidden = false;
  $("plan-nom").value = chantierOuvert.nom || "";
  $("message-plan").textContent = "";
  afficherOutils();
  afficherReglages();
  dessinerPlan();
  afficherVerification();
  afficherListeAchat();
  afficherProprietes();
  window.scrollTo(0, 0);
}

$("ouvrir-plan").addEventListener("click", () => ouvrirPlan("chantier"));

// Nom du chantier, modifiable directement depuis le plan
$("plan-nom").addEventListener("input", (e) => {
  chantierOuvert.nom = e.target.value;
  sauverBientot();
});

$("retour-plan").addEventListener("click", async () => {
  clearTimeout(minuterie);
  await sauverChantier(chantierOuvert);
  plan = null;
  if (origine === "plans") afficherListePlans();
  else ouvrirChantier(chantierOuvert.id);
});

// ---------------------------------------------------------------------
//  Onglet Plan : liste des plans (un par chantier)
// ---------------------------------------------------------------------
async function afficherListePlans() {
  if ($("plans").contains($("vue-plan"))) $("vue-plan").hidden = true;
  $("vue-liste-plans").hidden = false;
  const zone = $("liste-plans");
  let chantiers;
  try {
    chantiers = await listerChantiers();
  } catch {
    zone.innerHTML = `<p class="erreur">Impossible d'ouvrir la mémoire du navigateur (navigation privée ?).</p>`;
    return;
  }
  if (!chantiers.length) {
    zone.innerHTML = `<p class="intro">Aucun plan pour l'instant. Touche « + Nouveau plan » pour commencer.</p>`;
    return;
  }
  chantiers.sort((a, b) => b.date.localeCompare(a.date));
  zone.innerHTML = "";
  chantiers.forEach((c) => {
    const bouton = document.createElement("button");
    bouton.className = "carte resultat-recherche";
    bouton.innerHTML = `<strong>📐 ${echapper(c.nom || "Sans nom")}</strong>
      <span>${new Date(c.date).toLocaleDateString("fr-FR")}${c.client ? " · " + echapper(c.client) : ""} · ${resumePlan(c)}</span>`;
    bouton.addEventListener("click", async () => {
      chantierOuvert = await lireChantier(c.id);
      ouvrirPlan("plans");
    });
    zone.appendChild(bouton);
  });
}

$("nouveau-plan").addEventListener("click", async () => {
  chantierOuvert = await creerChantier();
  ouvrirPlan("plans");
  $("plan-nom").focus();
});

// Toucher l'onglet Plan : on garde le plan ouvert s'il y en a un, sinon la liste
document.querySelector('nav button[data-onglet="plans"]').addEventListener("click", () => {
  if (!($("plans").contains($("vue-plan")) && !$("vue-plan").hidden)) afficherListePlans();
});

afficherListePlans();

// Résumé affiché sur la fiche du chantier
function resumePlan(c) {
  if (!c.plan || (!c.plan.pieces.length && !c.plan.symboles.length)) return "Aucun plan pour l'instant.";
  return `${c.plan.pieces.length} pièce(s) · ${c.plan.symboles.length} symbole(s)`;
}

// ---------------------------------------------------------------------
//  Préremplir le générateur de tableau à partir du plan
// ---------------------------------------------------------------------
$("plan-vers-tableau").addEventListener("click", () => {
  const de = (type) => plan.pieces.filter((p) => p.type === type);
  const surface = (type) => de(type).reduce((t, p) => t + p.w * p.h, 0);
  const reperes = new Set(plan.symboles.filter((s) => s.type === "prise-specialisee").map((s) => s.repere));
  const a = (type) => plan.symboles.some((s) => s.type === type);
  const ecrire = (id, v) => ($(id).value = v);
  const cocher = (id, v) => ($(id).checked = v);

  ecrire("t-surface", Math.max(1, Math.round(plan.pieces.reduce((t, p) => t + p.w * p.h, 0))));
  ecrire("t-sejour", Math.max(1, Math.round(surface("sejour"))));
  ecrire("t-cuisine", Math.max(1, Math.round(surface("cuisine"))));
  ecrire("t-entree", Math.round(surface("entree")));
  ecrire("t-chambres", de("chambre").length);
  ecrire("t-sdb", de("sdb").length);
  ecrire("t-wc", de("wc").length);
  cocher("t-plaque", reperes.has("P"));
  cocher("t-four", reperes.has("F"));
  cocher("t-lv", reperes.has("LV"));
  cocher("t-ll", reperes.has("LL"));
  cocher("t-sl", reperes.has("SL"));
  cocher("t-congel", reperes.has("CG"));
  cocher("t-ce", reperes.has("CE"));
  cocher("t-vmc", a("vmc"));
  cocher("t-volets", a("volet"));
  cocher("t-ext", de("exterieur").length > 0);
  if (reperes.has("VE")) ecrire("t-vehicule", "prise");

  ouvrirCalcul("calc-tableau");
  $("form-tableau").requestSubmit();
});

// ---------------------------------------------------------------------
//  Plan en PDF (Imprimer → « Enregistrer au format PDF »)
// ---------------------------------------------------------------------
if (!IMPRESSION_POSSIBLE) $("plan-pdf").hidden = true;

$("plan-pdf").addEventListener("click", () => {
  const c = chantierOuvert;
  const utilises = SYM.filter((s) => plan.symboles.some((x) => x.type === s.id));

  $("rapport").innerHTML = `
    <h1>⚡ Plan électrique</h1>
    <p><strong>${echapper(c.nom || "Sans nom")}</strong><br>
      ${c.client ? "Client : " + echapper(c.client) + "<br>" : ""}
      ${c.adresse ? "Adresse : " + echapper(c.adresse) + "<br>" : ""}
      Date : ${new Date(c.date).toLocaleDateString("fr-FR")}
      ${c.appareillage ? "<br>Appareillage : " + echapper(resumeAppareillage(c)) : ""}</p>
    <svg viewBox="0 0 ${plan.largeur} ${plan.hauteur}" class="plan-imprime">${contenuSVG(plan, false)}</svg>

    <h2>Légende</h2>
    <div class="legende-plan">${utilises.map((s) => `
      <span><svg viewBox="-0.3 -0.32 0.6 0.6" class="mini-symbole">${s.dessin({ repere: "" })}</svg> ${s.nom}</span>`).join("")}
      ${REPERES_SPECIALISES.filter((r) => plan.symboles.some((x) => x.repere === r.code))
        .map((r) => `<span><strong>${r.code}</strong> ${r.nom}</span>`).join("")}
    </div>

    <h2>Vérification NF C 15-100</h2>
    ${verificationHTML(verifierPlan(plan))}

    <h2>Liste du matériel</h2>
    ${listeAchatHTML()}

    <p class="source">Plan réalisé avec VoltGuide le ${new Date().toLocaleDateString("fr-FR")}.
      Vérification indicative : elle ne remplace pas la norme NF C 15-100.</p>`;

  document.body.classList.add("impression-rapport");
  window.print();
});
