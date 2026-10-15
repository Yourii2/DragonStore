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
  Github
} from 'lucide-react';

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseNotes?: string;
  publishedAt?: string;
  downloadUrl?: string;
}

export const UpdateSettingsView: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    currentVersion: 'v1.0.0',
    latestVersion: 'v1.0.0',
    hasUpdate: false
  });

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const repoUrl = 'https://github.com/Yourii2/DragonStore.git';

  // Check for updates from backend
  const checkUpdates = async () => {
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
          downloadUrl: data.downloadUrl
        });

        if (data.hasUpdate) {
          setMessage(`يوجد إصدار أحدث متوفر (${data.latestVersion})! يمكنك التحديث الآن.`);
        } else {
          setMessage('أنت تعمل حالياً بأحدث إصدار مستقر من النظام.');
        }
      }
    } catch (err: any) {
      setMessage('تعذر الاتصال بـ GitHub للتحقق من التحديثات: ' + err.message);
    } finally {
      setChecking(false);
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
            <span>إعدادات التحديث ومزامنة GitHub</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة إصدارات البرنامج والتحقق الفوري من التحديثات الجديدة عبر المستودع الرسمي
          </p>
        </div>

        <button
          onClick={checkUpdates}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'جارٍ التحقق من GitHub...' : 'التحقق من وجود تحديثات'}</span>
        </button>
      </div>

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

        {/* Update Instructions & Actions */}
        <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/20 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-cyan-900 dark:text-cyan-200">
            <ShieldCheck className="w-5 h-5 text-cyan-500 shrink-0" />
            <span>
              نظام التحديث التلقائي مرتبط بمستودع GitHub. يتم فحص الإصدارات الجديدة وإرسال إشعار فوري عند توفر نسخة أحدث.
            </span>
          </div>

          {updateInfo.hasUpdate && (
            <a
              href="https://github.com/Yourii2/DragonStore/releases"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل التحديث من GitHub</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
