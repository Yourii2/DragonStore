import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Printer, 
  FileSpreadsheet, 
  FileDown, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  ShieldCheck, 
  Key, 
  Lock, 
  UserCheck, 
  CheckCircle2, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';
import SearchableSelect from './SearchableSelect';
import { showSuccess, showError, showWarning, showConfirm, showToast } from '../utils/swal';

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  role_title_ar: string;
  is_active: number;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  table_name: string;
  details: string;
  created_at: string;
}

const USER_ROLES = [
  { value: 'SUPER_ADMIN', label: 'المدير العام والمالك (كل الصلاحيات)' },
  { value: 'ADMIN', label: 'مدير فرع / مدير إداري' },
  { value: 'CASHIER', label: 'كاشير ومبيعات' },
  { value: 'WAREHOUSE_KEEPER', label: 'أمين مخزن' },
  { value: 'ACCOUNTANT', label: 'محاسب مالي' },
  { value: 'STAFF', label: 'موظف عادي' }
];

interface UsersManagementViewProps {
  onNavigateToUserLogs?: (username: string) => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ onNavigateToUserLogs }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'STAFF',
    role_title_ar: 'موظف'
  });

  // User Actions statement modal (Eye Icon)
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<UserRecord | null>(null);
  const [userLogs, setUserLogs] = useState<AuditLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFromDate, setLogFromDate] = useState('');
  const [logToDate, setLogToDate] = useState('');
  const [logShortcut, setLogShortcut] = useState<DateShortcut>('ALL');

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role_title_ar && u.role_title_ar.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Open Add Modal
  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'STAFF',
      role_title_ar: 'موظف'
    });
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setFormData({
      full_name: u.full_name,
      username: u.username,
      password: '',
      confirmPassword: '',
      role: u.role,
      role_title_ar: u.role_title_ar || 'موظف'
    });
    setShowAddEditModal(true);
  };

  // Save User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال اسم المستخدم الذي يظهر على النظام');
      return;
    }
    if (!formData.username.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال اسم تسجيل الدخول');
      return;
    }

    if (!editingUser) {
      if (!formData.password) {
        showWarning('بيانات غير مكتملة', 'يرجى إدخال كلمة السر للمستخدم الجديد');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showWarning('خطأ في كلمة المرور', 'كلمة السر وتأكيد كلمة السر غير متطابقين!');
        return;
      }
    } else {
      if (formData.password && formData.password !== formData.confirmPassword) {
        showWarning('خطأ في كلمة المرور', 'كلمة السر وتأكيد كلمة السر غير متطابقين!');
        return;
      }
    }

    try {
      const payload = {
        id: editingUser ? editingUser.id : undefined,
        full_name: formData.full_name.trim(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password || undefined,
        role: formData.role,
        role_title_ar: formData.role_title_ar
      };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddEditModal(false);
        showToast(editingUser ? 'تم تحديث بيانات المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح');
        await fetchUsers();
      } else {
        showError('فشل الحفظ', data.message || 'فشل حفظ بيانات المستخدم');
      }
    } catch (err: any) {
      showError('خطأ في الاتصال بالخادم', err.message);
    }
  };

  // Delete User
  const handleDeleteUser = async (u: UserRecord) => {
    if (u.role === 'SUPER_ADMIN') {
      const superAdmins = users.filter(x => x.role === 'SUPER_ADMIN');
      if (superAdmins.length <= 1) {
        showWarning('إجراء غير مسموح', 'لا يمكن حذف حساب المدير العام الرئيسي للنظام!');
        return;
      }
    }

    const confirmed = await showConfirm(
      'تأكيد حذف المستخدم',
      `هل أنت متأكد من حذف المستخدم (${u.full_name} - ${u.username}) نهائياً؟`,
      { isDanger: true, confirmText: 'نعم، حذف المستخدم', cancelText: 'إلغاء' }
    );
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم حذف المستخدم بنجاح');
        await fetchUsers();
      } else {
        showError('فشل الحذف', data.message || 'فشل حذف المستخدم');
      }
    } catch (err: any) {
      showError('خطأ أثناء الحذف', err.message);
    }
  };

  // Fetch User Activity Logs (Eye button)
  const fetchUserLogs = async (user: UserRecord, from = logFromDate, to = logToDate) => {
    setLoadingLogs(true);
    try {
      let url = `/api/audit-logs?user=${encodeURIComponent(user.full_name)}`;
      if (from) url += `&fromDate=${from}`;
      if (to) url += `&toDate=${to}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUserLogs(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenUserLogs = (u: UserRecord) => {
    setSelectedUserForLogs(u);
    setLogFromDate('');
    setLogToDate('');
    setLogShortcut('ALL');
    fetchUserLogs(u, '', '');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
            <Users className="w-6 h-6" />
            <span>إدارة المستخدمين</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة حسابات الدخول، بيانات المستخدمين، أنواع الحسابات، ومتابعة سجل نشاط كل مستخدم
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، اسم تسجيل الدخول، أو المسمى..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs focus:outline-none focus:border-cyan-500 font-bold"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <SearchableSelect
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">جميع أنواع المستخدمين</option>
              {USER_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </SearchableSelect>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 font-black text-xs text-slate-700 dark:text-slate-300">
            <UserCheck className="w-4 h-4 text-cyan-500" />
            <span>قائمة المستخدمين المسجلين بالبرنامج ({filteredUsers.length} مستخدم)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const headers = ['#', 'الاسم الذي يظهر', 'اسم تسجيل الدخول', 'نوع المستخدم', 'الحالة', 'تاريخ الإنشاء'];
                const rows = filteredUsers.map((u, i) => [
                  i + 1,
                  u.full_name,
                  u.username,
                  u.role_title_ar || u.role,
                  u.is_active ? 'نشط' : 'معطل',
                  new Date(u.created_at).toLocaleDateString('ar-EG')
                ]);
                exportToExcel('قائمة_مستخدمي_النظام', headers, rows);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير Excel</span>
            </button>
            <button
              onClick={() => {
                const tableHtml = `
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #0891b2; color: #fff;">
                        <th>#</th>
                        <th>اسم المستخدم</th>
                        <th>اسم تسجيل الدخول</th>
                        <th>نوع المستخدم</th>
                        <th>الحالة</th>
                        <th>تاريخ الإنشاء</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredUsers.map((u, i) => `
                        <tr>
                          <td style="text-align: center;">${i + 1}</td>
                          <td><strong>${u.full_name}</strong></td>
                          <td style="text-align: center; font-family: monospace;">${u.username}</td>
                          <td>${u.role_title_ar || u.role}</td>
                          <td style="text-align: center;">${u.is_active ? 'نشط' : 'معطل'}</td>
                          <td style="text-align: center;">${new Date(u.created_at).toLocaleDateString('ar-EG')}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `;
                printTableOrReceipt('تقرير مستخدمي نظام دراغون', tableHtml);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">اسم المستخدم الذي يظهر</th>
                <th className="p-4">اسم تسجيل الدخول</th>
                <th className="p-4">نوع المستخدم</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4">تاريخ الإنشاء</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا يوجد مستخدمون مطابقون لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-sm">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 text-xs">
                        {u.username}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : u.role === 'ADMIN'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {u.role_title_ar || u.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        نشط
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. عرض سجل حركات المستخدم (العين) */}
                        <button
                          onClick={() => handleOpenUserLogs(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-100 cursor-pointer transition-colors"
                          title="عرض سجل حركات هذا المستخدم"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>سجل الحركات</span>
                        </button>

                        {/* 2. تعديل بيانات المستخدم */}
                        <button
                          onClick={() => openEditModal(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-100 cursor-pointer transition-colors"
                          title="تعديل المستخدم"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        {/* 3. حذف المستخدم */}
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-100 cursor-pointer transition-colors"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
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

      {/* ========================================================================= */}
      {/* MODAL 1: Add or Edit User */}
      {/* ========================================================================= */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fadeIn relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-500" />
                <span>{editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</span>
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              {/* 1. اسم المستخدم الذي يظهر على النظام */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المستخدم الذي يظهر على النظام: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد عبد الله، ممدوح، محمد..."
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 2. اسم تسجيل الدخول */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم تسجيل الدخول: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="username (مثال: ahmed, admin, cashier1)"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 3. كلمة السر */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة السر: {editingUser ? '(اتركها فارغة إذا لم ترغب بتغييرها)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 4. تأكيد كلمة السر */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تأكيد كلمة السر: {editingUser ? '(إذا قمت بكتابة كلمة سر جديدة)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser || Boolean(formData.password)}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 5. نوع المستخدم */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع المستخدم: *
                </label>
                <SearchableSelect
                  value={formData.role}
                  onChange={e => {
                    const selected = USER_ROLES.find(r => r.value === e.target.value);
                    setFormData({
                      ...formData,
                      role: e.target.value,
                      role_title_ar: selected ? selected.label.split('(')[0].trim() : 'موظف'
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {USER_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </SearchableSelect>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
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
                  {editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: User Activity Statement Modal (Eye Icon) */}
      {/* ========================================================================= */}
      {selectedUserForLogs && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl animate-fadeIn relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-500" />
                  <span>سجل حركات ونشاط المستخدم: {selectedUserForLogs.full_name}</span>
                </h3>
                <span className="text-xs text-slate-500">
                  اسم الدخول: {selectedUserForLogs.username} • نوع الحساب: {selectedUserForLogs.role_title_ar} • عدد العمليات: {userLogs.length}
                </span>
              </div>
              <button 
                onClick={() => setSelectedUserForLogs(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Filter Bar */}
            <div className="py-3 shrink-0">
              <DateFilterBar
                activeShortcut={logShortcut}
                fromDate={logFromDate}
                toDate={logToDate}
                onShortcutSelect={(sc) => {
                  setLogShortcut(sc);
                  const today = new Date();
                  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
                  let f = '';
                  let t = '';
                  if (sc === 'TODAY') {
                    f = t = formatDate(today);
                  } else if (sc === 'THIS_MONTH') {
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    f = formatDate(firstDay);
                    t = formatDate(today);
                  } else if (sc === 'THIS_YEAR') {
                    f = `${today.getFullYear()}-01-01`;
                    t = formatDate(today);
                  }
                  setLogFromDate(f);
                  setLogToDate(t);
                  fetchUserLogs(selectedUserForLogs, f, t);
                }}
                onFromDateChange={(d) => {
                  setLogFromDate(d);
                  fetchUserLogs(selectedUserForLogs, d, logToDate);
                }}
                onToDateChange={(d) => {
                  setLogToDate(d);
                  fetchUserLogs(selectedUserForLogs, logFromDate, d);
                }}
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              {loadingLogs ? (
                <div className="p-8 text-center text-slate-400">جارٍ تحميل الحركات...</div>
              ) : userLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا توجد حركات مسجلة لهذا المستخدم في الفترة المحددة</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">التاريخ والوقت</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3">القسم / الشاشة</th>
                      <th className="p-3">تفاصيل الحركة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {userLogs.map((log, idx) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {log.module}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['#', 'التاريخ والوقت', 'نوع الحركة', 'القسم', 'التفاصيل'];
                    const rows = userLogs.map((l, i) => [
                      i + 1,
                      new Date(l.created_at).toLocaleString('ar-EG'),
                      l.action,
                      l.module,
                      l.details
                    ]);
                    exportToExcel(`سجل_حركات_${selectedUserForLogs.full_name}`, headers, rows);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصدير Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tableHtml = `
                      <div style="font-family: 'Cairo', sans-serif; padding: 10px;">
                        <h2 style="color: #0891b2;">سجل حركات ونشاط المستخدم: ${selectedUserForLogs.full_name}</h2>
                        <p>اسم الدخول: ${selectedUserForLogs.username} | نوع الحساب: ${selectedUserForLogs.role_title_ar}</p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                          <thead>
                            <tr style="background-color: #0891b2; color: #fff;">
                              <th style="padding: 6px; border: 1px solid #ccc;">#</th>
                              <th style="padding: 6px; border: 1px solid #ccc;">التاريخ والوقت</th>
                              <th style="padding: 6px; border: 1px solid #ccc;">الحركة</th>
                              <th style="padding: 6px; border: 1px solid #ccc;">القسم</th>
                              <th style="padding: 6px; border: 1px solid #ccc;">التفاصيل</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${userLogs.map((l, i) => `
                              <tr>
                                <td style="text-align: center; padding: 6px; border: 1px solid #ccc;">${i + 1}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${new Date(l.created_at).toLocaleString('ar-EG')}</td>
                                <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold;">${l.action}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${l.module}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${l.details}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </div>
                    `;
                    printTableOrReceipt(`سجل_حركات_${selectedUserForLogs.full_name}`, tableHtml);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة السجل</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedUserForLogs(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
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
