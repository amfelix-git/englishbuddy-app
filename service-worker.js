// Service Worker — estratégia cache-first, para a app funcionar offline depois da 1ª visita.
// Sobe a versão da cache sempre que os ficheiros pré-cacheados mudarem, para forçar atualização.
const NOME_CACHE = 'englishbuddy-v1';

const FICHEIROS_PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/db.js',
  './js/voice.js',
  './js/srs.js',
  './js/gamification.js',
  './js/sessions.js',
  './js/exercises.js',
  './js/ai-mode.js',
  './js/persona-frases.js',
  './js/placement-test.js',
  './icons/icon.svg',
  './content/basico/indice.json',
  './content/basico/sessoes-01-10.json',
  './content/basico/sessoes-11-20.json',
  './content/basico/sessoes-21-30.json',
  './content/basico/sessoes-31-40.json',
  './content/basico/sessoes-41-50.json',
  './content/basico/sessoes-51-60.json',
  './content/basico/sessoes-61-70.json',
  './content/basico/sessoes-71-80.json',
  './content/basico/sessoes-81-90.json',
  './content/basico/sessoes-91-100.json',
  './content/basico/sessoes-101-110.json',
  './content/intermedio/indice.json',
  './content/intermedio/sessoes-01-10.json',
  './content/intermedio/sessoes-11-20.json',
  './content/intermedio/sessoes-21-30.json',
  './content/intermedio/sessoes-31-40.json',
  './content/intermedio/sessoes-41-50.json',
  './content/intermedio/sessoes-51-60.json',
  './content/intermedio/sessoes-61-70.json',
  './content/intermedio/sessoes-71-80.json',
  './content/intermedio/sessoes-81-90.json',
  './content/intermedio/sessoes-91-100.json',
  './content/intermedio/sessoes-101-110.json',
  './content/intermedio/sessoes-111-120.json',
  './content/intermedio/sessoes-121-130.json',
  './content/intermedio/sessoes-131-140.json',
  './content/especialista/indice.json',
  './content/especialista/sessoes-01-10.json',
  './content/especialista/sessoes-11-20.json',
  './content/especialista/sessoes-21-30.json',
  './content/especialista/sessoes-31-40.json',
  './content/especialista/sessoes-41-50.json',
  './content/especialista/sessoes-51-60.json',
  './content/especialista/sessoes-61-70.json',
  './content/especialista/sessoes-71-80.json',
  'https://unpkg.com/dexie@4.0.8/dist/dexie.min.js'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOME_CACHE).then((cache) => cache.addAll(FICHEIROS_PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) => Promise.all(
      chaves.filter((chave) => chave !== NOME_CACHE).map((chave) => caches.delete(chave))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => {
      if (respostaCache) return respostaCache;
      return fetch(evento.request).then((respostaRede) => {
        const copia = respostaRede.clone();
        caches.open(NOME_CACHE).then((cache) => cache.put(evento.request, copia)).catch(() => {});
        return respostaRede;
      }).catch(() => respostaCache);
    })
  );
});
