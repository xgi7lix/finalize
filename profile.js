// مكون الملف الشخصي وإعدادات الحساب
import { 
  getCurrentUser, 
  getUserProfile, 
  updateUserSettings 
} from './auth';

// تهيئة صفحة الملف الشخصي
export function initProfilePage() {
  // إضافة مستمعي الأحداث لأزرار الإعدادات
  setupProfileButtons();
  
  // تحميل بيانات المستخدم
  loadUserProfileData();
}

// إعداد أزرار صفحة الملف الشخصي
function setupProfileButtons() {
  // زر حفظ إعدادات السمة
  const saveThemeBtn = document.getElementById('save-theme-btn');
  if (saveThemeBtn) {
    saveThemeBtn.addEventListener('click', saveThemeSettings);
  }
  
  // زر حفظ إعدادات اللغة
  const saveLanguageBtn = document.getElementById('save-language-btn');
  if (saveLanguageBtn) {
    saveLanguageBtn.addEventListener('click', saveLanguageSettings);
  }
  
  // أزرار اختيار السمة
  const lightThemeBtn = document.getElementById('light-theme-btn');
  const darkThemeBtn = document.getElementById('dark-theme-btn');
  
  if (lightThemeBtn) {
    lightThemeBtn.addEventListener('click', () => setTheme('light'));
  }
  
  if (darkThemeBtn) {
    darkThemeBtn.addEventListener('click', () => setTheme('dark'));
  }
  
  // أزرار اختيار اللغة
  const arLangBtn = document.getElementById('ar-lang-btn');
  const enLangBtn = document.getElementById('en-lang-btn');
  
  if (arLangBtn) {
    arLangBtn.addEventListener('click', () => setLanguage('ar'));
  }
  
  if (enLangBtn) {
    enLangBtn.addEventListener('click', () => setLanguage('en'));
  }
}

// تحميل بيانات الملف الشخصي
async function loadUserProfileData() {
  try {
    const user = getCurrentUser();
    if (!user) return;
    
    const userProfile = await getUserProfile();
    if (!userProfile) return;
    
    // تحديث معلومات الملف الشخصي
    updateProfileUI(user, userProfile);
    
    // تطبيق الإعدادات الحالية
    if (userProfile.settings) {
      applyCurrentSettings(userProfile.settings);
    }
  } catch (error) {
    console.error('خطأ في تحميل بيانات الملف الشخصي:', error);
    showNotification('حدث خطأ أثناء تحميل بيانات الملف الشخصي', 'error');
  }
}

// تحديث واجهة الملف الشخصي
function updateProfileUI(user, userProfile) {
  // تحديث صورة المستخدم
  const profileAvatar = document.getElementById('profile-avatar');
  if (profileAvatar) {
    profileAvatar.src = user.photoURL || 'icons/default-avatar.png';
  }
  
  // تحديث اسم المستخدم
  const profileName = document.getElementById('profile-name');
  if (profileName) {
    profileName.textContent = user.displayName;
  }
  
  // تحديث البريد الإلكتروني
  const profileEmail = document.getElementById('profile-email');
  if (profileEmail) {
    profileEmail.textContent = user.email;
  }
  
  // تحديث تاريخ الانضمام
  const profileJoinDate = document.getElementById('profile-join-date');
  if (profileJoinDate && userProfile.createdAt) {
    const joinDate = new Date(userProfile.createdAt.seconds * 1000);
    profileJoinDate.textContent = joinDate.toLocaleDateString('ar-EG');
  }
  
  // تحديث تاريخ آخر تسجيل دخول
  const profileLastLogin = document.getElementById('profile-last-login');
  if (profileLastLogin && userProfile.lastLogin) {
    const lastLogin = new Date(userProfile.lastLogin.seconds * 1000);
    profileLastLogin.textContent = lastLogin.toLocaleDateString('ar-EG');
  }
}

// تطبيق الإعدادات الحالية على واجهة المستخدم
function applyCurrentSettings(settings) {
  // تحديد زر السمة النشط
  if (settings.theme) {
    const lightThemeBtn = document.getElementById('light-theme-btn');
    const darkThemeBtn = document.getElementById('dark-theme-btn');
    
    if (lightThemeBtn && darkThemeBtn) {
      if (settings.theme === 'light') {
        lightThemeBtn.classList.add('active');
        darkThemeBtn.classList.remove('active');
      } else {
        darkThemeBtn.classList.add('active');
        lightThemeBtn.classList.remove('active');
      }
    }
  }
  
  // تحديد زر اللغة النشط
  if (settings.language) {
    const arLangBtn = document.getElementById('ar-lang-btn');
    const enLangBtn = document.getElementById('en-lang-btn');
    
    if (arLangBtn && enLangBtn) {
      if (settings.language === 'ar') {
        arLangBtn.classList.add('active');
        enLangBtn.classList.remove('active');
      } else {
        enLangBtn.classList.add('active');
        arLangBtn.classList.remove('active');
      }
    }
  }
}

// تعيين السمة
function setTheme(theme) {
  // تطبيق السمة على الصفحة
  document.documentElement.setAttribute('data-theme', theme);
  
  // تحديث الأزرار النشطة
  const lightThemeBtn = document.getElementById('light-theme-btn');
  const darkThemeBtn = document.getElementById('dark-theme-btn');
  
  if (lightThemeBtn && darkThemeBtn) {
    if (theme === 'light') {
      lightThemeBtn.classList.add('active');
      darkThemeBtn.classList.remove('active');
    } else {
      darkThemeBtn.classList.add('active');
      lightThemeBtn.classList.remove('active');
    }
  }
}

// تعيين اللغة
function setLanguage(language) {
  // تحديث الأزرار النشطة
  const arLangBtn = document.getElementById('ar-lang-btn');
  const enLangBtn = document.getElementById('en-lang-btn');
  
  if (arLangBtn && enLangBtn) {
    if (language === 'ar') {
      arLangBtn.classList.add('active');
      enLangBtn.classList.remove('active');
    } else {
      enLangBtn.classList.add('active');
      arLangBtn.classList.remove('active');
    }
  }
  
  // يمكن إضافة منطق تغيير اللغة هنا
}

// حفظ إعدادات السمة
async function saveThemeSettings() {
  try {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    
    // الحصول على الإعدادات الحالية
    const userProfile = await getUserProfile();
    const currentSettings = userProfile?.settings || {};
    
    // تحديث الإعدادات
    const newSettings = {
      ...currentSettings,
      theme
    };
    
    // حفظ الإعدادات
    const result = await updateUserSettings(newSettings);
    
    if (result.success) {
      showNotification('تم حفظ إعدادات السمة بنجاح', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('خطأ في حفظ إعدادات السمة:', error);
    showNotification('حدث خطأ أثناء حفظ الإعدادات', 'error');
  }
}

// حفظ إعدادات اللغة
async function saveLanguageSettings() {
  try {
    // تحديد اللغة المختارة
    let language = 'ar';
    const arLangBtn = document.getElementById('ar-lang-btn');
    const enLangBtn = document.getElementById('en-lang-btn');
    
    if (arLangBtn && enLangBtn) {
      if (enLangBtn.classList.contains('active')) {
        language = 'en';
      }
    }
    
    // الحصول على الإعدادات الحالية
    const userProfile = await getUserProfile();
    const currentSettings = userProfile?.settings || {};
    
    // تحديث الإعدادات
    const newSettings = {
      ...currentSettings,
      language
    };
    
    // حفظ الإعدادات
    const result = await updateUserSettings(newSettings);
    
    if (result.success) {
      showNotification('تم حفظ إعدادات اللغة بنجاح', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('خطأ في حفظ إعدادات اللغة:', error);
    showNotification('حدث خطأ أثناء حفظ الإعدادات', 'error');
  }
}
