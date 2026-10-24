import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

/**
 * دالة مساعدة لتحديد ما إذا كان النمط الحالي ليلي/داكن (Dark Mode)
 */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
}

/**
 * تهيئة وتوليد الخصائص الجمالية الافتراضية المتناسقة مع هوية نظام دراجون
 */
function getSwalBaseOptions(): SweetAlertOptions {
  const dark = isDarkMode();
  return {
    background: dark ? '#0f172a' : '#ffffff', // slate-900 / white
    color: dark ? '#f1f5f9' : '#0f172a',      // slate-100 / slate-900
    confirmButtonColor: '#0891b2',            // cyan-600
    cancelButtonColor: '#64748b',             // slate-500
    customClass: {
      popup: 'dragon-swal-popup rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur font-[\'Cairo\',sans-serif] text-right',
      title: 'text-xl font-bold font-[\'Cairo\',sans-serif]',
      htmlContainer: 'text-sm font-[\'Cairo\',sans-serif] opacity-90 leading-relaxed',
      confirmButton: 'px-6 py-2.5 rounded-xl font-bold font-[\'Cairo\',sans-serif] shadow-md hover:brightness-110 transition-all text-white mx-1.5',
      cancelButton: 'px-6 py-2.5 rounded-xl font-bold font-[\'Cairo\',sans-serif] shadow-md hover:brightness-110 transition-all text-white mx-1.5',
      actions: 'gap-2 mt-4',
    },
    buttonsStyling: true,
  };
}

/**
 * إشعار بنجاح العملية
 */
export async function showSuccess(title: string, text?: string) {
  return Swal.fire({
    ...getSwalBaseOptions(),
    icon: 'success',
    title,
    text,
    confirmButtonText: 'حسناً',
    timer: 4000,
    timerProgressBar: true,
  });
}

/**
 * إشعار خطأ
 */
export async function showError(title: string, text?: string) {
  return Swal.fire({
    ...getSwalBaseOptions(),
    icon: 'error',
    title,
    text,
    confirmButtonText: 'إغلاق',
    confirmButtonColor: '#e11d48', // rose-600
  });
}

/**
 * إشعار تحذير
 */
export async function showWarning(title: string, text?: string) {
  return Swal.fire({
    ...getSwalBaseOptions(),
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'مفهوم',
    confirmButtonColor: '#d97706', // amber-600
  });
}

/**
 * إشعار تنبيه / معلومة
 */
export async function showInfo(title: string, text?: string) {
  return Swal.fire({
    ...getSwalBaseOptions(),
    icon: 'info',
    title,
    text,
    confirmButtonText: 'حسناً',
    confirmButtonColor: '#0284c7', // sky-600
  });
}

/**
 * نافذة تأكيد الإجراء (بديل window.confirm)
 * ترجع Promise<boolean> بصورة متوافقة 100% مع منطق الشرط
 */
export async function showConfirm(
  title: string,
  text?: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    icon?: SweetAlertIcon;
    isDanger?: boolean;
  }
): Promise<boolean> {
  const {
    confirmText = 'نعم، تأكيد',
    cancelText = 'إلغاء',
    icon = 'question',
    isDanger = false,
  } = options || {};

  const base = getSwalBaseOptions();

  const result = await Swal.fire({
    ...base,
    icon: isDanger ? 'warning' : icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true, // يضع زر الإلغاء والتأكيد بالترتيب المناسب للواجهة العربية
    confirmButtonColor: isDanger ? '#e11d48' : '#0891b2',
    cancelButtonColor: '#64748b',
    focusCancel: isDanger, // في العمليات الخطيرة التركيز على الإلغاء حمايةً للمستخدم
  });

  return result.isConfirmed;
}

/**
 * نافذة إدخال نص سريع (بديل window.prompt)
 */
export async function showPrompt(
  title: string,
  text?: string,
  options?: {
    inputPlaceholder?: string;
    inputValue?: string;
    inputType?: 'text' | 'number' | 'password' | 'textarea';
    confirmText?: string;
    cancelText?: string;
  }
): Promise<string | null> {
  const {
    inputPlaceholder = '',
    inputValue = '',
    inputType = 'text',
    confirmText = 'موافق',
    cancelText = 'إلغاء',
  } = options || {};

  const baseOptions = getSwalBaseOptions();
  const swalOpts: any = {
    ...baseOptions,
    title,
    text,
    input: inputType,
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    inputAttributes: {
      dir: 'auto',
      class: 'rounded-xl border border-slate-600 px-4 py-2 font-[\'Cairo\',sans-serif] bg-slate-900 text-white',
    },
  };

  const result = await Swal.fire(swalOpts);

  if (result.isConfirmed && typeof result.value === 'string') {
    return result.value;
  }
  return null;
}

/**
 * توست إشعار منبثق في زاوية الشاشة (سريع وغير معطل للمستخدم)
 */
export function showToast(
  title: string,
  icon: SweetAlertIcon = 'success',
  timer = 3000
) {
  const dark = isDarkMode();
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-start',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    background: dark ? '#1e293b' : '#ffffff',
    color: dark ? '#f8fafc' : '#0f172a',
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
    customClass: {
      popup: 'dragon-swal-toast font-[\'Cairo\',sans-serif] rounded-xl shadow-lg border border-slate-700/50 text-right',
    },
  });

  Toast.fire({
    icon,
    title,
  });
}

/**
 * استبدال window.alert و window.confirm عالمياً لضمان عدم ظهور أي نافذة تقليدية أبداً
 */
export function setupGlobalSwalPolyfills() {
  if (typeof window === 'undefined') return;

  // Polyfill alert
  window.alert = (message?: any) => {
    const msg = message !== undefined ? String(message) : '';
    // اكتشاف نوع الرسالة تقريبياً من المحتوى
    if (msg.includes('خطأ') || msg.includes('فشل') || msg.includes('تعذر')) {
      showError('تنبيه من النظام', msg);
    } else if (msg.includes('تحذير') || msg.includes('تنبيه') || msg.includes('يرجى') || msg.includes('يجب')) {
      showWarning('تنبيه هام', msg);
    } else if (msg.includes('بنجاح') || msg.includes('تم ')) {
      showSuccess('تمت العملية', msg);
    } else {
      showInfo('إشعار من النظام', msg);
    }
  };

  // Polyfill confirm
  window.confirm = (message?: string) => {
    // window.confirm متزامن في المتصفح، لكننا ننبه المستدعي ونطلق النافذة
    const msg = message || 'هل أنت متأكد من المتابعة؟';
    // في الكود الحديث نستخدم showConfirm مباشرة async
    // كـ fallback نقوم بإطلاق تنبيه SweetAlert
    showConfirm('تأكيد الإجراء', msg);
    return true;
  };
}

// تصدير الكائن الأصلي أيضاً لمن يحتاج تخصيص دقيق
export { Swal };
export default Swal;
