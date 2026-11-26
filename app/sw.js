// Guarda a app no telemóvel para abrir sem rede. As consultas aos serviços (morada, camadas) precisam sempre de rede.
const VERSAO = 'conforme-0.1.0';
const BASE = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'js/main.js', 'js/config.js',
  'js/core/formato.js', 'js/core/armazem.js', 'js/core/legislacao.js', 'js/core/lisboa.js', 'js/core/planta.js',
  'data/legislacao.json', 'data/regras.json', 'data/exemplo.conforme.json', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin) {
    // rede primeiro (para receber actualizações), cópia guardada se não houver rede
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put(e.request, c)); return r; })));
  }
});
