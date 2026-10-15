import React, { useState } from 'react';
import { FINANCIAL_METRICS, FinancialMetric } from '../data/financialFormulas';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Code2, 
  Laptop, 
  Sparkles,
  Info,
  Layers,
  FileCode,
  Copy,
  Check
} from 'lucide-react';

export const FinancialCalculator: React.FC = () => {
  // Input simulation state
  const [storeSalesRevenue, setStoreSalesRevenue] = useState<number>(32000);
  const [storeServiceRevenue, setStoreServiceRevenue] = useState<number>(8500); // maintenance + cctv + network
  const [storeIspRevenue, setStoreIspRevenue] = useState<number>(4500);
  const [storeCogs, setStoreCogs] = useState<number>(24000); // hardware cost + parts
  const [storeOpex, setStoreOpex] = useState<number>(5500); // store rent, technician salaries, shop electricity

  const [freelanceRevenue, setFreelanceRevenue] = useState<number>(35000);
  const [freelanceDirectCosts, setFreelanceDirectCosts] = useState<number>(3800); // cloud, apis, domains
  const [freelanceOpex, setFreelanceOpex] = useState<number>(2800); // software tools, dev setup

  const [sharedOpex, setSharedOpex] = useState<number>(1800); // general overhead, shared internet
  const [shopAllocationRatio, setShopAllocationRatio] = useState<number>(0.6); // 60% shop, 40% freelance

  // Balance sheet inputs
  const [inventoryValue, setInventoryValue] = useState<number>(38500);
  const [storeAR, setStoreAR] = useState<number>(7500);
  const [freelanceAR, setFreelanceAR] = useState<number>(14000);
  const [storeAP, setStoreAP] = useState<number>(12000);
  const [freelanceAP, setFreelanceAP] = useState<number>(1500);
  const [cashBalance, setCashBalance] = useState<number>(6200);
  const [bankBalance, setBankBalance] = useState<number>(43800);
  const [ownerCapital, setOwnerCapital] = useState<number>(40000);
  const [ownerDrawings, setOwnerDrawings] = useState<number>(15000);

  // Selected metric for detailed view
  const [selectedMetric, setSelectedMetric] = useState<FinancialMetric>(FINANCIAL_METRICS[0]);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Dynamic calculations
  const totalStoreRevenue = storeSalesRevenue + storeServiceRevenue + storeIspRevenue;
  const totalFreelanceRevenue = freelanceRevenue;
  const totalCombinedRevenue = totalStoreRevenue + totalFreelanceRevenue;

  const totalStoreCogs = storeCogs;
  const totalFreelanceCogs = freelanceDirectCosts;
  const totalCombinedCogs = totalStoreCogs + totalFreelanceCogs;

  const storeGrossProfit = totalStoreRevenue - totalStoreCogs;
  const freelanceGrossProfit = totalFreelanceRevenue - totalFreelanceCogs;
  const combinedGrossProfit = totalCombinedRevenue - totalCombinedCogs;

  const allocatedShopSharedOpex = sharedOpex * shopAllocationRatio;
  const allocatedFreelanceSharedOpex = sharedOpex * (1 - shopAllocationRatio);

  const totalStoreOpex = storeOpex + allocatedShopSharedOpex;
  const totalFreelanceOpex = freelanceOpex + allocatedFreelanceSharedOpex;
  const totalCombinedOpex = storeOpex + freelanceOpex + sharedOpex;

  const storeNetProfit = storeGrossProfit - totalStoreOpex;
  const freelanceNetProfit = freelanceGrossProfit - totalFreelanceOpex;
  const combinedNetProfit = combinedGrossProfit - totalCombinedOpex;

  const totalReceivables = storeAR + freelanceAR;
  const totalPayables = storeAP + freelanceAP;
  const totalLiquidCash = cashBalance + bankBalance;

  const copySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8">
      
      {/* Introduction Card */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">المحاكي المالي واحتساب المؤشرات الـ 15 للمنشأة المزدوجة</h2>
            <p className="text-xs text-slate-400">محرك حسابي فوري يوضح الترابط المالي بين متجر التقنية ونشاط البرمجيات الحرة والميزانية الموحدة.</p>
          </div>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Store Net Profit */}
        <div className="rounded-xl bg-slate-900 border border-cyan-500/40 p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" />
              أرباح المتجر والخدمات (13)
            </span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">SHOP</span>
          </div>
          <div className="text-2xl font-black text-white mt-2 mb-1">
            ${storeNetProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>هامش ربح المتجر:</span>
            <span className="text-cyan-400 font-bold">
              {totalStoreRevenue > 0 ? ((storeNetProfit / totalStoreRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Freelance Net Profit */}
        <div className="rounded-xl bg-slate-900 border border-indigo-500/40 p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              أرباح البرمجيات الحرة (14)
            </span>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/50">FREELANCE</span>
          </div>
          <div className="text-2xl font-black text-white mt-2 mb-1">
            ${freelanceNetProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>هامش ربح البرمجيات:</span>
            <span className="text-indigo-400 font-bold">
              {totalFreelanceRevenue > 0 ? ((freelanceNetProfit / totalFreelanceRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Consolidated Net Profit */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/50 p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              الأرباح الموحدة الإجمالية (15)
            </span>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/50">COMBINED</span>
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-2 mb-1">
            ${combinedNetProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-300 flex items-center justify-between">
            <span>إجمالي الإيرادات:</span>
            <span className="text-white font-bold">${totalCombinedRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Liquid Cash & Bank */}
        <div className="rounded-xl bg-slate-900 border border-slate-700/60 p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              السيولة النقدية والمصرفية (9+10)
            </span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/50">TREASURY</span>
          </div>
          <div className="text-2xl font-black text-white mt-2 mb-1">
            ${totalLiquidCash.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>صندوق: ${cashBalance.toLocaleString()}</span>
            <span>بنوك: ${bankBalance.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* Main Simulation Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Input Controls by Business Unit */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Store Unit Inputs */}
          <div className="bg-slate-900/90 rounded-xl border border-cyan-500/30 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">مدخلات متجر الحواسيب والشبكات (Shop Unit)</h3>
              </div>
              <span className="text-xs text-cyan-400 font-bold">إجمالي إيراد المتجر: ${totalStoreRevenue.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">مبيعات الأجهزة والقطع ($):</label>
                <input
                  type="number"
                  value={storeSalesRevenue}
                  onChange={(e) => setStoreSalesRevenue(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">خدمات الصيانة وتمديد CCTV والشبكات ($):</label>
                <input
                  type="number"
                  value={storeServiceRevenue}
                  onChange={(e) => setStoreServiceRevenue(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">اشتراكات الإنترنت الشهرية ($):</label>
                <input
                  type="number"
                  value={storeIspRevenue}
                  onChange={(e) => setStoreIspRevenue(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">تكلفة البضاعة المباعة COGS للسلع ($):</label>
                <input
                  type="number"
                  value={storeCogs}
                  onChange={(e) => setStoreCogs(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-rose-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 mb-1">مصاريف المتجر التشغيلية OPEX (رواتب فنيين، إيجار محل) ($):</label>
                <input
                  type="number"
                  value={storeOpex}
                  onChange={(e) => setStoreOpex(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Freelance Unit Inputs */}
          <div className="bg-slate-900/90 rounded-xl border border-indigo-500/30 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">مدخلات تطوير البرمجيات الحرة (Freelance Unit)</h3>
              </div>
              <span className="text-xs text-indigo-400 font-bold">إجمالي إيراد البرمجيات: ${totalFreelanceRevenue.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">إيرادات عقود ومراحل البرمجيات ($):</label>
                <input
                  type="number"
                  value={freelanceRevenue}
                  onChange={(e) => setFreelanceRevenue(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">المصاريف المباشرة (سيرفرات سحابية، APIs، تراخيص) ($):</label>
                <input
                  type="number"
                  value={freelanceDirectCosts}
                  onChange={(e) => setFreelanceDirectCosts(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-rose-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 mb-1">مصاريف البرمجيات التشغيلية OPEX ($):</label>
                <input
                  type="number"
                  value={freelanceOpex}
                  onChange={(e) => setFreelanceOpex(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Shared Overhead & Capital Inputs */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">المصاريف المشتركة ورأس المال وحسابات الميزانية</h3>
              </div>
              <span className="text-xs text-slate-400">توزيع المصاريف والأصول</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">المصاريف المشتركة ($):</label>
                <input
                  type="number"
                  value={sharedOpex}
                  onChange={(e) => setSharedOpex(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-rose-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">نسبة تحميل المتجر ({Math.round(shopAllocationRatio * 100)}%):</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={shopAllocationRatio}
                  onChange={(e) => setShopAllocationRatio(Number(e.target.value))}
                  className="w-full accent-cyan-500 mt-2"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">قيمة المخزون السلعي ($):</label>
                <input
                  type="number"
                  value={inventoryValue}
                  onChange={(e) => setInventoryValue(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ذمم عملاء المتجر AR ($):</label>
                <input
                  type="number"
                  value={storeAR}
                  onChange={(e) => setStoreAR(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ذمم عملاء البرمجيات AR ($):</label>
                <input
                  type="number"
                  value={freelanceAR}
                  onChange={(e) => setFreelanceAR(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">مستحقات الموردين AP ($):</label>
                <input
                  type="number"
                  value={storeAP + freelanceAP}
                  onChange={(e) => setStoreAP(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-rose-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">استثمار ورأس مال المالك ($):</label>
                <input
                  type="number"
                  value={ownerCapital}
                  onChange={(e) => setOwnerCapital(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">مسحوبات المالك الشخصية ($):</label>
                <input
                  type="number"
                  value={ownerDrawings}
                  onChange={(e) => setOwnerDrawings(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">السيولة في الصندوق والبنك ($):</label>
                <input
                  type="number"
                  value={totalLiquidCash}
                  onChange={(e) => setBankBalance(Number(e.target.value) - cashBalance)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-cyan-400"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Metric Selector & Deep Dive */}
        <div className="space-y-4">
          
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              فهرس المؤشرات الـ 15 (اختر للفحص):
            </h3>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {FINANCIAL_METRICS.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    selectedMetric.id === metric.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800/80 bg-slate-950/40'
                  }`}
                >
                  <span className="truncate">{metric.nameAr}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                    {metric.unitScope.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Metric Inspection Panel */}
          {selectedMetric && (
            <div className="bg-slate-900/95 rounded-xl border border-cyan-500/30 p-5 space-y-4 shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 font-bold">{selectedMetric.nameEn}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {selectedMetric.category === 'income' ? 'قائمة الدخل' :
                     selectedMetric.category === 'balance_sheet' ? 'الميزانية العمومية' : 'ربحية الوحدات'}
                  </span>
                </div>
                <h4 className="font-bold text-base text-white mt-1">{selectedMetric.nameAr}</h4>
              </div>

              {/* Formula */}
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                <span className="text-[11px] font-bold text-emerald-400 block mb-1">المعادلة المحاسبية:</span>
                <p className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-line">
                  {selectedMetric.formula}
                </p>
              </div>

              {/* Accounting logic */}
              <div className="text-xs space-y-1 text-slate-300">
                <p><strong className="text-cyan-400">طبيعة الحساب:</strong> {selectedMetric.accountingLogic.debitCreditImpact}</p>
                <p><strong className="text-slate-400">أرقام الحسابات:</strong> {selectedMetric.accountingLogic.accountCodes}</p>
              </div>

              {/* MySQL Query Box */}
              <div className="relative bg-slate-950 rounded-lg p-3 border border-slate-800 text-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-400">استعلام MySQL 8.0:</span>
                  <button
                    onClick={() => copySql(selectedMetric.sqlQuerySample)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'تم النسخ' : 'نسخ الاستعلام'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre p-1">
                  {selectedMetric.sqlQuerySample}
                </pre>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
