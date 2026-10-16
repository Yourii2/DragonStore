import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Boxes, 
  Coins, 
  Users, 
  Truck, 
  Receipt, 
  RefreshCw, 
  FileText,
  DollarSign,
  AlertTriangle,
  ArrowUpDown,
  Building,
  CheckCircle2,
  PieChart,
  BarChart3
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';


export type ReportType = 
  | 'sales' 
  | 'physical' 
  | 'maintenance' 
  | 'software' 
  | 'network' 
  | 'inventory' 
  | 'treasury' 
  | 'customers' 
  | 'suppliers' 
  | 'expenses' 
  | 'pnl';

interface AccountingReportsViewProps {
  initialReport?: ReportType;
}

export const AccountingReportsView: React.FC<AccountingReportsViewProps> = ({ initialReport = 'sales' }) => {
  const [activeReport, setActiveReport] = useState<ReportType>(initialReport);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
    }
  }, [initialReport]);

  // Filter States
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState<'all' | 'shop' | 'freelance'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown options
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch initial dropdown metadata
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [whRes, catRes] = await Promise.all([
          fetch('/api/warehouses'),
          fetch('/api/categories')
        ]);
        const whData = await whRes.json();
        const catData = await catRes.json();
        if (whData.success) setWarehouses(whData.warehouses || []);
        if (catData.success) setCategories(catData.categories || []);
      } catch (e) {
        console.error('Failed to load filter metadata', e);
      }
    };
    fetchMeta();
  }, []);

  // Fetch report data
  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: activeReport,
        startDate: startDate || '',
        endDate: endDate || '',
        category: categoryFilter,
        warehouse: warehouseFilter,
        paymentType: paymentTypeFilter,
        status: statusFilter,
        unit: unitFilter
      });

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate, categoryFilter, warehouseFilter, paymentTypeFilter, statusFilter, unitFilter]);

  // Handle Export to CSV/Excel
  const handleExportCSV = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) {
      alert('لا توجد بيانات متاحة للتصدير');
      return;
    }

    const rows = reportData.rows;
    const headers = Object.keys(rows[0]).filter(k => k !== 'items');
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => 
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          cell = cell.replace(/"/g, '""');
          return `"${cell}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dragon_report_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Filtered rows for client-side search query
  const filteredRows = (reportData?.rows || []).filter((r: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(r).some(val => 
      typeof val === 'string' && val.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <span className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg">
            <FileSpreadsheet className="w-7 h-7" />
          </span>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <span>
                {activeReport === 'sales' && 'تقرير المبيعات والفواتير والأرباح التشغيلية'}
                {activeReport === 'physical' && 'تقرير مبيعات وأرباح السلع والمنتجات المادية'}
                {activeReport === 'maintenance' && 'تقرير أرباح الصيانة وخدمات الأجهزة وقطع الغيار'}
                {activeReport === 'software' && 'تقرير مبيعات وأرباح البرمجيات والحلول السحابية'}
                {activeReport === 'network' && 'تقرير أرباح وخسائر الشبكة والمشتركين حسب المدة'}
                {activeReport === 'inventory' && 'تقرير تقييم المخزون والبضاعة والنواقص'}
                {activeReport === 'treasury' && 'تقرير حركات وسندات الخزائن والتدفقات النقدية'}
                {activeReport === 'customers' && 'تقرير كشف حسابات وأرصدة العملاء والديون'}
                {activeReport === 'suppliers' && 'تقرير كشف حسابات ومستحقات الموردين'}
                {activeReport === 'expenses' && 'تقرير تحليل وتوزيع المصروفات التشغيلية'}
                {activeReport === 'pnl' && 'قائمة الدخل والأرباح والخسائر الختامية (P&L)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              تقرير معتمد من قاعدة البيانات يدعم الفلترة المتقدمة، الحسابات الدقيقة، الطباعة، والتصدير إلى Excel
            </p>
          </div>
        </div>

        {/* Action Buttons: Print & Export */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>طباعة التقرير</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>خيارات الفلترة والتصفية الدقيقة:</span>
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Start Date */}
          {(activeReport === 'sales' || activeReport === 'physical' || activeReport === 'maintenance' || activeReport === 'software' || activeReport === 'network' || activeReport === 'treasury' || activeReport === 'expenses' || activeReport === 'pnl') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-500" />
                <span>من تاريخ:</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          {/* End Date */}
          {(activeReport === 'sales' || activeReport === 'physical' || activeReport === 'maintenance' || activeReport === 'software' || activeReport === 'network' || activeReport === 'treasury' || activeReport === 'expenses' || activeReport === 'pnl') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-500" />
                <span>إلى تاريخ:</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          {/* Warehouse Filter */}
          {activeReport === 'inventory' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Boxes className="w-3 h-3 text-cyan-500" />
                <span>المخزن:</span>
              </label>
              <SearchableSelect
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">كل المخازن</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </SearchableSelect>
            </div>
          )}

          {/* Category Filter */}
          {activeReport === 'inventory' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-500" />
                <span>التصنيف:</span>
              </label>
              <SearchableSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">كافة التصنيفات</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </SearchableSelect>
            </div>
          )}

          {/* Payment Type */}
          {(activeReport === 'sales' || activeReport === 'treasury') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-cyan-500" />
                <span>طريقة الدفع / النوع:</span>
              </label>
              <SearchableSelect
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">الكل</option>
                <option value="CASH">نقدي (Cash)</option>
                <option value="CREDIT">آجل (Credit)</option>
                <option value="BANK_TRANSFER">تحويل بنكي</option>
                <option value="RECEIPT">إيداع / سند قبض</option>
                <option value="PAYMENT">صرف / سند دفع</option>
              </SearchableSelect>
            </div>
          )}

          {/* Status Filter */}
          {(activeReport === 'sales' || activeReport === 'inventory' || activeReport === 'customers' || activeReport === 'suppliers') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-cyan-500" />
                <span>الحالة:</span>
              </label>
              <SearchableSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">كافة الحالات</option>
                {activeReport === 'sales' && (
                  <>
                    <option value="COMPLETED">مكتملة</option>
                    <option value="QUOTATION">عرض سعر</option>
                  </>
                )}
                {activeReport === 'inventory' && (
                  <>
                    <option value="available">متوفر في المخزن</option>
                    <option value="low_stock">نواقص (أوشك على النفاد)</option>
                    <option value="out_of_stock">رصيد صفري (نفد)</option>
                  </>
                )}
                {activeReport === 'customers' && (
                  <>
                    <option value="debtors">عملاء مدينون (عليهم مبالغ)</option>
                    <option value="settled">حسابات مسددة بالكامل</option>
                  </>
                )}
                {activeReport === 'suppliers' && (
                  <>
                    <option value="creditors">موردون دائنون (لهم مستحقات)</option>
                    <option value="settled">حسابات مسددة</option>
                  </>
                )}
              </SearchableSelect>
            </div>
          )}

          {/* Unit Filter */}
          {(activeReport === 'sales' || activeReport === 'pnl') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-cyan-500" />
                <span>الوحدة التشغيلية:</span>
              </label>
              <SearchableSelect
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">المتجر والمؤسسة بالكامل</option>
                <option value="shop">المتجر والأجهزة (BU 1)</option>
                <option value="freelance">البرمجيات الحرة (BU 2)</option>
              </SearchableSelect>
            </div>
          )}

          {/* Fast Search input */}
          {activeReport !== 'pnl' && (
            <div className="sm:col-span-2 md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Search className="w-3 h-3 text-cyan-500" />
                <span>بحث سريع داخل السجلات:</span>
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الكود، الرقم..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

        </div>
      </div>

      {/* Printable Header (Visible only on print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-xl font-bold">تقرير تفصيلي - متجر دراجون للأنظمة المتكاملة</h1>
        <p className="text-sm text-slate-600 mt-1">
          نوع التقرير: {activeReport.toUpperCase()} • الفترة من: {startDate || 'البداية'} إلى: {endDate || 'الآن'}
        </p>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold">جاري استخراج وتحليل بيانات التقرير بدقة فائقة...</p>
        </div>
      )}

      {/* REPORT CONTENT VIEW */}
      {!loading && reportData && (
        <div className="space-y-6">

          {/* 1. SALES REPORT VIEW */}
          {activeReport === 'sales' && (
            <div className="space-y-5">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي المبيعات (صافي)</span>
                  <div className="text-lg font-black text-cyan-400 font-mono">
                    {Number(reportData.totals.netTotal).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 block">عدد الفواتير: {reportData.totals.count}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">مجمل الأرباح التشغيلية</span>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {Number(reportData.totals.grossProfit).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold mt-1 block">
                    هامش الربح: {reportData.totals.netTotal > 0 ? ((reportData.totals.grossProfit / reportData.totals.netTotal) * 100).toFixed(1) : 0}%
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">المبالغ المحصلة فعلياً</span>
                  <div className="text-lg font-black text-blue-400 font-mono">
                    {Number(reportData.totals.paidAmount).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold mt-1 block">نسبة التحصيل: {reportData.totals.netTotal > 0 ? ((reportData.totals.paidAmount / reportData.totals.netTotal) * 100).toFixed(1) : 0}%</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">المتبقي الآجل (ديون)</span>
                  <div className="text-lg font-black text-rose-400 font-mono">
                    {Number(reportData.totals.remainingAmount).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">مستحقات على العملاء</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 font-mono">
                      <tr>
                        <th className="py-3 px-4">رقم الفاتورة</th>
                        <th className="py-3 px-4">التاريخ</th>
                        <th className="py-3 px-4">العميل</th>
                        <th className="py-3 px-4">الإجمالي قبل الخصم</th>
                        <th className="py-3 px-4">الخصم</th>
                        <th className="py-3 px-4 text-cyan-400">الصافي</th>
                        <th className="py-3 px-4 text-emerald-400">الربح</th>
                        <th className="py-3 px-4">المدفوع</th>
                        <th className="py-3 px-4">المتبقي</th>
                        <th className="py-3 px-4">الدفع</th>
                        <th className="py-3 px-4">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRows.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-cyan-400">{inv.invoice_number}</td>
                          <td className="py-2.5 px-4 text-slate-400">{inv.date}</td>
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-200">{inv.customer_name}</td>
                          <td className="py-2.5 px-4 text-slate-400">{Number(inv.subtotal).toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-rose-400">{Number(inv.discount).toLocaleString()}</td>
                          <td className="py-2.5 px-4 font-black text-cyan-300">{Number(inv.net_total).toLocaleString()} ج.م</td>
                          <td className="py-2.5 px-4 font-bold text-emerald-400">{Number(inv.gross_profit).toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-slate-300">{Number(inv.paid_amount).toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-rose-400 font-bold">{Number(inv.remaining_amount).toLocaleString()}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {inv.payment_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {inv.status === 'COMPLETED' ? 'مكتملة' : 'عرض سعر'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredRows.length === 0 && (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                            لا توجد فواتير مبيعات مطابقة لمعايير البحث المحددة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. INVENTORY REPORT VIEW */}
          {activeReport === 'inventory' && (
            <div className="space-y-5">
              {/* Inventory KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">قيمة المخزون بسعر الشراء (التكلفة)</span>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {Number(reportData.totals.totalCostValue).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 block">إجمالي الأصناف: {reportData.totals.totalItems} صنف</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">القيمة التقديرية بسعر البيع</span>
                  <div className="text-lg font-black text-cyan-400 font-mono">
                    {Number(reportData.totals.totalSellValue).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-cyan-500 font-bold mt-1 block">إجمالي الوحدات: {reportData.totals.totalUnits} قطعة</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">الربح المتوقع عند البيع</span>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {Number(reportData.totals.totalPotentialProfit).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold mt-1 block">هامش ربح المخزون</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">تنبيهات النواقص</span>
                  <div className="text-lg font-black text-rose-400 font-mono">
                    {reportData.totals.lowStockCount} <span className="text-xs">أصناف</span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">تحتاج لإعادة طلب وتوريد</span>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 font-mono">
                      <tr>
                        <th className="py-3 px-4">كود الصنف</th>
                        <th className="py-3 px-4">اسم المنتج</th>
                        <th className="py-3 px-4">التصنيف</th>
                        <th className="py-3 px-4">المخزن</th>
                        <th className="py-3 px-4 text-center">الرصيد الحالي</th>
                        <th className="py-3 px-4 text-center">الحد الأدنى</th>
                        <th className="py-3 px-4">سعر الشراء</th>
                        <th className="py-3 px-4">سعر البيع</th>
                        <th className="py-3 px-4 text-amber-400">إجمالي التكلفة</th>
                        <th className="py-3 px-4 text-cyan-400">إجمالي البيع</th>
                        <th className="py-3 px-4 text-emerald-400">الربح المتوقع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRows.map((prod: any) => {
                        const isLow = prod.current_stock <= prod.min_stock;
                        return (
                          <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-cyan-400">{prod.code}</td>
                            <td className="py-2.5 px-4 font-sans font-bold text-slate-200">{prod.name}</td>
                            <td className="py-2.5 px-4 text-slate-400">{prod.category}</td>
                            <td className="py-2.5 px-4 text-slate-400">{prod.warehouse}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                                isLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {prod.current_stock} {prod.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-500">{prod.min_stock}</td>
                            <td className="py-2.5 px-4 text-slate-400">{Number(prod.buy_price).toLocaleString()}</td>
                            <td className="py-2.5 px-4 text-slate-300 font-bold">{Number(prod.sell_price).toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-bold text-amber-400">{Number(prod.stock_cost_value).toLocaleString()} ج.م</td>
                            <td className="py-2.5 px-4 font-bold text-cyan-400">{Number(prod.stock_sell_value).toLocaleString()} ج.م</td>
                            <td className="py-2.5 px-4 font-bold text-emerald-400">+{Number(prod.potential_profit).toLocaleString()} ج.م</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. TREASURY REPORT VIEW */}
          {activeReport === 'treasury' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي الوارد (المقبوضات)</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    +{Number(reportData.totals.totalIn).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold mt-1 block">تدفق نقدي داخل</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي المنصرف (المدفوعات)</span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    -{Number(reportData.totals.totalOut).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">تدفق نقدي خارج</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">صافي الحركة النقدية</span>
                  <div className={`text-xl font-black font-mono ${reportData.totals.netCashFlow >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {Number(reportData.totals.netCashFlow).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">خلال الفترة المحددة</span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 font-mono">
                      <tr>
                        <th className="py-3 px-4">رقم الإيصال / السند</th>
                        <th className="py-3 px-4">التاريخ</th>
                        <th className="py-3 px-4">النوع</th>
                        <th className="py-3 px-4">الخزينة / الحساب</th>
                        <th className="py-3 px-4">البيان / التصنيف</th>
                        <th className="py-3 px-4">الطرف الآخر</th>
                        <th className="py-3 px-4 text-emerald-400">الوارد (+)</th>
                        <th className="py-3 px-4 text-rose-400">المنصرف (-)</th>
                        <th className="py-3 px-4 text-cyan-400">الرصيد بعد الحركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRows.map((tx: any) => {
                        const isIncome = tx.flow === 'IN' || tx.transaction_type === 'RECEIPT';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-cyan-400">{tx.reference_no}</td>
                            <td className="py-2.5 px-4 text-slate-400">{tx.date}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {isIncome ? 'قبض/إيداع' : 'صرف/دفع'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-200">{tx.account_name}</td>
                            <td className="py-2.5 px-4 text-slate-400">{tx.notes || tx.category || '-'}</td>
                            <td className="py-2.5 px-4 text-slate-300">{tx.party_name || '-'}</td>
                            <td className="py-2.5 px-4 font-bold text-emerald-400">
                              {isIncome ? `+${Number(tx.amount).toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-rose-400">
                              {!isIncome ? `-${Number(tx.amount).toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2.5 px-4 font-black text-cyan-400">{Number(tx.balance_after).toLocaleString()} ج.م</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. CUSTOMERS REPORT VIEW */}
          {activeReport === 'customers' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي ديون ومستحقات العملاء</span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {Number(reportData.totals.totalDebit).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">أرصدة مدينة لصالح المنشأة</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي أرصدة مقدمات العملاء</span>
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {Number(reportData.totals.totalCredit).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-cyan-500 font-bold mt-1 block">دفعات مقدمة / أرصدة دائنة</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي عدد العملاء</span>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    {reportData.totals.count} <span className="text-xs">عميل</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">المسجلين بالنظام</span>
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 font-mono">
                      <tr>
                        <th className="py-3 px-4">اسم العميل</th>
                        <th className="py-3 px-4">رقم الهاتف</th>
                        <th className="py-3 px-4">نوع التعامل</th>
                        <th className="py-3 px-4 text-center">عدد الفواتير</th>
                        <th className="py-3 px-4">الحد الائتماني</th>
                        <th className="py-3 px-4 text-center">الرصيد المالي الحالي</th>
                        <th className="py-3 px-4">حالة الحساب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRows.map((c: any) => {
                        const bal = Number(c.balance);
                        return (
                          <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-4 font-sans font-bold text-slate-200">{c.name}</td>
                            <td className="py-2.5 px-4 text-slate-400">{c.phone}</td>
                            <td className="py-2.5 px-4 text-slate-400">{c.type}</td>
                            <td className="py-2.5 px-4 text-center text-cyan-400 font-bold">{c.total_invoices}</td>
                            <td className="py-2.5 px-4 text-slate-400">{Number(c.credit_limit).toLocaleString()} ج.م</td>
                            <td className="py-2.5 px-4 text-center font-bold">
                              <span className={`px-2.5 py-1 rounded-full ${
                                bal > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                bal < 0 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400'
                              }`}>
                                {bal > 0 ? `مدين بـ ${bal.toLocaleString()} ج.م` : bal < 0 ? `دائن بـ ${Math.abs(bal).toLocaleString()} ج.م` : 'مسدد (0.00)'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-sans text-[11px]">
                              {bal > 0 ? <span className="text-rose-400 font-bold">مستحق السداد</span> : <span className="text-emerald-400 font-bold">سليم</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. SUPPLIERS REPORT VIEW */}
          {activeReport === 'suppliers' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي مستحقات الموردين (ديون علينا)</span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {Number(reportData.totals.totalBalance).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">مطلوب سدادها للشركات والموردين</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي حجم المشتريات التراكمية</span>
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {Number(reportData.totals.totalPurchases).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-cyan-500 font-bold mt-1 block">من كافة الموردين</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">عدد الموردين</span>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    {reportData.totals.count} <span className="text-xs">مورد</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">شركات وجهات توريد</span>
                </div>
              </div>

              {/* Suppliers Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 font-mono">
                      <tr>
                        <th className="py-3 px-4">اسم المورد</th>
                        <th className="py-3 px-4">الشركة</th>
                        <th className="py-3 px-4">الهاتف</th>
                        <th className="py-3 px-4">التصنيف</th>
                        <th className="py-3 px-4">شروط السداد</th>
                        <th className="py-3 px-4 text-cyan-400">إجمالي المشتريات</th>
                        <th className="py-3 px-4 text-rose-400">المستحق له (الرصيد)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRows.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-200">{s.name}</td>
                          <td className="py-2.5 px-4 text-slate-300 font-sans">{s.company}</td>
                          <td className="py-2.5 px-4 text-slate-400">{s.phone}</td>
                          <td className="py-2.5 px-4 text-slate-400">{s.category}</td>
                          <td className="py-2.5 px-4 text-slate-400">{s.payment_terms}</td>
                          <td className="py-2.5 px-4 font-bold text-cyan-400">{Number(s.total_purchases).toLocaleString()} ج.م</td>
                          <td className="py-2.5 px-4 font-black text-rose-400">{Number(s.balance).toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. EXPENSES REPORT VIEW */}
          {activeReport === 'expenses' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي المصروفات التشغيلية</span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {Number(reportData.totals.totalAmount).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 block">عدد البنود: {reportData.totals.count}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">حصة المتجر والأنظمة الأمنية (BU 1)</span>
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {Number(reportData.totals.shopPortion).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-cyan-500 font-bold mt-1 block">مصروفات مباشرة ومشتركة</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">حصة البرمجيات الحرة (BU 2)</span>
                  <div className="text-xl font-black text-purple-400 font-mono">
                    {Number(reportData.totals.freelancePortion).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-purple-500 font-bold mt-1 block">مصروفات التطوير والسيرفرات</span>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 font-mono">
                      <tr>
                        <th className="py-3 px-4">بند المصروف</th>
                        <th className="py-3 px-4">التاريخ</th>
                        <th className="py-3 px-4">التصنيف</th>
                        <th className="py-3 px-4">طريقة التوزيع</th>
                        <th className="py-3 px-4 text-cyan-400">حصة المتجر</th>
                        <th className="py-3 px-4 text-purple-400">حصة البرمجيات</th>
                        <th className="py-3 px-4 text-rose-400">إجمالي المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRows.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-200">{exp.title}</td>
                          <td className="py-2.5 px-4 text-slate-400">{exp.date}</td>
                          <td className="py-2.5 px-4 text-slate-300">{exp.category}</td>
                          <td className="py-2.5 px-4 text-slate-400">{exp.allocation_ratio || exp.type}</td>
                          <td className="py-2.5 px-4 text-cyan-400">{Number(exp.shop_portion).toLocaleString()} ج.م</td>
                          <td className="py-2.5 px-4 text-purple-400">{Number(exp.freelance_portion).toLocaleString()} ج.م</td>
                          <td className="py-2.5 px-4 font-black text-rose-400">{Number(exp.amount).toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. P&L STATEMENT VIEW */}
          {activeReport === 'pnl' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي الإيرادات (المبيعات)</span>
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {Number(reportData.sales).toLocaleString()} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-cyan-500 font-bold mt-1 block">إجمالي النشاط</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">تكلفة البضاعة المباعة (COGS)</span>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    ({Number(reportData.cogs).toLocaleString()}) <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-amber-500 font-bold mt-1 block">التكلفة المباشرة</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">المصروفات والرواتب التشغيلية</span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    ({Number(reportData.expenses).toLocaleString()}) <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">رواتب + مصاريف عامة</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">صافي الأرباح الحقيقية (Net Profit)</span>
                  <div className={`text-xl font-black font-mono ${reportData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {reportData.netProfit >= 0 ? `+${Number(reportData.netProfit).toLocaleString()}` : `(${Number(Math.abs(reportData.netProfit)).toLocaleString()})`} <span className="text-xs">ج.م</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold mt-1 block">الأرباح الصافية بعد كافة التكاليف</span>
                </div>
              </div>

              {/* Detailed Financial Statement Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span>قائمة الدخل والأرباح والخسائر المعيارية المعتمدة (P&L Income Statement)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">توضح معادلة: المبيعات - تكلفة البضاعة المباعة = مجمل الربح - المصروفات والرواتب = صافي الربح</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 font-mono text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">البند المالي والتشغيلي</th>
                        <th className="py-3 px-4 text-center w-40">المتجر والأجهزة (BU 1)</th>
                        <th className="py-3 px-4 text-center w-40">البرمجيات الحرة (BU 2)</th>
                        <th className="py-3 px-4 text-center w-48 text-cyan-400">الإجمالي المجمع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      
                      {/* 1. Revenues */}
                      <tr className="bg-slate-950/40 font-bold text-slate-200">
                        <td className="py-2.5 px-4 text-emerald-400">1. إجمالي الإيرادات والمبيعات التشغيلية:</td>
                        <td className="py-2.5 px-4 text-center text-slate-200">{Number(reportData.shop.sales).toLocaleString()} ج.م</td>
                        <td className="py-2.5 px-4 text-center text-slate-200">{Number(reportData.freelance.sales).toLocaleString()} ج.م</td>
                        <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">{Number(reportData.sales).toLocaleString()} ج.م</td>
                      </tr>

                      {/* 2. COGS */}
                      <tr className="bg-slate-950/40 font-bold text-slate-200">
                        <td className="py-2.5 px-4 text-rose-400">2. يخصم: تكلفة البضاعة المباعة (COGS):</td>
                        <td className="py-2.5 px-4 text-center text-rose-400">({Number(reportData.shop.cogs).toLocaleString()}) ج.م</td>
                        <td className="py-2.5 px-4 text-center text-rose-400">({Number(reportData.freelance.cogs).toLocaleString()}) ج.م</td>
                        <td className="py-2.5 px-4 text-center text-rose-400 font-bold">({Number(reportData.cogs).toLocaleString()}) ج.م</td>
                      </tr>

                      {/* 3. Gross Profit */}
                      <tr className="bg-cyan-950/30 font-black text-cyan-300 border-y border-cyan-800/40">
                        <td className="py-3.5 px-4">= مجمل الربح التشغيلي (Gross Profit):</td>
                        <td className="py-3.5 px-4 text-center">{Number(reportData.shop.grossProfit).toLocaleString()} ج.م</td>
                        <td className="py-3.5 px-4 text-center">{Number(reportData.freelance.grossProfit).toLocaleString()} ج.م</td>
                        <td className="py-3.5 px-4 text-center text-emerald-400 text-sm font-black">{Number(reportData.grossProfit).toLocaleString()} ج.م</td>
                      </tr>

                      {/* 4. Operating Expenses */}
                      <tr className="bg-slate-950/40 font-bold text-slate-200">
                        <td className="py-2.5 px-4 text-amber-400">3. يخصم: المصروفات الإدارية والتشغيلية والرواتب:</td>
                        <td className="py-2.5 px-4 text-center text-slate-400">({Number(reportData.shop.expenses).toLocaleString()}) ج.م</td>
                        <td className="py-2.5 px-4 text-center text-slate-400">({Number(reportData.freelance.expenses).toLocaleString()}) ج.م</td>
                        <td className="py-2.5 px-4 text-center text-rose-400 font-bold">({Number(reportData.expenses).toLocaleString()}) ج.م</td>
                      </tr>

                      {/* 5. Net Profit */}
                      <tr className="bg-emerald-950/40 font-black text-emerald-400 text-sm border-t-2 border-emerald-500/50">
                        <td className="py-4 px-4">= صافي الأرباح الصافية (Net Profit):</td>
                        <td className="py-4 px-4 text-center text-cyan-300">+{Number(reportData.shop.grossProfit - reportData.shop.expenses).toLocaleString()} ج.م</td>
                        <td className="py-4 px-4 text-center text-purple-300">+{Number(reportData.freelance.grossProfit - reportData.freelance.expenses).toLocaleString()} ج.م</td>
                        <td className="py-4 px-4 text-center text-emerald-400 text-base">+{Number(reportData.netProfit).toLocaleString()} ج.م</td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
