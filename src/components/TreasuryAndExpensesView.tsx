import React, { useState, useEffect } from 'react';
import { systemAuthStore, hasFinancialPermission } from '../store/systemAuthStore';
import { 
  CircleDollarSign, 
  Wallet, 
  Landmark, 
  Plus, 
  Minus, 
  ArrowLeftRight, 
  UserCheck, 
  Truck, 
  Users, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  X, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins,
  History,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';


interface AccountItem {
  id: string;
  account_code: string;
  name: string;
  balance: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

interface SupplierOption {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

interface EmployeeOption {
  id: string;
  name: string;
  job_title: string;
  base_salary: number;
  commissions: number;
  advances: number;
  net_payable: number;
}

type ModalType = 
  | 'NONE'
  | 'EXPENSE'
  | 'DEPOSIT'
  | 'CUSTOMER_RECEIPT'
  | 'SUPPLIER_PAYMENT'
  | 'EMPLOYEE_WITHDRAWAL'
  | 'TRANSFER';

export const TreasuryAndExpensesView: React.FC = () => {
  const currentUser = systemAuthStore.currentUser;
  const userAssignedTreasury = currentUser?.assignedTreasury;
  const isRestrictedTreasury = currentUser?.role !== 'SUPER_ADMIN' && Boolean(userAssignedTreasury) && userAssignedTreasury !== 'ALL';

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Modal
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');

  // Form States
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Specific party IDs
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Status feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, custRes, supRes, empRes, txRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/customers'),
        fetch('/api/suppliers'),
        fetch('/api/employees'),
        fetch('/api/financial-transactions')
      ]);

      if (accRes.ok) {
        const json = await accRes.json();
        if (json.success && Array.isArray(json.data)) {
          let list = json.data;
          if (isRestrictedTreasury) {
            list = list.filter((a: any) => a.id === userAssignedTreasury || a.name === userAssignedTreasury);
          }
          setAccounts(list);
          if (list.length > 0) {
            setSelectedAccountId(list[0].id);
          }
        }
      }
      if (custRes.ok) {
        const json = await custRes.json();
        if (json.success && Array.isArray(json.data)) setCustomers(json.data);
      }
      if (supRes.ok) {
        const json = await supRes.json();
        if (json.success && Array.isArray(json.data)) setSuppliers(json.data);
      }
      if (empRes.ok) {
        const json = await empRes.json();
        if (json.success && Array.isArray(json.data)) setEmployees(json.data);
      }
      if (txRes.ok) {
        const json = await txRes.json();
        if (json.success && Array.isArray(json.data)) {
          let list = json.data;
          if (isRestrictedTreasury) {
            list = list.filter((t: any) => t.account_id === userAssignedTreasury || t.to_account_id === userAssignedTreasury || t.account_name === userAssignedTreasury);
          }
          setRecentTransactions(list.slice(0, 8));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to get selected account object
  const currentAccount = accounts.find(a => a.id === selectedAccountId);
  const targetAccount = accounts.find(a => a.id === targetAccountId);
  const currentCustomer = customers.find(c => c.id === selectedCustomerId);
  const currentSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const currentEmployee = employees.find(e => e.id === selectedEmployeeId);

  // Reset modal fields
  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setAmount('');
    setReason('');
    setFeedback(null);
    setPaymentMethod('CASH');
    if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
    if (accounts.length > 1) setTargetAccountId(accounts[1].id);
    if (customers.length > 0) setSelectedCustomerId(customers[0].id);
    if (suppliers.length > 0) setSelectedSupplierId(suppliers[0].id);
    if (employees.length > 0) setSelectedEmployeeId(employees[0].id);
  };

  const closeModal = () => {
    setActiveModal('NONE');
    setFeedback(null);
  };

  // Submit Handler with validations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (!selectedAccountId) {
      alert('يرجى اختيار الخزينة');
      return;
    }

    // 1. Validation for Expense
    if (activeModal === 'EXPENSE') {
      if (!currentAccount || currentAccount.balance < numAmount) {
        alert(`رصيد الخزينة (${currentAccount?.name}) غير كافٍ للصرف. الرصيد المتاح: ${currentAccount?.balance.toLocaleString()} ج.م`);
        return;
      }
      if (!reason.trim()) {
        alert('يرجى كتابة سبب المصروف أو البيان');
        return;
      }

      await executeTransaction({
        account_id: selectedAccountId,
        account_name: currentAccount.name,
        flow: 'OUT',
        amount: numAmount,
        transaction_type: 'EXPENSE',
        category: 'مصروفات تشغيلية',
        notes: reason.trim(),
        payment_method: paymentMethod
      });
    }

    // 2. Validation for Deposit
    else if (activeModal === 'DEPOSIT') {
      if (!reason.trim()) {
        alert('يرجى كتابة سبب الإيداع');
        return;
      }

      await executeTransaction({
        account_id: selectedAccountId,
        account_name: currentAccount?.name,
        flow: 'IN',
        amount: numAmount,
        transaction_type: 'RECEIPT',
        category: 'إيداع نقدي إضافي',
        notes: reason.trim(),
        payment_method: paymentMethod
      });
    }

    // 3. Validation for Customer Receipt
    else if (activeModal === 'CUSTOMER_RECEIPT') {
      if (!selectedCustomerId || !currentCustomer) {
        alert('يرجى اختيار العميل');
        return;
      }

      await executeTransaction({
        account_id: selectedAccountId,
        account_name: currentAccount?.name,
        flow: 'IN',
        amount: numAmount,
        transaction_type: 'RECEIPT',
        party_type: 'CUSTOMER',
        party_id: currentCustomer.id,
        party_name: currentCustomer.name,
        category: 'تحصيل من عميل',
        notes: reason.trim() || `تحصيل دفعة نقدية من العميل: ${currentCustomer.name}`,
        payment_method: paymentMethod
      });
    }

    // 4. Validation for Supplier Payment
    else if (activeModal === 'SUPPLIER_PAYMENT') {
      if (!selectedSupplierId || !currentSupplier) {
        alert('يرجى اختيار المورد');
        return;
      }
      if (!currentAccount || currentAccount.balance < numAmount) {
        alert(`رصيد الخزينة (${currentAccount?.name}) غير كافٍ للسداد للمورد. الرصيد المتاح: ${currentAccount?.balance.toLocaleString()} ج.م`);
        return;
      }

      await executeTransaction({
        account_id: selectedAccountId,
        account_name: currentAccount.name,
        flow: 'OUT',
        amount: numAmount,
        transaction_type: 'PAYMENT',
        party_type: 'SUPPLIER',
        party_id: currentSupplier.id,
        party_name: currentSupplier.name,
        category: 'سداد لمورد',
        notes: reason.trim() || `سداد دفعة نقدية للمورد: ${currentSupplier.name}`,
        payment_method: paymentMethod
      });
    }

    // 5. Validation for Employee Withdrawal
    else if (activeModal === 'EMPLOYEE_WITHDRAWAL') {
      if (!selectedEmployeeId || !currentEmployee) {
        alert('يرجى اختيار الموظف');
        return;
      }
      if (!currentAccount || currentAccount.balance < numAmount) {
        alert(`رصيد الخزينة (${currentAccount?.name}) غير كافٍ لصرف سلفة الموظف. الرصيد المتاح: ${currentAccount?.balance.toLocaleString()} ج.م`);
        return;
      }
      // Check employee limit
      const remainingSalary = currentEmployee.net_payable;
      if (numAmount > remainingSalary) {
        alert(`لا يمكن صرف مبلغ (${numAmount.toLocaleString()} ج.م) لأنه يتجاوز المتبقي من راتب الموظف (${remainingSalary.toLocaleString()} ج.م).`);
        return;
      }

      await executeTransaction({
        account_id: selectedAccountId,
        account_name: currentAccount.name,
        flow: 'OUT',
        amount: numAmount,
        transaction_type: 'ADVANCE',
        party_type: 'EMPLOYEE',
        party_id: currentEmployee.id,
        party_name: currentEmployee.name,
        category: 'مسحوبات وسلف موظفين',
        notes: reason.trim() || `سلفة ومسحوبات نقدية للموظف: ${currentEmployee.name}`,
        payment_method: paymentMethod
      });
    }

    // 6. Validation for Transfer
    else if (activeModal === 'TRANSFER') {
      if (!targetAccountId || targetAccountId === selectedAccountId) {
        alert('يرجى اختيار خزينة محول إليها مختلفة عن الخزينة المصدر');
        return;
      }
      if (!currentAccount || currentAccount.balance < numAmount) {
        alert(`رصيد الخزينة المحول منها (${currentAccount?.name}) غير كافٍ لإتمام التحويل. الرصيد الحالي: ${currentAccount?.balance.toLocaleString()} ج.م`);
        return;
      }

      await executeTransaction({
        account_id: selectedAccountId,
        account_name: currentAccount.name,
        to_account_id: targetAccountId,
        to_account_name: targetAccount?.name,
        flow: 'TRANSFER',
        amount: numAmount,
        transaction_type: 'TRANSFER',
        category: 'تحويل سيولة داخلية',
        notes: reason.trim() || `تحويل من (${currentAccount.name}) إلى (${targetAccount?.name})`,
        payment_method: 'CASH'
      });
    }
  };

  const executeTransaction = async (payload: any) => {
    try {
      const res = await fetch('/api/financial-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message || 'تمت العملية وتحديث الأرصدة بنجاح!' });
        fetchData();
        setTimeout(() => {
          closeModal();
        }, 1200);
      } else {
        alert(data.message || 'فشل إتمام العملية');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err.message);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>إدارة الماليات والعمليات النقدية</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مركز العمليات المالية المباشرة، الصرف، التحصيل، سداد الموردين، سلف الموظفين، والتحويلات
            </p>
          </div>
        </div>
      </div>

      {/* Main 6 Actions Grid (The user's requested operations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. إضافة مصروفات */}
        {hasFinancialPermission(currentUser, 'can_withdraw') && (
        <button
          onClick={() => openModal('EXPENSE')}
          className="group relative bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-rose-500/30 transition-all text-right cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Minus className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              صرف نقدي
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">إضافة مصروفات</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تسجيل مصروفات الكهرباء، الإيجار، والمصاريف التشغيلية مع فحص رصيد الخزينة
          </p>
        </button>
        )}

        {/* 2. إضافة إيداع */}
        {hasFinancialPermission(currentUser, 'can_deposit') && (
        <button
          onClick={() => openModal('DEPOSIT')}
          className="group relative bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-emerald-500/30 transition-all text-right cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              إيداع وارد
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">إضافة إيداع</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            توريد نقدية إضافية، إيرادات رأسمالية، أو تغذية رصيد الخزائن والبنوك
          </p>
        </button>
        )}

        {/* 3. تحصيل من عميل */}
        {hasFinancialPermission(currentUser, 'can_customer_receipt') && (
        <button
          onClick={() => openModal('CUSTOMER_RECEIPT')}
          className="group relative bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-cyan-500/30 transition-all text-right cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              سند تحصيل
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">تحصيل من عميل</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            قبض دفعة من عميل، إيداعها بالخزينة، وتخفيض مديونية العميل آلياً
          </p>
        </button>
        )}

        {/* 4. دفع إلى مورد */}
        {hasFinancialPermission(currentUser, 'can_supplier_payment') && (
        <button
          onClick={() => openModal('SUPPLIER_PAYMENT')}
          className="group relative bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-amber-500/30 transition-all text-right cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              سداد مورد
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">دفع إلى مورد</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            صرف دفعات للموردين والشركات مع التحقق الصارم من رصيد الخزينة
          </p>
        </button>
        )}

        {/* 5. مسحوبات الموظفين */}
        {hasFinancialPermission(currentUser, 'can_employee_advance') && (
        <button
          onClick={() => openModal('EMPLOYEE_WITHDRAWAL')}
          className="group relative bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-purple-500/30 transition-all text-right cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              سلف موظفين
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">مسحوبات الموظفين</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            صرف سلف الموظفين مع فحص الراتب، السلف السابقة، والتأكد من عدم تجاوز الراتب
          </p>
        </button>
        )}

        {/* 6. نقل من خزينة لأخرى */}
        {hasFinancialPermission(currentUser, 'can_transfer') && (
        <button
          onClick={() => openModal('TRANSFER')}
          className="group relative bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-blue-500/30 transition-all text-right cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              تحويل داخلي
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">نقل من خزينة لأخرى</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            مناقلة سيولة بين الكاشير، الخزينة الرئيسية، البنك، أو المحافظ مع التأكد من الرصيد
          </p>
        </button>
        )}
      </div>

      {/* Recent Financial Transactions Feed */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-500" />
            <span>آخر الحركات والعمليات المالية المنفذة</span>
          </h3>
          <span className="text-xs text-slate-400">محدث لحظياً مع قاعدة البيانات</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">رقم السند</th>
                <th className="p-3">الخزينة</th>
                <th className="p-3">نوع الحركة</th>
                <th className="p-3 text-center">المبلغ</th>
                <th className="p-3 text-center">الرصيد بعدها</th>
                <th className="p-3">البيان والملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-500">{t.date?.slice(0, 10)}</td>
                  <td className="p-3 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{t.reference_no}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{t.account_name}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.flow === 'IN' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : t.flow === 'OUT'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {t.flow === 'IN' ? 'قبض / إيداع (+)' : (t.flow === 'OUT' ? 'صرف / سداد (-)' : 'تحويل داخلي')}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-black">
                    <span className={t.flow === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {t.flow === 'IN' ? `+${Number(t.amount).toLocaleString()}` : `-${Number(t.amount).toLocaleString()}`} ج.م
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {Number(t.balance_after || 0).toLocaleString()} ج.م
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">
                    {t.party_name ? `${t.party_name} - ` : ''}{t.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL POPUPS FOR THE 6 OPERATIONS                        */}
      {/* ======================================================== */}
      {activeModal !== 'NONE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {activeModal === 'EXPENSE' && <Minus className="w-5 h-5 text-rose-500" />}
                {activeModal === 'DEPOSIT' && <Plus className="w-5 h-5 text-emerald-500" />}
                {activeModal === 'CUSTOMER_RECEIPT' && <Users className="w-5 h-5 text-cyan-500" />}
                {activeModal === 'SUPPLIER_PAYMENT' && <Truck className="w-5 h-5 text-amber-500" />}
                {activeModal === 'EMPLOYEE_WITHDRAWAL' && <UserCheck className="w-5 h-5 text-purple-500" />}
                {activeModal === 'TRANSFER' && <ArrowLeftRight className="w-5 h-5 text-blue-500" />}

                <span>
                  {activeModal === 'EXPENSE' && 'إضافة مصروفات تشغيلية'}
                  {activeModal === 'DEPOSIT' && 'إضافة إيداع نقدي بالخزينة'}
                  {activeModal === 'CUSTOMER_RECEIPT' && 'تحصيل دفعة نقدية من عميل'}
                  {activeModal === 'SUPPLIER_PAYMENT' && 'دفع وسداد نقدية إلى مورد'}
                  {activeModal === 'EMPLOYEE_WITHDRAWAL' && 'صرف سلفة / مسحوبات موظف'}
                  {activeModal === 'TRANSFER' && 'نقل وتحويل سيولة بين الخزائن'}
                </span>
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                feedback.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-500/20'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 1. الخزينة المحول منها أو الخزينة المعنية */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {activeModal === 'TRANSFER' ? 'الخزينة المحول منها:' : 'اختيار الخزينة:'} <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  required
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  disabled={isRestrictedTreasury}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold ${
                    isRestrictedTreasury ? 'opacity-80 bg-slate-200/50 dark:bg-slate-800/50 cursor-not-allowed' : ''
                  }`}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (الرصيد المتاح: {acc.balance.toLocaleString()} ج.م)
                    </option>
                  ))}
                </SearchableSelect>
                {isRestrictedTreasury && (
                  <div className="text-[10px] text-amber-500 font-bold mt-1">
                    * تم قفل وتحديد الخزينة المصرح بها لحسابك تلقائياً
                  </div>
                )}
                {currentAccount && (
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>الرصيد المتاح الحالي:</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {currentAccount.balance.toLocaleString()} ج.م
                    </span>
                  </div>
                )}
              </div>

              {/* 2. في حالة النقل: اختيار الخزينة المحول إليها */}
              {activeModal === 'TRANSFER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الخزينة المحول إليها: <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    required
                    value={targetAccountId}
                    onChange={(e) => setTargetAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    {accounts.filter(a => a.id !== selectedAccountId).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (الرصيد الحالي: {acc.balance.toLocaleString()} ج.م)
                      </option>
                    ))}
                  </SearchableSelect>
                </div>
              )}

              {/* 3. في حالة تحصيل من عميل: اختيار العميل وعرض حسابه */}
              {activeModal === 'CUSTOMER_RECEIPT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اختيار العميل: <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </SearchableSelect>
                  {currentCustomer && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 text-[11px] flex items-center justify-between">
                      <span className="text-slate-400">حساب العميل الحالي:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {currentCustomer.balance.toLocaleString()} ج.م {currentCustomer.balance > 0 ? '(مدين / عليه)' : '(دائن / له)'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. في حالة سداد لمورد: اختيار المورد وعرض حسابه */}
              {activeModal === 'SUPPLIER_PAYMENT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اختيار المورد: <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone})
                      </option>
                    ))}
                  </SearchableSelect>
                  {currentSupplier && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 text-[11px] flex items-center justify-between">
                      <span className="text-slate-400">مستحقات المورد الحالية:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {currentSupplier.balance.toLocaleString()} ج.م
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 5. في حالة مسحوبات الموظفين: اختيار الموظف وعرض الراتب والمسحوبات والمتبقي */}
              {activeModal === 'EMPLOYEE_WITHDRAWAL' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اختيار الموظف: <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      required
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} - {emp.job_title}
                        </option>
                      ))}
                    </SearchableSelect>
                  </div>

                  {currentEmployee && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">إجمالي الراتب الأساسي + الحوافز:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {(Number(currentEmployee.base_salary) + Number(currentEmployee.commissions)).toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">إجمالي المسحوبات والسلف السابقة:</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          -{Number(currentEmployee.advances).toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-300">المتبقي من الراتب المتاح للصرف:</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {Number(currentEmployee.net_payable).toLocaleString()} ج.م
                        </span>
                      </div>

                      {/* إظهار المتبقي بعد ذلك */}
                      {Number(amount) > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-300 dark:border-slate-700 text-cyan-600 dark:text-cyan-400 font-bold">
                          <span>المتبقي من الراتب بعد هذا السحب:</span>
                          <span className="font-mono font-black text-sm">
                            {Math.max(0, currentEmployee.net_payable - Number(amount)).toLocaleString()} ج.م
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 6. إدخال المبلغ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ المطلوب: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-bold text-base"
                />

                {/* Live Validation Warnings */}
                {currentAccount && Number(amount) > currentAccount.balance && (activeModal === 'EXPENSE' || activeModal === 'SUPPLIER_PAYMENT' || activeModal === 'EMPLOYEE_WITHDRAWAL' || activeModal === 'TRANSFER') && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>تنبيه: المبلغ المطلوب أكبر من رصيد الخزينة المتاح ({currentAccount.balance.toLocaleString()} ج.م)!</span>
                  </p>
                )}

                {activeModal === 'EMPLOYEE_WITHDRAWAL' && currentEmployee && Number(amount) > currentEmployee.net_payable && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>تنبيه: لا يمكن للموظف أخذ أكثر من المتبقي من راتبه ({currentEmployee.net_payable.toLocaleString()} ج.م)!</span>
                  </p>
                )}
              </div>

              {/* 7. السبب والبيان (مطلوب للمصروفات والإيداع، واختياري للباقي) */}
              {(activeModal === 'EXPENSE' || activeModal === 'DEPOSIT' || activeModal === 'CUSTOMER_RECEIPT' || activeModal === 'SUPPLIER_PAYMENT' || activeModal === 'EMPLOYEE_WITHDRAWAL' || activeModal === 'TRANSFER') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {activeModal === 'EXPENSE' || activeModal === 'DEPOSIT' ? 'السبب والبيان: *' : 'البيان والملاحظات (اختياري):'}
                  </label>
                  <input
                    type="text"
                    required={activeModal === 'EXPENSE' || activeModal === 'DEPOSIT'}
                    placeholder={
                      activeModal === 'EXPENSE' ? 'مثال: فاتورة كهرباء، صيانة سيارة، إيجار المقر...' :
                      activeModal === 'DEPOSIT' ? 'مثال: تغذية سيولة كاشير، إيراد إضافي...' :
                      'تفاصيل إضافية عن الحركة...'
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30 cursor-pointer"
                >
                  تأكيد وتنفيذ العملية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
