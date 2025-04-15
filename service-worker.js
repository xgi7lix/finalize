// Service Worker
const CACHE_NAME = 'financial-app-v1';
const OFFLINE_URL = '/offline.html';

// الملفات التي سيتم تخزينها مسبقاً
const PRE_CACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/bundle.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('تثبيت Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تخزين الملفات الأساسية في ذاكرة التخزين المؤقت');
        return cache.addAll(PRE_CACHE_URLS);
      })
      .then(() => {
        // تنشيط Service Worker فوراً
        return self.skipWaiting();
      })
  );
});

// تنشيط Service Worker
self.addEventListener('activate', event => {
  console.log('تنشيط Service Worker...');
  
  // حذف ذاكرة التخزين المؤقت القديمة
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('حذف ذاكرة التخزين المؤقت القديمة:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // السيطرة على جميع العملاء فوراً
      return self.clients.claim();
    })
  );
});

// استراتيجية الشبكة أولاً، ثم ذاكرة التخزين المؤقت
self.addEventListener('fetch', event => {
  // تجاهل طلبات POST وطلبات Firebase
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('www.googleapis.com') ||
    event.request.url.includes('firebaseinstallations.googleapis.com')
  ) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // نسخ الاستجابة
        const responseClone = response.clone();
        
        // فتح ذاكرة التخزين المؤقت
        caches.open(CACHE_NAME)
          .then(cache => {
            // تخزين الاستجابة في ذاكرة التخزين المؤقت
            cache.put(event.request, responseClone);
          });
        
        return response;
      })
      .catch(() => {
        // في حالة فشل الاتصال، استخدام الإصدار المخزن مؤقتاً
        return caches.match(event.request)
          .then(cachedResponse => {
            // إذا كان الطلب موجوداً في ذاكرة التخزين المؤقت، إرجاعه
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // إذا كان الطلب لصفحة، إرجاع صفحة عدم الاتصال
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // إذا لم يكن الطلب موجوداً في ذاكرة التخزين المؤقت، إرجاع خطأ
            return new Response('حدث خطأ في الاتصال', {
              status: 503,
              statusText: 'خدمة غير متوفرة',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// استقبال رسائل من التطبيق
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
