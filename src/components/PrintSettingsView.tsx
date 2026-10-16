import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileText,
  DollarSign,
  ArrowLeftRight,
  FileSpreadsheet,
  CheckCircle2,
  Save,
  RotateCcw,
  Eye,
  Sliders,
  Palette,
  Layout,
  Type,
  Maximize2,
  Sparkles,
  QrCode,
  Building,
  Phone,
  Hash,
  Check,
  Zap,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Stamp,
  Image as ImageIcon,
  Move,
  Scissors,
  Receipt,
  FileCheck,
  TrendingUp,
  Coins
} from 'lucide-react';

export type PaperSize = 'thermal80' | 'a5' | 'a4';
export type LayoutPreset = 'modern' | 'classic' | 'minimal';

export interface DocumentSection {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface DocumentTemplateConfig {
  docId: string;
  docTitle: string;
  docCategory: 'sales' | 'finance' | 'inventory' | 'reports';
  paperSize: PaperSize;
  layoutPreset: LayoutPreset;
  themeColor: string;
  fontFamily: 'Cairo' | 'Tajawal' | 'Inter' | 'monospace';
  fontSizeScale: number; // 0.8 to 1.3
  logoSize: number; // px
  // Watermark
  watermarkEnabled: boolean;
  watermarkType: 'text' | 'logo';
  watermarkText: string;
  watermarkOpacity: number; // 0.05 to 0.3
  // Components
  sections: DocumentSection[];
  // Metadata & Custom Fields
  customFields: CustomField[];
  customFooterNote: string;
  showSignatures: boolean;
  signatures: { title: string; subtitle: string }[];
  showStampBox: boolean;
}

// Available document types
export const DOCUMENT_CATALOG = [
  // 1. Sales & POS
  { id: 'sales_pos', title: 'فاتورة مبيعات نقدية (كاشير)', category: 'sales', defaultSize: 'thermal80' },
  { id: 'sales_tax', title: 'فاتورة ضريبية رسمية (A4)', category: 'sales', defaultSize: 'a4' },
  { id: 'sales_return', title: 'فاتورة مرتجع مبيعات', category: 'sales', defaultSize: 'thermal80' },
  { id: 'sales_quote', title: 'عرض أسعار ومقايسة مالية', category: 'sales', defaultSize: 'a4' },

  // 2. Finance
  { id: 'finance_receipt', title: 'سند قبض وتحصيل نقدي', category: 'finance', defaultSize: 'a5' },
  { id: 'finance_payment', title: 'سند صرف ودفعات نقدية', category: 'finance', defaultSize: 'a5' },
  { id: 'finance_expense', title: 'إيصال مصروفات ونثريات', category: 'finance', defaultSize: 'thermal80' },
  { id: 'finance_transfer', title: 'سند تحويل بين الخزائن', category: 'finance', defaultSize: 'a5' },

  // 3. Inventory
  { id: 'stock_receipt', title: 'إذن استلام وتوريد بضائع', category: 'inventory', defaultSize: 'a4' },
  { id: 'stock_return', title: 'إذن ارتجاع بضائع لمورد', category: 'inventory', defaultSize: 'a4' },
  { id: 'stock_transfer', title: 'إذن تحويل ونقل مخزني', category: 'inventory', defaultSize: 'a4' },

  // 4. Reports & Statements
  { id: 'rep_customer_statement', title: 'كشف حساب عميل تفصيلي', category: 'reports', defaultSize: 'a4' },
  { id: 'rep_supplier_statement', title: 'كشف حساب ومستحقات مورد', category: 'reports', defaultSize: 'a4' },
  { id: 'rep_inventory_audit', title: 'تقرير تقييم وجرد المخزون', category: 'reports', defaultSize: 'a4' },
  { id: 'rep_treasury_flow', title: 'بيان حركة الخزائن والسيولة', category: 'reports', defaultSize: 'a4' }
] as const;

const DEFAULT_SECTIONS: DocumentSection[] = [
  { id: 'header', name: 'الترويسة وبيانات الشركة والشعار', visible: true, order: 1 },
  { id: 'title_bar', name: 'شريط العنوان والرقم التسلسلي والتاريخ', visible: true, order: 2 },
  { id: 'party_info', name: 'بيانات العميل / المورد / الطرف الآخر', visible: true, order: 3 },
  { id: 'custom_fields', name: 'الحقول المخصصة الإضافية', visible: true, order: 4 },
  { id: 'items_table', name: 'جدول الأصناف والبنود المالية', visible: true, order: 5 },
  { id: 'totals_box', name: 'ملخص الحسابات والإجماليات والضريبة', visible: true, order: 6 },
  { id: 'qr_barcode', name: 'الباركود ورمز الاستجابة السريع (QR)', visible: true, order: 7 },
  { id: 'footer_terms', name: 'الشروط والأحكام وملاحظات الفاتورة', visible: true, order: 8 },
  { id: 'signatures', name: 'خانات التواقيع والاعتماد والختم', visible: true, order: 9 }
];

function generateDefaultConfig(doc: typeof DOCUMENT_CATALOG[number]): DocumentTemplateConfig {
  let themeColor = '#4f46e5';
  if (doc.category === 'finance') themeColor = '#059669';
  if (doc.category === 'inventory') themeColor = '#d97706';
  if (doc.category === 'reports') themeColor = '#0f172a';

  return {
    docId: doc.id,
    docTitle: doc.title,
    docCategory: doc.category,
    paperSize: doc.defaultSize as PaperSize,
    layoutPreset: 'modern',
    themeColor,
    fontFamily: 'Cairo',
    fontSizeScale: 1,
    logoSize: 55,
    watermarkEnabled: false,
    watermarkType: 'text',
    watermarkText: 'معتمد رسمياً',
    watermarkOpacity: 0.08,
    sections: [...DEFAULT_SECTIONS],
    customFields: [
      { id: 'f1', label: 'الموظف المسؤول', value: 'ممدوح المصري' },
      { id: 'f2', label: 'طريقة السداد', value: 'نقدي (Cash)' }
    ],
    customFooterNote: 'شكراً لتعاملكم معنا - البضاعة المباعة ترد وتستبدل وفق الشروط والأحكام المعتمدة.',
    showSignatures: doc.category !== 'sales' || doc.id === 'sales_tax' || doc.id === 'sales_quote',
    signatures: [
      { title: 'توقيع المستلم', subtitle: 'الاسم والتوقيع' },
      { title: 'الاعتماد والمراجعة', subtitle: 'الختم والتوقيع' }
    ],
    showStampBox: doc.category === 'finance' || doc.category === 'inventory' || doc.id === 'sales_tax'
  };
}

const COLOR_PALETTES = [
  { name: 'نيلي ملكي', hex: '#4f46e5' },
  { name: 'أخضر زمردي', hex: '#059669' },
  { name: 'كهرماني ذهبي', hex: '#d97706' },
  { name: 'أزرق سماوي', hex: '#0284c7' },
  { name: 'فحمي رسمي', hex: '#0f172a' },
  { name: 'قرمزي جذاب', hex: '#e11d48' },
  { name: 'بنفسجي احترافي', hex: '#7c3aed' }
];

export const PrintSettingsView: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>('sales_pos');
  const [activeCategory, setActiveCategory] = useState<'sales' | 'finance' | 'inventory' | 'reports'>('sales');
  const [templates, setTemplates] = useState<{ [docId: string]: DocumentTemplateConfig }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // Active company profile
  const [companyProfile, setCompanyProfile] = useState({
    name: 'دراجون للأنظمه الامنيه',
    phones: '01050016289',
    address: 'القاهرة - المقر الرئيسي',
    tax_number: 'TR-892019',
    commercial_record: 'CR-104829',
    logo: ''
  });

  // Load from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const [printRes, compRes] = await Promise.all([
          fetch('/api/settings/print').then(r => r.json()).catch(() => null),
          fetch('/api/settings/company').then(r => r.json()).catch(() => null)
        ]);

        const initial: { [key: string]: DocumentTemplateConfig } = {};
        DOCUMENT_CATALOG.forEach(doc => {
          initial[doc.id] = generateDefaultConfig(doc);
        });

        if (printRes?.success && printRes.data) {
          // Merge saved templates
          Object.keys(printRes.data).forEach(key => {
            if (initial[key]) {
              initial[key] = { ...initial[key], ...printRes.data[key] };
            }
          });
        }
        setTemplates(initial);

        if (compRes?.success && compRes.data) {
          setCompanyProfile({
            name: compRes.data.company_name || 'دراجون للأنظمه الامنيه',
            phones: compRes.data.phones || '01050016289',
            address: compRes.data.address || 'القاهرة - المقر الرئيسي',
            tax_number: compRes.data.tax_number || 'TR-892019',
            commercial_record: compRes.data.commercial_record || 'CR-104829',
            logo: compRes.data.logo || ''
          });
        }
      } catch (err) {
        console.error('Failed to load print templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const currentTemplate = templates[selectedDocId] || generateDefaultConfig(DOCUMENT_CATALOG[0]);

  // Update current template
  const updateCurrent = (field: keyof DocumentTemplateConfig, value: any) => {
    setTemplates(prev => ({
      ...prev,
      [selectedDocId]: {
        ...prev[selectedDocId],
        [field]: value
      }
    }));
  };

  // Section Reordering (Move up / down)
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sorted = [...currentTemplate.sections].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    // Swap elements in sorted array
    const item = sorted[index];
    sorted[index] = sorted[targetIndex];
    sorted[targetIndex] = item;

    // Reassign clean 1-based sequential order
    const updated = sorted.map((s, idx) => ({ ...s, order: idx + 1 }));
    updateCurrent('sections', updated);
  };

  const toggleSection = (id: string) => {
    const secs = currentTemplate.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s);
    updateCurrent('sections', secs);
  };

  // Custom Fields Management
  const addCustomField = () => {
    const newField: CustomField = {
      id: 'f_' + Date.now(),
      label: 'حقل جديد',
      value: 'قيمة تجريبية'
    };
    updateCurrent('customFields', [...currentTemplate.customFields, newField]);
  };

  const removeCustomField = (id: string) => {
    updateCurrent('customFields', currentTemplate.customFields.filter(f => f.id !== id));
  };

  const updateCustomField = (id: string, key: 'label' | 'value', val: string) => {
    updateCurrent('customFields', currentTemplate.customFields.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  // Save to backend
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/settings/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
      }
    } catch (err: any) {
      alert('خطأ أثناء حفظ التعديلات: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleResetCurrent = () => {
    const catalogItem = DOCUMENT_CATALOG.find(d => d.id === selectedDocId);
    if (!catalogItem) return;
    if (window.confirm(`هل أنت متأكد من استعادة الشكل الافتراضي لـ (${catalogItem.title})؟`)) {
      setTemplates(prev => ({
        ...prev,
        [selectedDocId]: generateDefaultConfig(catalogItem)
      }));
    }
  };

  // Print Test
  const handleTestPrint = () => {
    const area = document.getElementById('print-live-canvas');
    if (!area) return;

    const printWin = window.open('', '_blank', 'width=950,height=850');
    if (!printWin) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const cssWidth = currentTemplate.paperSize === 'thermal80' ? '80mm' : (currentTemplate.paperSize === 'a5' ? '148mm' : '210mm');

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>${currentTemplate.docTitle} - طباعة تجريبية</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;700;900&display=swap">
          <style>
            @page {
              size: ${currentTemplate.paperSize === 'thermal80' ? '80mm auto' : (currentTemplate.paperSize === 'a5' ? 'A5' : 'A4')};
              margin: ${currentTemplate.paperSize === 'thermal80' ? '2mm' : '8mm'};
            }
            body {
              font-family: '${currentTemplate.fontFamily}', sans-serif;
              margin: 0;
              padding: ${currentTemplate.paperSize === 'thermal80' ? '5px' : '18px'};
              color: #0f172a;
              width: ${cssWidth};
              box-sizing: border-box;
            }
            * { box-sizing: border-box; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            th { background: ${currentTemplate.themeColor}; color: white; padding: 6px 4px; font-size: 11px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 6px 4px; font-size: 11px; text-align: center; }
            .watermark {
              position: absolute;
              top: 45%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 55px;
              font-weight: 900;
              color: ${currentTemplate.themeColor};
              opacity: ${currentTemplate.watermarkOpacity};
              pointer-events: none;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          ${area.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const sortedSections = [...currentTemplate.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">مصمم قوالب الطباعة التفاعلي (Canva Studio)</h1>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Full Document Engine
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                تخصيص حر لكل مستند على حدة (المبيعات، المرتجعات، عروض الأسعار، السندات، والمخزون) مع العلامات المائية وإعادة الترتيب.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestPrint}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2 backdrop-blur-sm border border-white/10"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة تجريبية
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'جاري الحفظ...' : 'حفظ كافة النماذج'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-2 text-xs font-black animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ كافة قوالب الطباعة وتخصيصات الصفحات بنجاح تام!</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'sales', label: 'المبيعات وعروض الأسعار والمرتجعات', icon: Receipt },
          { id: 'finance', label: 'سندات الماليات والمصروفات والقبض', icon: Coins },
          { id: 'inventory', label: 'حركة المخزون والاستلام والتحويل', icon: ArrowLeftRight },
          { id: 'reports', label: 'التقارير وكشوف الحساب الرسمية', icon: FileSpreadsheet }
        ].map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as any);
                // Switch to first doc of this category
                const first = DOCUMENT_CATALOG.find(d => d.category === cat.id);
                if (first) setSelectedDocId(first.id);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-document selector pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 ml-2">اختر المستند المراد تصميمه:</span>
        {DOCUMENT_CATALOG.filter(d => d.category === activeCategory).map(doc => {
          const isSelected = selectedDocId === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition border ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {doc.title}
            </button>
          );
        })}
      </div>

      {/* Designer Workspace: Left Canva Inspector & Right Visual Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Canva Controls Inspector */}
        <div className="lg:col-span-5 space-y-5">
          {/* Layout Presets (3 Different Shapes) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">الشكل العام للقالب (3 Presets)</h3>
              </div>
              <button
                onClick={handleResetCurrent}
                className="text-[11px] text-slate-400 hover:text-rose-500 transition flex items-center gap-1"
                title="استعادة الافتراضي"
              >
                <RotateCcw className="w-3 h-3" />
                استعادة
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'modern', label: 'القالب العصري', desc: 'Modern Luxury' },
                { id: 'classic', label: 'القالب الكلاسيكي', desc: 'Classic Frame' },
                { id: 'minimal', label: 'القالب البسيط', desc: 'Clean Minimal' }
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => updateCurrent('layoutPreset', preset.id as LayoutPreset)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                    currentTemplate.layoutPreset === preset.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs font-black">{preset.label}</span>
                  <span className="text-[10px] opacity-75 mt-0.5">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paper Size & Dimensions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Maximize2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">مقاس ورقة الطباعة لهذا المستند</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'thermal80', label: 'حراري 80mm' },
                { id: 'a5', label: 'نصف A4 (A5)' },
                { id: 'a4', label: 'ورقة A4 كاملة' }
              ].map(paper => (
                <button
                  key={paper.id}
                  onClick={() => updateCurrent('paperSize', paper.id as PaperSize)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                    currentTemplate.paperSize === paper.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {paper.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color, Typography & Sizing */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">اللون المميز للمستند</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">{currentTemplate.themeColor}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PALETTES.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => updateCurrent('themeColor', c.hex)}
                    className={`w-7 h-7 rounded-full transition flex items-center justify-center relative ${
                      currentTemplate.themeColor === c.hex ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {currentTemplate.themeColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
                <input
                  type="color"
                  value={currentTemplate.themeColor}
                  onChange={(e) => updateCurrent('themeColor', e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">حجم الشعار (Logo Size)</label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={currentTemplate.logoSize}
                  onChange={(e) => updateCurrent('logoSize', Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400 font-mono">{currentTemplate.logoSize}px</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">مقياس الخطوط (Scale)</label>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={currentTemplate.fontSizeScale}
                  onChange={(e) => updateCurrent('fontSizeScale', Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400 font-mono">{(currentTemplate.fontSizeScale * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Watermark Studio (العلامة المائية) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">العلامة المائية (Watermark)</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentTemplate.watermarkEnabled}
                  onChange={(e) => updateCurrent('watermarkEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {currentTemplate.watermarkEnabled && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">نص العلامة المائية</label>
                  <input
                    type="text"
                    value={currentTemplate.watermarkText}
                    onChange={(e) => updateCurrent('watermarkText', e.target.value)}
                    placeholder="مثال: مدفوع بالكامل / معتمد / نسخة أصلية"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    <span>درجة الشفافية (Opacity)</span>
                    <span className="font-mono">{Math.round(currentTemplate.watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.04"
                    max="0.25"
                    step="0.01"
                    value={currentTemplate.watermarkOpacity}
                    onChange={(e) => updateCurrent('watermarkOpacity', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Canva Sections Drag/Reorder & Visibility */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">ترتيب وإخفاء مكونات الصفحة</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">تحريك لأعلى / لأسفل</span>
            </div>

            <div className="space-y-1.5">
              {sortedSections.map((sec, index) => (
                <div
                  key={sec.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    sec.visible
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                      : 'bg-slate-100/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sec.visible}
                      onChange={() => toggleSection(sec.id)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold">{sec.name}</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 transition"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sortedSections.length - 1}
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 transition"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Fields (Add / Remove) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">الحقول والبيانات المخصصة</h3>
              </div>
              <button
                onClick={addCustomField}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                إضافة حقل
              </button>
            </div>

            <div className="space-y-2">
              {currentTemplate.customFields.map(f => (
                <div key={f.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) => updateCustomField(f.id, 'label', e.target.value)}
                    placeholder="اسم الحقل (مثل: السائق)"
                    className="w-1/3 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => updateCustomField(f.id, 'value', e.target.value)}
                    placeholder="القيمة"
                    className="w-2/3 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                  />
                  <button
                    onClick={() => removeCustomField(f.id)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Canva Live Visual Paper Canvas */}
        <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-950/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-start min-h-[750px] overflow-auto">
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                المعاينة التفاعلية المباشرة: {currentTemplate.docTitle} ({currentTemplate.paperSize.toUpperCase()})
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {currentTemplate.layoutPreset.toUpperCase()} THEME
            </span>
          </div>

          {/* Paper Canvas */}
          <div
            id="print-live-canvas"
            style={{
              fontFamily: `${currentTemplate.fontFamily}, sans-serif`,
              width: currentTemplate.paperSize === 'thermal80' ? '300px' : (currentTemplate.paperSize === 'a5' ? '460px' : '580px'),
              maxWidth: '100%',
              fontSize: `${12 * currentTemplate.fontSizeScale}px`
            }}
            className={`bg-white text-slate-900 rounded-xl shadow-2xl p-6 border transition-all duration-300 relative text-right dir-rtl overflow-hidden ${
              currentTemplate.layoutPreset === 'classic'
                ? 'border-4 border-double border-slate-800'
                : 'border-slate-200'
            }`}
          >
            {/* Watermark Rendering */}
            {currentTemplate.watermarkEnabled && (
              <div
                style={{
                  position: 'absolute',
                  top: '45%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-30deg)',
                  fontSize: currentTemplate.paperSize === 'thermal80' ? '28px' : '52px',
                  fontWeight: 900,
                  color: currentTemplate.themeColor,
                  opacity: currentTemplate.watermarkOpacity,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 0
                }}
              >
                {currentTemplate.watermarkText}
              </div>
            )}

            {/* Dynamic Ordered Sections with On-Canvas Canva Controls */}
            <div className="relative z-10 space-y-3">
              {sortedSections.map((sec, secIdx) => {
                if (!sec.visible) return null;

                const renderSectionContent = () => {
                  switch (sec.id) {
                    case 'header':
                      return (
                        <div
                          className={`pb-3 flex items-start justify-between gap-3 ${
                            currentTemplate.layoutPreset === 'modern'
                              ? 'border-b-2'
                              : (currentTemplate.layoutPreset === 'classic' ? 'border-b-2 border-double border-slate-700' : 'border-b border-slate-200')
                          }`}
                          style={{ borderColor: currentTemplate.layoutPreset === 'modern' ? currentTemplate.themeColor : undefined }}
                        >
                          <div>
                            <h2 className="text-base font-black text-slate-900 leading-tight">
                              {companyProfile.name}
                            </h2>
                            <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                              <p className="flex items-center gap-1 font-mono">
                                <Phone className="w-2.5 h-2.5" /> {companyProfile.phones}
                              </p>
                              <p>{companyProfile.address}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold mt-1">
                              <span>ض.م: {companyProfile.tax_number}</span>
                              <span>س.ت: {companyProfile.commercial_record}</span>
                            </div>
                          </div>

                          <div>
                            {companyProfile.logo ? (
                              <img
                                src={companyProfile.logo}
                                alt="Logo"
                                style={{ width: `${currentTemplate.logoSize}px`, height: `${currentTemplate.logoSize}px` }}
                                className="object-contain rounded-lg"
                              />
                            ) : (
                              <div
                                style={{
                                  width: `${currentTemplate.logoSize}px`,
                                  height: `${currentTemplate.logoSize}px`,
                                  backgroundColor: currentTemplate.themeColor
                                }}
                                className="rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm"
                              >
                                DRAGON
                              </div>
                            )}
                          </div>
                        </div>
                      );

                    case 'title_bar':
                      return (
                        <div className="flex items-center justify-between py-1 border-b border-slate-100">
                          <span
                            className={`px-3 py-1 rounded-md text-xs font-black ${
                              currentTemplate.layoutPreset === 'minimal'
                                ? 'border border-slate-300 text-slate-800'
                                : 'text-white'
                            }`}
                            style={{
                              backgroundColor: currentTemplate.layoutPreset === 'minimal' ? 'transparent' : currentTemplate.themeColor
                            }}
                          >
                            {currentTemplate.docTitle}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono dir-ltr">
                            REF: #{selectedDocId.slice(0, 4).toUpperCase()}-2026-9042
                          </div>
                        </div>
                      );

                    case 'party_info':
                      return (
                        <div className="text-[10px] text-slate-700 bg-slate-50 p-2.5 rounded-lg flex items-center justify-between border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-400 ml-1">الطرف المعني:</span>
                            <span className="font-bold">مؤسسة الأمل للتجارة والتوريدات</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 ml-1">التاريخ:</span>
                            <span className="font-mono">{new Date().toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                      );

                    case 'custom_fields':
                      if (currentTemplate.customFields.length === 0) return null;
                      return (
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/70 p-2 rounded-lg border border-dashed border-slate-200">
                          {currentTemplate.customFields.map(f => (
                            <div key={f.id} className="flex items-center justify-between">
                              <span className="text-slate-500 font-bold">{f.label}:</span>
                              <span className="font-bold text-slate-800">{f.value}</span>
                            </div>
                          ))}
                        </div>
                      );

                    case 'items_table':
                      return (
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr
                              style={{
                                backgroundColor: currentTemplate.layoutPreset === 'minimal' ? '#f1f5f9' : currentTemplate.themeColor,
                                color: currentTemplate.layoutPreset === 'minimal' ? '#0f172a' : '#ffffff'
                              }}
                            >
                              <th className="p-1.5 text-[10px] font-bold text-center">#</th>
                              <th className="p-1.5 text-[10px] font-bold">البيان / البند</th>
                              <th className="p-1.5 text-[10px] font-bold text-center">الكمية</th>
                              <th className="p-1.5 text-[10px] font-bold text-center">السعر</th>
                              <th className="p-1.5 text-[10px] font-bold text-center">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[10px]">
                            <tr>
                              <td className="p-1.5 text-center font-bold">1</td>
                              <td className="p-1.5">كاميرا مراقبة هيكفيجن 5 ميجا دقة فائقة</td>
                              <td className="p-1.5 text-center">4</td>
                              <td className="p-1.5 text-center">850.00</td>
                              <td className="p-1.5 text-center font-bold">3,400.00</td>
                            </tr>
                            <tr>
                              <td className="p-1.5 text-center font-bold">2</td>
                              <td className="p-1.5">جهاز تسجيل فيديو DVR 8 قنوات 4K</td>
                              <td className="p-1.5 text-center">1</td>
                              <td className="p-1.5 text-center">2,200.00</td>
                              <td className="p-1.5 text-center font-bold">2,200.00</td>
                            </tr>
                            <tr>
                              <td className="p-1.5 text-center font-bold">3</td>
                              <td className="p-1.5">قرص صلب 2 تيرابايت للمراقبة المستمرة</td>
                              <td className="p-1.5 text-center">1</td>
                              <td className="p-1.5 text-center">1,600.00</td>
                              <td className="p-1.5 text-center font-bold">1,600.00</td>
                            </tr>
                          </tbody>
                        </table>
                      );

                    case 'totals_box':
                      return (
                        <div className="border-t border-slate-200 pt-2 space-y-1 text-[11px]">
                          <div className="flex justify-between text-slate-500">
                            <span>المجموع الفرعي:</span>
                            <span className="font-bold">7,200.00 ج.م</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>ضريبة القيمة المضافة (14%):</span>
                            <span className="font-bold">1,008.00 ج.م</span>
                          </div>
                          <div
                            className="flex justify-between font-black text-xs pt-1 border-t border-slate-200"
                            style={{ color: currentTemplate.themeColor }}
                          >
                            <span>الصافي الإجمالي المستحق:</span>
                            <span>8,208.00 ج.م</span>
                          </div>
                        </div>
                      );

                    case 'qr_barcode':
                      return (
                        <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 border border-slate-300 rounded flex items-center justify-center p-1 bg-slate-50">
                              <QrCode className="w-8 h-8 text-slate-700" />
                            </div>
                            <span className="text-[9px] text-slate-400">الفاتورة الإلكترونية المعتمدة</span>
                          </div>
                          <div className="text-center">
                            <div className="font-mono text-[10px] tracking-widest text-slate-700">||||| | |||| ||| ||||</div>
                            <span className="text-[8px] text-slate-400 font-mono">INV-892019-EGP</span>
                          </div>
                        </div>
                      );

                    case 'footer_terms':
                      return (
                        <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg text-center leading-relaxed border border-slate-100">
                          {currentTemplate.customFooterNote}
                        </div>
                      );

                    case 'signatures':
                      if (!currentTemplate.showSignatures) return null;
                      return (
                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-700">
                          {currentTemplate.signatures.map((sig, sIdx) => (
                            <div key={sIdx} className="text-center">
                              <p>{sig.title}:</p>
                              <p className="text-slate-300 mt-4">............................</p>
                            </div>
                          ))}
                          {currentTemplate.showStampBox && (
                            <div className="w-16 h-12 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                              مكان الختم
                            </div>
                          )}
                        </div>
                      );

                    default:
                      return null;
                  }
                };

                return (
                  <div
                    key={sec.id}
                    className="group relative border border-transparent hover:border-indigo-400/80 hover:bg-indigo-50/20 rounded-xl p-1.5 transition-all"
                  >
                    {/* Canva Floating On-Canvas Controller */}
                    <div className="no-print absolute -top-3.5 left-2 hidden group-hover:flex items-center gap-1 bg-slate-900 text-white rounded-lg shadow-xl px-2 py-0.5 text-[10px] font-black z-30">
                      <span className="text-indigo-300 ml-1">{sec.name}</span>
                      <button
                        onClick={() => moveSection(secIdx, 'up')}
                        disabled={secIdx === 0}
                        className="p-1 hover:bg-slate-700 rounded disabled:opacity-20"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveSection(secIdx, 'down')}
                        disabled={secIdx === sortedSections.length - 1}
                        className="p-1 hover:bg-slate-700 rounded disabled:opacity-20"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleSection(sec.id)}
                        className="p-1 hover:bg-rose-600 rounded text-rose-300 hover:text-white"
                        title="إخفاء هذا العنصر"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {renderSectionContent()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
