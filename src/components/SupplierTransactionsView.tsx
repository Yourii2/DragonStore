import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Printer, 
  FileDown, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Truck,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';
import SearchableSelect from './SearchableSelect';

export interface SupplierOption {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

export interface SupplierTransactionItem {
  id: string;
  supplier_id: string;
  supplier_name: string;
  transaction_type: string;
  reference_no: string;
  date: string;
  debit: number;
  credit: number;
  balance_after: number;
  payment_method: string;
  notes?: string;
  created_at?: string;
}

export const SupplierTransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<SupplierTransactionItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Date Filters with Shortcuts
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeShortcut, setActiveShortcut] = useState<DateShortcut>('ALL');

  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [txForm, setTxForm] = useState({
    supplier_id: '',
    transaction_type: 'PAYMENT',
    reference_no: '',
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    flow: 'DEBIT', // DEBIT = سداد للمورد (يقلل مديونيته), CREDIT = فاتورة مشتريات (يزيد مديونيته)
    payment_method: 'CASH',
    notes: ''
  });

  // Fetch Suppliers & Transactions
  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSuppliers(json.data);
          if (json.data.length > 0 && !txForm.supplier_id) {
            setTxForm(prev => ({ ...prev, supplier_id: json.data[0].id }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = '/api/supplier-transactions?';
      if (selectedSupplier && selectedSupplier !== 'ALL') url += `supplierId=${encodeURIComponent(selectedSupplier)}&`;
      if (fromDate) url += `fromDate=${fromDate}&`;
      if (toDate) url += `toDate=${toDate}&`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTransactions(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [selectedSupplier, fromDate, toDate]);

  // Handle Add Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.supplier_id || !txForm.amount) {
      alert('يرجى اختيار المورد وتحديد المبلغ');
      return;
    }

    try {
      const selectedSup = suppliers.find(s => s.id === txForm.supplier_id);
      const isDebit = txForm.flow === 'DEBIT'; // سداد منا للمورد
      const payload = {
        supplier_id: txForm.supplier_id,
        supplier_name: selectedSup ? selectedSup.name : 'مورد',
        transaction_type: txForm.transaction_type,
        reference_no: txForm.reference_no || `PUR-TX-${Date.now().toString().slice(-6)}`,
        date: txForm.date,
        debit: isDebit ? Number(txForm.amount) : 0,
        credit: !isDebit ? Number(txForm.amount) : 0,
        payment_method: txForm.payment_method,
        notes: txForm.notes
      };

      const res = await fetch('/api/supplier-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setTxForm({
          supplier_id: suppliers.length > 0 ? suppliers[0].id : '',
          transaction_type: 'PAYMENT',
          reference_no: '',
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          flow: 'DEBIT',
          payment_method: 'CASH',
          notes: ''
        });
        fetchTransactions();
        fetchSuppliers();
      } else {
        alert(data.message || 'فشل تسجيل المعاملة');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err.message);
    }
  };

  // Filtered by Search Term
  const filteredTransactions = transactions.filter(t => 
    t.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalDebit = filteredTransactions.reduce((acc, t) => acc + Number(t.debit || 0), 0);
  const totalCredit = filteredTransactions.reduce((acc, t) => acc + Number(t.credit || 0), 0);

  // Print & Export Handlers
  const handlePrint = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">التاريخ</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">رقم المرجع</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">اسم المورد</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">نوع المعاملة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #10b981;">مدين (سداد منا)</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #e11d48;">دائن (فاتورة له)</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الرصيد بعد الحركة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">البيان</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map(t => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.date?.slice(0, 10)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${t.reference_no}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${t.supplier_name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.transaction_type}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${t.debit > 0 ? `${t.debit.toLocaleString()} ج.م` : '—'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${t.credit > 0 ? `${t.credit.toLocaleString()} ج.م` : '—'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${t.balance_after.toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.notes || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printTableOrReceipt('سجل معاملات وحركات الموردين', tableHtml);
  };

  const handleExportPDF = () => {
    handlePrint();
  };

  const handleExportExcel = () => {
    const headers = ['التاريخ', 'رقم المرجع', 'اسم المورد', 'نوع المعاملة', 'مدين (سداد منا)', 'دائن (فاتورة له)', 'الرصيد بعد الحركة', 'طريقة الدفع', 'البيان'];
    const rows = filteredTransactions.map(t => [
      t.date?.slice(0, 10),
      t.reference_no,
      t.supplier_name,
      t.transaction_type,
      t.debit,
      t.credit,
      t.balance_after,
      t.payment_method,
      t.notes || ''
    ]);
    exportToExcel('معاملات_الموردين_متجر_دراجون', headers, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>معاملات الموردين (سداد وفواتير مشتريات)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  {transactions.length} حركة
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                سجل قيود المشتريات والسدادات للموردين مع فلاتر التاريخ والمدد الزمنية
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setTxForm(prev => ({
                ...prev,
                reference_no: `VOUCH-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString().slice(0, 10)
              }));
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل سند سداد / مشتريات</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>طباعة</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-rose-500" />
            <span>تصدير PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>تصدير إكسيل</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Outflow (Debit/Payments) & Inflow (Credit/Purchases) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي السدادات المدفوعة (مدين / مسدد للموردين)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {totalDebit.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">مبالغ خرجت من الخزينة لسداد حسابات الموردين</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي فواتير المشتريات (دائن / مستحق للموردين)</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              {totalCredit.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">مشتريات وبضاعة مستلمة على الحساب</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Date Filter Bar with Shortcuts */}
      <DateFilterBar
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        activeShortcut={activeShortcut}
        onShortcutSelect={setActiveShortcut}
        label="فلترة معاملات الموردين بالفترة:"
      />

      {/* Filters: Supplier Selection + Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم المرجع، اسم المورد، أو البيان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <SearchableSelect
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
          >
            <option value="ALL">جميع الموردين</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </SearchableSelect>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">التاريخ</th>
                <th className="p-4">رقم المرجع / الإذن</th>
                <th className="p-4">اسم المورد</th>
                <th className="p-4">نوع الحركة</th>
                <th className="p-4 text-center text-emerald-600">مدين (سداد منا)</th>
                <th className="p-4 text-center text-rose-600">دائن (فاتورة له)</th>
                <th className="p-4 text-center">الرصيد بعد الحركة</th>
                <th className="p-4">طريقة الدفع والبيان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    جاري تحميل حركات ومعاملات الموردين...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-bold">
                    لا توجد معاملات مطابقة للفترة والخيارات المحددة
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                      {tx.date?.slice(0, 10)}
                    </td>
                    <td className="p-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {tx.reference_no}
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-sm">
                        {tx.supplier_name}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        tx.transaction_type === 'PAYMENT' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/20'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-500/20'
                      }`}>
                        {tx.transaction_type === 'PAYMENT' ? 'سند سداد للمورد' : 'فاتورة مشتريات'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-emerald-600">
                      {tx.debit > 0 ? `${tx.debit.toLocaleString()} ج.م` : '—'}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-rose-600">
                      {tx.credit > 0 ? `${tx.credit.toLocaleString()} ج.م` : '—'}
                    </td>
                    <td className="p-4 text-center font-mono font-black text-slate-900 dark:text-slate-100">
                      {tx.balance_after.toLocaleString()} ج.م
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 dark:text-slate-300 font-bold">{tx.notes || 'معاملة مسجلة'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{tx.payment_method}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: RECORD SUPPLIER TRANSACTION                       */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-500" />
                <span>تسجيل معاملة مورد (سداد أو مشتريات)</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المورد المستحق: <span className="text-rose-500">*</span></label>
                <SearchableSelect
                  value={txForm.supplier_id}
                  onChange={(e) => setTxForm({ ...txForm, supplier_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (حسابه: {s.balance.toLocaleString()} ج.م)</option>
                  ))}
                </SearchableSelect>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">نوع المعاملة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, flow: 'DEBIT', transaction_type: 'PAYMENT' })}
                    className={`p-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                      txForm.flow === 'DEBIT'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    سداد منا للمورد (مدين)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, flow: 'CREDIT', transaction_type: 'PURCHASE' })}
                    className={`p-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                      txForm.flow === 'CREDIT'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    فاتورة مشتريات (دائن)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المبلغ (ج.م): <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="0.00"
                    value={txForm.amount || ''}
                    onChange={(e) => setTxForm({ ...txForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاريخ المعاملة:</label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الفاتورة / الإذن:</label>
                  <input
                    type="text"
                    placeholder="PUR-001..."
                    value={txForm.reference_no}
                    onChange={(e) => setTxForm({ ...txForm, reference_no: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">طريقة السداد:</label>
                  <SearchableSelect
                    value={txForm.payment_method}
                    onChange={(e) => setTxForm({ ...txForm, payment_method: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="CASH">نقدي (كاش من الخزينة)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="INSTAPAY">انستاباي</option>
                    <option value="CHECK">شيك بنكي</option>
                  </SearchableSelect>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البيان وملاحظات المعاملة:</label>
                <textarea
                  rows={2}
                  placeholder="بيان سبب المعاملة أو أرقام البضاعة المستلمة..."
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30 cursor-pointer"
                >
                  حفظ المعاملة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
