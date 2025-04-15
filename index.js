// استيراد المكونات والأنماط
import '../css/main.css';
import { initializeApp } from 'firebase/app';
import { initAuth } from './components/auth';
import { initAuthUI } from './components/auth-ui';
import { initProfilePage } from './components/profile';
import { initDataStorage } from './components/data-storage';
import { initDataImport } from './components/data-import';
import { initOfflineSupport } from './components/offline-support';
import { registerServiceWorker } from './components/service-worker-registration';
import Chart from 'chart.js/auto';

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
  // تسجيل Service Worker
  registerServiceWorker();

  // مراقبة حالة الاتصال
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // تهيئة المصادقة
  initAuth();
  
  // تهيئة واجهة المصادقة
  initAuthUI();
  
  // تهيئة صفحة الملف الشخصي
  initProfilePage();
  
  // تهيئة تخزين البيانات
  initDataStorage();
  
  // تهيئة استيراد البيانات
  initDataImport();
  
  // تهيئة دعم العمل بدون اتصال
  initOfflineSupport();
  
  // إضافة مستمعي الأحداث الإضافية
  setupEventListeners();
});

// تحديث حالة الاتصال
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  const statusElement = document.getElementById('online-status');
  if (statusElement) {
    statusElement.className = isOnline ? 'online' : 'offline';
    statusElement.innerHTML = isOnline ? '<i class="fas fa-wifi"></i>' : '<i class="fas fa-wifi-slash"></i>';
  }
  
  if (isOnline) {
    showNotification('تم استعادة الاتصال بالإنترنت', 'success');
    syncOfflineData();
  } else {
    showNotification('أنت الآن في وضع عدم الاتصال', 'warning');
  }
}

// مزامنة البيانات المخزنة محلياً عند استعادة الاتصال
function syncOfflineData() {
  // سيتم تنفيذها لاحقاً
}

// إعداد مستمعي الأحداث الإضافية
function setupEventListeners() {
  // زر فتح/إغلاق القائمة الجانبية
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }
  
  // إغلاق القائمة الجانبية عند النقر خارجها
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebar && sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        e.target !== sidebarToggle) {
      sidebar.classList.remove('active');
    }
  });
  
  // زر استيراد البيانات
  const importDataBtn = document.getElementById('import-data-btn');
  if (importDataBtn) {
    importDataBtn.addEventListener('click', showImportDataDialog);
  }
}

// فتح/إغلاق القائمة الجانبية
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('active');
}

// عرض حوار استيراد البيانات
function showImportDataDialog() {
  // سيتم تنفيذها لاحقاً
  showNotification('سيتم تنفيذ هذه الميزة قريباً', 'info');
}

// عرض إشعار للمستخدم
function showNotification(message, type = 'success') {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-times-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    case 'info':
      icon = '<i class="fas fa-info-circle"></i>';
      break;
  }
  
  notification.innerHTML = `${icon} ${message}`;
  container.appendChild(notification);
  
  // إزالة الإشعار بعد 3 ثوانٍ
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      container.removeChild(notification);
    }, 300);
  }, 3000);
}

// تصدير الدوال العامة
window.showNotification = showNotification;
window.toggleSidebar = toggleSidebar;
