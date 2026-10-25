// =====================================================================
//  GÉNÉRATEUR DE TABLEAU ÉLECTRIQUE (logement)
//  À partir des pièces et des appareils, propose :
//  - la liste des circuits (section + disjoncteur)
//  - la répartition sur les interrupteurs différentiels
//  - la taille du coffret et la liste du matériel
// =====================================================================

const METRES_PAR_POINT = 4; // longueur moyenne ajoutée par prise ou point lumineux (m)

// Fabrique un circuit
const circuit = (nom, section, calibre, options = {}) => ({
  nom, section, calibre,
  typeA: false,     // doit être sur un différentiel de type A (ou F)
  plein: false,     // compte à 100 % dans la règle de l'aval (chauffage, chauffe-eau)
  points: 0,        // nombre de prises ou points lumineux
  ...options,
});

// Répartit un nombre d'éléments en paquets de taille max : 13 en paquets de 8 → [7, 6]
function repartir(total, max) {
  const paquets = Math.ceil(total / max);
  return Array.from({ length: paquets }, (_, i) =>
    Math.floor(total / paquets) + (i < total % paquets ? 1 : 0));
}

// ---------------------------------------------------------------------
//  Le calcul (sans affichage)
// ---------------------------------------------------------------------
function genererTableau(p) {
  const circuits = [];

  // --- Éclairage : 8 points max par circuit, au moins 2 circuits (sauf studio / T1)
  const pointsLumineux = 1 /* séjour */ + p.chambres + 1 /* cuisine */ + p.sdb + p.wc + 1 /* entrée */ + (p.exterieur ? 1 : 0);
  let paquetsLumiere = repartir(pointsLumineux, 8);
  if (paquetsLumiere.length < 2 && p.chambres > 0) paquetsLumiere = repartir(pointsLumineux, Math.ceil(pointsLumineux / 2));
  paquetsLumiere.forEach((n, i) =>
    circuits.push(circuit(`Éclairage ${i + 1}`, 1.5, 16, { points: n })));

  // --- Prises des pièces (hors cuisine) : 12 max par circuit en 2,5 mm² / 20 A
  const prises =
    prisesMinimum("sejour", p.surfaceSejour) + 2 /* multimédia */ +
    3 * p.chambres +
    prisesMinimum("entree", p.surfaceEntree) +
    p.sdb; // 1 prise hors volumes par salle de bain (conseillé)
  repartir(prises, 12).forEach((n, i) =>
    circuits.push(circuit(`Prises ${i + 1}`, 2.5, 20, { points: n })));

  // --- Prises de la cuisine : circuit dédié, 6 max
  repartir(prisesMinimum("cuisine", p.surfaceCuisine), 6).forEach((n, i, tab) =>
    circuits.push(circuit(`Prises cuisine${tab.length > 1 ? " " + (i + 1) : ""}`, 2.5, 20, { points: n })));

  // --- Circuits spécialisés
  if (p.plaque) circuits.push(circuit("Plaque de cuisson", 6, 32, { typeA: true }));
  if (p.four) circuits.push(circuit("Four", 2.5, 20));
  if (p.laveVaisselle) circuits.push(circuit("Lave-vaisselle", 2.5, 20));
  if (p.laveLinge) circuits.push(circuit("Lave-linge", 2.5, 20, { typeA: true }));
  if (p.secheLinge) circuits.push(circuit("Sèche-linge", 2.5, 20, { typeA: true }));
  if (p.congelateur) circuits.push(circuit("Congélateur", 2.5, 20));
  if (p.chauffeEau) circuits.push(circuit("Chauffe-eau (via contacteur HC)", 2.5, 20, { plein: true }));
  if (p.vmc) circuits.push(circuit("VMC", 1.5, 2));
  if (p.volets) circuits.push(circuit("Volets roulants", 1.5, 16));
  if (p.exterieur) circuits.push(circuit("Prises extérieures", 2.5, 20, { points: 2 }));

  // --- Chauffage électrique : circuits de 4 500 W max en 2,5 mm² / 20 A
  if (p.chauffage > 0) {
    const n = Math.ceil(p.chauffage / 4500);
    for (let i = 0; i < n; i++) circuits.push(circuit(`Chauffage ${i + 1}`, 2.5, 20, { plein: true }));
  }

  // --- Véhicule électrique
  if (p.vehicule === "prise") circuits.push(circuit("Prise renforcée véhicule", 2.5, 20, { typeA: true }));
  if (p.vehicule === "borne") circuits.push(circuit("Borne de recharge 7,4 kW", 10, 40, { typeA: true }));

  // --- Coffret de communication : circuit conseillé (la norme demande au moins 1 prise à côté)
  circuits.push(circuit("Coffret de communication (conseillé)", 1.5, 16));

  // --- Longueur de câble estimée pour chaque circuit
  circuits.forEach((c) => (c.longueur = p.distance + c.points * METRES_PAR_POINT));

  return completerTableau(circuits, p);
}

// Répartit des circuits déjà calculés sur les différentiels, dimensionne le coffret
// et compte le matériel. Sert au générateur et à la liste d'achat du plan.
// p : { surface (m²), chauffeEau (true/false) }
function completerTableau(circuits, p) {
  // -------------------------------------------------------------------
  //  Interrupteurs différentiels (NF C 15-100 version 2024)
  //  - au moins 2 par logement, dont au moins 1 de type A
  //  - 8 circuits maximum chacun
  //  - lave-linge, sèche-linge, plaque, recharge VE sur un type A
  //  - calibre par la règle de l'aval : 1 × (chauffage + chauffe-eau) + 0,5 × le reste
  // -------------------------------------------------------------------
  const differentiels = repartirSurDifferentiels(circuits);

  // -------------------------------------------------------------------
  //  Coffret : 1 module par disjoncteur, 2 par différentiel, + 20 % de réserve
  // -------------------------------------------------------------------
  const modulesUtilises = circuits.length + differentiels.length * 2 + (p.chauffeEau ? 2 : 0); // contacteur + disj. 2 A
  const modulesAvecReserve = Math.ceil(modulesUtilises * 1.2);
  const rangees = Math.ceil(modulesAvecReserve / 13);

  // -------------------------------------------------------------------
  //  Liste du matériel
  // -------------------------------------------------------------------
  const compter = (liste, cle) => liste.reduce((acc, x) => ((acc[cle(x)] = (acc[cle(x)] || 0) + 1), acc), {});
  const disjoncteurs = compter(circuits, (c) => c.calibre);
  const inter = compter(differentiels, (d) => `${d.calibre} A type ${d.type}`);
  const cables = {};
  circuits.forEach((c) => (cables[c.section] = (cables[c.section] || 0) + c.longueur));
  Object.keys(cables).forEach((s) => (cables[s] = Math.ceil((cables[s] * 1.1) / 10) * 10)); // +10 %, arrondi à 10 m

  return { circuits, differentiels, modulesUtilises, modulesAvecReserve, rangees, disjoncteurs, inter, cables };
}

// Charge d'un différentiel selon la règle de l'aval (en ampères)
const chargeAval = (liste) => liste.reduce((t, c) => t + (c.plein ? 1 : 0.5) * c.calibre, 0);

function repartirSurDifferentiels(circuits) {
  const max = R.circuitsMaxParDifferentiel;
  const calibres = R.differentiels.calibres;
  const circuitsA = circuits.filter((c) => c.typeA);
  const circuitsAC = circuits.filter((c) => !c.typeA);
  const nbA = Math.max(1, Math.ceil(circuitsA.length / max));
  let nbAC = Math.max(R.differentiels.minimum - nbA, Math.ceil(Math.max(0, circuitsAC.length - (nbA * max - circuitsA.length)) / max));

  // On place les plus gros circuits d'abord, chacun sur le différentiel le moins chargé
  const placer = (liste, cibles, tous) => {
    [...liste].sort((a, b) => (b.plein ? 1 : 0.5) * b.calibre - (a.plein ? 1 : 0.5) * a.calibre).forEach((c) => {
      let possibles = cibles.filter((d) => d.circuits.length < max);
      if (!possibles.length) possibles = tous.filter((d) => d.circuits.length < max);
      possibles.sort((a, b) => chargeAval(a.circuits) - chargeAval(b.circuits) || a.circuits.length - b.circuits.length)[0].circuits.push(c);
    });
  };

  // Si un différentiel dépasse 63 A, on en ajoute un et on recommence
  for (let essai = 0; essai < 10; essai++) {
    const ids = [
      ...Array.from({ length: nbA }, () => ({ type: "A", circuits: [] })),
      ...Array.from({ length: nbAC }, () => ({ type: "AC", circuits: [] })),
    ];
    placer(circuitsA, ids.filter((d) => d.type === "A"), ids);
    placer(circuitsAC, ids.filter((d) => d.type === "AC"), ids);
    ids.forEach((d) => {
      d.charge = chargeAval(d.circuits);
      d.calibre = calibres.find((c) => c >= d.charge) || calibres[calibres.length - 1];
    });
    if (ids.every((d) => d.charge <= calibres[calibres.length - 1])) return ids;
    nbAC++;
  }
}

// ---------------------------------------------------------------------
//  Lecture du formulaire et affichage
// ---------------------------------------------------------------------
function lireFormulaireTableau() {
  const nombre = (id) => parseFloat($(id).value) || 0;
  const coche = (id) => $(id).checked;
  return {
    surface: nombre("t-surface"),
    surfaceSejour: nombre("t-sejour"),
    chambres: nombre("t-chambres"),
    surfaceCuisine: nombre("t-cuisine"),
    sdb: nombre("t-sdb"),
    wc: nombre("t-wc"),
    surfaceEntree: nombre("t-entree"),
    distance: nombre("t-distance"),
    chauffage: nombre("t-chauffage"),
    vehicule: $("t-vehicule").value,
    plaque: coche("t-plaque"), four: coche("t-four"), laveVaisselle: coche("t-lv"),
    laveLinge: coche("t-ll"), secheLinge: coche("t-sl"), congelateur: coche("t-congel"),
    chauffeEau: coche("t-ce"), vmc: coche("t-vmc"), volets: coche("t-volets"), exterieur: coche("t-ext"),
  };
}

$("form-tableau").addEventListener("submit", (e) => {
  e.preventDefault();
  const t = genererTableau(lireFormulaireTableau());
  const sec = (s) => fr(s) + " mm²";

  const carteDifferentiel = (d, i) => `
    <div class="carte differentiel">
      <h3>Différentiel ${i + 1} : 30 mA ${d.calibre} A type ${d.type} <small>(charge ${fr(d.charge)} A)</small>
        <span class="compteur">${d.circuits.length}/${R.circuitsMaxParDifferentiel}</span></h3>
      <table><tbody>
        ${d.circuits.map((c) => `<tr>
            <td>${c.nom}${c.points ? ` <small>(${c.points} pts)</small>` : ""}</td>
            <td>${sec(c.section)}</td><td>${c.calibre} A</td></tr>`).join("")}
      </tbody></table>
    </div>`;

  // La norme demande au moins 3 circuits spécialisés 20 A par logement
  const f = lireFormulaireTableau();
  const specialises = [f.four, f.laveVaisselle, f.laveLinge, f.secheLinge, f.congelateur, f.chauffeEau].filter(Boolean).length;

  $("resultat-tableau").innerHTML = `
    <div class="carte resultat">
      <p><span class="chiffre">${t.circuits.length}</span> circuits ·
         <span class="chiffre">${t.differentiels.length}</span> différentiels</p>
      <p>Coffret : <strong>${t.rangees} rangée(s) de 13 modules</strong>
         (${t.modulesUtilises} modules utilisés, ${t.modulesAvecReserve} avec 20 % de réserve)</p>
      ${specialises < 3 ? `<p class="info">⚠️ La norme demande au moins 3 circuits spécialisés 20 A par logement (lave-linge, lave-vaisselle, four, congélateur, micro-ondes, chauffe-eau…). Ici : ${specialises}.</p>` : ""}
      <p class="source">Différentiels : au moins 2 dont 1 de type A, 8 circuits max chacun, calibre par la règle de l'aval (1 × chauffage et chauffe-eau + 0,5 × le reste).</p>
    </div>

    <h2>Répartition</h2>
    ${t.differentiels.map(carteDifferentiel).join("")}

    <h2>Liste du matériel</h2>
    <div class="carte">
      <h3>Interrupteurs différentiels 30 mA</h3>
      <ul class="regles">${Object.entries(t.inter).map(([k, n]) => `<li>${n} × ${k}</li>`).join("")}</ul>
      <h3>Disjoncteurs (phase + neutre)</h3>
      <ul class="regles">${Object.entries(t.disjoncteurs).sort((a, b) => a[0] - b[0])
        .map(([cal, n]) => `<li>${n} × ${cal} A</li>`).join("")}</ul>
      ${t.circuits.some((c) => c.nom.startsWith("Chauffe-eau"))
        ? `<h3>Chauffe-eau</h3><ul class="regles"><li>1 × contacteur jour/nuit 20 A</li><li>1 × disjoncteur 2 A (commande)</li></ul>` : ""}
      <h3>Câbles (estimation, +10 %)</h3>
      <ul class="regles">${Object.entries(t.cables).sort((a, b) => a[0] - b[0])
        .map(([s, m]) => `<li>≈ ${m} m en ${sec(parseFloat(s))} (câble 3G ou 3 fils sous gaine)</li>`).join("")}</ul>
      <p class="source">⚠️ Proposition à vérifier : contrôler le calibre des différentiels selon les circuits en aval
        (surtout avec une borne de recharge) et adapter les longueurs au chantier réel.</p>
    </div>
    ${IMPRESSION_POSSIBLE ? `<button type="button" class="secondaire" onclick="window.print()">🖨️ Imprimer / enregistrer en PDF</button>` : ""}`;

  $("resultat-tableau").scrollIntoView({ behavior: "smooth" });
});
