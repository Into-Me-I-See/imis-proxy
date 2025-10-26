const CACHE_NAME = 'imis-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/favicon.ico'
  ) {
    return;
  }

  const qp = url.search ? url.search.slice(1) : '';
  const path = url.pathname || '/';
  const proxyURL = `/api/proxy?path=${encodeURIComponent(path)}${qp ? `&q=${encodeURIComponent(qp)}` : ''}`;

  event.respondWith(fetch(proxyURL, {
    method: 'GET',
    headers: {
      'accept': req.headers.get('accept') || '*/*',
      'cache-control': 'no-cache'
    }
  }));
});

self.addEventListener('push', (e) => {
  let d = { title: 'Into-Me-I-See', body: 'You have a new notification', data: {} };
  try { if (e.data) d = e.data.json(); } catch { d.body = e.data?.text() || d.body; }
  e.waitUntil(self.registration.showNotification(
    d.title,
    {
      body: d.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: d.data || {}
    }
  ));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.openWindow(url));
});
