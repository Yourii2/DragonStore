import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Image as ImageIcon, 
  Phone, 
  MapPin, 
  FileText, 
  Hash, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  Save, 
  Upload, 
  X,
  Sparkles,
  Wifi,
  Network,
  Code
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';
import SearchableSelect from './SearchableSelect';
import { showSuccess, showError, showWarning } from '../utils/swal';

const FOOTER_EXAMPLES = [
  'شكراً لتعاملكم معنا - نسعد دائماً بخدمتكم ورضاكم غايتنا.',
  'البضاعة المباعة ترد وتستبدل خلال 14 يوماً من تاريخ الفاتورة مع إحضار أصل الفاتورة وبحالتها الأصلية.',
  'الضمان يسري على عيوب الصناعة فقط ولا يشمل سوء الاستخدام أو الكسر أو الحروق الكهربائية.',
  'خدمات الصيانة والبرمجيات مكفولة بضمان تجريبي لمدة 30 يوماً من تاريخ التسليم.',
  'تخضع المعاملات التجارية للضوابط القانونية والضريبية المعتمدة بجمهورية مصر العربية.'
];

export const CompanySettingsView: React.FC = () => {
  const [formData, setFormData] = useState({
    logo: '',
    company_name: '',
    phones: '',
    address: '',
    invoice_footer: '',
    tax_number: '',
    commercial_record: '',
    vat_rate: 14,
    currency: 'EGP',
    show_network_page: false,
    show_software_features: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // Fetch company settings
  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/company');
      const data = await res.json();
      if (data.success && data.data) {
        setFormData({
          logo: data.data.logo || '',
          company_name: data.data.company_name || '',
          phones: data.data.phones || '',
          address: data.data.address || '',
          invoice_footer: data.data.invoice_footer || '',
          tax_number: data.data.tax_number || '',
          commercial_record: data.data.commercial_record || '',
          vat_rate: Number(data.data.vat_rate !== undefined ? data.data.vat_rate : 14),
          currency: data.data.currency || 'EGP',
          show_network_page: Boolean(data.data.show_network_page),
          show_software_features: data.data.show_software_features !== undefined ? Boolean(data.data.show_software_features) : true
        });
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 250, 0.85);
      setFormData(prev => ({ ...prev, logo: compressed }));
    } catch (err) {
      console.error('Failed to compress logo:', err);
    }
  };

  // Save Settings
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال اسم الشركة');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/settings/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(true);
        window.dispatchEvent(new CustomEvent('company-settings-updated', {
          detail: { 
            show_network_page: formData.show_network_page,
            show_software_features: formData.show_software_features
          }
        }));
        showSuccess('تم الحفظ بنجاح', 'تم حفظ وتحديث بيانات وإعدادات الشركة في قاعدة البيانات بنجاح!');
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        showError('فشل الحفظ', data.message || 'فشل حفظ الإعدادات');
      }
    } catch (err: any) {
      showError('خطأ أثناء الحفظ', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
            <Building className="w-6 h-6" />
            <span>إعدادات الشركة وبيانات الفواتير</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تخصيص هوية المتجر والشركة، اللوجو، الهواتف، العناوين، وبيانات الفواتير والضريبة
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        {successMessage && (
          <div className="p-4 rounded-2xl mb-5 flex items-center gap-3 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>تم حفظ وتحديث بيانات وإعدادات الشركة بنجاح!</span>
          </div>
        )}

        <form onSubmit={handleSaveCompany} className="space-y-5">
          {/* 1. لوجو الشركة */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-500" />
              <span>لوجو الشركة (شعار المؤسسة):</span>
            </label>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-100 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة اللوجو</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {formData.logo && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-500/30 hover:bg-rose-100 cursor-pointer transition-colors mr-2"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>إزالة اللوجو</span>
                  </button>
                )}
                <p className="text-[10px] text-slate-400">
                  يظهر هذا اللوجو في ترويسة تقارير الطباعة وفواتير المبيعات والمشتريات
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2. اسم الشركة */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>اسم الشركة: *</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: شركة دراجون للحلول التقنية والأنظمة الأمنية"
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* 3. أرقام الهاتف */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>أرقام الهاتف:</span>
              </label>
              <input
                type="text"
                placeholder="01050016289 - 01123456789"
                value={formData.phones}
                onChange={e => setFormData({ ...formData, phones: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* 4. العنوان */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>العنوان:</span>
              </label>
              <input
                type="text"
                placeholder="جمهورية مصر العربية - القاهرة - المقر الرئيسي"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* 5. سطر تذييل الفاتورة مع أمثلة جاهزة */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-500" />
              <span>سطر تذييل الفاتورة:</span>
            </label>

            <textarea
              rows={2}
              placeholder="نص أو شروط يتم طباعتها أسفل كل فاتورة..."
              value={formData.invoice_footer}
              onChange={e => setFormData({ ...formData, invoice_footer: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            />

            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>أمثلة جاهزة (انقر على أي مثال لإدراجه مباشرة في الحقل):</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {FOOTER_EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, invoice_footer: ex }))}
                    className="text-right text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. البيانات الضريبية والمالية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* الرقم الضريبي الرسمي */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>الرقم الضريبي الرسمي:</span>
              </label>
              <input
                type="text"
                placeholder="TR-123-456-789"
                value={formData.tax_number}
                onChange={e => setFormData({ ...formData, tax_number: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* السجل التجاري */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>السجل التجاري:</span>
              </label>
              <input
                type="text"
                placeholder="CR-104829"
                value={formData.commercial_record}
                onChange={e => setFormData({ ...formData, commercial_record: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* نسبة ضريبة القيمة المضافة */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                <span>نسبة ضريبة القيمة المضافة (VAT %):</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.vat_rate}
                onChange={e => setFormData({ ...formData, vat_rate: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-purple-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* العملة الأساسية */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>العملة الأساسية:</span>
              </label>
              <SearchableSelect
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="EGP">جنيه مصري (EGP - ج.م)</option>
                <option value="USD">دولار أمريكي (USD - $)</option>
                <option value="SAR">ريال سعودي (SAR - ر.س)</option>
                <option value="AED">درهم إماراتي (AED - د.إ)</option>
                <option value="EUR">يورو (EUR - €)</option>
              </SearchableSelect>
            </div>
          </div>

          {/* خيار إظهار أو إخفاء صفحة الشبكة وتقرير أرباح وخسائر الشبكة */}
          <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>إظهار صفحة "الشبكة" في إدارة المبيعات وتقرير أرباح وخسائر الشبكة</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  تفعيل ظهور بند صفحة "الشبكة" في قائمة إدارة المبيعات وتقرير "أرباح وخسائر الشبكة" في قائمة التقارير بالشريط الجانبي
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={Boolean(formData.show_network_page)} 
                onChange={e => setFormData({ ...formData, show_network_page: e.target.checked })} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* خيار إظهار أو إخفاء نشاط البرمجيات والمنتجات الرقمية */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>تفعيل نشاط البرمجيات والمنتجات الرقمية</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  إظهار خيار "منتج رقمي / برمجية" عند إضافة وتعديل المنتجات وإظهار تقرير "مبيعات البرمجيات" في قائمة التقارير
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={Boolean(formData.show_software_features)} 
                onChange={e => setFormData({ ...formData, show_software_features: e.target.checked })} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جارٍ حفظ الإعدادات...' : 'حفظ إعدادات الشركة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
