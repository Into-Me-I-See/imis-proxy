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

  if (isSameOrigin && (isHTML || ALWAYS_NETWORK.has(url.pathname))) {
    event.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetched = fetch(req).then((res) => {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })());
    return;
  }

  event.respondWith(fetch(req));
});

// ---- Push Notifications ----
const ICON_URL = "https://abqfbjpxlxxxqjzdpmij.supabase.co/storage/v1/object/public/app-assets/72x72%20white%20logo%20_transparent.png";
const BADGE_URL = ICON_URL;

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {}

  const title = data.title || "Into-Me-I-See";
  const body  = data.body  || "You have a new notification.";
  const targetUrl = data.url || "/app";

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: ICON_URL,   // ✅ defines the small top-left icon (replaces gray “P”)
      badge: BADGE_URL, // ✅ monochrome white icon for status bar
      data: { url: targetUrl, ...data }
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || "/app";

  e.waitUntil((async () => {
    const list = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (new URL(c.url).origin === self.location.origin) {
        try { c.postMessage({ type: "navigate", url: targetUrl }); } catch {}
        await c.focus();
        return;
      }
    }
    await clients.openWindow(targetUrl);
  })());
});
