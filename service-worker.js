const CACHE_NAME = "bakim-egitimleri-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./data/trainings.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);

      // trainings.json içindeki tüm PDF dosyalarını da önbelleğe al
      try {
        const res = await fetch("./data/trainings.json");
        const data = await res.json();
        const pdfUrls = [];
        data.categories.forEach((cat) => {
          cat.trainings.forEach((t) => {
            pdfUrls.push(`./pdfs/${t.pdfFileName}`);
          });
        });
        await cache.addAll(pdfUrls);
      } catch (e) {
        // trainings.json henüz erişilemiyorsa sorun değil, sonraki fetch'lerde önbelleğe alınır
      }

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      self.clients.claim();
    })()
  );
});

// Cache-first strateji: önbellekte varsa oradan ver, yoksa ağdan çekip önbelleğe ekle
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const networkRes = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkRes.clone());
        return networkRes;
      } catch (e) {
        return cached || Response.error();
      }
    })()
  );
});
