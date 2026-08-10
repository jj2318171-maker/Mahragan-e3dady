// Service Worker بسيط لموقع مهرجان الكرازة
// الهدف الأساسي: تفعيل شرط "قابلية التثبيت" (installability) على أندرويد/كروم.
// مفيش كاش تخزين كبير هنا عشان بيانات الطلاب والمهام بتتحدث أول بأول من Google Sheets.

const CACHE_NAME = 'mahragan-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// استراتيجية Network First: يحاول ياخد أحدث نسخة من النت،
// ولو النت مقطوع يرجع للنسخة المخزنة (لصفحة الهيكل بس، مش بيانات API).
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // متلمسش طلبات الـ API بتاعة Google Apps Script / Sheets خالص، سيبها تروح للنت زي ما هي
  if (req.url.includes('script.google.com') || req.url.includes('docs.google.com')) {
    return;
  }

  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
