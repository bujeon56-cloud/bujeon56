self.addEventListener('push', event => {
  let payload;
  try {
    payload = event.data?.json();
  } catch {
    return;
  }
  if (!payload?.title || !payload?.body) return;
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: new URL('pwa-192x192.png', self.registration.scope).href,
    data: { attendanceNotice: true },
  }));
});

self.addEventListener('notificationclick', event => {
  if (!event.notification.data?.attendanceNotice) return;
  event.notification.close();
  const url = new URL('teacher/attendance', self.registration.scope).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window' });
    const existing = windows.find(client => client.url.startsWith(self.registration.scope));
    if (existing) {
      const navigated = await existing.navigate(url);
      if (navigated) return navigated.focus();
    }
    return self.clients.openWindow(url);
  })());
});
