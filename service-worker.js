const CACHE_NAME = 'eldorado-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // NUNCA interceptar: Supabase, APIs externas, autenticação
  if (
    url.hostname !== location.hostname ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/rest/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('awesomeapi')
  ) {
    return; // deixa o browser lidar normalmente
  }

  // Assets estáticos locais — cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
