self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('push', (e) => {
  let d = { title: 'Into-Me-I-See', body: 'You have a new notification', data: {} };
  try { if (e.data) d = e.data.json(); } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: d.data || {}
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.openWindow(url));
});
