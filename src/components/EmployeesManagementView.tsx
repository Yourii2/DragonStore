import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  FileDown,
  Printer,
  Eye,
  Edit3,
  Trash2,
  X,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Clock
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';

export interface EmployeeItem {
  id: string;
  name: string;
  job_title: string;
  department: string;
  phone: string;
  email?: string;
  base_salary: number;
  salary_cycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  commissions: number;
  advances: number;
  net_payable: number;
  business_unit?: 'SHOP' | 'FREELANCE' | 'BOTH';
  status?: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  hire_date?: string;
}

export interface EmployeeTransaction {
  id: string;
  employee_id: string;
  employee_name: string;
  transaction_type: string;
  reference_no: string;
  date: string;
  amount: number;
  flow: 'INCENTIVE' | 'DEDUCTION' | 'PAYOUT';
  payment_method: string;
  notes?: string;
}

export const EmployeesManagementView: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    job_title: '',
    phone: '',
    base_salary: 5000,
    salary_cycle: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    department: 'عام',
    email: ''
  });

  // Statement / Transactions Modal
  const [selectedEmployeeForStatement, setSelectedEmployeeForStatement] = useState<EmployeeItem | null>(null);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txFromDate, setTxFromDate] = useState('');
  const [txToDate, setTxToDate] = useState('');
  const [txShortcut, setTxShortcut] = useState<DateShortcut>('ALL');

  // Single Employee View Modal
  const [viewingEmployee, setViewingEmployee] = useState<EmployeeItem | null>(null);

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setEmployees(json.data.map((e: any) => ({
            id: e.id,
            name: e.name,
            job_title: e.job_title || e.jobTitle || 'موظف',
            department: e.department || 'عام',
            phone: e.phone || '',
            email: e.email || '',
            base_salary: Number(e.base_salary || e.baseSalary || 0),
            salary_cycle: e.salary_cycle || e.salaryCycle || 'MONTHLY',
            commissions: Number(e.commissions || 0),
            advances: Number(e.advances || 0),
            net_payable: Number(e.net_payable !== undefined ? e.net_payable : (e.netPayable !== undefined ? e.netPayable : (Number(e.base_salary || 0) + Number(e.commissions || 0) - Number(e.advances || 0)))),
            business_unit: e.business_unit || e.businessUnit || 'SHOP',
            status: e.status || 'ACTIVE',
            hire_date: e.hire_date || e.hireDate || ''
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
    fetchEmployees();
  }, []);

  // Fetch Transactions for Statement
  const fetchEmployeeTransactions = async (employeeId: string, from = txFromDate, to = txToDate) => {
    try {
      setLoadingTransactions(true);
      let url = `/api/employee-transactions?employeeId=${encodeURIComponent(employeeId)}`;
      if (from) url += `&fromDate=${from}`;
      if (to) url += `&toDate=${to}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setEmployeeTransactions(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Open statement modal
  const handleOpenStatement = (emp: EmployeeItem) => {
    setSelectedEmployeeForStatement(emp);
    setTxFromDate('');
    setTxToDate('');
    setTxShortcut('ALL');
    fetchEmployeeTransactions(emp.id, '', '');
  };

  // Save Employee (Add or Edit)
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.job_title.trim()) {
      alert('يرجى إدخال اسم الموظف، المسمى الوظيفي، ورقم الهاتف');
      return;
    }

    try {
      const payload = {
        id: editingEmployee ? editingEmployee.id : undefined,
        name: formData.name.trim(),
        job_title: formData.job_title.trim(),
        phone: formData.phone.trim(),
        base_salary: Number(formData.base_salary) || 0,
        salary_cycle: formData.salary_cycle,
        department: formData.department.trim() || 'عام',
        email: formData.email.trim() || undefined
      };

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddEditModal(false);
        setEditingEmployee(null);
        setFormData({
          name: '',
          job_title: '',
          phone: '',
          base_salary: 5000,
          salary_cycle: 'MONTHLY',
          department: 'عام',
          email: ''
        });
        fetchEmployees();
      } else {
        alert(data.message || 'فشل حفظ بيانات الموظف');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err.message);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (emp: EmployeeItem) => {
    if (emp.advances > 0) {
      alert(`لا يمكن حذف الموظف (${emp.name}) لوجود سلف وخصومات معلقة بقيمة (${emp.advances.toLocaleString()} ج.م). يجب تصفية الحساب أولاً.`);
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف الموظف: "${emp.name}"؟`)) return;

    try {
      const res = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
      } else {
        alert(data.message || 'فشل حذف الموظف');
      }
    } catch (err) {
      console.error(err);
      alert('فشل حذف الموظف');
    }
  };

  // Filtered Employees (Search only)
  const filteredEmployees = employees.filter(e => {
    return (
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone.includes(searchTerm) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Aggregates
  const totalBaseSalary = employees.reduce((acc, e) => acc + Number(e.base_salary || 0), 0);
  const totalCommissions = employees.reduce((acc, e) => acc + Number(e.commissions || 0), 0);
  const totalAdvances = employees.reduce((acc, e) => acc + Number(e.advances || 0), 0);
  const totalNetPayable = employees.reduce((acc, e) => acc + Number(e.net_payable || 0), 0);

  const getCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'DAILY': return 'يومي';
      case 'WEEKLY': return 'أسبوعي';
      case 'MONTHLY': return 'شهري';
      case 'YEARLY': return 'سنوي';
      default: return 'شهري';
    }
  };

  // Print & Export Handlers
  const handlePrint = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الموظف والوظيفة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الاتصال</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الراتب الأساسي</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">مدة الراتب</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #10b981;">العمولات والحوافز</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #e11d48;">السلف والخصومات</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; color: #0284c7;">صافي المستحق</th>
          </tr>
        </thead>
        <tbody>
          ${filteredEmployees.map(e => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">
                ${e.name} - <span style="font-weight: normal; color: #64748b;">${e.job_title}</span>
              </td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; direction: ltr; font-family: monospace;">${e.phone}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${e.base_salary.toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${getCycleLabel(e.salary_cycle)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #10b981; font-weight: bold;">+${e.commissions.toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #e11d48; font-weight: bold;">-${e.advances.toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0284c7; font-weight: 900;">${e.net_payable.toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printTableOrReceipt('دليل وبيانات الموظفين والرواتب', tableHtml);
  };

  const handleExportPDF = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الموظف والوظيفة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الاتصال</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الراتب الأساسي</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">المدة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">العمولات</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">السلف</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">صافي المستحق</th>
          </tr>
        </thead>
        <tbody>
          ${filteredEmployees.map(e => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${e.name} (${e.job_title})</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${e.phone}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${e.base_salary.toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${getCycleLabel(e.salary_cycle)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #10b981;">+${e.commissions.toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #e11d48;">-${e.advances.toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${e.net_payable.toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    exportToPDF('دليل_الموظفين_والرواتب', tableHtml);
  };

  const handleExportExcel = () => {
    const headers = ['كود الموظف', 'اسم الموظف', 'المسمى الوظيفي', 'رقم الهاتف', 'الراتب الأساسي', 'مدة الراتب', 'العمولات والحوافز', 'السلف والخصومات', 'صافي المستحق'];
    const rows = filteredEmployees.map(e => [
      e.id,
      e.name,
      e.job_title,
      e.phone,
      e.base_salary,
      getCycleLabel(e.salary_cycle),
      e.commissions,
      e.advances,
      e.net_payable
    ]);
    exportToExcel('دليل_الموظفين_والرواتب', headers, rows);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>إدارة الموظفين وكادر العمل</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تسجيل بيانات الموظفين، تحديد مدة الراتب، ومتابعة العمولات والسلف وصافي المستحقات
            </p>
          </div>
        </div>

        {/* Action Buttons: Add, Print, Export PDF, Export Excel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingEmployee(null);
              setFormData({
                name: '',
                job_title: '',
                phone: '',
                base_salary: 5000,
                salary_cycle: 'MONTHLY',
                department: 'عام',
                email: ''
              });
              setShowAddEditModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
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

      {/* KPI Cards: Base Salary, Commissions, Advances, Net Payable */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي الرواتب الأساسية</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
              {totalBaseSalary.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{employees.length} موظف مسجل</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي العمولات والحوافز</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              +{totalCommissions.toLocaleString()} ج.م
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
              -{totalAdvances.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">سلف نقدية مستقطعة</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي صافي المستحق للرواتب</div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1">
              {totalNetPayable.toLocaleString()} ج.م
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">صافي استحقاق كادر العمل</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Input Bar (No registration date filter) */}
      <div className="bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 mr-2 pointer-events-none" />
        <input 
          type="text"
          placeholder="بحث باسم الموظف، المسمى الوظيفي، أو رقم الهاتف..."
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

      {/* Employees Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">الموظف والوظيفة</th>
                <th className="p-4">الاتصال</th>
                <th className="p-4">الراتب الأساسي</th>
                <th className="p-4">العمولات والحوافز</th>
                <th className="p-4">السلف والخصومات</th>
                <th className="p-4">صافي المستحق</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    جاري تحميل بيانات الموظفين...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                    لا يوجد موظفون يطابقون خيارات البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-sm">{e.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[10px] bg-cyan-50 dark:bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-500/20 font-bold">
                          {e.id}
                        </span>
                        <span>{e.job_title}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span>{e.phone}</span>
                        <Phone className="w-3.5 h-3.5 text-cyan-500" />
                      </div>
                      {e.email && (
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5 text-right">{e.email}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {e.base_salary.toLocaleString()} ج.م
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-500" />
                        <span>المدة: {getCycleLabel(e.salary_cycle)}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{e.commissions.toLocaleString()} ج.م
                    </td>
                    <td className="p-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{e.advances.toLocaleString()} ج.م
                    </td>
                    <td className="p-4 font-mono font-black text-cyan-600 dark:text-cyan-400 text-sm">
                      {e.net_payable.toLocaleString()} ج.م
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* عرض المعاملات المالية للموظف */}
                        <button
                          onClick={() => handleOpenStatement(e)}
                          className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 border border-cyan-500/20 transition-all cursor-pointer"
                          title="عرض جميع المعاملات المالية للموظف"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* تعديل */}
                        <button
                          onClick={() => {
                            setEditingEmployee(e);
                            setFormData({
                              name: e.name,
                              job_title: e.job_title,
                              phone: e.phone,
                              base_salary: e.base_salary,
                              salary_cycle: e.salary_cycle || 'MONTHLY',
                              department: e.department || 'عام',
                              email: e.email || ''
                            });
                            setShowAddEditModal(true);
                          }}
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-amber-500/20 transition-all cursor-pointer"
                          title="تعديل بيانات الموظف"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* حذف */}
                        <button
                          onClick={() => handleDeleteEmployee(e)}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-500/20 transition-all cursor-pointer"
                          title="حذف الموظف"
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
      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {/* ======================================================== */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-500" />
                <span>{editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</span>
              </h3>
              <button 
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الموظف: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م/ إسلام عبد العزيز، أحمد سعيد..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المسمى الوظيفي: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مهندس صيانة، فني شبكات..."
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف: <span className="text-rose-500">*</span>
                  </label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الراتب الأساسي: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    placeholder="0.00"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مدة الراتب: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.salary_cycle}
                    onChange={(e) => setFormData({ ...formData, salary_cycle: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="DAILY">يومي</option>
                    <option value="WEEKLY">أسبوعي</option>
                    <option value="MONTHLY">شهري</option>
                    <option value="YEARLY">سنوي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    القسم / الإدارة (اختياري):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: ورشة الصيانة، المتجر..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني (اختياري):
                  </label>
                  <input
                    type="email"
                    placeholder="emp@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    dir="ltr"
                  />
                </div>
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
      {/* MODAL: EMPLOYEE TRANSACTIONS / STATEMENT WITH DATE FILTERS */}
      {/* ======================================================== */}
      {selectedEmployeeForStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  <span>سجل المعاملات المالية للموظف: {selectedEmployeeForStatement.name}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  الوظيفة: {selectedEmployeeForStatement.job_title} • الراتب الأساسي: {selectedEmployeeForStatement.base_salary.toLocaleString()} ج.م ({getCycleLabel(selectedEmployeeForStatement.salary_cycle)}) • صافي المستحق: {selectedEmployeeForStatement.net_payable.toLocaleString()} ج.م
                </span>
              </div>
              <button 
                onClick={() => setSelectedEmployeeForStatement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Filter Bar for Employee Statement */}
            <div className="my-4 shrink-0">
              <DateFilterBar
                fromDate={txFromDate}
                toDate={txToDate}
                onFromDateChange={(d) => {
                  setTxFromDate(d);
                  fetchEmployeeTransactions(selectedEmployeeForStatement.id, d, txToDate);
                }}
                onToDateChange={(d) => {
                  setTxToDate(d);
                  fetchEmployeeTransactions(selectedEmployeeForStatement.id, txFromDate, d);
                }}
                activeShortcut={txShortcut}
                onShortcutSelect={(sc) => {
                  setTxShortcut(sc);
                }}
                onReset={() => fetchEmployeeTransactions(selectedEmployeeForStatement.id, '', '')}
                label="فلترة معاملات الموظف حسب الفترة:"
              />
            </div>

            {/* Statement Table */}
            <div className="flex-1 overflow-y-auto scrollbar-thin my-2">
              {loadingTransactions ? (
                <div className="p-8 text-center text-slate-400">جاري تحميل سجل المعاملات...</div>
              ) : employeeTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا توجد معاملات مسجلة لهذا الموظف في هذه الفترة.</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">رقم الحركة</th>
                      <th className="p-3">نوع المعاملة</th>
                      <th className="p-3 text-center text-emerald-600">حوافز وعمولات (+)</th>
                      <th className="p-3 text-center text-rose-600">سلف وخصومات (-)</th>
                      <th className="p-3 text-center text-cyan-600">صرف راتب</th>
                      <th className="p-3">طريقة الدفع</th>
                      <th className="p-3">البيان / ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employeeTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{tx.date?.slice(0, 10)}</td>
                        <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{tx.reference_no}</td>
                        <td className="p-3 font-bold">
                          {tx.transaction_type === 'COMMISSION' ? 'عمولة إنجاز / مبيعات' :
                           tx.transaction_type === 'BONUS' ? 'مكافأة تشجيعية' :
                           tx.transaction_type === 'ADVANCE' ? 'سلفة نقدية' :
                           tx.transaction_type === 'DEDUCTION' ? 'خصم / جزاء' :
                           tx.transaction_type === 'SALARY_PAYMENT' ? 'صرف راتب' : tx.transaction_type}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600">
                          {tx.flow === 'INCENTIVE' ? `+${Number(tx.amount).toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-rose-600">
                          {tx.flow === 'DEDUCTION' ? `-${Number(tx.amount).toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-cyan-600">
                          {tx.flow === 'PAYOUT' ? `${Number(tx.amount).toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                          {tx.payment_method === 'CASH' ? 'نقدي' : tx.payment_method}
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{tx.notes || '—'}</td>
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
                    const headers = ['التاريخ', 'رقم الحركة', 'نوع المعاملة', 'المبلغ', 'الاتجاه', 'طريقة الدفع', 'البيان'];
                    const rows = employeeTransactions.map(tx => [
                      tx.date?.slice(0, 10),
                      tx.reference_no,
                      tx.transaction_type,
                      tx.amount,
                      tx.flow === 'INCENTIVE' ? 'حافز/عمولة (+)' : (tx.flow === 'DEDUCTION' ? 'سلفة/خصم (-)' : 'صرف راتب'),
                      tx.payment_method,
                      tx.notes || ''
                    ]);
                    exportToExcel(`معاملات_الموظف_${selectedEmployeeForStatement.name}`, headers, rows);
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
                      <h3>سجل معاملات الموظف: ${selectedEmployeeForStatement.name}</h3>
                      <p>المسمى الوظيفي: ${selectedEmployeeForStatement.job_title} | الراتب الأساسي: ${selectedEmployeeForStatement.base_salary.toLocaleString()} ج.م | صافي المستحق: ${selectedEmployeeForStatement.net_payable.toLocaleString()} ج.م</p>
                      <table style="width:100%; border-collapse:collapse; text-align:right;">
                        <thead>
                          <tr style="background:#eee;">
                            <th style="padding:6px;border:1px solid #ccc;">التاريخ</th>
                            <th style="padding:6px;border:1px solid #ccc;">المرجع</th>
                            <th style="padding:6px;border:1px solid #ccc;">النوع</th>
                            <th style="padding:6px;border:1px solid #ccc;">حوافز وعمولات</th>
                            <th style="padding:6px;border:1px solid #ccc;">سلف وخصومات</th>
                            <th style="padding:6px;border:1px solid #ccc;">صرف راتب</th>
                            <th style="padding:6px;border:1px solid #ccc;">البيان</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${employeeTransactions.map(t => `
                            <tr>
                              <td style="padding:6px;border:1px solid #ddd;">${t.date?.slice(0, 10)}</td>
                              <td style="padding:6px;border:1px solid #ddd;">${t.reference_no}</td>
                              <td style="padding:6px;border:1px solid #ddd;">${t.transaction_type}</td>
                              <td style="padding:6px;border:1px solid #ddd;color:#10b981;">${t.flow === 'INCENTIVE' ? `+${Number(t.amount).toLocaleString()} ج.م` : '—'}</td>
                              <td style="padding:6px;border:1px solid #ddd;color:#e11d48;">${t.flow === 'DEDUCTION' ? `-${Number(t.amount).toLocaleString()} ج.م` : '—'}</td>
                              <td style="padding:6px;border:1px solid #ddd;color:#0284c7;">${t.flow === 'PAYOUT' ? `${Number(t.amount).toLocaleString()} ج.م` : '—'}</td>
                              <td style="padding:6px;border:1px solid #ddd;">${t.notes || '—'}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `;
                    printTableOrReceipt(`سجل معاملات - ${selectedEmployeeForStatement.name}`, html);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                  title="طباعة كشف المعاملات"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployeeForStatement(null)}
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
