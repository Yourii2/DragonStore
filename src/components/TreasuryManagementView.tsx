import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Search, 
  Plus, 
  DollarSign, 
  Printer, 
  FileDown, 
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  Wallet, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Receipt, 
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';

export interface TreasuryAccount {
  id: string;
  account_code: string;
  name: string;
  type: string; // 'ASSET', 'CASH', 'BANK', 'WALLET'
  unit: string;
  balance: number;
  keeper_name?: string;
  notes?: string;
  created_at?: string;
}

export interface FinancialTransactionItem {
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
}

export const TreasuryManagementView: React.FC = () => {
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TreasuryAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH',
    balance: 0,
    notes: ''
  });

  // Statement / Transactions Modal
  const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<TreasuryAccount | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<FinancialTransactionItem[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txFromDate, setTxFromDate] = useState('');
  const [txToDate, setTxToDate] = useState('');
  const [txShortcut, setTxShortcut] = useState<DateShortcut>('ALL');

  // Fetch Accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAccounts(json.data.map((a: any) => ({
            id: a.id,
            account_code: a.account_code || a.code || '',
            name: a.name,
            type: a.type || 'ASSET',
            unit: a.unit || 'BOTH',
            balance: Number(a.balance || 0),
            keeper_name: a.keeper_name || 'المدير المالي',
            notes: a.notes || '',
            created_at: a.created_at || ''
          })));
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

  // Fetch Transactions for Statement
  const fetchAccountTransactions = async (accountId: string, from = txFromDate, to = txToDate) => {
    try {
      setLoadingTransactions(true);
      let url = `/api/financial-transactions?accountId=${encodeURIComponent(accountId)}`;
      if (from) url += `&fromDate=${from}`;
      if (to) url += `&toDate=${to}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAccountTransactions(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Open statement modal
  const handleOpenStatement = (acc: TreasuryAccount) => {
    setSelectedAccountForStatement(acc);
    setTxFromDate('');
    setTxToDate('');
    setTxShortcut('ALL');
    fetchAccountTransactions(acc.id, '', '');
  };

  // Save Account (Add or Edit)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم الخزينة أو الحساب المالي');
      return;
    }

    try {
      const payload = {
        id: editingAccount ? editingAccount.id : undefined,
        name: formData.name.trim(),
        type: formData.type,
        balance: Number(formData.balance) || 0,
        notes: formData.notes.trim() || undefined
      };

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddEditModal(false);
        setEditingAccount(null);
        setFormData({
          name: '',
          type: 'CASH',
          balance: 0,
          notes: ''
        });
        fetchAccounts();
      } else {
        alert(data.message || 'فشل حفظ بيانات الخزينة');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err.message);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (acc: TreasuryAccount) => {
    if (Math.abs(acc.balance) > 0) {
      alert(`لا يمكن حذف الخزينة (${acc.name}) لوجود رصيد مالي متبقي بها (${acc.balance.toLocaleString()} ج.م). يرجى تصفية أو تحويل الرصيد أولاً.`);
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف الحساب / الخزينة: "${acc.name}"؟`)) return;

    try {
      const res = await fetch(`/api/accounts/${acc.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchAccounts();
      } else {
        alert(data.message || 'فشل حذف الخزينة');
      }
    } catch (err) {
      console.error(err);
      alert('فشل حذف الخزينة');
    }
  };

  // Filtered Accounts
  const filteredAccounts = accounts.filter(a => {
    return (
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.keeper_name && a.keeper_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Aggregates
  const totalLiquidity = accounts.reduce((acc, a) => acc + (a.balance > 0 ? a.balance : 0), 0);
  const cashAccountsCount = accounts.filter(a => a.type === 'CASH' || a.account_code.startsWith('111')).length;
  const bankAccountsCount = accounts.filter(a => a.type === 'BANK' || a.account_code.startsWith('112') || a.account_code.startsWith('113')).length;

  const getAccountTypeLabel = (acc: TreasuryAccount) => {
    if (acc.account_code === '1111') return 'صندوق كاشير نقدي';
    if (acc.account_code === '1112') return 'خزينة رئيسية';
    if (acc.account_code.startsWith('112')) return 'حساب بنكي جاري';
    if (acc.account_code.startsWith('113')) return 'محفظة إلكترونية';
    return acc.type === 'BANK' ? 'حساب بنكي' : 'خزينة نقدية';
  };

  // Print & Export Handlers
  const handlePrint = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">كود الحساب</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">اسم الخزينة / الحساب</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">النوع والتصنيف</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">المسؤول / أمين الخزينة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الوحدة المخصصة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #0284c7;">الرصيد المالي الحالي</th>
          </tr>
        </thead>
        <tbody>
          ${filteredAccounts.map(a => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${a.account_code}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${a.name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${getAccountTypeLabel(a)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.keeper_name || 'المدير المالي'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.unit === 'SHOP' ? 'متجر وصيانة' : (a.unit === 'FREELANCE' ? 'برمجيات' : 'مشترك عام')}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0284c7; font-weight: 900; font-family: monospace;">
                ${a.balance.toLocaleString()} ج.م
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printTableOrReceipt('دليل وأرصدة الخزائن والبنوك', tableHtml);
  };

  const handleExportPDF = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">كود الحساب</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">اسم الخزينة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">النوع</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">المسؤول</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الرصيد الحالي</th>
          </tr>
        </thead>
        <tbody>
          ${filteredAccounts.map(a => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.account_code}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${a.name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${getAccountTypeLabel(a)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.keeper_name || 'المدير المالي'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${a.balance.toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    exportToPDF('دليل_الخزائن_والبنوك', tableHtml);
  };

  const handleExportExcel = () => {
    const headers = ['كود الحساب', 'اسم الخزينة أو البنك', 'النوع', 'المسؤول', 'الوحدة المخصصة', 'الرصيد الحالي'];
    const rows = filteredAccounts.map(a => [
      a.account_code,
      a.name,
      getAccountTypeLabel(a),
      a.keeper_name || 'المدير المالي',
      a.unit,
      a.balance
    ]);
    exportToExcel('دليل_الخزائن_والبنوك', headers, rows);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>إدارة الخزائن والحسابات المالية</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              متابعة صناديق النقدية، الحسابات البنكية، المحافظ الإلكترونية، وأرصدة السيولة الحية
            </p>
          </div>
        </div>

        {/* Action Buttons: Add, Print, Export PDF, Export Excel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingAccount(null);
              setFormData({
                name: '',
                type: 'CASH',
                balance: 0,
                notes: ''
              });
              setShowAddEditModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خزينة / حساب مالي</span>
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

      {/* KPI Cards: Total Liquidity, Cash Accounts, Bank Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي رصيد السيولة النقدية والبنكية</div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1">
              {totalLiquidity.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">الرصيد الفعلي في جميع الخزائن والبنوك</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">صناديق وخزائن النقدية (الكاش)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {accounts.filter(a => a.account_code.startsWith('111')).reduce((s, a) => s + a.balance, 0).toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{cashAccountsCount} صناديق نقدية نشطة</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">أرصدة البنوك والمحافظ الإلكترونية</div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
              {accounts.filter(a => !a.account_code.startsWith('111')).reduce((s, a) => s + a.balance, 0).toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{bankAccountsCount} حسابات بنكية ومحافظ رقمية</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Input Bar (No registration date filter) */}
      <div className="bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 mr-2 pointer-events-none" />
        <input 
          type="text"
          placeholder="بحث باسم الخزينة، كود الحساب، أو اسم المسؤول..."
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

      {/* Treasury Accounts Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">كود الحساب</th>
                <th className="p-4">اسم الخزينة / الحساب</th>
                <th className="p-4">التصنيف والنوع</th>
                <th className="p-4">المسؤول / أمين العهدة</th>
                <th className="p-4 text-center">الرصيد المالي الحالي</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    جاري تحميل بيانات الخزائن...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                    لا توجد خزائن أو حسابات تطابق خيارات البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-bold">
                        {a.account_code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        {a.account_code.startsWith('111') ? (
                          <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : a.account_code.startsWith('112') ? (
                          <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
                        )}
                        <span>{a.name}</span>
                      </div>
                      {a.notes && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{a.notes}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {getAccountTypeLabel(a)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{a.keeper_name || 'المدير المالي'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                        {a.balance.toLocaleString()} ج.م
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* عرض المعاملات المالية (العين) */}
                        <button
                          onClick={() => handleOpenStatement(a)}
                          className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 border border-cyan-500/20 transition-all cursor-pointer"
                          title="عرض معاملات وكشف حركات الخزينة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* تعديل */}
                        <button
                          onClick={() => {
                            setEditingAccount(a);
                            setFormData({
                              name: a.name,
                              type: a.type || 'CASH',
                              balance: a.balance,
                              notes: a.notes || ''
                            });
                            setShowAddEditModal(true);
                          }}
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-amber-500/20 transition-all cursor-pointer"
                          title="تعديل بيانات الخزينة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* حذف */}
                        <button
                          onClick={() => handleDeleteAccount(a)}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-500/20 transition-all cursor-pointer"
                          title="حذف الخزينة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT TREASURY ACCOUNT                       */}
      {/* ======================================================== */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-cyan-500" />
                <span>{editingAccount ? 'تعديل بيانات الخزينة / الحساب' : 'إضافة خزينة / حساب مالي جديد'}</span>
              </h3>
              <button 
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الخزينة أو الحساب: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خزينة الفرع الثاني، حساب بنك مصر، فودافون كاش..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع الحساب: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="CASH">صندوق نقدية (كاشير / خزينة)</option>
                  <option value="BANK">حساب بنكي جاري</option>
                  <option value="WALLET">محفظة إلكترونية (Instapay / Vodafone Cash)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الرصيد الافتتاحي:
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وبيان إضافي:
                </label>
                <textarea
                  rows={2}
                  placeholder="وصف استخدام الخزينة، رقم الحساب البنكي، أو رقم المحفظة..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30 cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TREASURY TRANSACTIONS / STATEMENT WITH DATE FILTERS*/}
      {/* ======================================================== */}
      {selectedAccountForStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  <span>كشف حركات ومعاملات الخزينة: {selectedAccountForStatement.name}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  كود الحساب: {selectedAccountForStatement.account_code} • الرصيد الحالي: {selectedAccountForStatement.balance.toLocaleString()} ج.م • المسؤول: {selectedAccountForStatement.keeper_name || 'المدير المالي'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedAccountForStatement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Filter Bar for Statement */}
            <div className="my-4 shrink-0">
              <DateFilterBar
                fromDate={txFromDate}
                toDate={txToDate}
                onFromDateChange={(d) => {
                  setTxFromDate(d);
                  fetchAccountTransactions(selectedAccountForStatement.id, d, txToDate);
                }}
                onToDateChange={(d) => {
                  setTxToDate(d);
                  fetchAccountTransactions(selectedAccountForStatement.id, txFromDate, d);
                }}
                activeShortcut={txShortcut}
                onShortcutSelect={(sc) => {
                  setTxShortcut(sc);
                }}
                onReset={() => fetchAccountTransactions(selectedAccountForStatement.id, '', '')}
                label="فلترة معاملات الخزينة حسب الفترة:"
              />
            </div>

            {/* Statement Table */}
            <div className="flex-1 overflow-y-auto scrollbar-thin my-2">
              {loadingTransactions ? (
                <div className="p-8 text-center text-slate-400">جاري تحميل كشف الحركات...</div>
              ) : accountTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا توجد حركات مسجلة لهذه الخزينة في هذه الفترة.</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">رقم الحركة</th>
                      <th className="p-3">نوع المعاملة</th>
                      <th className="p-3 text-center text-emerald-600">وارد / إيداع (+)</th>
                      <th className="p-3 text-center text-rose-600">منصرف / سحب (-)</th>
                      <th className="p-3 text-center">الرصيد بعد الحركة</th>
                      <th className="p-3">الطرف / البيان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {accountTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{tx.date?.slice(0, 10)}</td>
                        <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{tx.reference_no}</td>
                        <td className="p-3 font-bold">
                          {tx.flow === 'IN' ? 'قبض / إيداع نقدي' :
                           tx.flow === 'OUT' ? 'صرف / سداد' : 'تحويل داخلي'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600">
                          {tx.flow === 'IN' ? `+${Number(tx.amount).toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-rose-600">
                          {tx.flow === 'OUT' ? `-${Number(tx.amount).toLocaleString()} ج.م` : 
                           tx.flow === 'TRANSFER' ? `-${Number(tx.amount).toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-800 dark:text-slate-200">
                          {Number(tx.balance_after || 0).toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">
                          {tx.party_name ? `${tx.party_name} - ` : ''}{tx.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Buttons for Statement */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['التاريخ', 'رقم الحركة', 'نوع المعاملة', 'المبلغ', 'الاتجاه', 'الرصيد بعد الحركة', 'البيان'];
                    const rows = accountTransactions.map(tx => [
                      tx.date?.slice(0, 10),
                      tx.reference_no,
                      tx.transaction_type,
                      tx.amount,
                      tx.flow === 'IN' ? 'وارد (+)' : 'منصرف (-)',
                      tx.balance_after,
                      tx.notes || ''
                    ]);
                    exportToExcel(`حركات_خزينة_${selectedAccountForStatement.name}`, headers, rows);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors"
                  title="تصدير إكسيل"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>تصدير Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const html = `
                      <h3>سجل حركات ومعاملات الخزينة: ${selectedAccountForStatement.name}</h3>
                      <p>كود الحساب: ${selectedAccountForStatement.account_code} | الرصيد الحالي: ${selectedAccountForStatement.balance.toLocaleString()} ج.م</p>
                      <table style="width:100%; border-collapse:collapse; text-align:right;">
                        <thead>
                          <tr style="background:#eee;">
                            <th style="padding:6px;border:1px solid #ccc;">التاريخ</th>
                            <th style="padding:6px;border:1px solid #ccc;">المرجع</th>
                            <th style="padding:6px;border:1px solid #ccc;">النوع</th>
                            <th style="padding:6px;border:1px solid #ccc;">وارد (+)</th>
                            <th style="padding:6px;border:1px solid #ccc;">منصرف (-)</th>
                            <th style="padding:6px;border:1px solid #ccc;">الرصيد</th>
                            <th style="padding:6px;border:1px solid #ccc;">البيان</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${accountTransactions.map(t => `
                            <tr>
                              <td style="padding:6px;border:1px solid #ddd;">${t.date?.slice(0, 10)}</td>
                              <td style="padding:6px;border:1px solid #ddd;">${t.reference_no}</td>
                              <td style="padding:6px;border:1px solid #ddd;">${t.transaction_type}</td>
                              <td style="padding:6px;border:1px solid #ddd;color:#10b981;">${t.flow === 'IN' ? `+${Number(t.amount).toLocaleString()} ج.م` : '—'}</td>
                              <td style="padding:6px;border:1px solid #ddd;color:#e11d48;">${t.flow !== 'IN' ? `-${Number(t.amount).toLocaleString()} ج.م` : '—'}</td>
                              <td style="padding:6px;border:1px solid #ddd;font-weight:bold;">${Number(t.balance_after || 0).toLocaleString()} ج.م</td>
                              <td style="padding:6px;border:1px solid #ddd;">${t.notes || '—'}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `;
                    printTableOrReceipt(`سجل حركات - ${selectedAccountForStatement.name}`, html);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                  title="طباعة كشف الحركات"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAccountForStatement(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
