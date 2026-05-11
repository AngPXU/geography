// ─── Service Worker v3 ───────────────────────────────────────────────────────
// Chiến lược cache phân tầng:
//   • Static assets (icons, images, /cesium, /books PDFs): cache-first
//   • Pages (HTML): network-first, fallback offline page nếu mất mạng
//   • API + RSC + auth: KHÔNG cache (luôn lấy từ network để tránh data cũ /
//     cross-user leak / phiên bản build conflict)
// ────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v3';
const STATIC_CACHE  = `geo-static-${CACHE_VERSION}`;
const PAGES_CACHE   = `geo-pages-${CACHE_VERSION}`;

// Pre-cache shell + các shortcut từ manifest.json để vào nhanh khi install PWA.
const PRECACHE_URLS = [
  '/',
  '/login',
  '/map',
  '/arena',
  '/lessons',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// ─── Install: pre-cache shell ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {
        // Một số URL có thể fail (ví dụ /map cần auth) — bỏ qua, không break install
      })
    )
  );
  self.skipWaiting();
});

// ─── Activate: dọn cache cũ ──────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const allowlist = new Set([STATIC_CACHE, PAGES_CACHE]);
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => (allowlist.has(name) ? null : caches.delete(name))))
    ).then(() => self.clients.claim())
  );
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shouldBypass(request, url) {
  // Chỉ xử lý GET cùng origin
  if (request.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true;

  // Không cache API, auth callbacks, RSC payloads, build-id chunks động
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname.startsWith('/_next/data/')) return true;
  if (url.searchParams.has('_rsc')) return true;
  if (request.headers.get('rsc') || request.headers.get('Next-Router-State-Tree')) return true;

  return false;
}

function isStaticAsset(url) {
  const p = url.pathname;
  return (
    p.startsWith('/_next/static/') ||
    p.startsWith('/cesium/') ||
    p.startsWith('/books/') ||
    p.startsWith('/uploads/') ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|woff2?|ttf|otf|json|geojson|pdf)$/i.test(p)
  );
}

// ─── Fetch handler ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (shouldBypass(event.request, url)) return; // mặc định để browser xử lý

  // Static assets → cache-first (immutable, rất an toàn)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // HTML pages → network-first, fallback cache nếu offline
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  );
});