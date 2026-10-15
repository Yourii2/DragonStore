import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Search, 
  Plus, 
  Printer, 
  FileDown, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Calendar,
  Landmark,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Wallet,
  Building2,
  Smartphone,
  Receipt,
  UserCheck
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';

export interface AccountOption {
  id: string;
  account_code: string;
  name: string;
  balance: number;
}

export interface FinancialTransactionRecord {
  id: string;
  reference_no: string;
  date: string;
  transaction_type: string;
  account_id: string;
  account_name: string;
  to_account_id?: string;
  to_account_name?: string;
  flow: 'IN' | 'OUT' | 'TRANSFER';
  amount: number;
  balance_after: number;
  category?: string;
  party_type?: string;
  party_name?: string;
  payment_method: string;
  notes?: string;
  created_at?: string;
}

export const FinancialTransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransactionRecord[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [selectedFlow, setSelectedFlow] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Date Filters with Shortcuts
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeShortcut, setActiveShortcut] = useState<DateShortcut>('ALL');

  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [txForm, setTxForm] = useState({
    account_id: '',
    to_account_id: '',
    transaction_type: 'RECEIPT', // RECEIPT, PAYMENT, TRANSFER, EXPENSE
    reference_no: '',
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    flow: 'IN' as 'IN' | 'OUT' | 'TRANSFER',
    category: 'إيداع نقدي',
    party_type: 'CUSTOMER',
    party_name: '',
    payment_method: 'CASH',
    notes: ''
  });

  // Fetch Accounts for dropdown
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAccounts(json.data);
          if (json.data.length > 0 && !txForm.account_id) {
            setTxForm(prev => ({ 
              ...prev, 
              account_id: json.data[0].id,
              to_account_id: json.data.length > 1 ? json.data[1].id : ''
            }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Financial Transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = '/api/financial-transactions?';
      if (selectedAccount && selectedAccount !== 'ALL') {
        url += `accountId=${encodeURIComponent(selectedAccount)}&`;
      }
      if (fromDate) {
        url += `fromDate=${fromDate}&`;
      }
      if (toDate) {
        url += `toDate=${toDate}&`;
      }
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
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [selectedAccount, fromDate, toDate]);

  // Handle Save Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.account_id || !txForm.amount) {
      alert('يرجى اختيار الخزينة وتحديد المبلغ');
      return;
    }

    if (txForm.flow === 'TRANSFER' && (!txForm.to_account_id || txForm.to_account_id === txForm.account_id)) {
      alert('يرجى تحديد خزينة أخرى محول إليها');
      return;
    }

    try {
      const selectedSrcAcc = accounts.find(a => a.id === txForm.account_id);
      const selectedTgtAcc = accounts.find(a => a.id === txForm.to_account_id);

      const payload = {
        account_id: txForm.account_id,
        account_name: selectedSrcAcc ? selectedSrcAcc.name : 'خزينة',
        to_account_id: txForm.flow === 'TRANSFER' ? txForm.to_account_id : null,
        to_account_name: txForm.flow === 'TRANSFER' && selectedTgtAcc ? selectedTgtAcc.name : null,
        transaction_type: txForm.transaction_type,
        reference_no: txForm.reference_no || `${txForm.flow === 'IN' ? 'REC' : (txForm.flow === 'OUT' ? 'PAY' : 'TRF')}-${Date.now().toString().slice(-6)}`,
        date: txForm.date,
        amount: Number(txForm.amount),
        flow: txForm.flow,
        category: txForm.category,
        party_type: txForm.party_type,
        party_name: txForm.party_name,
        payment_method: txForm.payment_method,
        notes: txForm.notes
      };

      const res = await fetch('/api/financial-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setTxForm({
          account_id: accounts.length > 0 ? accounts[0].id : '',
          to_account_id: accounts.length > 1 ? accounts[1].id : '',
          transaction_type: 'RECEIPT',
          reference_no: '',
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          flow: 'IN',
          category: 'إيداع نقدي',
          party_type: 'CUSTOMER',
          party_name: '',
          payment_method: 'CASH',
          notes: ''
        });
        fetchTransactions();
        fetchAccounts();
      } else {
        alert(data.message || 'فشل تسجيل المعاملة المالية');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err.message);
    }
  };

  // Filtered by Search & Flow
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.reference_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.party_name && t.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFlow = selectedFlow === 'ALL' || t.flow === selectedFlow;
    return matchesSearch && matchesFlow;
  });

  const totalIn = filteredTransactions
    .filter(t => t.flow === 'IN')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalOut = filteredTransactions
    .filter(t => t.flow === 'OUT')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalTransfers = filteredTransactions
    .filter(t => t.flow === 'TRANSFER')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const getTransactionTypeLabel = (t: FinancialTransactionRecord) => {
    if (t.flow === 'IN') return 'قبض / إيداع نقدي (+)';
    if (t.flow === 'OUT') return 'صرف / سداد نقدي (-)';
    return 'تحويل بين الخزائن';
  };

  // Print & Export Handlers
  const handlePrint = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">التاريخ</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">رقم السند / الإذن</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الخزينة / الحساب</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">نوع المعاملة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #10b981;">وارد (+)</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #e11d48;">منصرف (-)</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الرصيد بعد الحركة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الطرف المستفيد / البيان</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map(t => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.date?.slice(0, 10)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${t.reference_no}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${t.account_name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${getTransactionTypeLabel(t)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #10b981; font-weight: bold;">
                ${t.flow === 'IN' ? `+${Number(t.amount).toLocaleString()} ج.م` : '—'}
              </td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #e11d48; font-weight: bold;">
                ${t.flow !== 'IN' ? `-${Number(t.amount).toLocaleString()} ج.م` : '—'}
              </td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">
                ${Number(t.balance_after || 0).toLocaleString()} ج.م
              </td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">
                ${t.party_name ? `${t.party_name} - ` : ''}${t.notes || '—'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printTableOrReceipt('سجل المعاملات والقيود المالية', tableHtml);
  };

  const handleExportPDF = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">التاريخ</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">رقم السند</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الخزينة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">نوع الحركة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">المبلغ</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الرصيد بعدها</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">البيان</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map(t => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.date?.slice(0, 10)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.reference_no}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.account_name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${getTransactionTypeLabel(t)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${Number(t.amount).toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${Number(t.balance_after || 0).toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.party_name ? `${t.party_name} ` : ''}${t.notes || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    exportToPDF('سجل_المعاملات_المالية', tableHtml);
  };

  const handleExportExcel = () => {
    const headers = ['التاريخ', 'رقم السند', 'الخزينة', 'نوع المعاملة', 'المبلغ', 'الاتجاه', 'الرصيد بعد الحركة', 'الطرف المستفيد', 'البيان'];
    const rows = filteredTransactions.map(t => [
      t.date?.slice(0, 10),
      t.reference_no,
      t.account_name,
      getTransactionTypeLabel(t),
      Number(t.amount),
      t.flow === 'IN' ? 'وارد (+)' : (t.flow === 'OUT' ? 'منصرف (-)' : 'تحويل'),
      Number(t.balance_after || 0),
      t.party_name || '',
      t.notes || ''
    ]);
    exportToExcel('سجل_المعاملات_المالية', headers, rows);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>سجل المعاملات والقيود المالية</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              سندات القبض، أذون الصرف، والتحويلات المالية الداخلية بين الخزائن والبنوك
            </p>
          </div>
        </div>

        {/* Action Buttons: Add, Print, Export PDF, Export Excel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل معاملة مالية جديدة</span>
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

      {/* KPI Cards: Inflow, Outflow, Transfers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي المقبوضات والإيداعات (وارد)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              +{totalIn.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">سندات قبض وتحصيلات نقدية وبنكية</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي المدفوعات والمصروفات (منصرف)</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              -{totalOut.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">أذون صرف وسدادات من الخزائن</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي التحويلات الداخلية</div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1">
              {totalTransfers.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">مناقلة السيولة بين الصناديق والبنوك</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
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
        label="فلترة تاريخ المعاملات المالية:"
      />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Account Selector */}
        <div className="sm:w-64 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-slate-400 mr-1" />
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-bold"
          >
            <option value="ALL">جميع الخزائن والحسابات</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.account_code})
              </option>
            ))}
          </select>
        </div>

        {/* Flow Selector */}
        <div className="sm:w-48 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <select
            value={selectedFlow}
            onChange={(e) => setSelectedFlow(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-bold"
          >
            <option value="ALL">كل حركات الخزينة</option>
            <option value="IN">وارد / إيداعات فقط (+)</option>
            <option value="OUT">منصرف / سداد فقط (-)</option>
            <option value="TRANSFER">تحويلات بين الخزائن</option>
          </select>
        </div>

        {/* Search Input Bar */}
        <div className="flex-1 bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 mr-2 pointer-events-none" />
          <input 
            type="text"
            placeholder="بحث برقم السند، اسم الخزينة، الطرف المستفيد، أو البيان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">التاريخ</th>
                <th className="p-4">رقم الحركة</th>
                <th className="p-4">الخزينة / الحساب</th>
                <th className="p-4">نوع المعاملة</th>
                <th className="p-4 text-center">وارد / إيداع (+)</th>
                <th className="p-4 text-center">منصرف / سداد (-)</th>
                <th className="p-4 text-center">الرصيد بعد الحركة</th>
                <th className="p-4">طريقة الدفع</th>
                <th className="p-4">الطرف المستفيد والبيان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    جاري تحميل سجل المعاملات المالية...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 font-bold">
                    لا توجد معاملات مسجلة تطابق خيارات البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {t.date?.slice(0, 10)}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                        {t.reference_no}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-slate-100">
                      {t.account_name}
                      {t.to_account_name && (
                        <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-normal mt-0.5">
                          إلى: {t.to_account_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {getTransactionTypeLabel(t)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {t.flow === 'IN' ? (
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          +{Number(t.amount).toLocaleString()} ج.م
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {t.flow === 'OUT' ? (
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                          -{Number(t.amount).toLocaleString()} ج.م
                        </span>
                      ) : t.flow === 'TRANSFER' ? (
                        <span className="font-mono font-black text-cyan-600 dark:text-cyan-400">
                          {Number(t.amount).toLocaleString()} ج.م
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono font-black text-slate-800 dark:text-slate-200">
                      {Number(t.balance_after || 0).toLocaleString()} ج.م
                    </td>
                    <td className="p-4 text-[11px] text-slate-600 dark:text-slate-400">
                      {t.payment_method === 'CASH' ? 'نقدي (كاش)' : 
                       t.payment_method === 'BANK_TRANSFER' ? 'تحويل بنكي' :
                       t.payment_method === 'INSTAPAY' ? 'انستاباي' : t.payment_method}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {t.party_name ? <span className="font-bold text-slate-700 dark:text-slate-300 ml-1">{t.party_name} -</span> : null}
                      {t.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-500" />
                <span>تسجيل معاملة مالية / سند</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اتجاه الحركة: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={txForm.flow}
                    onChange={(e) => {
                      const flow = e.target.value as 'IN' | 'OUT' | 'TRANSFER';
                      setTxForm({ 
                        ...txForm, 
                        flow,
                        transaction_type: flow === 'IN' ? 'RECEIPT' : (flow === 'OUT' ? 'PAYMENT' : 'TRANSFER')
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="IN">قبض / إيداع نقدي (+)</option>
                    <option value="OUT">صرف / سداد نقدي (-)</option>
                    <option value="TRANSFER">تحويل بين الخزائن</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {txForm.flow === 'TRANSFER' ? 'الخزينة المحول منها:' : 'الخزينة / الحساب:'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={txForm.account_id}
                    onChange={(e) => setTxForm({ ...txForm, account_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="" disabled>اختر الخزينة...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.balance.toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {txForm.flow === 'TRANSFER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الخزينة المحول إليها: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={txForm.to_account_id}
                    onChange={(e) => setTxForm({ ...txForm, to_account_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="" disabled>اختر الخزينة المستلمة...</option>
                    {accounts.filter(a => a.id !== txForm.account_id).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.balance.toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="0.00"
                    value={txForm.amount || ''}
                    onChange={(e) => setTxForm({ ...txForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التاريخ: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الطرف المستفيد / صاحب المعاملة:
                  </label>
                  <input
                    type="text"
                    placeholder="اسم العميل، المورد، أو الموظف"
                    value={txForm.party_name}
                    onChange={(e) => setTxForm({ ...txForm, party_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة الدفع:
                  </label>
                  <select
                    value={txForm.payment_method}
                    onChange={(e) => setTxForm({ ...txForm, payment_method: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CASH">نقدي (كاش)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="INSTAPAY">انستاباي (InstaPay)</option>
                    <option value="VODAFONE_CASH">فودافون كاش ومحافظ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والملاحظات:
                </label>
                <textarea
                  rows={2}
                  placeholder="سبب السند، تفاصيل الحركة..."
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
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
