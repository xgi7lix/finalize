// مكون العمل بدون اتصال
import { getCurrentUser } from './auth';
import { getCurrentData } from './data-storage';

// متغيرات عامة
let offlineQueue = [];
let isOnline = navigator.onLine;

// تهيئة مكون العمل بدون اتصال
export function initOfflineSupport() {
  // تحميل قائمة الانتظار من التخزين المحلي
  loadOfflineQueue();
  
  // إضافة مستمعي أحداث الاتصال
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOfflineStatus);
  
  // التحقق من حالة الاتصال الحالية
  updateOnlineStatus();
}

// تحديث حالة الاتصال
function updateOnlineStatus() {
  isOnline = navigator.onLine;
  const statusElement = document.getElementById('online-status');
  
  if (statusElement) {
    statusElement.className = isOnline ? 'online' : 'offline';
    statusElement.innerHTML = isOnline ? '<i class="fas fa-wifi"></i>' : '<i class="fas fa-wifi-slash"></i>';
  }
}

// معالجة حالة الاتصال
function handleOnlineStatus() {
  isOnline = true;
  updateOnlineStatus();
  showNotification('تم استعادة الاتصال بالإنترنت', 'success');
  
  // مزامنة العمليات المعلقة
  syncOfflineQueue();
}

// معالجة حالة عدم الاتصال
function handleOfflineStatus() {
  isOnline = false;
  updateOnlineStatus();
  showNotification('أنت الآن في وضع عدم الاتصال', 'warning');
}

// تحميل قائمة الانتظار من التخزين المحلي
function loadOfflineQueue() {
  const queueData = localStorage.getItem('offlineQueue');
  if (queueData) {
    try {
      offlineQueue = JSON.parse(queueData);
    } catch (error) {
      console.error('خطأ في تحميل قائمة الانتظار:', error);
      offlineQueue = [];
    }
  }
}

// حفظ قائمة الانتظار في التخزين المحلي
function saveOfflineQueue() {
  localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
}

// إضافة عملية إلى قائمة الانتظار
export function addToOfflineQueue(operation) {
  // إضافة طابع زمني للعملية
  const queueItem = {
    ...operation,
    timestamp: Date.now()
  };
  
  // إضافة العملية إلى قائمة الانتظار
  offlineQueue.push(queueItem);
  
  // حفظ قائمة الانتظار
  saveOfflineQueue();
  
  // تحديث عداد العمليات المعلقة
  updatePendingOperationsCount();
  
  return true;
}

// مزامنة قائمة الانتظار عند استعادة الاتصال
export async function syncOfflineQueue() {
  if (!isOnline || offlineQueue.length === 0) return;
  
  const user = getCurrentUser();
  if (!user) return;
  
  showNotification('جاري مزامنة البيانات...', 'info');
  
  // نسخة من قائمة الانتظار للمعالجة
  const queueToProcess = [...offlineQueue];
  
  // تفريغ قائمة الانتظار
  offlineQueue = [];
  saveOfflineQueue();
  
  // تحديث عداد العمليات المعلقة
  updatePendingOperationsCount();
  
  // معالجة العمليات
  for (const operation of queueToProcess) {
    try {
      // تنفيذ العملية (سيتم تنفيذها لاحقاً)
      await processOfflineOperation(operation);
    } catch (error) {
      console.error('خطأ في معالجة العملية:', error);
      
      // إعادة العملية إلى قائمة الانتظار
      offlineQueue.push(operation);
    }
  }
  
  // حفظ قائمة الانتظار المحدثة
  saveOfflineQueue();
  
  // تحديث عداد العمليات المعلقة
  updatePendingOperationsCount();
  
  if (offlineQueue.length === 0) {
    showNotification('تمت مزامنة جميع البيانات بنجاح', 'success');
  } else {
    showNotification(`تمت مزامنة ${queueToProcess.length - offlineQueue.length} من ${queueToProcess.length} عملية`, 'warning');
  }
}

// معالجة عملية من قائمة الانتظار
async function processOfflineOperation(operation) {
  // سيتم تنفيذها لاحقاً عند ربط مكونات التطبيق
  console.log('معالجة العملية:', operation);
  
  // مثال على معالجة العمليات
  switch (operation.type) {
    case 'addTransaction':
      // await addTransaction(operation.data);
      break;
    case 'addTransfer':
      // await addTransfer(operation.data);
      break;
    case 'addClient':
      // await addClient(operation.data);
      break;
    case 'addClientDebt':
      // await addClientDebt(operation.data);
      break;
    default:
      console.warn('نوع عملية غير معروف:', operation.type);
  }
}

// تحديث عداد العمليات المعلقة
function updatePendingOperationsCount() {
  const pendingBadge = document.getElementById('pending-operations-badge');
  if (pendingBadge) {
    if (offlineQueue.length > 0) {
      pendingBadge.textContent = offlineQueue.length;
      pendingBadge.style.display = 'flex';
    } else {
      pendingBadge.style.display = 'none';
    }
  }
}

// التحقق مما إذا كان التطبيق متصلاً بالإنترنت
export function isAppOnline() {
  return isOnline;
}

// الحصول على عدد العمليات المعلقة
export function getPendingOperationsCount() {
  return offlineQueue.length;
}

// عرض إشعار للمستخدم
function showNotification(message, type = 'success') {
  // استخدام دالة showNotification العامة إذا كانت متاحة
  if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    console.log(`${type}: ${message}`);
  }
}
