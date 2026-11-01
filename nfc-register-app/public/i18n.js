// English / Arabic texts shared by the registration and admin pages.
const I18N = {
  en: {
    pageTitle: 'Eid Al Etihad Registration', adminTitle: 'Admin · Eid Al Etihad',
    heroDate: '2 DECEMBER · UAE NATIONAL DAY', heroSub: 'Eid Al Etihad · UAE National Day',
    heroGreet: 'Happy National Day! The 55th celebration',
    footTxt: 'Made with love for the United Arab Emirates', footAr: 'الإمارات العربية المتحدة',
    title: 'Create your account', sub: 'Fill in your details, take a photo and tap your NFC card.',
    step1: '1. Your details', fullName: 'Full name', email: 'Email', phone: 'Phone (optional)',
    password: 'Password (min. 8 characters)',
    step2: '2. Photo', camPh: 'Camera is off. Click “Start camera”.', startCam: 'Start camera', snap: 'Take photo', retake: 'Retake',
    camHint: 'Your browser will ask permission to use the camera. Camera access needs https:// or http://localhost.',
    step3: '3. NFC card', cardUid: 'Card UID:', uidNone: '— not scanned —',
    btnArduino: 'Connect Arduino reader (USB)', btnSpring: 'Connect SpringCard reader (bridge)', btnWebNfc: "Use this phone's NFC",
    uidManualLabel: 'Or type / paste the UID (also works with readers in keyboard mode)',
    register: 'Register', adminLink: 'Admin login',
    rdNone: 'reader not connected', rdUidSet: 'UID set', rdRead: s => `read via ${s}`,
    rdArduinoOn: 'Arduino connected — tap a card', rdArduinoOff: 'Arduino disconnected',
    rdBridgeConn: 'connecting to bridge…', rdBridgeOn: 'SpringCard bridge connected', rdBridgeOff: 'bridge disconnected', rdBridgeDown: 'bridge not running',
    rdReader: n => 'Reader: ' + n, rdPhoneOn: 'Phone NFC ready — tap a card',
    camNotAvail: 'Camera not available. Open this page via https:// or http://localhost.',
    camDenied: 'Camera permission was denied. Allow camera access in your browser settings and try again.',
    serialUnsupported: 'Web Serial is not supported. Use Chrome or Edge on a computer.',
    serialFail: 'Could not open the serial port: ',
    bridgeFail: 'Bridge not reachable. Start it with "npm run bridge" on the computer that has the SpringCard reader.',
    webNfcUnsupported: 'Web NFC is only available in Chrome on Android (over https).', nfcErr: 'NFC error: ',
    fillRequired: 'Please fill in name, email and a password of at least 8 characters.',
    regDone: 'Registration complete. Thank you, and happy National Day!',
    kbSpace: 'space', kbShow: 'Show keyboard', kbHide: 'Hide keyboard',
    // admin
    adminLogin: 'Admin login', username: 'Username', pwdLabel: 'Password', signIn: 'Sign in', backReg: 'Back to registration',
    dashboard: 'Admin dashboard', exportCsv: 'Export CSV', refresh: 'Refresh', logout: 'Log out',
    stTotal: 'Total users', stToday: 'Today', st7: 'Last 7 days', stPhoto: 'With photo', stNfc: 'With NFC card',
    usersTitle: 'Registered users', thPhoto: 'Photo', thName: 'Name', thEmail: 'Email', thPhone: 'Phone', thUid: 'NFC UID', thDate: 'Registered',
    del: 'Delete', delConfirm: n => `Delete ${n}?`, noUsers: 'No users registered yet.', photoOf: n => 'Photo of ' + n
  },
  ar: {
    pageTitle: 'التسجيل · عيد الاتحاد', adminTitle: 'المشرف · عيد الاتحاد',
    heroDate: '٢ ديسمبر · اليوم الوطني', heroSub: 'عيد الاتحاد · اليوم الوطني لدولة الإمارات',
    heroGreet: 'كل عام والإمارات بخير · الاحتفال الخامس والخمسون',
    footTxt: 'صُنع بحب للإمارات العربية المتحدة', footAr: 'الإمارات العربية المتحدة',
    title: 'إنشاء حسابك', sub: 'أدخل بياناتك والتقط صورة وقرّب بطاقة NFC.',
    step1: '١. بياناتك', fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'الهاتف (اختياري)',
    password: 'كلمة المرور (٨ أحرف على الأقل)',
    step2: '٢. الصورة', camPh: 'الكاميرا متوقفة. اضغط «تشغيل الكاميرا».', startCam: 'تشغيل الكاميرا', snap: 'التقاط صورة', retake: 'إعادة الالتقاط',
    camHint: 'سيطلب المتصفح إذنًا لاستخدام الكاميرا. تتطلب الكاميرا https:// أو http://localhost.',
    step3: '٣. بطاقة NFC', cardUid: 'رقم البطاقة:', uidNone: '— لم تُمسح بعد —',
    btnArduino: 'ربط قارئ Arduino (USB)', btnSpring: 'ربط قارئ SpringCard (الجسر)', btnWebNfc: 'استخدام NFC في هذا الهاتف',
    uidManualLabel: 'أو اكتب / الصق رقم البطاقة (يعمل أيضًا مع القارئات بوضع لوحة المفاتيح)',
    register: 'تسجيل', adminLink: 'دخول المشرف',
    rdNone: 'القارئ غير متصل', rdUidSet: 'تم إدخال الرقم', rdRead: s => `تمت القراءة عبر ${s}`,
    rdArduinoOn: 'Arduino متصل — قرّب البطاقة', rdArduinoOff: 'تم فصل Arduino',
    rdBridgeConn: 'جارٍ الاتصال بالجسر…', rdBridgeOn: 'جسر SpringCard متصل', rdBridgeOff: 'تم فصل الجسر', rdBridgeDown: 'الجسر غير شغّال',
    rdReader: n => 'القارئ: ' + n, rdPhoneOn: 'NFC الهاتف جاهز — قرّب البطاقة',
    camNotAvail: 'الكاميرا غير متاحة. افتح الصفحة عبر https:// أو http://localhost.',
    camDenied: 'تم رفض إذن الكاميرا. اسمح بالوصول إلى الكاميرا من إعدادات المتصفح ثم أعد المحاولة.',
    serialUnsupported: 'Web Serial غير مدعوم. استخدم Chrome أو Edge على الحاسوب.',
    serialFail: 'تعذّر فتح المنفذ التسلسلي: ',
    bridgeFail: 'تعذّر الوصول إلى الجسر. شغّله بالأمر "npm run bridge" على الحاسوب المتصل به قارئ SpringCard.',
    webNfcUnsupported: 'خاصية Web NFC متاحة فقط في Chrome على أندرويد (عبر https).', nfcErr: 'خطأ NFC: ',
    fillRequired: 'يرجى إدخال الاسم والبريد الإلكتروني وكلمة مرور من ٨ أحرف على الأقل.',
    regDone: 'تم التسجيل بنجاح. شكرًا لك وكل عام والإمارات بخير!',
    kbSpace: 'مسافة', kbShow: 'إظهار لوحة المفاتيح', kbHide: 'إخفاء لوحة المفاتيح',
    adminLogin: 'دخول المشرف', username: 'اسم المستخدم', pwdLabel: 'كلمة المرور', signIn: 'تسجيل الدخول', backReg: 'العودة إلى التسجيل',
    dashboard: 'لوحة المشرف', exportCsv: 'تصدير CSV', refresh: 'تحديث', logout: 'تسجيل الخروج',
    stTotal: 'إجمالي المستخدمين', stToday: 'اليوم', st7: 'آخر ٧ أيام', stPhoto: 'لديهم صورة', stNfc: 'لديهم بطاقة NFC',
    usersTitle: 'المستخدمون المسجلون', thPhoto: 'الصورة', thName: 'الاسم', thEmail: 'البريد', thPhone: 'الهاتف', thUid: 'رقم NFC', thDate: 'تاريخ التسجيل',
    del: 'حذف', delConfirm: n => `هل تريد حذف ${n}؟`, noUsers: 'لا يوجد مستخدمون مسجلون بعد.', photoOf: n => 'صورة ' + n
  }
};

let LANG = 'en';
try { LANG = localStorage.getItem('lang') || 'en'; } catch { /* storage blocked */ }
const langListeners = [];

function t(key, ...args) {
  const v = (I18N[LANG] && I18N[LANG][key]) ?? I18N.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}
function onLang(fn) { langListeners.push(fn); }

function applyI18n() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
  document.title = t(document.body.dataset.title || 'pageTitle');
  const b = document.getElementById('langBtn');
  if (b) b.textContent = LANG === 'ar' ? 'English' : 'العربية';
  langListeners.forEach(f => f());
}
function toggleLang() {
  LANG = LANG === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem('lang', LANG); } catch { /* ignore */ }
  applyI18n();
}
document.addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('langBtn');
  if (b) b.onclick = toggleLang;
  applyI18n();
});
