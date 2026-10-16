import React, { useState, useEffect } from 'react';
import { systemAuthStore, hasPermission } from '../store/systemAuthStore';
import {
  Wifi,
  PlusCircle,
  MinusCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Landmark,
  Calendar,
  User,
  Phone,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Receipt
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';


interface NetworkTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  treasury_id: string;
  treasury_name: string;
  reason: string;
  subscriber_name?: string;
  phone?: string;
  date: string;
  created_at?: string;
}

interface TreasuryAccount {
  id: string;
  name: string;
  balance: number;
}

export const NetworkManagementView: React.FC = () => {
  const currentUser = systemAuthStore.currentUser;
  const canReceivePayment = hasPermission(currentUser, 'network_page', 'receive_payment');
  const canPayExpense = hasPermission(currentUser, 'network_page', 'pay_expense');

  const [transactions, setTransactions] = useState<NetworkTransaction[]>([]);
  const [treasuries, setTreasuries] = useState<TreasuryAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Modal State
  const [activeModal, setActiveModal] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    treasury_id: '',
    reason: '',
    subscriber_name: '',
    phone: '',
    date: new Date().toISOString().slice(0, 10)
  });

  // Filter & Search
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch transactions and treasuries
  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, accRes] = await Promise.all([
        fetch('/api/network/transactions').then(r => r.json()).catch(() => null),
        fetch('/api/accounts').then(r => r.json()).catch(() => null)
      ]);

      if (txRes?.success && txRes.data) {
        setTransactions(txRes.data);
      }
      if (accRes?.success && accRes.data) {
        setTreasuries(accRes.data);
        if (accRes.data.length > 0 && !formData.treasury_id) {
          setFormData(prev => ({ ...prev, treasury_id: accRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    if (activeModal === 'INCOME' && !canReceivePayment) {
      setMessage({ type: 'error', text: 'ليس لديك صلاحية استلام دفعات أو اشتراكات شبكة' });
      return;
    }

    if (activeModal === 'EXPENSE' && !canPayExpense) {
      setMessage({ type: 'error', text: 'ليس لديك صلاحية دفع أو تسجيل مصروف شبكة' });
      return;
    }

    const numAmount = Number(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      setMessage({ type: 'error', text: 'يرجى إدخال مبلغ صحيح أكبر من الصفر' });
      return;
    }
    if (!formData.treasury_id) {
      setMessage({ type: 'error', text: 'يرجى اختيار الخزينة المراد التعامل معها' });
      return;
    }
    if (!formData.reason.trim()) {
      setMessage({ type: 'error', text: 'يرجى كتابة سبب المعاملة بوضوح' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const res = await fetch('/api/network/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeModal,
          amount: numAmount,
          treasury_id: formData.treasury_id,
          reason: formData.reason.trim(),
          subscriber_name: formData.subscriber_name.trim(),
          phone: formData.phone.trim(),
          date: formData.date
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setActiveModal(null);
        setFormData({
          amount: '',
          treasury_id: treasuries[0]?.id || '',
          reason: '',
          subscriber_name: '',
          phone: '',
          date: new Date().toISOString().slice(0, 10)
        });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'فشلت العملية' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'حدث خطأ: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Filtered List
  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchReason = t.reason.toLowerCase().includes(q);
      const matchSubscriber = (t.subscriber_name || '').toLowerCase().includes(q);
      const matchPhone = (t.phone || '').includes(q);
      const matchTreasury = t.treasury_name.toLowerCase().includes(q);
      return matchReason || matchSubscriber || matchPhone || matchTreasury;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-cyan-950 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-cyan-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <Wifi className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">إدارة معاملات ومصروفات الشبكة</h1>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Network Hub
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                تسجيل استلام اشتراكات ودفعات المشتركين ومصروفات الشبكة مع الترحيل اللحظي للخزائن.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {canReceivePayment && (
              <button
                onClick={() => {
                  setActiveModal('INCOME');
                  setMessage(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                استلام دفعة / اشتراك
              </button>
            )}
            {canPayExpense && (
              <button
                onClick={() => {
                  setActiveModal('EXPENSE');
                  setMessage(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <MinusCircle className="w-4 h-4" />
                تسجيل مصروف شبكة
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition border border-white/10 cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-black border animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-75 hover:opacity-100">إغلاق</button>
        </div>
      )}

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">إجمالي مقبوضات واشتراكات الشبكة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalIncome.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">تم توريدها مباشرة إلى الخزائن المعنية</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">إجمالي مصروفات وصيانة الشبكة</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {totalExpense.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">سلك، كروت، أجهزة، وفواتير إنترنت شهرية</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">صافي عائد / ربح الشبكة</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black ${netBalance >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600'}`}>
            {netBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">الفارق الإيجابي بين الإيرادات والمصروفات</p>
        </div>
      </div>

      {/* Transactions Table & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-600" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">سجل حركات ودفعات الشبكة</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredTransactions.length} حركة
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${filterType === 'ALL' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterType('INCOME')}
                className={`px-3 py-1.5 rounded-lg transition ${filterType === 'INCOME' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
              >
                المقبوضات
              </button>
              <button
                onClick={() => setFilterType('EXPENSE')}
                className={`px-3 py-1.5 rounded-lg transition ${filterType === 'EXPENSE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
              >
                المصروفات
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالمشترك، السبب، الخزينة..."
                className="pr-8 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="p-3 text-center">النوع</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المشترك / العميل</th>
                <th className="p-3">البيان والسبب</th>
                <th className="p-3">الخزينة المربوطة</th>
                <th className="p-3 text-center">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                    لا توجد معاملات مسجلة في الشبكة حالياً.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 text-center">
                      {tx.type === 'INCOME' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <ArrowDownLeft className="w-3 h-3" />
                          قبض / اشتراك
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <ArrowUpRight className="w-3 h-3" />
                          مصروف شبكة
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{tx.date}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {tx.subscriber_name || '—'}
                      </div>
                      {tx.phone && <div className="text-[10px] text-slate-400 font-mono">{tx.phone}</div>}
                    </td>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {tx.reason}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg text-[11px]">
                        <Landmark className="w-3 h-3" />
                        {tx.treasury_name}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-black text-sm">
                      <span className={tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {tx.type === 'INCOME' ? '+' : '-'}{Number(tx.amount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Transaction (Income or Expense) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                    activeModal === 'INCOME' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {activeModal === 'INCOME' ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    {activeModal === 'INCOME' ? 'تسجيل استلام دفعة / اشتراك شبكة' : 'تسجيل مصروف شبكة جديد'}
                  </h3>
                  <p className="text-[11px] text-slate-400">سيتم ترحيل المعاملة مباشرة إلى الخزينة المحددة</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  المبلغ (ج.م) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm font-black focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {activeModal === 'INCOME' ? 'الخزينة المستلمة للمبلغ *' : 'الخزينة التي سيتم الصرف منها *'}
                </label>
                <div className="relative">
                  <Landmark className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                  <SearchableSelect
                    required
                    value={formData.treasury_id}
                    onChange={(e) => setFormData({ ...formData, treasury_id: e.target.value })}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {treasuries.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (الرصيد: {Number(t.balance).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م)
                      </option>
                    ))}
                  </SearchableSelect>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  السبب والبيان *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder={activeModal === 'INCOME' ? 'مثال: اشتراك شهر أكتوبر باقة 50 ميجا' : 'مثال: شراء كابلات وباقات شحن الموزع الرئيسي'}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {activeModal === 'INCOME' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      اسم المشترك
                    </label>
                    <input
                      type="text"
                      value={formData.subscriber_name}
                      onChange={(e) => setFormData({ ...formData, subscriber_name: e.target.value })}
                      placeholder="اسم المشترك"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-lg disabled:opacity-50 ${
                    activeModal === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  {submitting ? 'جاري الحفظ والترحيل...' : (activeModal === 'INCOME' ? 'تأكيد استلام الدفعة' : 'تأكيد صرف المصروف')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
