// مكون المصادقة
import { auth, db } from '../js/firebase-config';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

// متغيرات عامة
let currentUser = null;
let authStateListeners = [];

// تهيئة المصادقة
export function initAuth() {
  // مراقبة حالة المصادقة
  onAuthStateChanged(auth, user => {
    currentUser = user;
    
    // استدعاء جميع المستمعين المسجلين
    authStateListeners.forEach(listener => listener(user));
  });
}

// تسجيل الدخول باستخدام حساب جوجل
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // تم تسجيل الدخول بنجاح
    currentUser = result.user;
    
    // التحقق مما إذا كان المستخدم جديداً وإنشاء بيانات المستخدم
    await checkAndCreateUserProfile(currentUser);
    
    return { success: true, user: currentUser };
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.' 
    };
  }
}

// تسجيل الخروج
export async function logoutUser() {
  try {
    await signOut(auth);
    currentUser = null;
    return { success: true };
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء تسجيل الخروج.' 
    };
  }
}

// التحقق من وجود ملف تعريف المستخدم وإنشائه إذا لم يكن موجوداً
export async function checkAndCreateUserProfile(user) {
  if (!user) return null;
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // إنشاء ملف تعريف جديد للمستخدم
      const userData = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        settings: {
          theme: 'light',
          language: 'ar'
        }
      };
      
      await setDoc(userDocRef, userData);
      return { ...userData, isNewUser: true };
    } else {
      // تحديث وقت آخر تسجيل دخول
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp()
      });
      
      return { ...userDoc.data(), isNewUser: false };
    }
  } catch (error) {
    console.error('خطأ في التحقق من ملف تعريف المستخدم:', error);
    throw error;
  }
}

// الحصول على المستخدم الحالي
export function getCurrentUser() {
  return currentUser;
}

// الحصول على معلومات المستخدم من Firestore
export async function getUserProfile() {
  if (!currentUser) return null;
  
  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('خطأ في الحصول على ملف تعريف المستخدم:', error);
    throw error;
  }
}

// تحديث إعدادات المستخدم
export async function updateUserSettings(settings) {
  if (!currentUser) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      'settings': settings
    });
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث إعدادات المستخدم:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء تحديث الإعدادات.' 
    };
  }
}

// إضافة مستمع لحالة المصادقة
export function addAuthStateListener(listener) {
  if (typeof listener === 'function') {
    authStateListeners.push(listener);
    
    // استدعاء المستمع مباشرة مع حالة المستخدم الحالية
    listener(currentUser);
    
    // إرجاع دالة لإزالة المستمع
    return () => {
      authStateListeners = authStateListeners.filter(l => l !== listener);
    };
  }
}
