self.addEventListener('install', event => {
  console.log('Service worker instalando...', event)
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
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

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('graphql-cache', 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queries')) {
        db.createObjectStore('queries', { keyPath: 'queryKey' });
      }
    };

    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

async function saveQueryToDB(queryKey, response) {
  const db = await openDatabase();
  const transaction = db.transaction('queries', 'readwrite');
  const store = transaction.objectStore('queries');
  store.put({ queryKey, response });
}

async function getQueryFromDB(queryKey) {
  const db = await openDatabase();
  const transaction = db.transaction('queries', 'readonly');
  const store = transaction.objectStore('queries');
  return new Promise((resolve, reject) => {
    const request = store.get(queryKey);
    request.onsuccess = () => resolve(request.result ? request.result.response : null);
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('fetch', event => {
  const url = 'http://localhost:3000/graphql';

  if (event.request.method === 'POST' && event.request.url === url) {
    event.respondWith(
      (async () => {
        const requestClone = event.request.clone();
        const requestBody = await requestClone.json();
        const queryKey = JSON.stringify(requestBody);

        const cachedResponse = await getQueryFromDB(queryKey);
        if (cachedResponse) {
          console.log('GraphQL response:', queryKey);
          return new Response(JSON.stringify(cachedResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const networkResponse = await fetch(event.request);
        const responseClone = await networkResponse.clone().json();

        await saveQueryToDB(queryKey, responseClone);
        console.log('Caching GraphQL response:', queryKey);

        return networkResponse;
      })()
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});