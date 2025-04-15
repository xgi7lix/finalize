// مكون تخزين البيانات
import { db } from '../js/firebase-config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { getCurrentUser } from './auth';

// متغيرات عامة
let balances = {};
let currencies = {};
let transactions = [];
let clients = {};
let dataListeners = [];

// تهيئة مكون تخزين البيانات
export function initDataStorage() {
  // إضافة مستمعي البيانات
  setupDataListeners();
}

// إعداد مستمعي البيانات
function setupDataListeners() {
  const user = getCurrentUser();
  if (!user) return;
  
  // مستمع للعملات والأرصدة
  const balancesRef = collection(db, 'users', user.uid, 'balances');
  const unsubBalances = onSnapshot(balancesRef, (snapshot) => {
    balances = {};
    snapshot.forEach(doc => {
      balances[doc.id] = doc.data().amount;
    });
    
    // تحديث واجهة المستخدم
    updateBalancesUI();
  });
  
  // مستمع للعملات
  const currenciesRef = collection(db, 'users', user.uid, 'currencies');
  const unsubCurrencies = onSnapshot(currenciesRef, (snapshot) => {
    currencies = {};
    snapshot.forEach(doc => {
      currencies[doc.id] = doc.data().name;
    });
    
    // تحديث واجهة المستخدم
    updateCurrencySelectsUI();
  });
  
  // مستمع للمعاملات
  const transactionsRef = collection(db, 'users', user.uid, 'transactions');
  const transactionsQuery = query(transactionsRef, orderBy('date', 'desc'));
  const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
    transactions = [];
    snapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // تحديث واجهة المستخدم
    updateTransactionsUI();
    updateRecentTransactionsUI();
  });
  
  // مستمع للعملاء
  const clientsRef = collection(db, 'users', user.uid, 'clients');
  const unsubClients = onSnapshot(clientsRef, (snapshot) => {
    clients = {};
    snapshot.forEach(doc => {
      clients[doc.id] = doc.data();
    });
    
    // تحديث واجهة المستخدم
    updateClientsUI();
  });
  
  // تخزين مراجع المستمعين لإلغاء الاشتراك لاحقاً
  dataListeners = [unsubBalances, unsubCurrencies, unsubTransactions, unsubClients];
}

// إلغاء الاشتراك في مستمعي البيانات
export function unsubscribeDataListeners() {
  dataListeners.forEach(unsubscribe => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
  dataListeners = [];
}

// تحديث واجهة الأرصدة
function updateBalancesUI() {
  // تحديث قائمة الأرصدة
  const balancesList = document.getElementById('balancesList');
  if (balancesList) {
    balancesList.innerHTML = '';
    
    if (Object.keys(balances).length === 0) {
      balancesList.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">لا توجد أرصدة مسجلة</div>';
      return;
    }
    
    for (const [code, balance] of Object.entries(balances)) {
      const div = document.createElement('div');
      div.className = 'balance-item';
      div.innerHTML = `
        <span><strong>${currencies[code] || code}:</strong></span>
        <span>${Number(balance).toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ${code}</span>
      `;
      balancesList.appendChild(div);
    }
  }
  
  // تحديث ملخص الأرصدة في لوحة التحكم
  updateDashboardSummary();
}

// تحديث قوائم اختيار العملات
function updateCurrencySelectsUI() {
  const selects = document.querySelectorAll('select:not(#currency-select):not(#balance-currency-select)');
  selects.forEach(select => {
    if (select.id.includes('Currency')) {
      const currentValue = select.value;
      select.innerHTML = '';
      
      for (const code in currencies) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${code} - ${currencies[code]}`;
        select.appendChild(option);
      }
      
      // استعادة القيمة المحددة إذا كانت موجودة
      if (currentValue && currencies[currentValue]) {
        select.value = currentValue;
      }
    }
  });
  
  // تحديث قائمة اختيار العملة في إعدادات الرصيد
  const balanceCurrencySelect = document.getElementById('balance-currency-select');
  if (balanceCurrencySelect) {
    const currentValue = balanceCurrencySelect.value;
    balanceCurrencySelect.innerHTML = '';
    
    for (const code in currencies) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${code} - ${currencies[code]}`;
      balanceCurrencySelect.appendChild(option);
    }
    
    // استعادة القيمة المحددة إذا كانت موجودة
    if (currentValue && currencies[currentValue]) {
      balanceCurrencySelect.value = currentValue;
    }
  }
}

// تحديث واجهة المعاملات
function updateTransactionsUI() {
  const transactionsList = document.getElementById('transactionsList');
  if (!transactionsList) return;
  
  transactionsList.innerHTML = '';
  
  if (transactions.length === 0) {
    transactionsList.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">لا توجد معاملات مسجلة</div>';
    return;
  }
  
  transactions.forEach(tx => {
    let bgColor = '';
    if (tx.type === 'تحويل') {
      bgColor = '#2196F3';
    } else if (tx.type === 'وارد') {
      bgColor = '#4CAF50';
    } else if (tx.type === 'صادر') {
      bgColor = '#F44336';
    }
    
    const btn = document.createElement('button');
    btn.className = 'transaction-button';
    btn.style.backgroundColor = bgColor;
    btn.style.color = 'white';
    btn.style.fontWeight = 'bold';
    btn.style.marginBottom = '10px';
    btn.style.padding = '15px';
    btn.style.borderRadius = '5px';
    btn.style.border = 'none';
    btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    btn.style.cursor = 'pointer';
    btn.style.width = '100%';
    btn.style.textAlign = 'right';
    btn.style.display = 'flex';
    btn.style.justifyContent = 'space-between';
    btn.style.alignItems = 'center';
    
    const idSpan = document.createElement('span');
    idSpan.textContent = `#${tx.id}`;
    
    const amountSpan = document.createElement('span');
    amountSpan.textContent = `${Number(tx.amount).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${tx.currency}`;
    
    btn.appendChild(idSpan);
    btn.appendChild(amountSpan);
    
    btn.onclick = () => showTransactionDetails(tx);
    
    transactionsList.appendChild(btn);
  });
}

// تحديث أحدث المعاملات
function updateRecentTransactionsUI() {
  const recentTransactionsEl = document.getElementById('dashboard-recent-transactions');
  if (!recentTransactionsEl) return;
  
  recentTransactionsEl.innerHTML = '';
  
  if (transactions.length === 0) {
    recentTransactionsEl.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">لا توجد معاملات مسجلة</div>';
    return;
  }
  
  // عرض آخر 5 معاملات
  transactions.slice(0, 5).forEach(tx => {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    let typeClass = '';
    if (tx.type === 'وارد') {
      typeClass = 'income';
    } else if (tx.type === 'صادر') {
      typeClass = 'expense';
    } else if (tx.type === 'تحويل') {
      typeClass = 'transfer';
    }
    
    div.innerHTML = `
      <div class="transaction-info">
        <span class="transaction-date">${tx.date}</span>
        <span class="transaction-description">${tx.description}</span>
      </div>
      <div class="transaction-amount ${typeClass}">
        ${tx.type === 'صادر' ? '-' : ''}${Number(tx.amount).toLocaleString('ar-EG')} ${tx.currency}
      </div>
    `;
    
    recentTransactionsEl.appendChild(div);
  });
}

// تحديث واجهة العملاء
function updateClientsUI() {
  const clientsListDisplay = document.getElementById('clientsListDisplay');
  if (!clientsListDisplay) return;
  
  clientsListDisplay.innerHTML = '';
  
  if (Object.keys(clients).length === 0) {
    clientsListDisplay.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">لا يوجد عملاء مسجلين</div>';
    return;
  }
  
  for (const [clientId, clientData] of Object.entries(clients)) {
    const div = document.createElement('div');
    div.className = 'client-item';
    div.innerHTML = `
      <div class="client-info">
        <span class="client-name">${clientData.name}</span>
        <span class="client-phone">${clientData.phone || ''}</span>
      </div>
      <button class="view-client-btn" onclick="showClientDetails('${clientId}')">
        <i class="fas fa-eye"></i> عرض
      </button>
    `;
    
    clientsListDisplay.appendChild(div);
  }
  
  // تحديث قائمة اختيار العملاء للحذف
  const removeClientDropdown = document.getElementById('removeClientDropdown');
  if (removeClientDropdown) {
    removeClientDropdown.innerHTML = '';
    
    for (const [clientId, clientData] of Object.entries(clients)) {
      const option = document.createElement('option');
      option.value = clientId;
      option.textContent = clientData.name;
      removeClientDropdown.appendChild(option);
    }
  }
  
  // تحديث ملخص الديون
  updateDebtSummary();
}

// تحديث ملخص الديون
function updateDebtSummary() {
  const overallDebtSummary = document.getElementById('overallDebtSummary');
  if (!overallDebtSummary) return;
  
  // حساب إجمالي الديون
  let totalDebts = {};
  
  for (const clientData of Object.values(clients)) {
    if (clientData.debts) {
      for (const debt of clientData.debts) {
        const currency = debt.currency;
        const amount = debt.type === 'له' ? -debt.amount : debt.amount;
        
        if (!totalDebts[currency]) {
          totalDebts[currency] = 0;
        }
        
        totalDebts[currency] += amount;
      }
    }
  }
  
  // عرض إجمالي الديون
  if (Object.keys(totalDebts).length === 0) {
    overallDebtSummary.innerHTML = 'لا توجد ديون مسجلة';
    return;
  }
  
  let debtSummaryHTML = '<strong>إجمالي الديون:</strong> ';
  for (const [currency, amount] of Object.entries(totalDebts)) {
    const formattedAmount = Number(amount).toLocaleString('ar-EG');
    debtSummaryHTML += `${formattedAmount} ${currency} | `;
  }
  
  // إزالة الفاصلة الأخيرة
  debtSummaryHTML = debtSummaryHTML.slice(0, -3);
  
  overallDebtSummary.innerHTML = debtSummaryHTML;
  
  // تحديث ملخص الديون في لوحة التحكم
  updateDashboardSummary();
}

// تحديث ملخص لوحة التحكم
function updateDashboardSummary() {
  const totalBalanceEl = document.getElementById('total-balance');
  const totalIncomeEl = document.getElementById('total-income');
  const totalExpensesEl = document.getElementById('total-expenses');
  const totalDebtsEl = document.getElementById('total-debts');
  
  if (totalBalanceEl) {
    let balanceText = '';
    for (const [code, balance] of Object.entries(balances)) {
      balanceText += `${Number(balance).toLocaleString('ar-EG')} ${code}<br>`;
    }
    totalBalanceEl.innerHTML = balanceText || '0';
  }
  
  if (totalIncomeEl) {
    // حساب إجمالي الوارد
    const totalIncome = transactions
      .filter(tx => tx.type === 'وارد')
      .reduce((sum, tx) => {
        if (tx.currency === 'SDG') {
          return sum + tx.amount;
        }
        return sum;
      }, 0);
    
    totalIncomeEl.textContent = `${Number(totalIncome).toLocaleString('ar-EG')} SDG`;
  }
  
  if (totalExpensesEl) {
    // حساب إجمالي الصادر
    const totalExpenses = transactions
      .filter(tx => tx.type === 'صادر')
      .reduce((sum, tx) => {
        if (tx.currency === 'SDG') {
          return sum + tx.amount;
        }
        return sum;
      }, 0);
    
    totalExpensesEl.textContent = `${Number(totalExpenses).toLocaleString('ar-EG')} SDG`;
  }
  
  if (totalDebtsEl) {
    // حساب إجمالي الديون
    let totalDebts = 0;
    
    for (const clientData of Object.values(clients)) {
      if (clientData.debts) {
        for (const debt of clientData.debts) {
          if (debt.currency === 'SDG') {
            const amount = debt.type === 'له' ? -debt.amount : debt.amount;
            totalDebts += amount;
          }
        }
      }
    }
    
    totalDebtsEl.textContent = `${Number(totalDebts).toLocaleString('ar-EG')} SDG`;
  }
}

// عرض تفاصيل المعاملة
function showTransactionDetails(transaction) {
  // سيتم تنفيذها لاحقاً
  console.log('تفاصيل المعاملة:', transaction);
  showNotification('سيتم تنفيذ عرض تفاصيل المعاملة قريباً', 'info');
}

// عرض تفاصيل العميل
window.showClientDetails = function(clientId) {
  const client = clients[clientId];
  if (!client) return;
  
  // تعيين العميل الحالي
  window.currentDebtClient = clientId;
  
  // تعيين اسم العميل في العنوان
  const clientDetailsName = document.getElementById('clientDetailsName');
  if (clientDetailsName) {
    clientDetailsName.textContent = client.name;
  }
  
  // تحديث ملخص ديون العميل
  updateClientDebtSummary(clientId);
  
  // تحديث تفاصيل ديون العميل
  updateClientDebtDetails(clientId);
  
  // عرض صفحة تفاصيل الديون
  showPage('debtDetailsPage');
};

// تحديث ملخص ديون العميل
function updateClientDebtSummary(clientId) {
  const client = clients[clientId];
  if (!client) return;
  
  const clientDebtSummary = document.getElementById('clientDebtSummary');
  if (!clientDebtSummary) return;
  
  // حساب إجمالي ديون العميل
  let totalDebts = {};
  
  if (client.debts) {
    for (const debt of client.debts) {
      const currency = debt.currency;
      const amount = debt.type === 'له' ? -debt.amount : debt.amount;
      
      if (!totalDebts[currency]) {
        totalDebts[currency] = 0;
      }
      
      totalDebts[currency] += amount;
    }
  }
  
  // عرض إجمالي ديون العميل
  if (Object.keys(totalDebts).length === 0) {
    clientDebtSummary.innerHTML = 'لا توجد ديون مسجلة';
    return;
  }
  
  let debtSummaryHTML = '<strong>إجمالي الديون:</strong> ';
  for (const [currency, amount] of Object.entries(totalDebts)) {
    const formattedAmount = Number(amount).toLocaleString('ar-EG');
    const debtType = amount > 0 ? 'لك' : 'له';
    debtSummaryHTML += `${Math.abs(amount).toLocaleString('ar-EG')} ${currency} (${debtType}) | `;
  }
  
  // إزالة الفاصلة الأخيرة
  debtSummaryHTML = debtSummaryHTML.slice(0, -3);
  
  clientDebtSummary.innerHTML = debtSummaryHTML;
}

// تحديث تفاصيل ديون العميل
function updateClientDebtDetails(clientId) {
  const client = clients[clientId];
  if (!client) return;
  
  const clientDebtDetails = document.getElementById('clientDebtDetails');
  if (!clientDebtDetails) return;
  
  clientDebtDetails.innerHTML = '';
  
  if (!client.debts || client.debts.length === 0) {
    clientDebtDetails.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">لا توجد سجلات ديون</div>';
    return;
  }
  
  // ترتيب الديون حسب التاريخ (الأحدث أولاً)
  const sortedDebts = [...client.debts].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  for (const debt of sortedDebts) {
    const div = document.createElement('div');
    div.className = 'debt-record';
    
    const date = new Date(debt.date).toLocaleDateString('ar-EG');
    const amount = Number(debt.amount).toLocaleString('ar-EG');
    
    div.innerHTML = `
      <div class="debt-record-header">
        <span class="debt-date">${date}</span>
        <span class="debt-type ${debt.type === 'له' ? 'debt-out' : 'debt-in'}">${debt.type}</span>
      </div>
      <div class="debt-record-amount">
        ${amount} ${debt.currency}
      </div>
      <div class="debt-record-comment">
        ${debt.comment || ''}
      </div>
    `;
    
    clientDebtDetails.appendChild(div);
  }
}

// إضافة عملة
export async function addCurrency(code, name) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // التحقق من وجود العملة
    if (currencies[code]) {
      return { success: false, error: 'هذه العملة مضافة بالفعل' };
    }
    
    // إضافة العملة
    const currencyRef = doc(db, 'users', user.uid, 'currencies', code);
    await setDoc(currencyRef, {
      name,
      createdAt: serverTimestamp()
    });
    
    // إضافة رصيد أولي للعملة
    const balanceRef = doc(db, 'users', user.uid, 'balances', code);
    await setDoc(balanceRef, {
      amount: 0,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في إضافة العملة:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء إضافة العملة' 
    };
  }
}

// حذف عملة
export async function removeCurrency(code) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // التحقق من وجود معاملات بهذه العملة
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, where('currency', '==', code));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { 
        success: false, 
        error: 'لا يمكن حذف هذه العملة لوجود معاملات مرتبطة بها' 
      };
    }
    
    // حذف العملة
    const currencyRef = doc(db, 'users', user.uid, 'currencies', code);
    await deleteDoc(currencyRef);
    
    // حذف رصيد العملة
    const balanceRef = doc(db, 'users', user.uid, 'balances', code);
    await deleteDoc(balanceRef);
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في حذف العملة:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء حذف العملة' 
    };
  }
}

// تحديث رصيد
export async function updateBalance(currency, newBalance) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // التحقق من وجود العملة
    if (!currencies[currency]) {
      return { success: false, error: 'العملة غير موجودة' };
    }
    
    // تحديث الرصيد
    const balanceRef = doc(db, 'users', user.uid, 'balances', currency);
    await updateDoc(balanceRef, {
      amount: newBalance,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث الرصيد:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء تحديث الرصيد' 
    };
  }
}

// إضافة معاملة
export async function addTransaction(transaction) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // إنشاء معرف فريد للمعاملة
    const transactionId = Date.now().toString();
    
    // إضافة المعاملة
    const transactionRef = doc(db, 'users', user.uid, 'transactions', transactionId);
    await setDoc(transactionRef, {
      ...transaction,
      date: new Date().toLocaleString('ar-EG'),
      createdAt: serverTimestamp()
    });
    
    // تحديث الرصيد
    const balanceRef = doc(db, 'users', user.uid, 'balances', transaction.currency);
    const balanceDoc = await getDoc(balanceRef);
    
    if (balanceDoc.exists()) {
      let currentBalance = balanceDoc.data().amount;
      
      if (transaction.type === 'وارد') {
        currentBalance += transaction.amount;
      } else if (transaction.type === 'صادر') {
        currentBalance -= transaction.amount;
      }
      
      await updateDoc(balanceRef, {
        amount: currentBalance,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true, id: transactionId };
  } catch (error) {
    console.error('خطأ في إضافة المعاملة:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء إضافة المعاملة' 
    };
  }
}

// إضافة تحويل
export async function addTransfer(fromCurrency, toCurrency, fromAmount, toAmount, comment) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // التحقق من وجود العملات
    if (!currencies[fromCurrency] || !currencies[toCurrency]) {
      return { success: false, error: 'إحدى العملات غير موجودة' };
    }
    
    // إنشاء معرف فريد للمعاملة
    const transactionId = Date.now().toString();
    
    // إضافة معاملة التحويل
    const transactionRef = doc(db, 'users', user.uid, 'transactions', transactionId);
    await setDoc(transactionRef, {
      type: 'تحويل',
      description: `تحويل من ${fromCurrency} إلى ${toCurrency}`,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      comment,
      date: new Date().toLocaleString('ar-EG'),
      createdAt: serverTimestamp()
    });
    
    // تحديث رصيد العملة المصدر
    const fromBalanceRef = doc(db, 'users', user.uid, 'balances', fromCurrency);
    const fromBalanceDoc = await getDoc(fromBalanceRef);
    
    if (fromBalanceDoc.exists()) {
      let currentBalance = fromBalanceDoc.data().amount;
      currentBalance -= fromAmount;
      
      await updateDoc(fromBalanceRef, {
        amount: currentBalance,
        updatedAt: serverTimestamp()
      });
    }
    
    // تحديث رصيد العملة الهدف
    const toBalanceRef = doc(db, 'users', user.uid, 'balances', toCurrency);
    const toBalanceDoc = await getDoc(toBalanceRef);
    
    if (toBalanceDoc.exists()) {
      let currentBalance = toBalanceDoc.data().amount;
      currentBalance += toAmount;
      
      await updateDoc(toBalanceRef, {
        amount: currentBalance,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true, id: transactionId };
  } catch (error) {
    console.error('خطأ في إضافة التحويل:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء إضافة التحويل' 
    };
  }
}

// إضافة عميل
export async function addClient(name, phone, note) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // إنشاء معرف فريد للعميل
    const clientId = Date.now().toString();
    
    // إضافة العميل
    const clientRef = doc(db, 'users', user.uid, 'clients', clientId);
    await setDoc(clientRef, {
      name,
      phone,
      note,
      debts: [],
      createdAt: serverTimestamp()
    });
    
    return { success: true, id: clientId };
  } catch (error) {
    console.error('خطأ في إضافة العميل:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء إضافة العميل' 
    };
  }
}

// حذف عميل
export async function removeClient(clientId) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // حذف العميل
    const clientRef = doc(db, 'users', user.uid, 'clients', clientId);
    await deleteDoc(clientRef);
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في حذف العميل:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء حذف العميل' 
    };
  }
}

// إضافة دين للعميل
export async function addClientDebt(clientId, debtType, amount, currency, comment) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // التحقق من وجود العميل
    const clientRef = doc(db, 'users', user.uid, 'clients', clientId);
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      return { success: false, error: 'العميل غير موجود' };
    }
    
    // الحصول على بيانات العميل
    const clientData = clientDoc.data();
    
    // إضافة الدين
    const newDebt = {
      id: Date.now().toString(),
      type: debtType,
      amount,
      currency,
      comment,
      date: new Date().toISOString()
    };
    
    // إضافة الدين إلى مصفوفة الديون
    const debts = clientData.debts || [];
    debts.push(newDebt);
    
    // تحديث بيانات العميل
    await updateDoc(clientRef, {
      debts,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: newDebt.id };
  } catch (error) {
    console.error('خطأ في إضافة الدين:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء إضافة الدين' 
    };
  }
}

// استيراد البيانات من localStorage
export async function importDataFromLocalStorage() {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'المستخدم غير مسجل الدخول' };
  
  try {
    // الحصول على البيانات من localStorage
    const localBalances = JSON.parse(localStorage.getItem('balances') || '{}');
    const localCurrencies = JSON.parse(localStorage.getItem('currencies') || '{}');
    const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const localClients = JSON.parse(localStorage.getItem('clients') || '{}');
    
    // استيراد العملات
    for (const [code, name] of Object.entries(localCurrencies)) {
      const currencyRef = doc(db, 'users', user.uid, 'currencies', code);
      await setDoc(currencyRef, {
        name,
        createdAt: serverTimestamp()
      });
    }
    
    // استيراد الأرصدة
    for (const [code, amount] of Object.entries(localBalances)) {
      const balanceRef = doc(db, 'users', user.uid, 'balances', code);
      await setDoc(balanceRef, {
        amount,
        updatedAt: serverTimestamp()
      });
    }
    
    // استيراد المعاملات
    for (const tx of localTransactions) {
      const transactionRef = doc(db, 'users', user.uid, 'transactions', tx.id || Date.now().toString());
      await setDoc(transactionRef, {
        ...tx,
        createdAt: serverTimestamp()
      });
    }
    
    // استيراد العملاء
    for (const [clientId, clientData] of Object.entries(localClients)) {
      const clientRef = doc(db, 'users', user.uid, 'clients', clientId);
      await setDoc(clientRef, {
        ...clientData,
        createdAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في استيراد البيانات:', error);
    return { 
      success: false, 
      error: error.message || 'حدث خطأ أثناء استيراد البيانات' 
    };
  }
}

// الحصول على البيانات الحالية
export function getCurrentData() {
  return {
    balances,
    currencies,
    transactions,
    clients
  };
}
