// Minimal offline cache so the web app installs and opens without a connection (online rooms still need the network).
const C = 'clicque-v9';
const FILES = ['./', 'index.html', 'platform.js', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'vendor/supabase.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.allSettled(FILES.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
