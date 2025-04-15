// مكون تسجيل Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker تم تسجيله بنجاح:', registration.scope);
          
          // التحقق من وجود تحديثات
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('تم العثور على تحديث للـ ServiceWorker');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // يوجد تحديث جديد، إظهار إشعار للمستخدم
                showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.error('فشل تسجيل ServiceWorker:', error);
        });
      
      // التعامل مع رسائل من Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('تم تحديث ذاكرة التخزين المؤقت');
        }
      });
    });
  }
}

// إظهار إشعار بوجود تحديث
function showUpdateNotification() {
  const updateNotification = document.createElement('div');
  updateNotification.className = 'update-notification';
  updateNotification.innerHTML = `
    <p>يوجد تحديث جديد للتطبيق</p>
    <button id="update-app-btn">تحديث الآن</button>
  `;
  
  document.body.appendChild(updateNotification);
  
  // إضافة مستمع حدث لزر التحديث
  document.getElementById('update-app-btn').addEventListener('click', () => {
    // إرسال رسالة إلى Service Worker لتخطي الانتظار
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    
    // إعادة تحميل الصفحة
    window.location.reload();
  });
}

// تحديث Service Worker
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
}
