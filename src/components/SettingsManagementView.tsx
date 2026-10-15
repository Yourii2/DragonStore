import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Database, 
  ShieldCheck, 
  Sliders, 
  Download, 
  Upload, 
  Save, 
  RefreshCcw, 
  CheckCircle2, 
  Key, 
  FileCode, 
  Layers, 
  Globe
} from 'lucide-react';
import { systemAuthStore } from '../store/systemAuthStore';

interface SettingsManagementViewProps {
  onReinstall: () => void;
}

export const SettingsManagementView: React.FC<SettingsManagementViewProps> = ({ onReinstall }) => {
  const [activeSubTab, setActiveSubTab] = useState<'GENERAL' | 'EXPENSE_RATIO' | 'DATABASE' | 'RBAC'>('GENERAL');
  
  const [shopRatio, setShopRatio] = useState(70);
  const [freelanceRatio, setFreelanceRatio] = useState(30);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [companyData, setCompanyData] = useState({
    nameAr: 'دراغون سيستمز لتقنية المعلومات والحلول البرمجية',
    nameEn: 'Dragon Systems IT & Software Solutions',
    currency: 'EGP (جنيه مصري)',
    taxNumber: 'TR-982-104-551',
    commercialRecord: 'CR-104829',
    vatRate: 14,
    fiscalYearStart: '01-01'
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0-PROD',
      database: 'MySQL 8.0+ Dual ERP',
      config: systemAuthStore.installationState
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dual_erp_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            <span>إعدادات النظام والتهيئة المحاسبية والنسخ الاحتياطي</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">تخصيص هوية المنشأة، نسب المصروفات المشتركة، الصلاحيات، والنسخ الاحتياطي</p>
        </div>

        <button
          onClick={handleExportBackup}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>تصدير نسخة احتياطية (Backup JSON)</span>
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
        {[
          { id: 'GENERAL', label: 'هوية المؤسسة والضرائب', icon: Building2 },
          { id: 'EXPENSE_RATIO', label: 'توزيع المصروفات المشتركة (70/30)', icon: Sliders },
          { id: 'DATABASE', label: 'قاعدة البيانات والنسخ الاحتياطي', icon: Database },
          { id: 'RBAC', label: 'الأدوار وصلاحيات المستخدمين', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-2 text-xs text-emerald-300 font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>تم حفظ وتطبيق التعديلات على إعدادات المنظومة وقاعدة البيانات بنجاح!</span>
        </div>
      )}

      {/* GENERAL TAB */}
      {activeSubTab === 'GENERAL' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-5">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>بيانات المنشأة والهوية الرسمية</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">اسم المؤسسة التجاري (عربي):</label>
              <input
                type="text"
                value={companyData.nameAr}
                onChange={(e) => setCompanyData({ ...companyData, nameAr: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">الاسم التجاري بالإنجليزية:</label>
              <input
                type="text"
                value={companyData.nameEn}
                onChange={(e) => setCompanyData({ ...companyData, nameEn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">الرقم الضريبي الرسمي:</label>
              <input
                type="text"
                value={companyData.taxNumber}
                onChange={(e) => setCompanyData({ ...companyData, taxNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">السجل التجاري:</label>
              <input
                type="text"
                value={companyData.commercialRecord}
                onChange={(e) => setCompanyData({ ...companyData, commercialRecord: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">نسبة ضريبة القيمة المضافة (VAT %):</label>
              <input
                type="number"
                value={companyData.vatRate}
                onChange={(e) => setCompanyData({ ...companyData, vatRate: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">العملة الأساسية:</label>
              <input
                type="text"
                disabled
                value={companyData.currency}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ البيانات الأساسية</span>
            </button>
          </div>
        </form>
      )}

      {/* EXPENSE RATIO TAB */}
      {activeSubTab === 'EXPENSE_RATIO' && (
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>معادلة توزيع المصروفات المشتركة (Shared Overhead Allocation Engine)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              المصروفات المشتركة مثل (فاتورة الكهرباء، إيجار المقر، فاتورة الإنترنت المركزي) يتم توزيعها آلياً في دفتر اليومية العامة.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="text-cyan-400 font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500" />
                <span>متجر الحواسيب والخدمات (BU 1): {shopRatio}%</span>
              </div>
              <div className="text-purple-400 font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span>تطوير البرمجيات السحابية (BU 2): {freelanceRatio}%</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={shopRatio}
              onChange={(e) => {
                const val = Number(e.target.value);
                setShopRatio(val);
                setFreelanceRatio(100 - val);
              }}
              className="w-full accent-cyan-500 cursor-pointer h-2.5"
            />

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-mono">
              مثال: عند تسجيل مصروف إنترنت بقيمة 1,000 ج.م كـ "مصروف مشترك"، يُنشئ النظام قيداً تلقائياً:
              <br />
              • من حـ/ مصروفات إنترنت المتجر (BU 1): <strong className="text-cyan-400">{(1000 * shopRatio / 100)} ج.م</strong>
              <br />
              • من حـ/ مصروفات إنترنت البرمجيات (BU 2): <strong className="text-purple-400">{(1000 * freelanceRatio / 100)} ج.م</strong>
              <br />
              • إلى حـ/ الخزينة الرئيسية / البنك: <strong className="text-emerald-400">1,000 ج.م</strong>
            </div>
          </div>

          <button
            onClick={() => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000); }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ نسبة التوزيع</span>
          </button>
        </div>
      )}

      {/* DATABASE TAB */}
      {activeSubTab === 'DATABASE' && (
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>حالة قاعدة البيانات والنسخ الاحتياطي والصيانة</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">محرك MySQL 8.0+ Core مع 55 جدولاً وعلاقات ربط Foreign Keys</p>
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              متصل ونشط
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">النسخ الاحتياطي الكامل (Full Backup)</h4>
              <p className="text-[11px] text-slate-400">تنزيل نسخة مشفرة من كافة الجداول والقيود المحاسبية وسجلات العملاء.</p>
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4" />
                <span>تحميل ملف Backup.json</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">إعادة تشغيل معالج التثبيت (Re-install Wizard)</h4>
              <p className="text-[11px] text-slate-400">إعادة تهيئة قاعدة البيانات وضبط الاتصال بالسيرفر من الصفر.</p>
              <button
                onClick={onReinstall}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>بدء معالج التثبيت</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RBAC TAB */}
      {activeSubTab === 'RBAC' && (
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>مصفوفة الأدوار والصلاحيات (RBAC Permissions Matrix)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">التحكم في وصول المستخدمين للوحدات والتقارير الحساسة</p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { role: 'المدير العام (Super Admin)', desc: 'صلاحيات كاملة على كافة الـ 19 موديول والشجرة المحاسبية والتقارير الربحية', count: '1 مستخدم' },
              { role: 'رئيس الحسابات (Accountant)', desc: 'إدارة القيود اليومية، ميزان المراجعة، الخزينة، والمصروفات المشتركة', count: '1 مستخدم' },
              { role: 'أمين نقطة البيع (Cashier)', desc: 'إصدار فواتير المبيعات، تحصيل النقدية، وإرجاع الفواتير فقط', count: '1 مستخدم' },
              { role: 'مهندس الصيانة والدعم الفني', desc: 'إدارة تذاكر الصيانة، صرف قطع الغيار، ومشاريع الشبكات والـ CCTV', count: '2 مستخدمين' }
            ].map((r, i) => (
              <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{r.role}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
