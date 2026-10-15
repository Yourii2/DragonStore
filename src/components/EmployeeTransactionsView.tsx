import React, { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  Search, 
  Plus, 
  Printer, 
  FileDown, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Calendar,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  TrendingUp,
  Percent,
  Wallet
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';

export interface EmployeeOption {
  id: string;
  name: string;
  job_title?: string;
  jobTitle?: string;
  phone: string;
  base_salary?: number;
  baseSalary?: number;
  salary_cycle?: string;
  salaryCycle?: string;
}

export interface EmployeeTransactionItem {
  id: string;
  employee_id: string;
  employee_name: string;
  transaction_type: string; // 'COMMISSION', 'BONUS', 'ADVANCE', 'DEDUCTION', 'SALARY_PAYMENT'
  reference_no: string;
  date: string;
  amount: number;
  flow: 'INCENTIVE' | 'DEDUCTION' | 'PAYOUT';
  payment_method: string;
  notes?: string;
  created_at?: string;
}

export const EmployeeTransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<EmployeeTransactionItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Date Filters with Shortcuts
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeShortcut, setActiveShortcut] = useState<DateShortcut>('ALL');

  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [txForm, setTxForm] = useState({
    employee_id: '',
    transaction_type: 'COMMISSION', // COMMISSION, BONUS, ADVANCE, DEDUCTION, SALARY_PAYMENT
    reference_no: '',
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    flow: 'INCENTIVE' as 'INCENTIVE' | 'DEDUCTION' | 'PAYOUT',
    payment_method: 'CASH',
    notes: ''
  });

  // Fetch Employees for dropdown
  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setEmployees(json.data);
          if (json.data.length > 0 && !txForm.employee_id) {
            setTxForm(prev => ({ ...prev, employee_id: json.data[0].id }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = '/api/employee-transactions?';
      if (selectedEmployee && selectedEmployee !== 'ALL') {
        url += `employeeId=${encodeURIComponent(selectedEmployee)}&`;
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
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [selectedEmployee, fromDate, toDate]);

  // Handle Add Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.employee_id || !txForm.amount) {
      alert('يرجى اختيار الموظف وتحديد المبلغ');
      return;
    }

    try {
      const selectedEmp = employees.find(emp => emp.id === txForm.employee_id);
      const payload = {
        employee_id: txForm.employee_id,
        employee_name: selectedEmp ? selectedEmp.name : 'موظف',
        transaction_type: txForm.transaction_type,
        reference_no: txForm.reference_no || `EMP-TX-${Date.now().toString().slice(-6)}`,
        date: txForm.date,
        amount: Number(txForm.amount),
        flow: txForm.flow,
        payment_method: txForm.payment_method,
        notes: txForm.notes
      };

      const res = await fetch('/api/employee-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setTxForm({
          employee_id: employees.length > 0 ? employees[0].id : '',
          transaction_type: 'COMMISSION',
          reference_no: '',
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          flow: 'INCENTIVE',
          payment_method: 'CASH',
          notes: ''
        });
        fetchTransactions();
        fetchEmployees();
      } else {
        alert(data.message || 'فشل تسجيل معاملة الموظف');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err.message);
    }
  };

  // Filtered by Search Term
  const filteredTransactions = transactions.filter(t => 
    t.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalIncentives = filteredTransactions
    .filter(t => t.flow === 'INCENTIVE')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalDeductions = filteredTransactions
    .filter(t => t.flow === 'DEDUCTION')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalPayouts = filteredTransactions
    .filter(t => t.flow === 'PAYOUT')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const getTransactionTypeLabel = (type: string, flow: string) => {
    switch(type) {
      case 'COMMISSION': return 'عمولة إنجاز / مبيعات';
      case 'BONUS': return 'مكافأة تشجيعية';
      case 'ADVANCE': return 'سلفة نقدية';
      case 'DEDUCTION': return 'خصم / جزاء';
      case 'SALARY_PAYMENT': return 'صرف راتب مستحق';
      default: return flow === 'INCENTIVE' ? 'حافز / عمولة' : (flow === 'DEDUCTION' ? 'سلفة / خصم' : 'صرف');
    }
  };

  // Print & Export Handlers
  const handlePrint = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">التاريخ</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">رقم الحركة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">اسم الموظف</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">نوع المعاملة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #10b981;">الحوافز والعمولات</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #e11d48;">السلف والخصومات</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #0284c7;">صرف رواتب</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">طريقة الدفع</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">البيان</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map(t => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.date?.slice(0, 10)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${t.reference_no}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${t.employee_name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${getTransactionTypeLabel(t.transaction_type, t.flow)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #10b981; font-weight: bold;">
                ${t.flow === 'INCENTIVE' ? `+${Number(t.amount).toLocaleString()} ج.م` : '—'}
              </td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #e11d48; font-weight: bold;">
                ${t.flow === 'DEDUCTION' ? `-${Number(t.amount).toLocaleString()} ج.م` : '—'}
              </td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0284c7; font-weight: bold;">
                ${t.flow === 'PAYOUT' ? `${Number(t.amount).toLocaleString()} ج.م` : '—'}
              </td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.payment_method === 'CASH' ? 'نقدي (كاش)' : t.payment_method}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.notes || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printTableOrReceipt('سجل معاملات وحركات الموظفين والرواتب', tableHtml);
  };

  const handleExportPDF = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">التاريخ</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">رقم الحركة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">اسم الموظف</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">نوع المعاملة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">المبلغ</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الاتجاه</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">البيان</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map(t => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.date?.slice(0, 10)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${t.reference_no}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${t.employee_name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${getTransactionTypeLabel(t.transaction_type, t.flow)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${Number(t.amount).toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.flow === 'INCENTIVE' ? 'حافز/عمولة (+)' : (t.flow === 'DEDUCTION' ? 'سلفة/خصم (-)' : 'صرف مستحق')}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.notes || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    exportToPDF('سجل معاملات الموظفين', tableHtml);
  };

  const handleExportExcel = () => {
    const headers = ['التاريخ', 'رقم الحركة', 'اسم الموظف', 'نوع المعاملة', 'المبلغ', 'التصنيف', 'طريقة الدفع', 'البيان'];
    const rows = filteredTransactions.map(t => [
      t.date?.slice(0, 10),
      t.reference_no,
      t.employee_name,
      getTransactionTypeLabel(t.transaction_type, t.flow),
      Number(t.amount),
      t.flow === 'INCENTIVE' ? 'حافز وعمولة' : (t.flow === 'DEDUCTION' ? 'سلفة وخصم' : 'صرف راتب'),
      t.payment_method,
      t.notes || ''
    ]);
    exportToExcel('سجل_معاملات_الموظفين', headers, rows);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>سجل معاملات الموظفين والرواتب</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              متابعة السلف، العمولات، الحوافز، الخصومات وصرف الرواتب لجميع الكوادر
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل معاملة موظف جديدة</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي العمولات والحوافز المضافة</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              +{totalIncentives.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">مكافآت ونسب إنجاز مستحقة</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي السلف والخصومات</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              -{totalDeductions.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">سلف نقدية وخصومات مستقطعة</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي مبالغ الرواتب المصروفة</div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1">
              {totalPayouts.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">سدادات مسيرات الرواتب المنفذة</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
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
        label="فلترة تاريخ المعاملات:"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Employee Dropdown Selector */}
        <div className="sm:w-72 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400 mr-1" />
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-bold"
          >
            <option value="ALL">جميع الموظفين</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {emp.job_title || emp.jobTitle ? `(${emp.job_title || emp.jobTitle})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input Bar */}
        <div className="flex-1 bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 mr-2 pointer-events-none" />
          <input 
            type="text"
            placeholder="بحث برقم الحركة، اسم الموظف، أو البيان..."
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
                <th className="p-4">الموظف</th>
                <th className="p-4">نوع المعاملة</th>
                <th className="p-4 text-center">حوافز وعمولات (+)</th>
                <th className="p-4 text-center">سلف وخصومات (-)</th>
                <th className="p-4 text-center">صرف رواتب</th>
                <th className="p-4">طريقة الدفع</th>
                <th className="p-4">البيان والملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    جاري تحميل سجل المعاملات...
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
                      {t.employee_name}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {getTransactionTypeLabel(t.transaction_type, t.flow)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {t.flow === 'INCENTIVE' ? (
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          +{Number(t.amount).toLocaleString()} ج.م
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {t.flow === 'DEDUCTION' ? (
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                          -{Number(t.amount).toLocaleString()} ج.م
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {t.flow === 'PAYOUT' ? (
                        <span className="font-mono font-black text-cyan-600 dark:text-cyan-400">
                          {Number(t.amount).toLocaleString()} ج.م
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {t.payment_method === 'CASH' ? 'نقدي (خزينة)' : 
                         t.payment_method === 'BANK_TRANSFER' ? 'تحويل بنكي' :
                         t.payment_method === 'INSTAPAY' ? 'انستاباي' : t.payment_method}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
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
                <span>تسجيل معاملة مالية لموظف</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الموظف المستهدف: <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={txForm.employee_id}
                  onChange={(e) => setTxForm({ ...txForm, employee_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="" disabled>اختر الموظف...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.job_title || emp.jobTitle ? `(${emp.job_title || emp.jobTitle})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تصنيف المعاملة: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={txForm.flow}
                    onChange={(e) => {
                      const flow = e.target.value as 'INCENTIVE' | 'DEDUCTION' | 'PAYOUT';
                      setTxForm({ 
                        ...txForm, 
                        flow,
                        transaction_type: flow === 'INCENTIVE' ? 'COMMISSION' : (flow === 'DEDUCTION' ? 'ADVANCE' : 'SALARY_PAYMENT')
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="INCENTIVE">عمولة أو حافز إضافي (+)</option>
                    <option value="DEDUCTION">سلفة أو خصم مستقطع (-)</option>
                    <option value="PAYOUT">صرف مسير الراتب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع الحركة:
                  </label>
                  <select
                    value={txForm.transaction_type}
                    onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    {txForm.flow === 'INCENTIVE' && (
                      <>
                        <option value="COMMISSION">عمولة إنجاز / مبيعات</option>
                        <option value="BONUS">مكافأة تشجيعية</option>
                      </>
                    )}
                    {txForm.flow === 'DEDUCTION' && (
                      <>
                        <option value="ADVANCE">سلفة نقدية</option>
                        <option value="DEDUCTION">خصم جزاء / غياب</option>
                      </>
                    )}
                    {txForm.flow === 'PAYOUT' && (
                      <option value="SALARY_PAYMENT">صرف راتب مستحق</option>
                    )}
                  </select>
                </div>
              </div>

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
                    طريقة الدفع / الصرف:
                  </label>
                  <select
                    value={txForm.payment_method}
                    onChange={(e) => setTxForm({ ...txForm, payment_method: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CASH">نقدي (كاش من الخزينة)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="INSTAPAY">انستاباي (InstaPay)</option>
                    <option value="VODAFONE_CASH">فودافون كاش ومحافظ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الإذن / السند (اختياري):
                  </label>
                  <input
                    type="text"
                    placeholder="تلقائي إن ترك فارغاً"
                    value={txForm.reference_no}
                    onChange={(e) => setTxForm({ ...txForm, reference_no: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والملاحظات:
                </label>
                <textarea
                  rows={2}
                  placeholder="سبب الحافز أو السلفة، تفاصيل المشروع أو الشهر..."
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
