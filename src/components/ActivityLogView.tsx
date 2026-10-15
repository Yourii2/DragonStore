import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Printer, 
  FileSpreadsheet, 
  FileDown, 
  User, 
  Calendar, 
  Layers, 
  ShieldAlert, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';

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

export const ActivityLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [usersList, setUsersList] = useState<string[]>([]);
  const [modulesList, setModulesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [shortcut, setShortcut] = useState<DateShortcut>('ALL');

  // Fetch users for filter dropdown
  const loadFilterOptions = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const names = data.data.map((u: any) => u.full_name);
        setUsersList(Array.from(new Set(names)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/api/audit-logs?';
      if (selectedUser !== 'ALL') url += `&user=${encodeURIComponent(selectedUser)}`;
      if (selectedModule !== 'ALL') url += `&module=${encodeURIComponent(selectedModule)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);

        // Extract modules
        const mods = data.data.map((l: any) => l.module).filter(Boolean);
        setModulesList(Array.from(new Set(mods)));
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, selectedModule, fromDate, toDate]);

  // Client-side text search
  const filteredLogs = logs.filter(l =>
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
            <History className="w-6 h-6" />
            <span>سجل الحركات العام للنظام</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل رقابي شامل لجميع العمليات والحركات التي قام بها المستخدمون على مستوى البرنامج مع إمكانية الفلترة والتصدير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const headers = ['#', 'التاريخ والوقت', 'المستخدم', 'نوع الحركة', 'القسم / الشاشة', 'تفاصيل الحركة'];
              const rows = filteredLogs.map((l, i) => [
                i + 1,
                new Date(l.created_at).toLocaleString('ar-EG'),
                l.user,
                l.action,
                l.module,
                l.details
              ]);
              exportToExcel('سجل_حركات_النظام_العام', headers, rows);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors"
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
                      <th>التاريخ والوقت</th>
                      <th>المستخدم</th>
                      <th>نوع الحركة</th>
                      <th>القسم</th>
                      <th>تفاصيل الحركة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredLogs.map((l, i) => `
                      <tr>
                        <td style="text-align: center;">${i + 1}</td>
                        <td style="text-align: center;">${new Date(l.created_at).toLocaleString('ar-EG')}</td>
                        <td><strong>${l.user}</strong></td>
                        <td style="text-align: center;">${l.action}</td>
                        <td>${l.module}</td>
                        <td>${l.details}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `;
              printTableOrReceipt('سجل حركات النظام العام', tableHtml);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في تفاصيل الحركة، المستخدم، نوع الإجراء..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs focus:outline-none focus:border-cyan-500 font-bold"
            />
          </div>

          {/* User Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <User className="w-4 h-4 text-slate-400" />
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">جميع المستخدمين</option>
              {usersList.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">جميع الأقسام والشاشات</option>
              {modulesList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Bar */}
        <DateFilterBar
          activeShortcut={shortcut}
          fromDate={fromDate}
          toDate={toDate}
          onShortcutSelect={setShortcut}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
        />
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 font-black text-xs text-slate-700 dark:text-slate-300">
            <ShieldAlert className="w-4 h-4 text-cyan-500" />
            <span>عرض الحركات المسجلة ({filteredLogs.length} حركة)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">التاريخ والوقت</th>
                <th className="p-4">المستخدم</th>
                <th className="p-4">نوع الحركة</th>
                <th className="p-4">القسم / الشاشة</th>
                <th className="p-4">تفاصيل الحركة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    جارٍ تحميل سجل الحركات...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    لا توجد حركات مطابقة لمعايير البحث والفترة الزمنية المحددة
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l, idx) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-slate-100">
                      {l.user}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                      {l.module}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
