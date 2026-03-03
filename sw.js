const CACHE_NAME = 'upsc-hindi-v2';
const API_CACHE_NAME = 'upsc-api-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/js/main.js',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim clients for immediate control
      self.clients.claim()
    ])
  );
});

// Fetch event with advanced strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(API_CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // PDF files - Cache first, then network
  if (event.request.url.includes('.pdf')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // HTML pages - Network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }
  
  // Static assets - Cache first
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(response => {
        // Don't cache if not from same origin
        if (event.request.url.indexOf(self.location.origin) === 0) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  } else if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    dir: 'auto',
    lang: 'hi',
    tag: 'upsc-notification',
    renotify: true,
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification('UPSC हिन्दी माध्यम', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  }
});

// Periodic background sync (for daily updates)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-updates') {
    event.waitUntil(fetchDailyUpdates());
  }
});

// Handle share target
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/share-handler') && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const title = formData.get('title');
        const text = formData.get('text');
        const url = formData.get('url');
        
        // Save shared content for later
        saveSharedContent({ title, text, url });
        
        return Response.redirect('/notes/new', 303);
      })()
    );
  }
});

// Helper functions for background sync
async function syncNotes() {
  const cache = await caches.open('offline-notes');
  const requests = await cache.keys();
  // Process offline notes
  console.log('Syncing notes:', requests.length);
}

async function syncBookmarks() {
  // Sync bookmarks with server
  console.log('Syncing bookmarks...');
}

async function fetchDailyUpdates() {
  // Fetch daily current affairs and updates
  console.log('Fetching daily updates...');
}

async function saveSharedContent(content) {
  // Save shared content to IndexedDB
  console.log('Saving shared content:', content);
}
