// Service worker : garde une copie de l'application pour l'utiliser sans réseau.
// Changer le numéro de version force le téléphone à télécharger la nouvelle version.
const VERSION = "voltguide-v14";
const FICHIERS = [
  "./", "index.html", "style.css", "manifest.json",
  "icones/icone-192.png", "icones/icone-512.png", "icones/icone-apple.png",
  "data/regles.js", "data/schemas.js", "data/config.js", "data/symboles.js", "data/gammes.js",
  "js/commun.js", "js/pieces.js", "js/calculs.js", "js/tableau.js", "js/eclairage.js",
  "js/fiches.js", "js/chantiers.js", "js/plan.js", "js/liste.js", "js/checklist.js", "js/gammes.js", "js/avis.js", "js/recherche.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FICHIERS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
  );
});

// Réseau d'abord (pour avoir les règles à jour), sinon la copie hors-ligne.
// « no-cache » oblige le navigateur à vérifier auprès du site s'il y a une nouvelle version.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request, { cache: "no-cache" })
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(VERSION).then((cache) => cache.put(e.request, copie));
        return reponse;
      })
      .catch(() => caches.match(e.request))
  );
});
