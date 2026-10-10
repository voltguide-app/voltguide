// Service worker : garde une copie de l'application pour l'utiliser sans réseau.
// Changer le numéro de version force le téléphone à télécharger la nouvelle version.
const VERSION = "voltguide-v2";
const FICHIERS = ["./", "index.html", "style.css", "app.js", "data/regles.js", "manifest.json"];

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
