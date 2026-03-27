// Versão do cache — incremente isso a cada deploy para forçar atualização
const CACHE_VERSION = 'eldorado-v3';
const CACHE_NAME = CACHE_VERSION;

// Ao instalar, limpa tudo e não faz cache de nada
self.addEventListener('install', e => {
  self.skipWaiting();
});

// Ao ativar, apaga TODOS os caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network First para tudo
// HTML e JS sempre busca da rede — nunca serve cache
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Arquivos HTML e JS: sempre da rede, sem cache
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() =>
        caches.match(e.request)
      )
    );
    return;
  }

  // APIs externas (cotação, Supabase): sempre rede
  if (url.hostname !== location.hostname) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Imagens e outros assets estáticos: cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
