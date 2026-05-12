const CACHE_STATIC = 'pastoral-static-v3'; // docx library - rarely changes
const CACHE_APP    = 'pastoral-app-v3';    // app files - change with updates

const STATIC_ASSETS = ['/docx.iife.js'];
const APP_ASSETS = [
  '/', '/index.html', '/style.css',
  '/data.js', '/app.js', '/export.js',
  '/plantnet.js', '/sw-register.js', '/manifest.json'
];

// Prefix paths with repo base
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');
const prefixed = urls => urls.map(u => BASE + u);

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(CACHE_STATIC).then(c =>
      Promise.allSettled(prefixed(STATIC_ASSETS).map(u => c.add(u)))
    ),
    caches.open(CACHE_APP).then(c =>
      Promise.allSettled(prefixed(APP_ASSETS).map(u => c.add(u)))
    )
  ]));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  const keep = [CACHE_STATIC, CACHE_APP];
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          const isStatic = STATIC_ASSETS.some(u => e.request.url.includes(u));
          const cacheName = isStatic ? CACHE_STATIC : CACHE_APP;
          caches.open(cacheName).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached || caches.match(BASE + '/index.html'));
    })
  );
});
