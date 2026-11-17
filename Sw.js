/* MyFinance service worker.
 * Caches ONLY the static app shell listed below. It never touches IndexedDB and never caches
 * anything else (no API, no user data, no secrets: the app makes no network requests for data).
 * Update model: a new version installs in the background and WAITS; the page asks the user
 * (offering a backup first) and then sends SKIP_WAITING. Bump VERSION whenever any shell file changes. */
const VERSION = '1.1.0';
const PREFIX = 'myfinance-shell-';
const CACHE = PREFIX + VERSION;
// Relative to the SW location, so this works under https://<user>.github.io/My-finance-/
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== CACHE) await caches.delete(k); // old shells only
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'GET_VERSION' && e.source) e.source.postMessage({ type: 'VERSION', version: VERSION });
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;            // never intercept anything else
  if (r.mode === 'navigate') {                                              // app opens offline from the cached shell
    e.respondWith(caches.match('./index.html', { cacheName: CACHE }).then(m => m || fetch(r)));
    return;
  }
  e.respondWith(caches.match(r, { cacheName: CACHE, ignoreSearch: true }).then(m => m || fetch(r)));
});