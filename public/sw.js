const CACHE_NAME = "admitflow-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline shell");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip caching for API, sw.js, Vite HMR/dev assets, Chrome extensions, and non-GET requests
  if (
    e.request.method !== "GET" ||
    url.pathname === "/sw.js" ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/@id") ||
    url.pathname.startsWith("/@vite") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.endsWith(".tsx") ||
    url.searchParams.has("t") ||
    !e.request.url.startsWith(self.location.origin)
  ) {
    e.respondWith(
      fetch(e.request).catch(() => {
        if (url.pathname.startsWith("/api")) {
          return new Response(
            JSON.stringify({ error: "Offline: Network request failed." }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      })
    );
    return;
  }

  // Caching strategy: Network first with Cache fallback for navigations/assets
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache successful requests for assets/pages
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If it's a page navigation request and not in cache, return index page or custom offline message
          if (e.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline mode. Please check your internet connection.");
        });
      })
  );
});
