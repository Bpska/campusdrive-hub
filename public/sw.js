self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Simple pass-through fetch listener required by PWA install criteria
  e.respondWith(fetch(e.request).catch(() => {
    return new Response("Offline mode. Please check your internet connection.");
  }));
});
