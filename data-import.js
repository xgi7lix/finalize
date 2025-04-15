// مكون استيراد البيانات
import { getCurrentUser } from './auth';
import { importDataFromLocalStorage } from './data-storage';

// تهيئة مكون استيراد البيانات
export function initDataImport() {
  // إضافة مستمعي الأحداث
  setupImportButtons();
}

// إعداد أزرار الاستيراد
function setupImportButtons() {
  // زر استيراد البيانات
  const importDataBtn = document.getElementById('import-data-btn');
  if (importDataBtn) {
    importDataBtn.addEventListener('click', showImportDataDialog);
  }
  
  // زر تأكيد الاستيراد
  const confirmImportBtn = document.getElementById('confirm-import-btn');
  if (confirmImportBtn) {
    confirmImportBtn.addEventListener('click', handleDataImport);
  }
  
  // زر إلغاء الاستيراد
  const cancelImportBtn = document.getElementById('cancel-import-btn');
  if (cancelImportBtn) {
    cancelImportBtn.addEventListener('click', hideImportDataDialog);
  }
}

// عرض حوار استيراد البيانات
function showImportDataDialog() {
  const importDialog = document.getElementById('import-data-dialog');
  if (importDialog) {
    importDialog.style.display = 'flex';
  }
}

// إخفاء حوار استيراد البيانات
function hideImportDataDialog() {
  const importDialog = document.getElementById('import-data-dialog');
  if (importDialog) {
    importDialog.style.display = 'none';
  }
}

// معالجة استيراد البيانات
async function handleDataImport() {
  try {
    showLoading();
    
    // التحقق من وجود بيانات في localStorage
    const hasLocalData = checkLocalStorageData();
    
    if (!hasLocalData) {
      showNotification('لا توجد بيانات محلية للاستيراد', 'warning');
      hideImportDataDialog();
      hideLoading();
      return;
    }
    
    // استيراد البيانات
    const result = await importDataFromLocalStorage();
    
    if (result.success) {
      showNotification('تم استيراد البيانات بنجاح', 'success');
      hideImportDataDialog();
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('خطأ في معالجة استيراد البيانات:', error);
    showNotification('حدث خطأ أثناء استيراد البيانات', 'error');
  } finally {
    hideLoading();
  }
}

// التحقق من وجود بيانات في localStorage
function checkLocalStorageData() {
  const balances = localStorage.getItem('balances');
  const currencies = localStorage.getItem('currencies');
  const transactions = localStorage.getItem('transactions');
  const clients = localStorage.getItem('clients');
  
  return !!(balances || currencies || transactions || clients);
}

// عرض مؤشر التحميل
function showLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'flex';
  }
}

// إخفاء مؤشر التحميل
function hideLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}
