import React, { useState } from 'react';
import { 
  Store, 
  Code2, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Users, 
  Wrench, 
  Shield, 
  Wifi, 
  Cpu, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  PieChart,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

export const ProductionDashboard: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<'all' | 'shop' | 'freelance'>('all');

  // Realistic mock data reflecting the strict dual ERP logic
  const shopMetrics = {
    salesRevenue: 345200.00,
    cogs: 248600.00,
    grossProfit: 96600.00,
    serviceRevenue: 54300.00,
    internetRevenue: 28400.00,
    purchases: 290000.00,
    inventoryValue: 185400.00,
    operatingExpenses: 32400.00,
    salaries: 28000.00,
    netProfit: 118900.00,
    customersCount: 142,
    suppliersCount: 28,
    activeSubscribers: 86,
    openMaintenanceOrders: 14,
    activeCctvProjects: 3,
    activeNetworkProjects: 2,
    receivables: 42100.00,
    payables: 38500.00,
  };

  const freelanceMetrics = {
    projectRevenue: 195000.00,
    collectedPayments: 145000.00,
    directExpenses: 18400.00, // Servers, Domains, VPS, AI Tools
    generalExpenses: 7200.00,
    netProfit: 169400.00,
    profitMarginPct: 86.87,
    outstandingReceivables: 50000.00,
    activeProjects: 6,
    completedProjects: 19,
    clientsCount: 15,
  };

  const combinedMetrics = {
    totalRevenue: shopMetrics.salesRevenue + shopMetrics.serviceRevenue + shopMetrics.internetRevenue + freelanceMetrics.projectRevenue,
    totalCostsAndExpenses: shopMetrics.cogs + shopMetrics.operatingExpenses + shopMetrics.salaries + freelanceMetrics.directExpenses + freelanceMetrics.generalExpenses,
    totalNetProfit: shopMetrics.netProfit + freelanceMetrics.netProfit,
    totalCashAndBank: 174200.00,
    totalReceivables: shopMetrics.receivables + freelanceMetrics.outstandingReceivables,
    totalPayables: shopMetrics.payables,
  };

  const formatEGP = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      
      {/* Header & Business Unit Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <Activity className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">لوحة القيادة والمؤشرات التشغيلية المزدوجة</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مراقبة وفصل الأداء المالي اللحظي بين متجر التقنية ونشاط تطوير البرمجيات الحرة</p>
              </div>
            </div>
          </div>

          {/* Unit Toggle Buttons */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 self-stretch md:self-auto">
            <button
              onClick={() => setSelectedUnit('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedUnit === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>الإجمالي الموحد</span>
            </button>
            <button
              onClick={() => setSelectedUnit('shop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedUnit === 'shop'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>متجر الحواسيب والخدمات</span>
            </button>
            <button
              onClick={() => setSelectedUnit('freelance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedUnit === 'freelance'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>تطوير البرمجيات والعمل الحر</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Combined Strip */}
      {(selectedUnit === 'all') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">إجمالي إيرادات الكيانين</span>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><DollarSign className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatEGP(combinedMetrics.totalRevenue)}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>يشمل المبيعات، الصيانة، الشبكات، والبرمجيات</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">إجمالي التكاليف والمصروفات</span>
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400"><TrendingDown className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{formatEGP(combinedMetrics.totalCostsAndExpenses)}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">COGS + الرواتب + المصاريف المباشرة والعامة</div>
          </div>

          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">صافي الأرباح الصافية الموحدة</span>
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><TrendingUp className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">{formatEGP(combinedMetrics.totalNetProfit)}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1 text-cyan-600 dark:text-cyan-300">
              <span>هامش ربح إجمالي موحد 46.5%</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">إجمالي السيولة النقدية والبنكية</span>
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><Activity className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{formatEGP(combinedMetrics.totalCashAndBank)}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">الصناديق + البنوك + المحافظ الإلكترونية</div>
          </div>
        </div>
      )}

      {/* Section 1: المتجر والخدمات الفنية (BU 1) */}
      {(selectedUnit === 'all' || selectedUnit === 'shop') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">قطاع متجر التقنية والخدمات الفنية (Computer Shop & Field Services)</h3>
                <span className="text-xs text-slate-400">يشمل مبيعات القطع، الصيانة، مشاريع CCTV، الشبكات، واشتراكات الإنترنت</span>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Business Unit ID: 1
            </span>
          </div>

          {/* Key Metric Cards for Shop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">مبيعات الأجهزة</span>
              <span className="text-base font-bold text-slate-100">{formatEGP(shopMetrics.salesRevenue)}</span>
              <span className="text-[10px] text-slate-500 block mt-1">تكلفة COGS: {formatEGP(shopMetrics.cogs)}</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">إيراد الصيانة والمشاريع</span>
              <span className="text-base font-bold text-cyan-400">{formatEGP(shopMetrics.serviceRevenue)}</span>
              <span className="text-[10px] text-slate-500 block mt-1">صيانة + CCTV + شبكات</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">اشتراكات الإنترنت</span>
              <span className="text-base font-bold text-indigo-400">{formatEGP(shopMetrics.internetRevenue)}</span>
              <span className="text-[10px] text-slate-500 block mt-1">{shopMetrics.activeSubscribers} مشترك نشط</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">قيمة المخزون الفعلي</span>
              <span className="text-base font-bold text-emerald-400">{formatEGP(shopMetrics.inventoryValue)}</span>
              <span className="text-[10px] text-slate-500 block mt-1">مقيم بـ WAC / FIFO</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">ذمم العملاء (مدين)</span>
              <span className="text-base font-bold text-amber-400">{formatEGP(shopMetrics.receivables)}</span>
              <span className="text-[10px] text-slate-500 block mt-1">مستحقات آجلة</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">صافي ربح المتجر</span>
              <span className="text-base font-bold text-emerald-300">{formatEGP(shopMetrics.netProfit)}</span>
              <span className="text-[10px] text-emerald-500 block mt-1">بعد خصم الرواتب والمصاريف</span>
            </div>
          </div>

          {/* Sub-activities grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Wrench className="w-4 h-4" /></div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">ورشة الصيانة</span>
                <span className="text-[11px] text-slate-400">{shopMetrics.openMaintenanceOrders} جهاز قيد الفحص والإصلاح</span>
              </div>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Shield className="w-4 h-4" /></div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">مشاريع CCTV</span>
                <span className="text-[11px] text-slate-400">{shopMetrics.activeCctvProjects} مشاريع تركيب جارية</span>
              </div>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><Cpu className="w-4 h-4" /></div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">مشاريع الشبكات</span>
                <span className="text-[11px] text-slate-400">{shopMetrics.activeNetworkProjects} مشاريع تمديد وراك</span>
              </div>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Wifi className="w-4 h-4" /></div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">توزيع الإنترنت</span>
                <span className="text-[11px] text-slate-400">86 مشترك نشط | 3 متأخرون</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: تطوير البرمجيات والعمل الحر (BU 2) */}
      {(selectedUnit === 'all' || selectedUnit === 'freelance') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">قطاع تطوير البرمجيات والعمل الحر (Freelance Software Development)</h3>
                <span className="text-xs text-slate-400">عقود المشاريع، السيرفرات، أدوات AI، ودفعات مراحل الإنجاز المعزولة تماماً</span>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Business Unit ID: 2
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي عقود المشاريع</span>
              <span className="text-base font-bold text-slate-100">{formatEGP(freelanceMetrics.projectRevenue)}</span>
              <span className="text-[10px] text-slate-500 block mt-1">{freelanceMetrics.activeProjects} مشاريع جارية</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">المحصل الفعلي</span>
              <span className="text-base font-bold text-emerald-400">{formatEGP(freelanceMetrics.collectedPayments)}</span>
              <span className="text-[10px] text-emerald-500 block mt-1">دفعة مقدمة ومراحل</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">المستحقات المعلقة</span>
              <span className="text-base font-bold text-amber-400">{formatEGP(freelanceMetrics.outstandingReceivables)}</span>
              <span className="text-[10px] text-slate-500 block mt-1">دفعات ختامية ومراحل</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">مصروفات البرمجيات</span>
              <span className="text-base font-bold text-rose-400">{formatEGP(freelanceMetrics.directExpenses + freelanceMetrics.generalExpenses)}</span>
              <span className="text-[10px] text-slate-500 block mt-1">سيرفرات + تراخيص + AI</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block mb-1">صافي ربح البرمجيات</span>
              <span className="text-base font-bold text-purple-300">{formatEGP(freelanceMetrics.netProfit)}</span>
              <span className="text-[10px] text-purple-400 block mt-1">هامش ربح {freelanceMetrics.profitMarginPct}%</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
