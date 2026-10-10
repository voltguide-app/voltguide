// =====================================================================
//  CALCULATEUR D'ÉCLAIRAGE (lux) — méthode des lumens
//
//  Flux total à installer = Éclairement × Surface / (U × M)
//    U = facteur d'utilisation (dépend de la forme de la pièce et
//        de la couleur des murs / plafond)
//    M = facteur de maintenance (vieillissement + encrassement)
//
//  C'est une méthode simplifiée : pour une étude officielle,
//  utiliser un logiciel comme DIALux avec les fichiers du fabricant.
// =====================================================================

// Facteur d'utilisation approximatif selon l'indice du local K
// (luminaires à éclairage direct)
const INDICES_K = [0.6, 0.8, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5];
const FACTEURS_U = {
  claires:  [0.40, 0.47, 0.53, 0.58, 0.62, 0.67, 0.71, 0.73, 0.76, 0.78],
  moyennes: [0.34, 0.41, 0.46, 0.51, 0.55, 0.60, 0.64, 0.67, 0.70, 0.72],
  sombres:  [0.29, 0.36, 0.41, 0.46, 0.50, 0.55, 0.58, 0.61, 0.65, 0.67],
};

// Lit la valeur de U dans le tableau, en interpolant entre deux colonnes
function facteurUtilisation(k, parois) {
  const u = FACTEURS_U[parois];
  if (k <= INDICES_K[0]) return u[0];
  if (k >= INDICES_K[INDICES_K.length - 1]) return u[u.length - 1];
  const i = INDICES_K.findIndex((x) => x >= k);
  const t = (k - INDICES_K[i - 1]) / (INDICES_K[i] - INDICES_K[i - 1]);
  return u[i - 1] + t * (u[i] - u[i - 1]);
}

// Calcul pur (sans affichage)
function calculLux(p) {
  const surface = p.longueur * p.largeur;
  const hauteurUtile = Math.max(0.5, p.hauteur - p.planTravail);   // luminaire → plan de travail
  const k = surface / (hauteurUtile * (p.longueur + p.largeur));   // indice du local
  const u = facteurUtilisation(k, p.parois);

  const fluxTotal = (p.lux * surface) / (u * p.maintenance);
  const nombre = Math.max(1, Math.ceil(fluxTotal / p.fluxLuminaire));

  // Disposition en grille : on cherche le moins de luminaires possible,
  // avec des écarts à peu près égaux dans la longueur et dans la largeur
  let meilleur = null;
  for (let c = 1; c <= nombre; c++) {
    const r = Math.ceil(nombre / c);
    const ecarts = (p.longueur / c) / (p.largeur / r);
    const score = c * r * (1 + 0.5 * Math.abs(Math.log(ecarts)));
    if (!meilleur || score < meilleur.score) meilleur = { colonnes: c, rangees: r, score };
  }
  const { colonnes, rangees } = meilleur;
  const total = colonnes * rangees;

  const luxObtenus = (total * p.fluxLuminaire * u * p.maintenance) / surface;
  const ecartLongueur = p.longueur / colonnes;
  const ecartLargeur = p.largeur / rangees;

  return {
    surface, hauteurUtile, k, u, fluxTotal, nombre,
    colonnes, rangees, total, luxObtenus,
    ecartLongueur, ecartLargeur,
    puissance: total * p.puissanceLuminaire,
    // Règle pratique : écartement ≤ 1,5 × hauteur utile pour une lumière régulière
    uniformiteOk: Math.max(ecartLongueur, ecartLargeur) <= 1.5 * hauteurUtile,
  };
}

// ---------------------------------------------------------------------
//  Formulaire
// ---------------------------------------------------------------------
const VALEURS_PAR_DEFAUT = {
  logement: { flux: 800, puissance: 8 },      // spot / plafonnier LED
  pro: { flux: 3600, puissance: 30 },         // dalle LED 600 × 600
};

function remplirActivites() {
  const type = $("l-type").value;
  const liste = R.eclairement[type];
  $("l-activite").innerHTML = liste.map((a, i) => `<option value="${i}">${a.nom} — ${a.lux} lux</option>`).join("");
  $("l-flux").value = VALEURS_PAR_DEFAUT[type].flux;
  $("l-puissance").value = VALEURS_PAR_DEFAUT[type].puissance;
  majLuxVise();
}

function majLuxVise() {
  const activite = R.eclairement[$("l-type").value][$("l-activite").value];
  $("l-lux").value = activite.lux;
}

$("l-type").addEventListener("change", remplirActivites);
$("l-activite").addEventListener("change", majLuxVise);
remplirActivites();

$("form-lux").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = (id) => parseFloat($(id).value) || 0;
  const type = $("l-type").value;
  const activite = R.eclairement[type][$("l-activite").value];

  const p = {
    longueur: nombre("l-longueur"), largeur: nombre("l-largeur"),
    hauteur: nombre("l-hauteur"), planTravail: nombre("l-plan"),
    lux: nombre("l-lux"), parois: $("l-parois").value,
    maintenance: nombre("l-maintenance"),
    fluxLuminaire: nombre("l-flux"), puissanceLuminaire: nombre("l-puissance"),
  };
  const r = calculLux(p);

  // Vérification du minimum du Code du travail (locaux professionnels)
  let minimumHTML = "";
  if (type === "pro") {
    const ok = r.luxObtenus >= activite.minimum;
    minimumHTML = `<p class="${ok ? "ok" : "erreur"}">${ok ? "✔" : "✘"} Minimum du Code du travail : ${activite.minimum} lux</p>`;
  }

  $("resultat-lux").innerHTML = `
    <div class="carte resultat">
      <p>Luminaires : <span class="chiffre">${r.total}</span>
        (${r.colonnes} × ${r.rangees}${r.total > r.nombre ? `, ${r.nombre} au minimum` : ""})</p>
      <p>Éclairement obtenu : <span class="chiffre">${fr(r.luxObtenus, 0)} lux</span>
        <small>(visé : ${p.lux} lux)</small></p>
      ${minimumHTML}
      <p>Puissance : <strong>${fr(r.puissance, 0)} W</strong> soit ${fr(r.puissance / r.surface)} W/m²</p>
      <p>Flux total nécessaire : ${fr(r.fluxTotal, 0)} lm</p>
      <h3>Implantation</h3>
      <p>${r.colonnes} luminaire(s) dans la longueur, tous les <strong>${fr(r.ecartLongueur, 2)} m</strong><br>
         ${r.rangees} rangée(s) dans la largeur, tous les <strong>${fr(r.ecartLargeur, 2)} m</strong><br>
         <small>Premier luminaire à la moitié de l'écart depuis le mur.</small></p>
      ${schemaImplantation(p.longueur, p.largeur, r.colonnes, r.rangees)}
      ${r.uniformiteOk ? "" : `<p class="info">⚠️ Luminaires très espacés par rapport à la hauteur : l'éclairage risque d'être irrégulier. Prends plus de luminaires moins puissants.</p>`}
      <p class="source">Méthode simplifiée (méthode des lumens). Surface ${fr(r.surface)} m² · indice du local K = ${fr(r.k, 2)} · facteur d'utilisation ≈ ${fr(r.u, 2)}.
        Pour une étude officielle, utiliser DIALux avec les données du fabricant.</p>
    </div>`;
});

// Petit plan vu de dessus avec la position des luminaires
function schemaImplantation(longueur, largeur, colonnes, rangees) {
  const W = 300, H = Math.max(80, Math.min(300, (W * largeur) / longueur));
  let points = "";
  for (let c = 0; c < colonnes; c++) {
    for (let r = 0; r < rangees; r++) {
      const x = ((c + 0.5) * W) / colonnes, y = ((r + 0.5) * H) / rangees;
      points += `<circle cx="${x + 10}" cy="${y + 10}" r="6" fill="#ffc400" stroke="currentColor"/>`;
    }
  }
  return `<div class="schema"><svg viewBox="0 0 ${W + 20} ${H + 40}" role="img" aria-label="Implantation des luminaires">
    <rect x="10" y="10" width="${W}" height="${H}" fill="none" stroke="currentColor" stroke-width="2"/>
    ${points}
    <text x="${10 + W / 2}" y="${H + 30}" text-anchor="middle">${fr(longueur)} m × ${fr(largeur)} m</text>
  </svg></div>`;
}
