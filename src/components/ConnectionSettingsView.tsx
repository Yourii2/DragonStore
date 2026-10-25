import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Server, 
  Database, 
  Key, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Upload, 
  RefreshCw,
  Layers,
  FileCode,
  HardDrive
} from 'lucide-react';
import { showSuccess, showError, showWarning, showConfirm, showToast } from '../utils/swal';

export const ConnectionSettingsView: React.FC = () => {
  const [formData, setFormData] = useState({
    host: 'localhost',
    port: 3306,
    database: 'dragon_erp_production',
    username: 'root',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backup / Restore states
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current connection settings
  const fetchConnectionSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/connection');
      const data = await res.json();
      if (data.success && data.data) {
        setFormData({
          host: data.data.host || 'localhost',
          port: Number(data.data.port) || 3306,
          database: data.data.database || 'dragon_erp_production',
          username: data.data.username || 'root',
          password: data.data.password || ''
        });
      }
    } catch (err) {
      console.error('Error fetching connection settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionSettings();
  }, []);

  // Save & Test Connection
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message || 'تم اختبار الاتصال وحفظ الإعدادات بنجاح!' });
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'فشل الاتصال بقاعدة البيانات' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'خطأ في الاتصال بالخادم: ' + err.message });
    } finally {
      setTesting(false);
    }
  };

  // Export DB Backup
  const handleExportBackup = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/settings/backup/export');
      if (!res.ok) throw new Error('فشل التصدير من الخادم');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dragon_erp_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      showError('خطأ أثناء التصدير', 'خطأ أثناء تصدير قاعدة البيانات: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Import DB Backup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await showConfirm(
      'تحذير استيراد نسخة قاعدة البيانات',
      'تحذير هام: استيراد نسخة قاعدة البيانات سيقوم بتحديث واستبدال السجلات الموجودة بالنسخة المستوردة. هل أنت متأكد من الاستمرار؟',
      { isDanger: true, confirmText: 'نعم، استيراد واستبدال', cancelText: 'إلغاء' }
    );

    if (!confirmed) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    setImportMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupJson = JSON.parse(text);

        const res = await fetch('/api/settings/backup/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backup: backupJson })
        });
        const data = await res.json();
        if (data.success) {
          showSuccess('تم الاستيراد بنجاح', data.message || 'تمت استعادة قاعدة البيانات وتحديث السجلات بنجاح');
          setImportMessage({ type: 'success', text: data.message });
        } else {
          showError('فشل الاستيراد', data.message || 'فشل استيراد النسخة');
          setImportMessage({ type: 'error', text: data.message || 'فشل استيراد النسخة' });
        }
      } catch (err: any) {
        showError('خطأ بالملف', err.message);
        setImportMessage({ type: 'error', text: 'ملف غير صالح أو خطأ بالاستيراد: ' + err.message });
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
            <Radio className="w-6 h-6" />
            <span>إعدادات الاتصال وقاعدة البيانات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إعداد وتعديل معلمات اتصال خادم MySQL وإدارة النسخ الاحتياطية للنظام
          </p>
        </div>
      </div>

      {/* Part 1: Connection Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
          <Server className="w-4 h-4 text-cyan-500" />
          <span>بيانات خادم قاعدة البيانات (MySQL Connection)</span>
        </h3>

        {statusMessage && (
          <div className={`p-4 rounded-2xl mb-5 flex items-center gap-3 text-xs font-bold ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-500/30'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveConnection} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. عنوان السيرفر */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>عنوان السيرفر (Server Host): *</span>
              </label>
              <input
                type="text"
                required
                placeholder="localhost أو 127.0.0.1 أو عنوان IP الخادم"
                value={formData.host}
                onChange={e => setFormData({ ...formData, host: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* 2. بورت السيرفر */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-slate-400" />
                <span>بورت السيرفر (Port): *</span>
              </label>
              <input
                type="number"
                required
                placeholder="3306"
                value={formData.port}
                onChange={e => setFormData({ ...formData, port: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* 3. اسم المستخدم */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>اسم المستخدم (Username): *</span>
              </label>
              <input
                type="text"
                required
                placeholder="root"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* 4. كلمة المرور */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>كلمة المرور (Password):</span>
              </label>
              <input
                type="password"
                placeholder="كلمة مرور MySQL (اتركها فارغة إن لم تكن محددة)"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* 5. اسم قاعدة البيانات */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>اسم قاعدة البيانات (Database Name): *</span>
            </label>
            <input
              type="text"
              required
              placeholder="dragon_erp_production"
              value={formData.database}
              onChange={e => setFormData({ ...formData, database: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={testing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'جارٍ فحص الاتصال وحفظ الإعدادات...' : 'اختبار الاتصال وحفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Part 2: Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
          <HardDrive className="w-4 h-4 text-emerald-500" />
          <span>النسخ الاحتياطي واستعادة قاعدة البيانات (Backup & Restore)</span>
        </h3>

        {importMessage && (
          <div className={`p-4 rounded-2xl mb-5 flex items-center gap-3 text-xs font-bold ${
            importMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-500/30'
          }`}>
            {importMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{importMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* تصدير نسخة */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200 mb-1.5">
                <Download className="w-4 h-4 text-cyan-500" />
                <span>تصدير نسخة من قاعدة البيانات</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                تحميل ملف نسخة احتياطية كامل لجميع الجداول والسجلات والعمليات المالية والمخزنية بصيغة JSON آمنة.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'جارٍ تحضير النسخة وتنزيلها...' : 'تصدير وتحميل النسخة الآن'}</span>
            </button>
          </div>

          {/* استيراد نسخة */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200 mb-1.5">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>استيراد نسخة من قاعدة البيانات</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                استعادة قاعدة البيانات من ملف JSON تم تصديره مسبقاً لاسترجاع كافة البيانات والعمليات.
              </p>
            </div>

            <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors text-center">
              <Upload className="w-4 h-4" />
              <span>{importing ? 'جارٍ معالجة واستيراد البيانات...' : 'اختيار ملف النسخة لاستيراده'}</span>
              <input
                type="file"
                accept=".json"
                disabled={importing}
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
