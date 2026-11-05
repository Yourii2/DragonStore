import React, { useState, useEffect } from 'react';
import { 
  Download, 
  GitBranch, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Tag, 
  ArrowUpCircle,
  Github,
  RotateCcw,
  Trash2,
  Database,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { showSuccess, showError, showWarning, showConfirm, showPrompt } from '../utils/swal';

interface UpdateSettingsViewProps {
  onFactoryReset?: () => void;
}

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseNotes?: string;
  publishedAt?: string;
  downloadUrl?: string;
  assetDownloadUrl?: string;
  assetName?: string;
}

export const UpdateSettingsView: React.FC<UpdateSettingsViewProps> = ({ onFactoryReset }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    currentVersion: 'v1.0.0',
    latestVersion: 'v1.0.0',
    hasUpdate: false
  });

  const [checking, setChecking] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const [updateProgressText, setUpdateProgressText] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);

  // Maintenance & Reset state
  const [actionLoading, setActionLoading] = useState<'zero' | 'factory' | null>(null);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string; backupFile?: string } | null>(null);

  const repoUrl = 'https://github.com/Yourii2/DragonStore.git';

  // Trigger client-side JSON download of backup
  const triggerBackupDownload = (backup: any, prefix: string) => {
    if (!backup) return;
    try {
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prefix}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to trigger backup download:', e);
    }
  };

  // Check for updates from backend
  const checkUpdates = async (showNotification = false) => {
    try {
      setChecking(true);
      setMessage(null);
      const res = await fetch('/api/system/check-updates');
      const data = await res.json();
      if (data.success) {
        setUpdateInfo({
          currentVersion: data.currentVersion || 'v1.0.0',
          latestVersion: data.latestVersion || 'v1.0.0',
          hasUpdate: !!data.hasUpdate,
          releaseNotes: data.releaseNotes,
          publishedAt: data.publishedAt,
          downloadUrl: data.downloadUrl,
          assetDownloadUrl: data.assetDownloadUrl,
          assetName: data.assetName
        });

        if (data.hasUpdate) {
          setMessage(`يوجد إصدار أحدث متوفر (${data.latestVersion})! يمكنك التحديث الآن.`);
          if (showNotification) {
            showSuccess('تحديث جديد متاح!', `يتوفر إصدار جديد (${data.latestVersion}). يمكنك النقر على "تثبيت وتطبيق التحديث الآن" لتحديث النظام تلقائياً.`);
          }
        } else {
          setMessage('أنت تعمل حالياً بأحدث إصدار مستقر من النظام.');
          if (showNotification) {
            showSuccess('النظام محدث', `أنت تعمل حالياً بأحدث إصدار مستقر (${data.currentVersion}).`);
          }
        }
      }
    } catch (err: any) {
      setMessage('تعذر الاتصال بـ GitHub للتحقق من التحديثات: ' + err.message);
      if (showNotification) {
        showError('خطأ أثناء الفحص', err.message);
      }
    } finally {
      setChecking(false);
    }
  };

  // 1-Click Automatic System Update Handler
  const handleApplyUpdate = async () => {
    const isForced = !updateInfo.hasUpdate;
    const title = isForced ? 'إعادة تثبيت / تحديث إجباري للنظام' : 'تطبيق التحديث التلقائي الفوري';
    const desc = isForced
      ? `أنت تعمل حالياً بالإصدار (${updateInfo.currentVersion}). هل ترغب في تنزيل أحدث ملفات النظام من GitHub واستبدالها؟\n\n🛡️ ملاحظة هامة: سيتم الحفاظ الكامل على قاعدة البيانات والتراخيص والإعدادات.`
      : `هل أنت متأكد من بدء التحديث التلقائي إلى الإصدار (${updateInfo.latestVersion})؟\n\n📦 سيقوم النظام تلقائياً بـ:\n1. تنزيل حزمة التحديث الرسمية من GitHub.\n2. فك الضغط واستبدال ملفات النظام بالملفات الجديدة.\n3. الحفاظ التام والصارم على قاعدة البيانات وتراخيص التشغيل.\n4. إعادة تنشيط النظام فوراً.`;

    const confirm = await showConfirm(title, desc, {
      confirmText: isForced ? 'متابعة التحديث الإجباري' : 'بدء التحديث التلقائي الآن',
      cancelText: 'إلغاء'
    });
    if (!confirm) return;

    try {
      setApplyingUpdate(true);
      setUpdateProgressText('جارٍ الاتصال بـ GitHub وتنزيل حزمة التحديث...');

      const res = await fetch('/api/system/apply-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadUrl: updateInfo.assetDownloadUrl,
          version: updateInfo.latestVersion
        })
      });

      const data = await res.json();
      if (data.success) {
        setUpdateProgressText('تم استبدال وتحديث الملفات بنجاح! جارٍ تنشيط التحديث...');
        await showSuccess(
          'تم تثبيت التحديث بنجاح! 🎉',
          `${data.message}\nتم تحديث ${data.filesUpdated || ''} ملفاً بنجاح.\nسيتم إعادة تحميل الصفحة الآن للاستمتاع بالإصدار الجديد.`
        );
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.error || 'فشلت عملية تطبيق التحديث');
      }
    } catch (err: any) {
      showError('فشل تطبيق التحديث', err.message);
    } finally {
      setApplyingUpdate(false);
      setUpdateProgressText('');
    }
  };

  // 1. Zero Counters Handler
  const handleZeroCounters = async () => {
    const confirmFirst = await showConfirm(
      'تحذير أمني شديد الأهمية',
      'هل أنت متأكد من تصفير جميع العدادات والمعاملات؟ سيتم أخذ نسخة احتياطية كاملة وتنزيلها تلقائياً، وتصفير المبيعات والأرصدة والكميات مع الحفاظ على البيانات الأساسية.',
      { isDanger: true, confirmText: 'متابعة التصفير', cancelText: 'إلغاء' }
    );
    if (!confirmFirst) return;

    const confirmSecond = await showPrompt(
      'تأكيد نهائي لعملية التصفير',
      'للتأكيد النهائي، يرجى كتابة كلمة "تصفير" في المربع أدناه للمتابعة:',
      { inputPlaceholder: 'تصفير', confirmText: 'تأكيد التصفير', cancelText: 'تراجع' }
    );
    if (confirmSecond !== 'تصفير') {
      showWarning('تم الإلغاء', 'تم إلغاء عملية التصفير.');
      return;
    }

    try {
      setActionLoading('zero');
      setActionStatus(null);
      const res = await fetch('/api/system/zero-counters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (data.backup) {
          triggerBackupDownload(data.backup, 'zero_counters_auto');
        }
        setActionStatus({
          type: 'success',
          message: data.message || 'تم تصفير جميع العدادات وتصفير الأرصدة والكميات بنجاح مع حفظ نسخة احتياطية.',
          backupFile: data.backupFile
        });
        showSuccess('تم التصفير بنجاح', 'تم تصفير جميع العدادات والكميات بنجاح وتم حفظ نسخة احتياطية وتنزيلها تلقائياً على جهازك.');
      } else {
        throw new Error(data.error || 'فشلت عملية التصفير');
      }
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: 'حدث خطأ أثناء تصفير العدادات: ' + err.message
      });
      showError('خطأ أثناء التصفير', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Factory Reset Handler
  const handleFactoryReset = async () => {
    const confirmFirst = await showConfirm(
      'تحذير خطير جداً: إعادة ضبط المصنع',
      'هل أنت متأكد تماماً من رغبتك في إعادة ضبط المصنع؟ سيتم أخذ نسخة احتياطية كاملة وتنزيلها فوراً، وإرجاع النظام لحالة ما قبل التثبيت لتشغيل المعالج مجدداً.',
      { isDanger: true, confirmText: 'متابعة ضبط المصنع', cancelText: 'إلغاء' }
    );
    if (!confirmFirst) return;

    const confirmSecond = await showPrompt(
      'تأكيد نهائي صارم',
      'للتأكيد النهائي الصارم، اكتب "ضبط المصنع" في المربع أدناه:',
      { inputPlaceholder: 'ضبط المصنع', confirmText: 'تنفيذ ضبط المصنع', cancelText: 'تراجع' }
    );
    if (confirmSecond !== 'ضبط المصنع') {
      showWarning('تم الإلغاء', 'تم إلغاء عملية ضبط المصنع.');
      return;
    }

    try {
      setActionLoading('factory');
      setActionStatus(null);
      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (data.backup) {
          triggerBackupDownload(data.backup, 'factory_reset_auto');
        }
        await showSuccess('تمت إعادة ضبط المصنع بنجاح', 'تم حفظ نسخة احتياطية كاملة! جاري تحويلك الآن إلى معالج التثبيت...');
        if (onFactoryReset) {
          onFactoryReset();
        } else {
          window.location.reload();
        }
      } else {
        throw new Error(data.error || 'فشلت إعادة ضبط المصنع');
      }
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: 'حدث خطأ أثناء إعادة ضبط المصنع: ' + err.message
      });
      showError('خطأ أثناء إعادة الضبط', err.message);
      setActionLoading(null);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
            <Download className="w-6 h-6" />
            <span>إعدادات التحديث وصيانة النظام</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة إصدارات البرنامج، تصفير العدادات وبداية دورة جديدة، أو إعادة ضبط المصنع
          </p>
        </div>

        <button
          onClick={() => checkUpdates(true)}
          disabled={checking || applyingUpdate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'جارٍ التحقق من GitHub...' : 'التحقق من وجود تحديثات'}</span>
        </button>
      </div>

      {/* Action Status Notification */}
      {actionStatus && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs animate-slideDown ${
          actionStatus.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}>
          {actionStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <div className="space-y-1">
            <p className="font-bold">{actionStatus.message}</p>
            {actionStatus.backupFile && (
              <p className="font-mono text-[11px] opacity-80">
                مسار النسخة الاحتياطية على السيرفر: {actionStatus.backupFile}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Version Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              updateInfo.hasUpdate ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-600 shadow-emerald-600/20'
            }`}>
              {updateInfo.hasUpdate ? (
                <ArrowUpCircle className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {updateInfo.hasUpdate ? 'يتوفر إصدار جديد من البرنامج!' : 'البرنامج محدث إلى أحدث إصدار'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  {updateInfo.currentVersion}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {message || (updateInfo.hasUpdate ? `الإصدار الأحدث: ${updateInfo.latestVersion}` : 'نظام DragonStore يعمل باستقرار تام')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Yourii2/DragonStore"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>مستودع GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Repository details & Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 text-[11px] block mb-1">الإصدار الحالي المثبت:</span>
            <div className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-sm flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              <span>{updateInfo.currentVersion}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 text-[11px] block mb-1">أحدث إصدار على GitHub:</span>
            <div className={`font-mono font-black text-sm flex items-center gap-1.5 ${
              updateInfo.hasUpdate ? 'text-amber-500' : 'text-emerald-600'
            }`}>
              <Sparkles className="w-4 h-4" />
              <span>{updateInfo.latestVersion}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 text-[11px] block mb-1">رابط المستودع الرسمي:</span>
            <div className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate" title={repoUrl}>
              github.com/Yourii2/DragonStore
            </div>
          </div>
        </div>

        {/* Release notes section */}
        {updateInfo.releaseNotes && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span>ملاحظات الإصدار والتغييرات:</span>
            </h4>
            <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans">
              {updateInfo.releaseNotes}
            </div>
          </div>
        )}

        {/* 1-Click Auto Update Panel */}
        <div className="p-5 rounded-2xl border-2 border-cyan-500/30 dark:border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-50 to-emerald-500/10 dark:from-cyan-950/30 dark:via-slate-900 dark:to-emerald-950/20 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500 animate-pulse" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  التحديث التلقائي الفوري للنظام (1-Click Auto Update)
                </h4>
                {updateInfo.hasUpdate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-bounce">
                    تحديث جديد متاح!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                بمجرد الضغط على الزر، يتم تنزيل أحدث ملفات من GitHub واستبدال ملفات النظام تلقائياً مع حماية كاملة لقاعدة البيانات والتراخيص.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={handleApplyUpdate}
                disabled={applyingUpdate || checking}
                className={`w-full md:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  updateInfo.hasUpdate
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25'
                }`}
              >
                {applyingUpdate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{updateProgressText || 'جارٍ التحديث التلقائي...'}</span>
                  </>
                ) : updateInfo.hasUpdate ? (
                  <>
                    <ArrowUpCircle className="w-5 h-5" />
                    <span>تثبيت التحديث الآن ({updateInfo.latestVersion})</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>تحديث إجباري / إعادة تثبيت أحدث حزمة</span>
                  </>
                )}
              </button>

              {updateInfo.hasUpdate && (
                <a
                  href="https://github.com/Yourii2/DragonStore/releases"
                  target="_blank"
                  rel="noreferrer"
                  title="تحميل يدوي من GitHub"
                  className="flex items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Progress / Status indicator */}
          {applyingUpdate && (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-800 dark:text-cyan-200">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                  <span>{updateProgressText}</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">يرجى عدم إغلاق الصفحة</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full animate-pulse w-4/5"></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              نظام التحديث آمن 100%: لا يتم المساس ببيانات الاتصال بقاعدة البيانات (db_config.json) أو مفاتيح التفعيل والتراخيص (Dragon.enc).
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Maintenance & Resets */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-black">أدوات الصيانة، تصفير الحسابات وإعادة الضبط</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            عمليات مصيرية تتضمن أخذ نسخة احتياطية شاملة وتنزيلها تلقائياً على جهازك قبل التنفيذ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Zero Counters Card */}
          <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">تصفير العدادات والمعاملات</h4>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">بدء دورة مالية جديدة</span>
                </div>
              </div>

              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                <li>حذف جميع فواتير المبيعات وحركات المخزون والمصروفات والقيود.</li>
                <li>تصفير كميات جميع المنتجات (تصبح 0) مع الحفاظ على أسمائها وبياناتها.</li>
                <li>الحفاظ على المخازن والتصنيفات والمنتجات بدون كميات.</li>
                <li>الحفاظ على العملاء والموردين مع تصفير أرصدتهم بالكامل.</li>
                <li>الحفاظ على الموظفين ورواتبهم مع مسح السلف والمسحوبات.</li>
                <li>الحفاظ على جميع الخزائن والحسابات مع تصفير رصيدها (0.00).</li>
                <li className="text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 mt-1">
                  <Database className="w-3.5 h-3.5 inline" /> يتم أخذ وتنزيل نسخة احتياطية تلقائياً قبل الحذف.
                </li>
              </ul>
            </div>

            <button
              onClick={handleZeroCounters}
              disabled={actionLoading !== null}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {actionLoading === 'zero' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جارٍ أخذ النسخة وتصفير العدادات...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>تصفير العدادات والبدء من جديد</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Factory Reset Card */}
          <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">إعادة ضبط المصنع</h4>
                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">تشغيل معالج التثبيت من جديد</span>
                </div>
              </div>

              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                <li>إلغاء تثبيت النظام وإعادة تشغيل معالج التثبيت (Installation Wizard).</li>
                <li>يتم أخذ نسخة احتياطية كاملة وتنزيلها تلقائياً على جهازك قبل الضبط.</li>
                <li>يمكنك استخدام النسخة الاحتياطية أثناء معالج التثبيت لاسترجاع كل شيء.</li>
                <li>يتيح لك إعادة ربط قاعدة البيانات، تغيير الاسم، أو تهيئة النظام كأول مرة.</li>
                <li className="text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1 mt-1">
                  <FileCheck className="w-3.5 h-3.5 inline" /> نسخة احتياطية آمنة تضمن عدم ضياع أي بيانات.
                </li>
              </ul>
            </div>

            <button
              onClick={handleFactoryReset}
              disabled={actionLoading !== null}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {actionLoading === 'factory' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جارٍ أخذ النسخة وإعادة الضبط...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>إعادة ضبط المصنع ومعالج التثبيت</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

