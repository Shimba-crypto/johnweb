const CACHE = "johnweb-v4";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["/", "/manifest.json", "/icon.svg"])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Push notifications: show a native browser notification and open the app on click
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch {}
  const title = data.title || "JohnWeb";
  const options = {
    body: data.message || data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.link || "/" },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if (new URL(c.url).pathname === url) return c.focus(); }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API requests: always network (no stale data), EXCEPT offline paper bundles
  // which are network-first with a cached fallback so saved papers open without data
  if (url.pathname.startsWith("/api/")) {
    if (/^\/api\/papers\/[^/]+\/offline$/.test(url.pathname)) {
      e.respondWith(
        fetch(e.request)
          .then((res) => {
            if (res.ok) { const copy = res.clone(); caches.open("johnweb-offline-papers").then((c) => c.put(e.request, copy)); }
            return res;
          })
          .catch(() => caches.match(e.request).then((m) => m || Response.error()))
      );
    }
    return;
  }

  // Navigation (page loads): network-first, fall back to cached shell for offline
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("/", copy));
        return res;
      }).catch(() => caches.match("/"))
    );
    return;
  }

  // Hashed assets (immutable): cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }))
  );
});
