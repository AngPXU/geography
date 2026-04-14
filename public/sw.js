const CACHE_NAME = 'geography-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/login',
  '/manifest.json',
];

// Cài đặt service worker và cache tài nguyên
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Xóa cache cũ khi có version mới
self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Lấy tài nguyên từ cache (nếu có) khi offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // Fallback offline (Ví dụ: tuỳ chỉnh trang offline)
          // Có thể return caches.match('/offline') nếu định cài offline page
        });
      })
  );
});
