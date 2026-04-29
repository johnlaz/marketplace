const CACHE = 'marketmaster-v3';
const ASSETS = ['./index.html', './manifest.json', './sw.js', './icon192.jpg', './icon512.jpg'];

// Install: cache all assets, activate immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete every old cache version, then take control
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for index.html (always get latest app),
// cache-first for everything else (icons, manifest, etc.)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHTML) {
    // Network-first: try to get fresh HTML, fall back to cache
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // Cache-first: serve from cache, fall back to network
    e.respondWith(
      caches.match(e.request)
        .then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
    );
  }
});
