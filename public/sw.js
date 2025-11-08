self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || 'Into-Me-I-See';
  const body  = data.body  || 'Tap to open';
  const url   = data.url   || '/';
  const badge = data.badge || 1;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      badge,
      data: { url }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.openWindow(url));
});
