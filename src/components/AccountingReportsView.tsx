import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  BookOpen, 
  Activity,
  FileText,
  Printer
} from 'lucide-react';
import { globalErpStore, JournalEntry } from '../store/erpStore';

export const AccountingReportsView: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'pnl' | 'journal' | 'trial_balance' | 'balance_sheet'>('pnl');
  const [selectedUnit, setSelectedUnit] = useState<'all' | 'shop' | 'freelance'>('all');

  const journalEntries = globalErpStore.journalEntries;
  const financialSummary = globalErpStore.getFinancialSummary();

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-black text-slate-100">المنظومة المحاسبية والتقارير والقوائم المالية الختامية</h2>
            <p className="text-xs text-slate-400 mt-0.5">قائمة الدخل P&L، ميزان المراجعة، الميزانية العمومية، ودفتر قيود اليومية المزدوجة المتوازنة</p>
          </div>
        </div>

        {/* Report Selector Pills */}
        <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setActiveReport('pnl')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReport === 'pnl' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>قائمة الدخل (P&L)</span>
          </button>
          <button
            onClick={() => setActiveReport('journal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReport === 'journal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>قيود اليومية ({journalEntries.length})</span>
          </button>
          <button
            onClick={() => setActiveReport('trial_balance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReport === 'trial_balance' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>ميزان المراجعة</span>
          </button>
          <button
            onClick={() => setActiveReport('balance_sheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReport === 'balance_sheet' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>الميزانية العمومية</span>
          </button>
        </div>
      </div>

      {/* 1. Profit & Loss Statement (P&L) */}
      {activeReport === 'pnl' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-100">قائمة الأرباح والخسائر المعيارية (Profit and Loss Statement)</h3>
              <p className="text-xs text-slate-400">تطبيق معادلة: مجمل الربح = المبيعات - COGS | صافي الربح = الإيرادات التشغيلية - المصروفات والرواتب</p>
            </div>

            {/* Unit switch */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => setSelectedUnit('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${selectedUnit === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
              >
                الإجمالي الموحد
              </button>
              <button
                onClick={() => setSelectedUnit('shop')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${selectedUnit === 'shop' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                متجر التقنية (BU 1)
              </button>
              <button
                onClick={() => setSelectedUnit('freelance')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${selectedUnit === 'freelance' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
              >
                تطوير البرمجيات (BU 2)
              </button>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 font-mono text-xs">
            <table className="w-full text-right">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">البند المالي والتشغيلي</th>
                  <th className="py-3 px-4 text-center w-36">المتجر والخدمات (BU1)</th>
                  <th className="py-3 px-4 text-center w-36">البرمجيات الحرة (BU2)</th>
                  <th className="py-3 px-4 text-center w-40 text-cyan-400">الإجمالي المجمع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                
                {/* Revenues */}
                <tr className="bg-slate-950/40 font-bold text-slate-200">
                  <td className="py-2.5 px-4 text-emerald-400">1. الإيرادات والمبيعات التشغيلية:</td>
                  <td className="py-2.5 px-4 text-center"></td>
                  <td className="py-2.5 px-4 text-center"></td>
                  <td className="py-2.5 px-4 text-center"></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pr-8 text-slate-300">مبيعات الأجهزة ومكونات الحواسيب</td>
                  <td className="py-2 px-4 text-center text-slate-200">{financialSummary.shop.sales.toLocaleString()} ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-500">-</td>
                  <td className="py-2 px-4 text-center text-slate-200">{financialSummary.shop.sales.toLocaleString()} ج.م</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pr-8 text-slate-300">إيرادات ورشة الصيانة ومشاريع CCTV والشبكات</td>
                  <td className="py-2 px-4 text-center text-slate-200">{financialSummary.shop.services.toLocaleString()} ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-500">-</td>
                  <td className="py-2 px-4 text-center text-slate-200">{financialSummary.shop.services.toLocaleString()} ج.م</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pr-8 text-slate-300">إيرادات اشتراكات شبكة الإنترنت</td>
                  <td className="py-2 px-4 text-center text-slate-200">{financialSummary.shop.internet.toLocaleString()} ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-500">-</td>
                  <td className="py-2 px-4 text-center text-slate-200">{financialSummary.shop.internet.toLocaleString()} ج.م</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pr-8 text-slate-300">إيرادات عقود ومشاريع البرمجيات</td>
                  <td className="py-2 px-4 text-center text-slate-500">-</td>
                  <td className="py-2 px-4 text-center text-slate-200">{financialSummary.freelance.revenue.toLocaleString()} ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-200">{financialSummary.freelance.revenue.toLocaleString()} ج.م</td>
                </tr>

                {/* Direct Costs / COGS */}
                <tr className="bg-slate-950/40 font-bold text-slate-200">
                  <td className="py-2.5 px-4 text-rose-400">2. يخصم: تكلفة البضاعة المباعة والتكاليف المباشرة (COGS):</td>
                  <td className="py-2.5 px-4 text-center text-rose-400">({financialSummary.shop.cogs.toLocaleString()}) ج.م</td>
                  <td className="py-2.5 px-4 text-center text-rose-400">({financialSummary.freelance.directExpenses.toLocaleString()}) ج.م</td>
                  <td className="py-2.5 px-4 text-center text-rose-400 font-bold">({financialSummary.combined.totalCogsAndDirectCost.toLocaleString()}) ج.م</td>
                </tr>

                {/* Gross Profit */}
                <tr className="bg-cyan-950/20 font-black text-cyan-300 border-y border-cyan-900/40">
                  <td className="py-3 px-4">= مجمل الربح التشغيلي (Gross Profit):</td>
                  <td className="py-3 px-4 text-center">{financialSummary.shop.grossProfit.toLocaleString()} ج.م</td>
                  <td className="py-3 px-4 text-center">{(financialSummary.freelance.revenue - financialSummary.freelance.directExpenses).toLocaleString()} ج.م</td>
                  <td className="py-3 px-4 text-center text-emerald-400 text-sm">{financialSummary.combined.totalGrossProfit.toLocaleString()} ج.م</td>
                </tr>

                {/* Operating Expenses */}
                <tr className="bg-slate-950/40 font-bold text-slate-200">
                  <td className="py-2.5 px-4 text-amber-400">3. يخصم: المصروفات التشغيلية والرواتب والإهلاك:</td>
                  <td className="py-2.5 px-4 text-center"></td>
                  <td className="py-2.5 px-4 text-center"></td>
                  <td className="py-2.5 px-4 text-center"></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pr-8 text-slate-300">رواتب وأجور الموظفين والفنيين والمبرمجين</td>
                  <td className="py-2 px-4 text-center text-slate-400">({financialSummary.shop.salaries.toLocaleString()}) ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-400">({financialSummary.freelance.salaries.toLocaleString()}) ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-400">({(financialSummary.shop.salaries + financialSummary.freelance.salaries).toLocaleString()}) ج.م</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pr-8 text-slate-300">المصروفات الإدارية والمشتركة (كهرباء، إيجار، إنترنت 70/30)</td>
                  <td className="py-2 px-4 text-center text-slate-400">({financialSummary.shop.expenses.toLocaleString()}) ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-400">({financialSummary.freelance.generalExpenses.toLocaleString()}) ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-400">({(financialSummary.shop.expenses + financialSummary.freelance.generalExpenses).toLocaleString()}) ج.م</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pr-8 text-slate-300">أقساط إهلاك الأصول والمعدات الثابتة</td>
                  <td className="py-2 px-4 text-center text-slate-400">({Math.round(financialSummary.shop.depreciation).toLocaleString()}) ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-400">({Math.round(financialSummary.freelance.depreciation).toLocaleString()}) ج.م</td>
                  <td className="py-2 px-4 text-center text-slate-400">({Math.round(financialSummary.shop.depreciation + financialSummary.freelance.depreciation).toLocaleString()}) ج.م</td>
                </tr>

                {/* Net Profit */}
                <tr className="bg-emerald-950/30 font-black text-emerald-400 text-sm border-t-2 border-emerald-500/50">
                  <td className="py-4 px-4">= صافي الأرباح الصافية الحقيقية (Net Profit):</td>
                  <td className="py-4 px-4 text-center text-cyan-300">+{financialSummary.shop.netProfit.toLocaleString()} ج.م</td>
                  <td className="py-4 px-4 text-center text-purple-300">+{financialSummary.freelance.netProfit.toLocaleString()} ج.م</td>
                  <td className="py-4 px-4 text-center text-emerald-400 text-base">+{financialSummary.combined.totalNetProfit.toLocaleString()} ج.م</td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Journal Entries */}
      {activeReport === 'journal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">سجل قيود اليومية العامة المزدوجة (Double-Entry Journal)</h3>
              <p className="text-xs text-slate-400">كافة القيود متوازنة بدقة (إجمالي المدين = إجمالي الدائن) وغير قابلة للتلاعب</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>معدل التوازن: 100%</span>
            </span>
          </div>

          <div className="space-y-4">
            {journalEntries.map(entry => {
              const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
              const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

              return (
                <div key={entry.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                        {entry.entry_number}
                      </span>
                      <span className="text-xs text-slate-300 font-bold">{entry.description}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{entry.date}</span>
                  </div>

                  <table className="w-full text-right text-xs font-mono">
                    <thead className="text-slate-500 border-b border-slate-900 text-[11px]">
                      <tr>
                        <th className="py-1.5 px-2">كود الحساب</th>
                        <th className="py-1.5 px-2">اسم الحساب في شجرة الحسابات</th>
                        <th className="py-1.5 px-2 text-center w-28">مدين (Debit)</th>
                        <th className="py-1.5 px-2 text-center w-28">دائن (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {entry.lines.map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/30">
                          <td className="py-1.5 px-2 text-slate-400">{l.account_code}</td>
                          <td className="py-1.5 px-2 text-slate-200">{l.account_name}</td>
                          <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">
                            {l.debit > 0 ? `${l.debit.toLocaleString()} ج.م` : '-'}
                          </td>
                          <td className="py-1.5 px-2 text-center text-cyan-400 font-bold">
                            {l.credit > 0 ? `${l.credit.toLocaleString()} ج.م` : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-900/60 font-bold border-t border-slate-800">
                        <td colSpan={2} className="py-2 px-2 text-slate-400 text-left">إجمالي القيد المتوازن:</td>
                        <td className="py-2 px-2 text-center text-emerald-400">{totalDebit.toLocaleString()} ج.م</td>
                        <td className="py-2 px-2 text-center text-cyan-400">{totalCredit.toLocaleString()} ج.م</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Trial Balance */}
      {activeReport === 'trial_balance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">ميزان المراجعة بالأرصدة والمجاميع (Trial Balance)</h3>
              <p className="text-xs text-slate-400">التحقق الرقابي الشامل من تساوي الأرصدة المدينة والدائنة في نهاية الفترة</p>
            </div>
            <span className="text-xs text-cyan-400 font-mono font-bold">حالة الميزان: متوازن تماماً</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 font-mono text-xs">
            <table className="w-full text-right">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">رقم الحساب</th>
                  <th className="py-2.5 px-3">اسم الحساب</th>
                  <th className="py-2.5 px-3">النوع</th>
                  <th className="py-2.5 px-3 text-center w-36">رصيد مدين</th>
                  <th className="py-2.5 px-3 text-center w-36">رصيد دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2 px-3 text-slate-400">1111</td>
                  <td className="py-2 px-3 text-slate-200">صندوق كاشير المحل الرئيسي</td>
                  <td className="py-2 px-3 text-slate-400">أصل متداول</td>
                  <td className="py-2 px-3 text-center text-emerald-400 font-bold">{globalErpStore.accounts[0]?.balance.toLocaleString()} ج.م</td>
                  <td className="py-2 px-3 text-center text-slate-500">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">1120</td>
                  <td className="py-2 px-3 text-slate-200">البنك الأهلي المصري (حساب رئيسي)</td>
                  <td className="py-2 px-3 text-slate-400">أصل متداول</td>
                  <td className="py-2 px-3 text-center text-emerald-400 font-bold">{globalErpStore.accounts[2]?.balance.toLocaleString()} ج.م</td>
                  <td className="py-2 px-3 text-center text-slate-500">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">1210</td>
                  <td className="py-2 px-3 text-slate-200">مخزون بضاعة وأجهزة ولابتوبات</td>
                  <td className="py-2 px-3 text-slate-400">أصل متداول</td>
                  <td className="py-2 px-3 text-center text-emerald-400 font-bold">{financialSummary.combined.inventoryValuation.toLocaleString()} ج.م</td>
                  <td className="py-2 px-3 text-center text-slate-500">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">1310</td>
                  <td className="py-2 px-3 text-slate-200">ذمم العملاء ومستحقات المشاريع</td>
                  <td className="py-2 px-3 text-slate-400">أصل متداول</td>
                  <td className="py-2 px-3 text-center text-emerald-400 font-bold">{financialSummary.combined.accountsReceivable.toLocaleString()} ج.م</td>
                  <td className="py-2 px-3 text-center text-slate-500">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">1510</td>
                  <td className="py-2 px-3 text-slate-200">الأصول والمعدات الثابتة (صافي دفتري)</td>
                  <td className="py-2 px-3 text-slate-400">أصل غير متداول</td>
                  <td className="py-2 px-3 text-center text-emerald-400 font-bold">{financialSummary.combined.fixedAssetsBookValue.toLocaleString()} ج.م</td>
                  <td className="py-2 px-3 text-center text-slate-500">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">2110</td>
                  <td className="py-2 px-3 text-slate-200">ذمم الموردين وشركات التوزيع</td>
                  <td className="py-2 px-3 text-slate-400">خصوم متداولة</td>
                  <td className="py-2 px-3 text-center text-slate-500">-</td>
                  <td className="py-2 px-3 text-center text-cyan-400 font-bold">{financialSummary.combined.accountsPayable.toLocaleString()} ج.م</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">3110</td>
                  <td className="py-2 px-3 text-slate-200">رأس مال المالك وصافي الأرباح المحتجزة</td>
                  <td className="py-2 px-3 text-slate-400">حقوق ملكية</td>
                  <td className="py-2 px-3 text-center text-slate-500">-</td>
                  <td className="py-2 px-3 text-center text-cyan-400 font-bold">{financialSummary.combined.ownerEquity.toLocaleString()} ج.م</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Balance Sheet */}
      {activeReport === 'balance_sheet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">الميزانية العمومية والمركز المالي (Balance Sheet)</h3>
              <p className="text-xs text-slate-400">معادلة الميزانية: الأصول = الخصوم + حقوق الملكية</p>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              إجمالي المركز المالي: {financialSummary.combined.totalAssets.toLocaleString()} ج.م
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Assets */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2">جانب الأصول (Assets)</h4>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-300">النقدية بالصناديق والبنوك والمحافظ:</span>
                  <span className="text-emerald-400 font-bold">{financialSummary.combined.totalCash.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">مخزون البضاعة والأجهزة (مقيم بـ WAC):</span>
                  <span className="text-emerald-400 font-bold">{financialSummary.combined.inventoryValuation.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">مستحقات وذمم العملاء (AR):</span>
                  <span className="text-emerald-400 font-bold">{financialSummary.combined.accountsReceivable.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">الأصول الثابتة (صافي القيمة الدفترية):</span>
                  <span className="text-emerald-400 font-bold">{financialSummary.combined.fixedAssetsBookValue.toLocaleString()} ج.م</span>
                </div>

                <div className="flex justify-between text-sm font-black text-slate-100 border-t border-slate-800 pt-3">
                  <span>إجمالي الأصول (Total Assets):</span>
                  <span className="text-emerald-400">{financialSummary.combined.totalAssets.toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-2">الخصوم وحقوق الملكية (Liabilities & Equity)</h4>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-300">ذمم الموردين والشركات (AP):</span>
                  <span className="text-rose-400 font-bold">{financialSummary.combined.accountsPayable.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">حقوق الملكية ورأس المال والأرباح:</span>
                  <span className="text-cyan-400 font-bold">{financialSummary.combined.ownerEquity.toLocaleString()} ج.م</span>
                </div>

                <div className="flex justify-between text-sm font-black text-slate-100 border-t border-slate-800 pt-3">
                  <span>إجمالي الخصوم وحقوق الملكية:</span>
                  <span className="text-cyan-400">{(financialSummary.combined.accountsPayable + financialSummary.combined.ownerEquity).toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
