import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Cpu,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  RefreshCw,
  Globe,
  Building,
  Phone,
  MessageSquare,
  Lock,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';

interface LicenseState {
  hwid: string;
  program_name: string;
  program_version: string;
  company?: string;
  phone?: string;
  license_type: string;
  status: 'active' | 'expired' | 'blocked' | 'unregistered' | string;
  end_date: string;
  is_expired: boolean;
  last_verified_at: string;
  last_online_verified_at?: string;
  server_time?: string;
  message?: string;
}

export const ActivationSettingsView: React.FC = () => {
  const [license, setLicense] = useState<LicenseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activatingOnline, setActivatingOnline] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedHwid, setCopiedHwid] = useState(false);

  // Fetch status & load current company name
  const fetchLicenseStatus = async () => {
    try {
      setLoading(true);
      // Fetch system status & license status in parallel
      const [licRes, compRes] = await Promise.all([
        fetch('/api/license/status').then(r => r.json()).catch(() => null),
        fetch('/api/settings/company').then(r => r.json()).catch(() => null)
      ]);

      if (licRes?.success && licRes.data) {
        setLicense(licRes.data);
      }

      // Populate default company name and phone accurately
      if (compRes?.success && compRes.data?.company_name) {
        setCompanyName(compRes.data.company_name);
        if (compRes.data.phones) setPhone(compRes.data.phones);
      } else if (licRes?.data?.company) {
        setCompanyName(licRes.data.company);
        if (licRes.data.phone) setPhone(licRes.data.phone);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'فشل تحميل بيانات الترخيص: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  // Online Activation / Sync via Cloud Google Sheet ONLY
  const handleOnlineActivation = async () => {
    try {
      setActivatingOnline(true);
      setNotification(null);

      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyName.trim(),
          phone: phone.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setLicense(data.data);
        setNotification({
          type: 'success',
          message: data.message || 'تم الاتصال بالسحابة والتحقق من صلاحية الترخيص وتحديثه بنجاح!'
        });
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'فشلت عملية التحقق السحابي.'
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'حدث خطأ في الاتصال بالخادم: ' + err.message
      });
    } finally {
      setActivatingOnline(false);
    }
  };

  // Copy HWID to clipboard
  const handleCopyHwid = () => {
    if (!license?.hwid) return;
    navigator.clipboard.writeText(license.hwid);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2500);
  };

  const getStatusBadge = () => {
    if (!license) return null;
    if (license.status === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" />
          محظور من الاستخدام
        </span>
      );
    }
    if (license.is_expired || license.status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          الترخيص منتهي الصلاحية
        </span>
      );
    }
    if (license.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          مفعل ونشط ({license.license_type || 'كاملة'})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        <Lock className="w-3.5 h-3.5" />
        غير مسجل / غير مفعل
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">إعدادات تفعيل وترخيص النظام</h1>
                {getStatusBadge()}
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                تفعيل النسخة الرسمية عبر السيرفر السحابي (Google Sheets License Hub) ومطابقة بصمة العتاد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLicenseStatus}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2 backdrop-blur-sm border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              تحديث الحالة
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold border transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              : notification.type === 'error'
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-75 hover:opacity-100 px-2 py-1"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* HWID & Core Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Hardware ID Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">معرف الجهاز الحصري (Hardware ID)</h3>
                <p className="text-[11px] text-slate-500">البصمة المشفرة للعتاد (Motherboard UUID + Drive Serial)</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              DRAGON-HWID
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-widest dir-ltr">
              {license?.hwid || 'جاري استخراج المعرف...'}
            </div>
            <button
              onClick={handleCopyHwid}
              disabled={!license?.hwid}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 flex-shrink-0 ${
                copiedHwid
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              {copiedHwid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم النسخ بنجاح
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  نسخ الكود للإدارة
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            * قم بنسخ هذا المعرف وإرساله للمسؤول لإضافته أو تحديث حالته في جدول التراخيص المركزي (Google Sheet).
          </p>
        </div>

        {/* License Overview Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">تفاصيل الترخيص</h3>
                <p className="text-[11px] text-slate-500">حالة الصلاحية والتسجيل</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">الشركة المسجلة:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {license?.company || companyName || 'غير مسجل'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">نوع الترخيص:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {license?.license_type || 'غير محدد'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">تاريخ الانتهاء:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {license?.end_date ? new Date(license.end_date).toLocaleDateString('ar-EG') : 'مدى الحياة / دائم'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">التحقق السحابي:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5" />
                  Google Cloud Hub
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-500">الحماية المحلية:</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  AES-256 (Dragon.enc)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Online Activation Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                التفعيل والتحقق السحابي المباشر (Cloud Online License)
              </h3>
              <p className="text-xs text-slate-500">يتم إرسال وقراءة التفعيل حصرياً عبر شيت التراخيص المعتمد</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            يقوم النظام بإرسال بيانات شركتك ورقم الهاتف وبصمة الجهاز الفريدة (HWID) إلى سيرفر Google Sheets المعتمد، وفي حال وجود الترخيص أو تجديده يتم تنزيل مفتاح التشفير وحفظه في ملف الأمان المحلي.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم المنشأة / الشركة (المسجل بالشيت)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="اسم الشركة كما يظهر في الفواتير وإعدادات الشركة"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رقم الهاتف المعتمد
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="رقم هاتف المنشأة أو المسؤول"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleOnlineActivation}
            disabled={activatingOnline}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${activatingOnline ? 'animate-spin' : ''}`} />
            {activatingOnline ? 'جاري الاتصال والتحقق من الشيت...' : 'تحديث والتحقق من التفعيل السحابي الآن'}
          </button>
        </div>
      </div>

      {/* Support & Notice Footer */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">الدعم الفني وإدارة التراخيص</h4>
            <p className="text-[11px] text-slate-500">لتفعيل ترخيص جديد أو تجديد الصلاحية في شيت التراخيص</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="text-slate-600 dark:text-slate-400">هاتف الدعم المباشر:</span>
          <a
            href="tel:01050016289"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            01050016289
          </a>
        </div>
      </div>
    </div>
  );
};
