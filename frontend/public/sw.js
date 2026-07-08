const CACHE = 'barangayos-v1'
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-logo.png',
  '/standard-logo.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Only cache GET requests
  if (request.method !== 'GET') {
    e.respondWith(fetch(request).catch(() => new Response(null, { status: 503 })))
    return
  }

  // API calls — network first, fallback to cache
  if (url.pathname.startsWith('/api/') || url.port === '8090') {
    e.respondWith(
      fetch(request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE).then((c) => c.put(request, clone))
        return res
      }).catch(() => caches.match(request))
    )
    return
  }

  // Static assets — cache first
  e.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((res) => {
      const clone = res.clone()
      caches.open(CACHE).then((c) => c.put(request, clone))
      return res
    }))
  )
})
