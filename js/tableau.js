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
  typeA: false,     // doit être sur un différentiel de type A
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

  // --- Éclairage : 8 points max par circuit
  const pointsLumineux = 1 /* séjour */ + p.chambres + 1 /* cuisine */ + p.sdb + p.wc + 1 /* entrée */ + (p.exterieur ? 1 : 0);
  repartir(pointsLumineux, 8).forEach((n, i) =>
    circuits.push(circuit(`Éclairage ${i + 1}`, 1.5, 16, { points: n })));

  // --- Prises des pièces (hors cuisine) : 8 max par circuit en 2,5 mm²
  const prises =
    prisesMinimum("sejour", p.surfaceSejour) +
    3 * p.chambres +
    prisesMinimum("entree", p.surfaceEntree) +
    p.sdb; // 1 prise hors volumes par salle de bain
  repartir(prises, 8).forEach((n, i) =>
    circuits.push(circuit(`Prises ${i + 1}`, 2.5, 20, { points: n })));

  // --- Prises de la cuisine : circuit dédié, 6 max
  repartir(prisesMinimum("cuisine", p.surfaceCuisine), 6).forEach((n, i, tab) =>
    circuits.push(circuit(`Prises cuisine${tab.length > 1 ? " " + (i + 1) : ""}`, 2.5, 20, { points: n })));

  // --- Circuits spécialisés
  if (p.plaque) circuits.push(circuit("Plaque de cuisson", 6, 32, { typeA: true }));
  if (p.four) circuits.push(circuit("Four", 2.5, 20));
  if (p.laveVaisselle) circuits.push(circuit("Lave-vaisselle", 2.5, 20));
  if (p.laveLinge) circuits.push(circuit("Lave-linge", 2.5, 20, { typeA: true }));
  if (p.secheLinge) circuits.push(circuit("Sèche-linge", 2.5, 20));
  if (p.congelateur) circuits.push(circuit("Congélateur", 2.5, 20));
  if (p.chauffeEau) circuits.push(circuit("Chauffe-eau (via contacteur HC)", 2.5, 20));
  if (p.vmc) circuits.push(circuit("VMC", 1.5, 2));
  if (p.volets) circuits.push(circuit("Volets roulants", 1.5, 16));
  if (p.exterieur) circuits.push(circuit("Prises extérieures", 2.5, 20, { points: 2 }));

  // --- Chauffage électrique : circuits de 4 500 W max en 2,5 mm² / 20 A
  if (p.chauffage > 0) {
    const n = Math.ceil(p.chauffage / 4500);
    for (let i = 0; i < n; i++) circuits.push(circuit(`Chauffage ${i + 1}`, 2.5, 20));
  }

  // --- Véhicule électrique
  if (p.vehicule === "prise") circuits.push(circuit("Prise renforcée véhicule", 2.5, 20, { typeA: true }));
  if (p.vehicule === "borne") circuits.push(circuit("Borne de recharge 7,4 kW", 10, 40, { typeA: true }));

  // --- Tableau de communication : toujours
  circuits.push(circuit("Tableau de communication", 1.5, 16));

  // --- Longueur de câble estimée pour chaque circuit
  circuits.forEach((c) => (c.longueur = p.distance + c.points * METRES_PAR_POINT));

  // -------------------------------------------------------------------
  //  Interrupteurs différentiels
  // -------------------------------------------------------------------
  const max = R.circuitsMaxParDifferentiel;
  const regle = R.differentiels.find((d) => p.surface <= d.surfaceMax);
  const circuitsA = circuits.filter((c) => c.typeA);
  const circuitsAC = circuits.filter((c) => !c.typeA);

  // Le tableau de la norme : 1 type A + (nombre - 1) type AC
  const nbA = Math.max(1, Math.ceil(circuitsA.length / max));
  let nbAC = regle.nombre - 1;
  // Ajoute des différentiels AC si 8 circuits max ne suffit pas
  while (nbAC * max + (nbA * max - circuitsA.length) < circuitsAC.length) nbAC++;

  const calibreAC = p.surface <= 35 ? 25 : 40;
  const differentiels = [
    ...Array.from({ length: nbA }, () => ({ type: "A", calibre: 40, circuits: [] })),
    ...Array.from({ length: nbAC }, (_, i) => ({ type: "AC", calibre: i === 0 ? calibreAC : 40, circuits: [] })),
  ];

  // Circuits de type A sur les différentiels A
  circuitsA.forEach((c, i) => differentiels[i % nbA].circuits.push(c));

  // Autres circuits répartis à tour de rôle (les éclairages sont ainsi sur des différentiels différents)
  const avecPlace = () => differentiels.filter((d) => d.circuits.length < max);
  let tour = 0;
  circuitsAC.forEach((c) => {
    const ac = avecPlace().filter((d) => d.type === "AC");
    const choix = ac.length ? ac : avecPlace(); // si les AC sont pleins, on complète les A
    choix[tour++ % choix.length].circuits.push(c);
  });

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
      <h3>Différentiel ${i + 1} : 30 mA ${d.calibre} A type ${d.type}
        <span class="compteur">${d.circuits.length}/${R.circuitsMaxParDifferentiel}</span></h3>
      <table><tbody>
        ${d.circuits.map((c) => `<tr>
            <td>${c.nom}${c.points ? ` <small>(${c.points} pts)</small>` : ""}</td>
            <td>${sec(c.section)}</td><td>${c.calibre} A</td></tr>`).join("")}
      </tbody></table>
    </div>`;

  $("resultat-tableau").innerHTML = `
    <div class="carte resultat">
      <p><span class="chiffre">${t.circuits.length}</span> circuits ·
         <span class="chiffre">${t.differentiels.length}</span> différentiels</p>
      <p>Coffret : <strong>${t.rangees} rangée(s) de 13 modules</strong>
         (${t.modulesUtilises} modules utilisés, ${t.modulesAvecReserve} avec 20 % de réserve)</p>
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
    <button type="button" class="secondaire" onclick="window.print()">🖨️ Imprimer / enregistrer en PDF</button>`;

  $("resultat-tableau").scrollIntoView({ behavior: "smooth" });
});
