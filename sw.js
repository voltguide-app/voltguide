// Service worker : garde une copie de l'application pour l'utiliser sans réseau.
// Changer le numéro de version force le téléphone à télécharger la nouvelle version.
const VERSION = "voltguide-v6";
const FICHIERS = [
  "./", "index.html", "style.css", "manifest.json",
  "icones/icone-192.png", "icones/icone-512.png", "icones/icone-apple.png",
  "data/regles.js", "data/schemas.js", "data/config.js",
  "js/commun.js", "js/pieces.js", "js/calculs.js", "js/tableau.js", "js/eclairage.js",
  "js/fiches.js", "js/chantiers.js", "js/checklist.js", "js/avis.js", "js/recherche.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FICHIERS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
  );
});

// Réseau d'abord (pour avoir les règles à jour), sinon la copie hors-ligne
self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(VERSION).then((cache) => cache.put(e.request, copie));
        return reponse;
      })
      .catch(() => caches.match(e.request))
  );
});
