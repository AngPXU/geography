const CACHE_NAME = 'geography-pwa-cache-v2';
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

self.addEventListener('fetch', (event) => {
  // Bỏ qua các request không phải GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cập nhật lại cache với dữ liệu mới từ mạng
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        // Fallback về cache nếu offline (hoặc mạng lỗi)
        return caches.match(event.request);
      })
  );
});
