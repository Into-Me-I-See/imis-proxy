const CACHE_NAME = "imis-v2";
const STATIC_RE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$/i;
const ALWAYS_NETWORK = new Set([
  "/", "/install", "/install/", "/install/index.html",
  "/app", "/app/", "/app/index.html",
  "/manifest.json", "/sw.js"
]);

self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const accept = req.headers.get("accept") || "";
  const isHTML = accept.includes("text/html");

  // Always bypass cache for our HTML routes and key files
  if (isSameOrigin && (isHTML || ALWAYS_NETWORK.has(url.pathname))) {
    event.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  // Stale-while-revalidate for static assets
  if (STATIC_RE.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // Default: network
  event.respondWith(fetch(req));
});

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {}
  const title = data.title || "Into-Me-I-See";
  const body  = data.body  || "You have a new notification.";
  const url   = data.url   || "/app";
  const icon  = data.icon  || "https://abqfbjpxlxxxqjzdpmij.supabase.co/storage/v1/object/public/app-assets/20250928_181524_0000.png";
  const badge = data.badge || icon;

  e.waitUntil(
    self.registration.showNotification(title, {
      body, icon, badge, data: { url }, requireInteraction: false
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/app";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        // Focus an existing tab if it’s already on our origin
        if (new URL(c.url).origin === self.location.origin) {
          c.postMessage({ type: "navigate", url });
          return c.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

