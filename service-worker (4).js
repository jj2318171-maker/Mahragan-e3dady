// Service Worker بسيط لموقع مهرجان الكرازة
// الهدف الأساسي: تفعيل شرط "قابلية التثبيت" (installability) على أندرويد/كروم.
// مفيش كاش تخزين كبير هنا عشان بيانات الطلاب والمهام بتتحدث أول بأول من Google Sheets.

// ===== Firebase Cloud Messaging (إشعارات Push) =====
// نفس القيم اللي حطيتها في index.html بالظبط (بدّلها هنا كمان).
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDPSYDH-L1sbqrOlUvNGXaVh_r2Em5YNB8",
  authDomain: "mahragan-keraza.firebaseapp.com",
  projectId: "mahragan-keraza",
  storageBucket: "mahragan-keraza.firebasestorage.app",
  messagingSenderId: "249287476329",
  appId: "1:249287476329:web:2dfd0f5930d3b4ac6b4ef8"
});

try{
  const messaging = firebase.messaging();
  // بيتنادى لما تيجي رسالة والموقع مقفول/مش فاتح قدام المستخدم (background)
  messaging.onBackgroundMessage((payload) => {
    const n = payload.notification || {};
    self.registration.showNotification(n.title || 'مهرجان الكرازة', {
      body: n.body || '',
      icon: 'appicon.png',
      badge: 'appicon.png'
    });
  });
}catch(e){}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

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
