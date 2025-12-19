// Service Worker for offline functionality
// This is a basic placeholder - will be enhanced when offline features are implemented

const CACHE_NAME = "grow-more-ams-v1";
const urlsToCache = [
  "/",
  "/students",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

