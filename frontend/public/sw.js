// This service worker exists only to unregister any previously installed
// version (barangayos-v1). It does not cache anything.
// Once every client has unregistered, this file can be deleted.

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      // Delete all caches from the old SW
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('barangayos-')).map((k) => caches.delete(k)))
      ),
      // Unregister this SW — on the next navigation it will be gone
      self.registration.unregister(),
    ]).then(() => self.clients.claim())
  )
})

// Passthrough — handle every request by going directly to the network.
// This is only needed until the SW finishes activating above.
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => new Response(null, { status: 503 })))
})
