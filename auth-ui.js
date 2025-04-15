// مكون واجهة المستخدم للمصادقة
import { 
  signInWithGoogle, 
  logoutUser, 
  getCurrentUser, 
  getUserProfile, 
  addAuthStateListener 
} from './auth';

// تهيئة واجهة المستخدم للمصادقة
export function initAuthUI() {
  // إضافة مستمعي الأحداث لأزرار المصادقة
  setupAuthButtons();
  
  // إضافة مستمع لحالة المصادقة لتحديث واجهة المستخدم
  addAuthStateListener(updateAuthUI);
}

// إعداد أزرار المصادقة
function setupAuthButtons() {
  // زر تسجيل الدخول بحساب جوجل
  const googleLoginBtn = document.getElementById('google-login-btn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
  }
  
  // زر تسجيل الخروج
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// معالجة تسجيل الدخول بحساب جوجل
async function handleGoogleLogin() {
  try {
    showLoading();
    const result = await signInWithGoogle();
    
    if (result.success) {
      // تم تسجيل الدخول بنجاح
      showNotification('تم تسجيل الدخول بنجاح', 'success');
      
      // التحقق مما إذا كان المستخدم جديداً
      if (result.user && result.isNewUser) {
        // عرض شاشة استيراد البيانات للمستخدمين الجدد
        showImportDataScreen();
      } else {
        // عرض التطبيق الرئيسي
        showApp();
      }
    } else {
      // حدث خطأ أثناء تسجيل الدخول
      const errorElement = document.getElementById('login-error');
      if (errorElement) {
        errorElement.textContent = result.error;
      }
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('خطأ في معالجة تسجيل الدخول:', error);
    showNotification('حدث خطأ أثناء تسجيل الدخول', 'error');
  } finally {
    hideLoading();
  }
}

// معالجة تسجيل الخروج
async function handleLogout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    try {
      showLoading();
      const result = await logoutUser();
      
      if (result.success) {
        // تم تسجيل الخروج بنجاح
        showNotification('تم تسجيل الخروج بنجاح', 'success');
        showLoginScreen();
      } else {
        // حدث خطأ أثناء تسجيل الخروج
        showNotification(result.error, 'error');
      }
    } catch (error) {
      console.error('خطأ في معالجة تسجيل الخروج:', error);
      showNotification('حدث خطأ أثناء تسجيل الخروج', 'error');
    } finally {
      hideLoading();
    }
  }
}

// تحديث واجهة المستخدم بناءً على حالة المصادقة
async function updateAuthUI(user) {
  if (user) {
    // المستخدم مسجل الدخول
    try {
      // الحصول على ملف تعريف المستخدم
      const userProfile = await getUserProfile();
      
      // تحديث معلومات المستخدم في الواجهة
      updateUserInfo(user, userProfile);
      
      // عرض التطبيق الرئيسي
      showApp();
    } catch (error) {
      console.error('خطأ في تحديث واجهة المستخدم:', error);
    }
  } else {
    // المستخدم غير مسجل الدخول
    showLoginScreen();
  }
}

// تحديث معلومات المستخدم في الواجهة
function updateUserInfo(user, userProfile) {
  if (!user) return;
  
  // تحديث صورة المستخدم واسمه في الهيدر
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  if (userAvatar) userAvatar.src = user.photoURL || 'icons/default-avatar.png';
  if (userName) userName.textContent = user.displayName;
  
  // تحديث معلومات المستخدم في القائمة الجانبية
  const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarUserName = document.getElementById('sidebar-user-name');
  const sidebarUserEmail = document.getElementById('sidebar-user-email');
  
  if (sidebarUserAvatar) sidebarUserAvatar.src = user.photoURL || 'icons/default-avatar.png';
  if (sidebarUserName) sidebarUserName.textContent = user.displayName;
  if (sidebarUserEmail) sidebarUserEmail.textContent = user.email;
  
  // تطبيق إعدادات المستخدم إذا كانت متوفرة
  if (userProfile && userProfile.settings) {
    applyUserSettings(userProfile.settings);
  }
}

// تطبيق إعدادات المستخدم
function applyUserSettings(settings) {
  // تطبيق السمة (الوضع الفاتح/المظلم)
  if (settings.theme) {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }
  
  // تطبيق اللغة
  if (settings.language) {
    // يمكن إضافة منطق تغيير اللغة هنا
  }
}

// عرض شاشة تسجيل الدخول
function showLoginScreen() {
  document.getElementById('login-container').style.display = 'flex';
  document.getElementById('main-header').style.display = 'none';
  document.getElementById('page-header').style.display = 'none';
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('sidebar-toggle').style.display = 'none';
  
  // إعادة تعيين أي رسائل خطأ
  const errorElement = document.getElementById('login-error');
  if (errorElement) {
    errorElement.textContent = '';
  }
}

// عرض التطبيق الرئيسي
function showApp() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('main-header').style.display = 'block';
  document.getElementById('main-content').style.display = 'block';
  document.getElementById('sidebar-toggle').style.display = 'flex';
  
  // عرض الصفحة الرئيسية (لوحة التحكم)
  showPage('dashboard-page');
}

// عرض شاشة استيراد البيانات
function showImportDataScreen() {
  // سيتم تنفيذها لاحقاً
  // مؤقتاً، سنعرض التطبيق مباشرة
  showApp();
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

// عرض صفحة محددة
function showPage(pageId) {
  document.getElementById("main-content").style.display = "none";
  document.getElementById("main-header").style.display = "none";
  document.getElementById("page-header").style.display = "block";
  
  const pageTitleEl = document.querySelector(`#${pageId} .page-header h2`);
  document.getElementById("page-title").textContent = pageTitleEl ? pageTitleEl.textContent : "";
  
  hideAllPages();
  document.getElementById(pageId).classList.add("active-page");
  
  // إغلاق القائمة الجانبية
  document.getElementById('sidebar').classList.remove('active');
  
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// إخفاء جميع الصفحات
function hideAllPages() {
  const pages = document.querySelectorAll(".page");
  pages.forEach(page => page.classList.remove("active-page"));
}

// تصدير الدوال العامة
window.showPage = showPage;
window.showNotification = showNotification;
