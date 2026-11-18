self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const app = windows.find(client => new URL(client.url).origin === self.location.origin)
    if (app) {
      await app.focus()
      return
    }
    await self.clients.openWindow('/bills')
  })())
})
