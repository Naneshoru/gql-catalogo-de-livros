self.addEventListener('install', event => {
  console.log('Service worker instalando...', event)
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/script.js',
      ])
    }).catch(error => {
      console.error('Erro ao adicionar arquivos ao cache:', error);
      throw error;
    })
  )
})

self.addEventListener('fetch', event => {

  event.respondWith(

    caches.match(event.request).then(response => {
      if (response) {
        return response
      }

      return fetch(event.request).then(networkResponse => {
        
        return caches.open('v1').then(cache => {
          cache.put(event.request, networkResponse.clone())
          console.log(`Recurso armazenado no cache: ${event.request.url}`);
          return networkResponse
        }).catch(error => {
          console.error('Erro ao buscar o recurso:', error);
          throw error;
        })
      })
    })
  )
})