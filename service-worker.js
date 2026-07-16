// =========================================================
// ÇİMENTO TEKNİK EĞİTİMLERİ — Service Worker
// Uygulama kabuğunu (app shell) önbelleğe alır, dokümanları
// önce ağdan, olmadığında önbellekten sunar.
// =========================================================
var CACHE_NAME = "cimento-pwa-v3";

var APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./data.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // Cache each file independently: if one file is missing/renamed,
      // the rest still get cached instead of the whole install failing.
      return Promise.all(
        APP_SHELL.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn("Önbelleğe alınamadı:", url, err);
          });
        })
      );
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  var url = new URL(event.request.url);
  var isIcon = url.pathname.indexOf("/icons/") !== -1;

  if (isIcon) {
    // Icons almost never change — cache-first is safe and fastest.
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
          return response;
        });
      })
    );
    return;
  }

  // Everything else — HTML, CSS, JS, manifest.json, data.json, docs/* —
  // is network-first. This guarantees that after every update, visitors
  // always get the current files instead of a stale mix of old/new
  // versions. The cache is only used as an offline fallback.
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        return response;
      })
      .catch(function () { return caches.match(event.request); })
  );
});
