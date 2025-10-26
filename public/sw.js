const CACHE_NAME = 'imis-v1';
const ICON_URL = 'https://abqfbjpxlxxxqjzdpmij.supabase.co/storage/v1/object/public/app-assets/20250928_181524_0000.png';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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

self.addEventListener('push', (event) => {
  let data = { title: 'Into-Me-I-See', body: 'You have a new notification 💛', data: {} };

  try {
    if (event.data) data = event.data.json();
  } catch {
    data.body = event.data?.text() || data.body;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: ICON_URL,
      badge: ICON_URL,
      data: data.data || {},
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(targetUrl));
});
