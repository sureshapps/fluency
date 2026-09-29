const VERSION = 'fluency-v1';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const SPLASH = [
  'https://raw.githubusercontent.com/sureshapps/fluency/refs/heads/main/app_splashscreen.gif',
  'https://raw.githubusercontent.com/sureshapps/fluency/refs/heads/main/splash/splash7.webp'
];
const SHELL_FILES = [
  './', './index.html', './manifest.webmanifest',
  './icons/192.png', './icons/512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    await (await caches.open(SHELL)).addAll(SHELL_FILES);
    // cross-origin splash art: no-cors so it caches as opaque; failures shouldn't block install
    const rt = await caches.open(RUNTIME);
    await Promise.allSettled(SPLASH.map(u => rt.add(new Request(u, { mode: 'no-cors' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = [SHELL, RUNTIME];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages: network first, fall back to cached shell when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  // Splash art + same-origin assets: cache first, fill cache on miss
  if (SPLASH.includes(req.url) || url.origin === location.origin) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(SPLASH.includes(req.url) ? new Request(req, { mode: 'no-cors' }) : req);
      if (res.ok || res.type === 'opaque') (await caches.open(RUNTIME)).put(req, res.clone());
      return res;
    })());
  }
});
