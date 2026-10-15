import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  DollarSign, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Boxes, 
  Truck, 
  FileText, 
  Wallet,
  Sparkles,
  ChevronLeft,
  Calendar,
  Activity,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  salesToday: { count: number; total: number; paid: number; profit: number };
  salesMonth: { count: number; total: number; profit: number };
  quotations: { count: number; total: number };
  inventory: { 
    total_items: number; 
    total_units: number; 
    inventory_cost_valuation: number; 
    inventory_sell_valuation: number; 
    low_stock_count: number; 
    out_of_stock_count: number; 
  };
  accounts: Array<{ id: string; name: string; account_code: string; balance: number; type: string }>;
  totalLiquidity: number;
  customers: { count: number; total_receivables: number };
  suppliers: { count: number; total_payables: number };
  recentDaysTrend: Array<{ date: string; daily_sales: number; daily_profit: number; count: number }>;
  recentSales: Array<{ id: string; invoice_number: string; date: string; customer_name: string; net_total: number; payment_type: string; status: string; created_at: string }>;
  recentLogs: Array<{ id: string; timestamp: string; user: string; action: string; module: string; details: string }>;
  lowStockItems: Array<{ id: string; code: string; name: string; category: string; current_stock: number; min_stock: number; buy_price: number; sell_price: number; warehouse: string }>;
}

export const ModernDashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
        setLastUpdated(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 45 seconds
    const interval = setInterval(fetchStats, 45000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400">جارٍ تحليل مؤشرات الأداء الحية من قاعدة البيانات...</p>
      </div>
    );
  }

  const s = stats || {
    salesToday: { count: 0, total: 0, paid: 0, profit: 0 },
    salesMonth: { count: 0, total: 0, profit: 0 },
    quotations: { count: 0, total: 0 },
    inventory: { total_items: 0, total_units: 0, inventory_cost_valuation: 0, inventory_sell_valuation: 0, low_stock_count: 0, out_of_stock_count: 0 },
    accounts: [],
    totalLiquidity: 0,
    customers: { count: 0, total_receivables: 0 },
    suppliers: { count: 0, total_payables: 0 },
    recentDaysTrend: [],
    recentSales: [],
    recentLogs: [],
    lowStockItems: []
  };

  // Find max sales for relative bar chart height
  const maxTrend = Math.max(...s.recentDaysTrend.map(d => Number(d.daily_sales)), 1000);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 1. Header Banner & Quick Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 p-2 flex items-center justify-center border border-cyan-500/30 shadow-xl shadow-cyan-500/20 shrink-0">
              <img src="/dragon-logo.png" alt="Dragon Logo" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>لوحة التحكم والمؤشرات الحية • Live MySQL Intelligence</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                متجر دراجون للاليكترونيات والأنظمة الأمنية
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>آخر تحديث تلقائي: {lastUpdated || 'الآن'}</span>
                <span>•</span>
                <span>نظام التداول والتشغيل الموحد</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>تحديث المؤشرات</span>
            </button>

            <button
              onClick={() => onNavigate('sales')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-cyan-900/40 transition-all cursor-pointer active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>نقطة البيع (POS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Tier Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: مبيعات اليوم */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-cyan-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي مبيعات اليوم</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {Number(s.salesToday.total).toLocaleString()} <span className="text-xs font-bold text-cyan-500">ج.م</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
            <span className="text-slate-500">عدد الفواتير: <strong className="font-mono text-slate-800 dark:text-slate-200">{s.salesToday.count}</strong></span>
            <span className="text-emerald-500 font-bold font-mono">ربح: {Number(s.salesToday.profit).toLocaleString()} ج.م</span>
          </div>
        </div>

        {/* KPI 2: السيولة النقدية والخزائن */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-emerald-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي السيولة والخزائن</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {Number(s.totalLiquidity).toLocaleString()} <span className="text-xs font-bold text-emerald-500">ج.م</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
            <span className="text-slate-500">عدد الحسابات: <strong className="font-mono text-slate-800 dark:text-slate-200">{s.accounts.length}</strong></span>
            <button onClick={() => onNavigate('treasury_management')} className="text-cyan-500 hover:underline font-bold">عرض الخزائن ←</button>
          </div>
        </div>

        {/* KPI 3: قيمة المخزون الحالي */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-blue-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تقييم المخزون (بالتكلفة)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {Number(s.inventory.inventory_cost_valuation).toLocaleString()} <span className="text-xs font-bold text-blue-500">ج.م</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
            <span className="text-slate-500">الأصناف: <strong className="font-mono text-slate-800 dark:text-slate-200">{s.inventory.total_items}</strong> ({s.inventory.total_units} وحدة)</span>
            <span className="text-slate-400 font-mono">بسعر البيع: {Number(s.inventory.inventory_sell_valuation).toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 4: مديونيات العملاء والمستحقات */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-purple-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مديونيات العملاء (آجل)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {Number(s.customers.total_receivables).toLocaleString()} <span className="text-xs font-bold text-purple-500">ج.م</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
            <span className="text-slate-500">العملاء: <strong className="font-mono text-slate-800 dark:text-slate-200">{s.customers.count}</strong></span>
            <span className="text-rose-500 font-bold font-mono">للموردين: {Number(s.suppliers.total_payables).toLocaleString()} ج.م</span>
          </div>
        </div>

      </div>

      {/* 3. Middle Section: Sales Trend Chart & Treasuries Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart (7 Days) */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">مؤشر حركة المبيعات اليومية</h3>
                <p className="text-xs text-slate-400">حركة المبيعات خلال الأيام الـ 7 الأخيرة مباشرة من قاعدة البيانات</p>
              </div>
            </div>
            <div className="text-left font-mono">
              <span className="text-xs text-slate-400">إجمالي الشهر الحالي: </span>
              <strong className="text-cyan-500 font-black">{Number(s.salesMonth.total).toLocaleString()} ج.م</strong>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-3 pt-8 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
            {s.recentDaysTrend.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Activity className="w-8 h-8 opacity-40 animate-pulse" />
                <span className="text-xs font-bold">لا توجد عمليات بيع مسجلة خلال الأيام الماضية بعد</span>
              </div>
            ) : (
              s.recentDaysTrend.map((day, idx) => {
                const heightPercent = Math.max(10, Math.min(100, Math.round((Number(day.daily_sales) / maxTrend) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 bg-slate-950 text-white text-[10px] py-1 px-2.5 rounded-lg border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      <div>المبيعات: <strong>{Number(day.daily_sales).toLocaleString()} ج.م</strong></div>
                      <div className="text-emerald-400">الربح: {Number(day.daily_profit).toLocaleString()} ج.م</div>
                    </div>

                    <div 
                      style={{ height: `${heightPercent}%` }} 
                      className="w-full max-w-[42px] bg-gradient-to-t from-cyan-600 to-cyan-400 dark:from-cyan-900 dark:to-cyan-500 rounded-t-xl group-hover:from-cyan-500 group-hover:to-cyan-300 transition-all shadow-md relative"
                    >
                      {Number(day.daily_sales) > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300">
                          {Number(day.daily_sales) > 999 ? `${(Number(day.daily_sales) / 1000).toFixed(1)}k` : day.daily_sales}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 mt-2 truncate w-full text-center">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-cyan-500 inline-block" /> المبيعات الصافية</span>
              <span className="text-slate-500">عروض الأسعار المسجلة: <strong className="font-mono text-purple-400">{s.quotations.count}</strong></span>
            </div>
            <button onClick={() => onNavigate('sales')} className="text-cyan-500 hover:text-cyan-400 font-bold flex items-center gap-1 cursor-pointer">
              <span>فتح سجل الفواتير</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Treasuries & Liquidity Distribution */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">توزيع أرصدة الخزائن والبنوك</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500">
                {Number(s.totalLiquidity).toLocaleString()} ج.م
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {s.accounts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد خزائن أو حسابات بنكية مسجلة
                </div>
              ) : (
                s.accounts.map((acc, idx) => {
                  const share = s.totalLiquidity > 0 ? Math.round((Number(acc.balance) / s.totalLiquidity) * 100) : 0;
                  return (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{acc.name}</span>
                        <span className="font-mono font-black text-slate-900 dark:text-slate-100">{Number(acc.balance).toLocaleString()} ج.م</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          style={{ width: `${Math.max(2, share)}%` }} 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>كود: {acc.account_code || '111'}</span>
                        <span>{share}% من السيولة</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('treasury_management')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all text-center cursor-pointer"
          >
            إدارة الخزائن والمعاملات المالية
          </button>
        </div>

      </div>

      {/* 4. Bottom Grid: Inventory Status & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Inventory Status & Low Stock Alerts */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">تنبيهات نواقص المخزون الحرج</h3>
                <p className="text-xs text-slate-400">منتجات وصلت للحد الأدنى أو نفدت كميتها تماماً</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold font-mono">
              {s.inventory.low_stock_count} صنف منخفض
            </span>
          </div>

          <div className="space-y-2 mt-4">
            {s.lowStockItems.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-400">جميع المنتجات في المخازن برصيد كافٍ وآمن</p>
              </div>
            ) : (
              s.lowStockItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">كود: {item.code} • {item.warehouse}</div>
                  </div>
                  <div className="text-left font-mono">
                    <span className={`px-2 py-0.5 rounded-lg font-black text-xs ${
                      Number(item.current_stock) <= 0 
                        ? 'bg-rose-500/20 text-rose-500' 
                        : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {item.current_stock} رصيد (الحد {item.min_stock})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">الأصناف النافذة بالكامل: <strong className="font-mono text-rose-500">{s.inventory.out_of_stock_count}</strong></span>
            <button onClick={() => onNavigate('stock_in')} className="text-cyan-500 hover:underline font-bold">
              إصدار أمر توريد بضائع ←
            </button>
          </div>
        </div>

        {/* Live Operations & Audit Log */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">سجل العمليات والنشاط الأخير</h3>
                <p className="text-xs text-slate-400">متابعة فورية للعمليات المنفذة في النظام بواسطة المستخدمين</p>
              </div>
            </div>
            <button onClick={() => onNavigate('activity_log')} className="text-xs text-cyan-500 font-bold hover:underline">
              السجل الكامل ←
            </button>
          </div>

          <div className="space-y-2 mt-4">
            {s.recentLogs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                لا توجد حركات مسجلة في سجل النظام حتى الآن
              </div>
            ) : (
              s.recentLogs.map((log, idx) => (
                <div key={idx} className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        {log.action}
                      </span>
                      <span>{log.details || log.module}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      بواسطة: {log.user} • {log.timestamp || 'مؤخراً'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
