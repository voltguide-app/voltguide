// =====================================================================
//  ONGLET CHANTIERS — carnet de chantier
//  Les chantiers (avec leurs photos) sont rangés dans IndexedDB,
//  la base de données du navigateur, qui accepte beaucoup plus de
//  données que localStorage.
// =====================================================================

const SEUILS = {
  terre: 100,      // Ω max (logement)
  isolement: 1,    // MΩ min sous 500 V — à vérifier
};

// ---------------------------------------------------------------------
//  Petite couche d'accès à la base de données
// ---------------------------------------------------------------------
const base = new Promise((resolve, reject) => {
  const demande = indexedDB.open("voltguide", 1);
  demande.onupgradeneeded = () => demande.result.createObjectStore("chantiers", { keyPath: "id" });
  demande.onsuccess = () => resolve(demande.result);
  demande.onerror = () => reject(demande.error);
});

async function operation(mode, action) {
  const db = await base;
  return new Promise((resolve, reject) => {
    const store = db.transaction("chantiers", mode).objectStore("chantiers");
    const demande = action(store);
    demande.onsuccess = () => resolve(demande.result);
    demande.onerror = () => reject(demande.error);
  });
}
const listerChantiers = () => operation("readonly", (s) => s.getAll());
const lireChantier = (id) => operation("readonly", (s) => s.get(id));
const sauverChantier = (c) => operation("readwrite", (s) => s.put(c));
const effacerChantier = (id) => operation("readwrite", (s) => s.delete(id));

// ---------------------------------------------------------------------
//  Liste des chantiers
// ---------------------------------------------------------------------
async function afficherListeChantiers() {
  $("vue-chantier").hidden = true;
  if ($("chantiers").contains($("vue-plan"))) $("vue-plan").hidden = true;
  $("vue-liste-chantiers").hidden = false;
  const zone = $("liste-chantiers");

  let chantiers;
  try {
    chantiers = await listerChantiers();
  } catch {
    zone.innerHTML = `<p class="erreur">Impossible d'ouvrir la mémoire du navigateur (navigation privée ?).</p>`;
    return;
  }

  if (!chantiers.length) {
    zone.innerHTML = `<p class="intro">Aucun chantier pour l'instant.</p>`;
    return;
  }
  chantiers.sort((a, b) => b.date.localeCompare(a.date));
  zone.innerHTML = "";
  chantiers.forEach((c) => {
    const bouton = document.createElement("button");
    bouton.className = "carte resultat-recherche";
    bouton.innerHTML = `<strong>📋 ${echapper(c.nom || "Sans nom")}</strong>
      <span>${new Date(c.date).toLocaleDateString("fr-FR")}${c.client ? " · " + echapper(c.client) : ""}
      · ${c.photos.length} photo(s)</span>`;
    bouton.addEventListener("click", () => ouvrirChantier(c.id));
    zone.appendChild(bouton);
  });
}

// Crée un chantier vide et l'enregistre (aussi utilisé par l'onglet Plan)
async function creerChantier() {
  const chantier = {
    id: Date.now().toString(),
    nom: "", client: "", adresse: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    mesures: { terre: "", isolement: "", continuite: "" },
    differentiels: [{ nom: "Différentiel 1", ok: false }],
    photos: [],
  };
  await sauverChantier(chantier);
  return chantier;
}

// Toucher l'onglet Chantiers rafraîchit la liste (un plan a pu être créé dans l'onglet Plan)
document.querySelector('nav button[data-onglet="chantiers"]').addEventListener("click", () => {
  if (!$("vue-liste-chantiers").hidden) afficherListeChantiers();
});

$("nouveau-chantier").addEventListener("click", async () => {
  const chantier = await creerChantier();
  ouvrirChantier(chantier.id);
});

// ---------------------------------------------------------------------
//  Fiche d'un chantier
// ---------------------------------------------------------------------
let chantierOuvert = null;
let minuterie = null;

// Enregistre automatiquement, un instant après la dernière frappe
function sauverBientot() {
  clearTimeout(minuterie);
  minuterie = setTimeout(() => sauverChantier(chantierOuvert), 400);
}

async function ouvrirChantier(id) {
  chantierOuvert = await lireChantier(id);
  $("vue-liste-chantiers").hidden = true;
  if ($("chantiers").contains($("vue-plan"))) $("vue-plan").hidden = true;
  $("vue-chantier").hidden = false;
  $("resume-plan").textContent = resumePlan(chantierOuvert);

  // Champs texte simples : l'attribut data-champ donne le nom de la propriété
  document.querySelectorAll("#vue-chantier [data-champ]").forEach((champ) => {
    const [groupe, cle] = champ.dataset.champ.split(".");
    champ.value = cle ? chantierOuvert[groupe][cle] : chantierOuvert[groupe];
  });
  majVerdicts();
  afficherDifferentielsChantier();
  afficherPhotos();
  window.scrollTo(0, 0);
}

document.querySelectorAll("#vue-chantier [data-champ]").forEach((champ) => {
  champ.addEventListener("input", () => {
    const [groupe, cle] = champ.dataset.champ.split(".");
    if (cle) chantierOuvert[groupe][cle] = champ.value;
    else chantierOuvert[groupe] = champ.value;
    majVerdicts();
    sauverBientot();
  });
});

// Résultat conforme / non conforme sous chaque mesure
function verdicts(m) {
  const terre = parseFloat(m.terre), iso = parseFloat(m.isolement);
  return {
    terre: isNaN(terre) ? null : terre <= SEUILS.terre,
    isolement: isNaN(iso) ? null : iso >= SEUILS.isolement,
  };
}

function majVerdicts() {
  const v = verdicts(chantierOuvert.mesures);
  const texte = (ok, seuil) => ok === null ? "" :
    ok ? `<span class="ok">✔ Conforme (${seuil})</span>` : `<span class="erreur">✘ Non conforme (${seuil})</span>`;
  $("verdict-terre").innerHTML = texte(v.terre, `≤ ${SEUILS.terre} Ω`);
  $("verdict-isolement").innerHTML = texte(v.isolement, `≥ ${SEUILS.isolement} MΩ`);
}

// --- Test des différentiels
function afficherDifferentielsChantier() {
  const zone = $("chantier-differentiels");
  zone.innerHTML = "";
  chantierOuvert.differentiels.forEach((d, i) => {
    const ligne = document.createElement("div");
    ligne.className = "ligne-differentiel";
    ligne.innerHTML = `
      <input type="checkbox" ${d.ok ? "checked" : ""} aria-label="Test OK">
      <input type="text" value="${echapper(d.nom)}" aria-label="Nom du différentiel">
      <button type="button" class="petit-bouton" aria-label="Supprimer">✕</button>`;
    const [caseOk, nom, supprimer] = ligne.querySelectorAll("input, button");
    caseOk.addEventListener("change", () => { d.ok = caseOk.checked; sauverBientot(); });
    nom.addEventListener("input", () => { d.nom = nom.value; sauverBientot(); });
    supprimer.addEventListener("click", () => {
      chantierOuvert.differentiels.splice(i, 1);
      afficherDifferentielsChantier();
      sauverBientot();
    });
    zone.appendChild(ligne);
  });
}

$("ajouter-differentiel").addEventListener("click", () => {
  chantierOuvert.differentiels.push({ nom: `Différentiel ${chantierOuvert.differentiels.length + 1}`, ok: false });
  afficherDifferentielsChantier();
  sauverBientot();
});

// --- Photos : réduites (1280 px par défaut) pour ne pas remplir la mémoire
function reduirePhoto(fichier, tailleMax = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const echelle = Math.min(1, tailleMax / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * echelle);
      canvas.height = Math.round(img.height * echelle);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(fichier);
  });
}

$("ajouter-photo").addEventListener("change", async (e) => {
  const illisibles = [];
  for (const fichier of e.target.files) {
    try {
      chantierOuvert.photos.push({ image: await reduirePhoto(fichier), legende: "" });
    } catch {
      illisibles.push(fichier.name);
    }
  }
  $("message-photo").textContent = illisibles.length
    ? `Impossible de lire : ${illisibles.join(", ")}. Essaie une photo en JPEG ou PNG.`
    : "";
  e.target.value = "";
  afficherPhotos();
  sauverChantier(chantierOuvert);
});

function afficherPhotos() {
  const zone = $("chantier-photos");
  zone.innerHTML = "";
  chantierOuvert.photos.forEach((photo, i) => {
    const bloc = document.createElement("figure");
    bloc.className = "photo";
    bloc.innerHTML = `
      <img src="${photo.image}" alt="Photo ${i + 1}">
      <input type="text" placeholder="Légende" value="${echapper(photo.legende)}">
      <button type="button" class="petit-bouton" aria-label="Supprimer la photo">✕</button>`;
    bloc.querySelector("input").addEventListener("input", (e) => { photo.legende = e.target.value; sauverBientot(); });
    const supprimer = bloc.querySelector("button");
    supprimer.addEventListener("click", () =>
      confirmerAvant(supprimer, "Supprimer ?", () => {
        chantierOuvert.photos.splice(i, 1);
        afficherPhotos();
        sauverChantier(chantierOuvert);
      }));
    zone.appendChild(bloc);
  });
}

// --- Boutons du bas
$("retour-chantiers").addEventListener("click", async () => {
  clearTimeout(minuterie);
  await sauverChantier(chantierOuvert);
  afficherListeChantiers();
});

$("supprimer-chantier").addEventListener("click", (e) =>
  confirmerAvant(e.currentTarget, "Touche encore pour supprimer définitivement", async () => {
    clearTimeout(minuterie);
    await effacerChantier(chantierOuvert.id);
    afficherListeChantiers();
  }));

// ---------------------------------------------------------------------
//  Rapport imprimable (pas disponible quand l'app est sur une page Claude)
if (!IMPRESSION_POSSIBLE) $("rapport-chantier").hidden = true;

// ---------------------------------------------------------------------
//  Rapport imprimable (Imprimer → « Enregistrer au format PDF »)
// ---------------------------------------------------------------------
$("rapport-chantier").addEventListener("click", () => {
  const c = chantierOuvert;
  const v = verdicts(c.mesures);
  const etat = (ok) => ok === null ? "—" : ok ? "✔ Conforme" : "✘ Non conforme";
  const ligne = (nom, valeur, unite, ok) =>
    `<tr><td>${nom}</td><td>${valeur ? echapper(valeur) + " " + unite : "—"}</td><td>${ok === undefined ? "" : etat(ok)}</td></tr>`;

  $("rapport").innerHTML = `
    <h1>⚡ Rapport de chantier</h1>
    <p><strong>${echapper(c.nom || "Sans nom")}</strong><br>
      ${c.client ? "Client : " + echapper(c.client) + "<br>" : ""}
      ${c.adresse ? "Adresse : " + echapper(c.adresse) + "<br>" : ""}
      Date : ${new Date(c.date).toLocaleDateString("fr-FR")}</p>

    <h2>Mesures</h2>
    <table>
      <thead><tr><th>Mesure</th><th>Valeur</th><th>Résultat</th></tr></thead>
      <tbody>
        ${ligne("Résistance de terre", c.mesures.terre, "Ω", v.terre)}
        ${ligne("Isolement", c.mesures.isolement, "MΩ", v.isolement)}
        ${ligne("Continuité des conducteurs de protection", c.mesures.continuite, "Ω")}
      </tbody>
    </table>

    <h2>Test des différentiels</h2>
    <ul>${c.differentiels.map((d) => `<li>${d.ok ? "✔" : "✘"} ${echapper(d.nom)}</li>`).join("")}</ul>

    ${c.notes ? `<h2>Notes</h2><p class="notes">${echapper(c.notes)}</p>` : ""}

    ${c.photos.length ? `<h2>Photos</h2><div class="rapport-photos">
      ${c.photos.map((p) => `<figure><img src="${p.image}" alt=""><figcaption>${echapper(p.legende)}</figcaption></figure>`).join("")}
    </div>` : ""}

    <p class="source">Rapport généré avec VoltGuide le ${new Date().toLocaleDateString("fr-FR")}.</p>`;

  document.body.classList.add("impression-rapport");
  window.print();
});

window.addEventListener("afterprint", () => document.body.classList.remove("impression-rapport"));

afficherListeChantiers();
