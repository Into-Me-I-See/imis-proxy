self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { self.clients.claim(); });

self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch {}
  const title = data.title || 'Into-Me-I-See';
  const body  = data.body  || 'Tap to open';
  const url   = data.url   || '/Practice';
  const badge = data.badge || 1;

  e.waitUntil(self.registration.showNotification(title, {
    body,
    badge,
    icon: '/favicon.ico',
    data: { url }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification?.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
