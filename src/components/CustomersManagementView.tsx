import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  CreditCard, 
  Printer, 
  FileDown, 
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  Layers,
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';
import { showSuccess, showError, showWarning, showConfirm, showToast } from '../utils/swal';

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // positive = مدين (عليه فلوس), negative = دائن (له فلوس), 0 = متزن
  email?: string;
  type?: string;
  credit_limit?: number;
  total_invoices?: number;
  business_unit?: string;
  created_at?: string;
}

export interface CustomerTransaction {
  id: string;
  customer_id: string;
  customer_name: string;
  transaction_type: string;
  reference_no: string;
  date: string;
  debit: number;
  credit: number;
  balance_after: number;
  payment_method: string;
  notes?: string;
}

export const CustomersManagementView: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    balance: 0
  });

  // Statement / Transactions Modal
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<CustomerItem | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txFromDate, setTxFromDate] = useState('');
  const [txToDate, setTxToDate] = useState('');
  const [txShortcut, setTxShortcut] = useState<DateShortcut>('ALL');

  // Single Customer View Modal
  const [viewingCustomer, setViewingCustomer] = useState<CustomerItem | null>(null);

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCustomers(json.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            address: c.address || '',
            balance: Number(c.balance || 0),
            email: c.email || '',
            type: c.type || 'RETAIL',
            credit_limit: Number(c.credit_limit || 0),
            total_invoices: Number(c.total_invoices || 0),
            created_at: c.created_at || ''
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
    fetchCustomers();
  }, []);

  // Fetch Transactions for Statement
  const fetchCustomerTransactions = async (customerId: string, from = txFromDate, to = txToDate) => {
    try {
      setLoadingTransactions(true);
      let url = `/api/customer-transactions?customerId=${encodeURIComponent(customerId)}`;
      if (from) url += `&fromDate=${from}`;
      if (to) url += `&toDate=${to}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCustomerTransactions(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Open statement modal
  const handleOpenStatement = (cust: CustomerItem) => {
    setSelectedCustomerForStatement(cust);
    setTxFromDate('');
    setTxToDate('');
    setTxShortcut('ALL');
    fetchCustomerTransactions(cust.id, '', '');
  };

  // Save Customer (Add or Edit)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال اسم العميل ورقم الهاتف');
      return;
    }

    try {
      const payload = {
        id: editingCustomer ? editingCustomer.id : undefined,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        balance: Number(formData.balance) || 0
      };

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setShowAddEditModal(false);
        setEditingCustomer(null);
        setFormData({ name: '', phone: '', address: '', balance: 0 });
        showToast(editingCustomer ? 'تم تحديث بيانات العميل بنجاح' : 'تمت إضافة العميل بنجاح');
        fetchCustomers();
      } else {
        showError('فشل الحفظ', data.message || 'فشل حفظ بيانات العميل');
      }
    } catch (err: any) {
      showError('خطأ في الاتصال', err.message);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (cust: CustomerItem) => {
    if (Math.abs(cust.balance) > 0) {
      showWarning(
        'لا يمكن حذف العميل',
        `لا يمكن حذف العميل (${cust.name}) لأن حسابه الحالي غير مصفى (الرصيد: ${cust.balance.toLocaleString()} ج.م). يجب تصفية الحساب أولاً.`
      );
      return;
    }

    const confirmed = await showConfirm(
      'تأكيد حذف العميل',
      `هل أنت متأكد من رغبتك في حذف العميل: "${cust.name}" نهائياً من النظام؟`,
      { isDanger: true, confirmText: 'نعم، حذف العميل', cancelText: 'إلغاء' }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/customers/${cust.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم حذف العميل بنجاح');
        fetchCustomers();
      } else {
        showError('فشل الحذف', data.message || 'فشل حذف العميل');
      }
    } catch (err: any) {
      console.error(err);
      showError('خطأ أثناء الحذف', err.message);
    }
  };

  // Filtered Customers (Search)
  const filteredCustomers = customers.filter(c => {
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Aggregates
  const totalDebtor = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const totalCreditor = customers.reduce((acc, c) => acc + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
  const netBalance = totalDebtor - totalCreditor;

  // Print & Export Handlers
  const handlePrint = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">اسم العميل</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">رقم الهاتف</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">العنوان</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الحساب الحالي</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCustomers.map(c => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${c.name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; direction: ltr;">${c.phone}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${c.address || '—'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: ${c.balance > 0 ? '#e11d48' : c.balance < 0 ? '#10b981' : '#0f172a'};">
                ${Math.abs(c.balance).toLocaleString()} ج.م
              </td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">
                ${c.balance > 0 ? 'مدين (عليه)' : c.balance < 0 ? 'دائن (له)' : 'متزن'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printTableOrReceipt('دليل وبيانات العملاء والأرصدة', tableHtml);
  };

  const handleExportPDF = () => {
    handlePrint();
  };

  const handleExportExcel = () => {
    const headers = ['اسم العميل', 'رقم الهاتف', 'العنوان', 'الرصيد بالأرقام', 'نوع الحساب'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.phone,
      c.address || '',
      c.balance,
      c.balance > 0 ? 'مدين (عليه)' : c.balance < 0 ? 'دائن (له)' : 'خالص'
    ]);
    exportToExcel('سجل_العملاء_متجر_دراجون', headers, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>إدارة العملاء</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  {customers.length} عميل
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                سجل حسابات العملاء (دائن / مدين)، أرقام الهواتف، العناوين، وكشوف الحسابات
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: '', phone: '', address: '', balance: 0 });
              setShowAddEditModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
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

      {/* KPI Cards: Debit, Credit, Net */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي مديونيات العملاء (مدين / لنا)</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              {totalDebtor.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">مبالغ مستحقة على العملاء</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">أرصدة العملاء الدائنة (دائن / دفعات مقدمة)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {totalCreditor.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">مبالغ مدفوعة مقدماً للعملاء</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">صافي رصيد ذمم العملاء</div>
            <div className={`text-2xl font-black font-mono mt-1 ${netBalance >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {netBalance.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">صافي المركز المالي للعملاء</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 mr-2 pointer-events-none" />
        <input 
          type="text"
          placeholder="بحث باسم العميل، رقم الهاتف، أو العنوان..."
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

      {/* Customers Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">اسم العميل</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">العنوان</th>
                <th className="p-4 text-center">الحساب الحالي (دائن / مدين)</th>
                <th className="p-4 text-center">حالة الحساب</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    جاري تحميل بيانات العملاء...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                    لا يوجد عملاء يطابقون خيارات البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-sm">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.id}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span>{c.phone}</span>
                        <Phone className="w-3.5 h-3.5 text-cyan-500" />
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{c.address || '—'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-mono font-black text-sm">
                        {c.balance > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {c.balance.toLocaleString()} ج.م
                          </span>
                        ) : c.balance < 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {Math.abs(c.balance).toLocaleString()} ج.م
                          </span>
                        ) : (
                          <span className="text-slate-400">0.00 ج.م</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {c.balance > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          مدين (عليه مديونية)
                        </span>
                      )}
                      {c.balance < 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          دائن (له رصيد مقدم)
                        </span>
                      )}
                      {c.balance === 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          خالص / متزن
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* عرض المعاملات المالية */}
                        <button
                          onClick={() => handleOpenStatement(c)}
                          className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 border border-cyan-500/20 transition-all cursor-pointer"
                          title="عرض معاملات وكشف حساب العميل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* تعديل */}
                        <button
                          onClick={() => {
                            setEditingCustomer(c);
                            setFormData({
                              name: c.name,
                              phone: c.phone,
                              address: c.address,
                              balance: c.balance
                            });
                            setShowAddEditModal(true);
                          }}
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-amber-500/20 transition-all cursor-pointer"
                          title="تعديل بيانات العميل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* حذف */}
                        <button
                          onClick={() => handleDeleteCustomer(c)}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-500/20 transition-all cursor-pointer"
                          title="حذف العميل"
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
      {/* MODAL: ADD / EDIT CUSTOMER                               */}
      {/* ======================================================== */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" />
                <span>{editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</span>
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم العميل: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م/ أحمد محمود، شركة الأمل..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف: <span className="text-rose-500">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">العنوان:</label>
                <input
                  type="text"
                  placeholder="مثال: القاهرة - المعادي شارع 9"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الحساب الحالي (الرصيد الافتتاحي):
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00 (موجب = مدين عليه، سالب = دائن له)"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  أدخل قيمة موجبة إذا كان العميل مديناً (عليه مبلغ)، أو سالبة إذا كان له رصيد دائن.
                </span>
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
      {/* MODAL: CUSTOMER TRANSACTIONS / STATEMENT WITH DATE FILTERS */}
      {/* ======================================================== */}
      {selectedCustomerForStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  <span>كشف معاملات وحساب العميل: {selectedCustomerForStatement.name}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  الهاتف: {selectedCustomerForStatement.phone} • الرصيد الإجمالي: {selectedCustomerForStatement.balance.toLocaleString()} ج.م
                </span>
              </div>
              <button 
                onClick={() => setSelectedCustomerForStatement(null)}
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
                  fetchCustomerTransactions(selectedCustomerForStatement.id, d, txToDate);
                }}
                onToDateChange={(d) => {
                  setTxToDate(d);
                  fetchCustomerTransactions(selectedCustomerForStatement.id, txFromDate, d);
                }}
                activeShortcut={txShortcut}
                onShortcutSelect={(sc) => {
                  setTxShortcut(sc);
                  // Handled by date changes
                }}
                onReset={() => fetchCustomerTransactions(selectedCustomerForStatement.id, '', '')}
                label="فلترة معاملات العميل حسب الفترة:"
              />
            </div>

            {/* Statement Table */}
            <div className="flex-1 overflow-y-auto scrollbar-thin my-2">
              {loadingTransactions ? (
                <div className="p-8 text-center text-slate-400">جاري تحميل كشف الحساب...</div>
              ) : customerTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا توجد معاملات مسجلة لهذا العميل في هذه الفترة.</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">رقم المرجع / الإذن</th>
                      <th className="p-3">نوع المعاملة</th>
                      <th className="p-3 text-center text-rose-600">مدين (عليه)</th>
                      <th className="p-3 text-center text-emerald-600">دائن (سداد)</th>
                      <th className="p-3 text-center">الرصيد بعد الحركة</th>
                      <th className="p-3">البيان / ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{tx.date?.slice(0, 10)}</td>
                        <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{tx.reference_no}</td>
                        <td className="p-3 font-bold">
                          {tx.transaction_type === 'INVOICE' ? 'فاتورة مبيعات' :
                           tx.transaction_type === 'PAYMENT' ? 'سداد نقدي' :
                           tx.transaction_type === 'RETURN' ? 'مرتجع بضاعة' : tx.transaction_type}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-rose-600">
                          {tx.debit > 0 ? `${tx.debit.toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600">
                          {tx.credit > 0 ? `${tx.credit.toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-800 dark:text-slate-200">
                          {tx.balance_after.toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{tx.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['التاريخ', 'رقم المرجع', 'نوع الحركة', 'مدين (فاتورة)', 'دائن (سداد)', 'الرصيد بعد الحركة', 'البيان / ملاحظات'];
                    const rows = customerTransactions.map(tx => [
                      tx.date?.slice(0, 10),
                      tx.reference_no,
                      tx.transaction_type === 'PAYMENT' ? 'سند تحصيل / سداد' : 'فاتورة مبيعات',
                      tx.debit || 0,
                      tx.credit || 0,
                      tx.balance_after || 0,
                      tx.notes || ''
                    ]);
                    exportToExcel(`كشف_حساب_عميل_${selectedCustomerForStatement.name}`, headers, rows);
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
                      <h3>كشف حساب العميل: ${selectedCustomerForStatement.name}</h3>
                      <p>الهاتف: ${selectedCustomerForStatement.phone} | الرصيد الحالي: ${selectedCustomerForStatement.balance.toLocaleString()} ج.م</p>
                      <table style="width:100%; border-collapse:collapse; text-align:right;">
                        <thead>
                          <tr style="background:#eee;">
                            <th style="padding:6px;border:1px solid #ccc;">التاريخ</th>
                            <th style="padding:6px;border:1px solid #ccc;">المرجع</th>
                            <th style="padding:6px;border:1px solid #ccc;">النوع</th>
                            <th style="padding:6px;border:1px solid #ccc;">مدين</th>
                            <th style="padding:6px;border:1px solid #ccc;">دائن</th>
                            <th style="padding:6px;border:1px solid #ccc;">الرصيد</th>
                            <th style="padding:6px;border:1px solid #ccc;">البيان</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${customerTransactions.map(tx => `
                            <tr>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.date?.slice(0, 10)}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.reference_no}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.transaction_type}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.debit}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.credit}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.balance_after}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.notes || ''}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `;
                    exportToPDF(`كشف حساب - ${selectedCustomerForStatement.name}`, html);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer transition-colors"
                  title="تصدير PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>تصدير PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const html = `
                      <h3>كشف حساب العميل: ${selectedCustomerForStatement.name}</h3>
                      <p>الهاتف: ${selectedCustomerForStatement.phone} | الرصيد الحالي: ${selectedCustomerForStatement.balance.toLocaleString()} ج.م</p>
                      <table style="width:100%; border-collapse:collapse; text-align:right;">
                        <thead>
                          <tr style="background:#eee;">
                            <th style="padding:6px;border:1px solid #ccc;">التاريخ</th>
                            <th style="padding:6px;border:1px solid #ccc;">المرجع</th>
                            <th style="padding:6px;border:1px solid #ccc;">النوع</th>
                            <th style="padding:6px;border:1px solid #ccc;">مدين</th>
                            <th style="padding:6px;border:1px solid #ccc;">دائن</th>
                            <th style="padding:6px;border:1px solid #ccc;">الرصيد</th>
                            <th style="padding:6px;border:1px solid #ccc;">البيان</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${customerTransactions.map(tx => `
                            <tr>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.date?.slice(0, 10)}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.reference_no}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.transaction_type}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.debit}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.credit}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.balance_after}</td>
                              <td style="padding:6px;border:1px solid #ccc;">${tx.notes || ''}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `;
                    printTableOrReceipt(`كشف حساب - ${selectedCustomerForStatement.name}`, html);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                  title="طباعة كشف الحساب"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedCustomerForStatement(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW CUSTOMER DETAILS                             */}
      {/* ======================================================== */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-500" />
                <span>بطاقة العميل</span>
              </h3>
              <button onClick={() => setViewingCustomer(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-slate-400 font-bold">اسم العميل:</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{viewingCustomer.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-slate-400 font-bold">رقم الهاتف:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">{viewingCustomer.phone}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-slate-400 font-bold">العنوان:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingCustomer.address || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-slate-400 font-bold">الحساب الحالي:</span>
                <span className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                  {viewingCustomer.balance.toLocaleString()} ج.م
                  {viewingCustomer.balance > 0 ? ' (مدين / عليه)' : viewingCustomer.balance < 0 ? ' (دائن / له)' : ' (خالص)'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-2">
              <button
                onClick={() => setViewingCustomer(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
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
