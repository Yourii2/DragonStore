import React from 'react';
import { Calendar, X } from 'lucide-react';

export type DateShortcut = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR';

interface DateFilterBarProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  activeShortcut?: DateShortcut;
  onShortcutSelect?: (shortcut: DateShortcut) => void;
  onReset?: () => void;
  label?: string;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  activeShortcut = 'ALL',
  onShortcutSelect,
  onReset,
  label = 'فلترة الفترة الزمنية:'
}) => {
  const handleShortcutClick = (shortcut: DateShortcut) => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (shortcut === 'ALL') {
      onFromDateChange('');
      onToDateChange('');
    } else if (shortcut === 'TODAY') {
      const dStr = formatDate(today);
      onFromDateChange(dStr);
      onToDateChange(dStr);
    } else if (shortcut === 'THIS_WEEK') {
      const day = today.getDay(); // 0 is Sunday, 6 is Saturday
      // Egyptian week typically starts Saturday
      const diffToSaturday = (day + 1) % 7;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diffToSaturday);
      onFromDateChange(formatDate(startOfWeek));
      onToDateChange(formatDate(today));
    } else if (shortcut === 'THIS_MONTH') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      onFromDateChange(formatDate(startOfMonth));
      onToDateChange(formatDate(today));
    } else if (shortcut === 'THIS_YEAR') {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      onFromDateChange(formatDate(startOfYear));
      onToDateChange(formatDate(today));
    }

    if (onShortcutSelect) {
      onShortcutSelect(shortcut);
    }
  };

  const shortcuts: { id: DateShortcut; label: string }[] = [
    { id: 'ALL', label: 'الكل' },
    { id: 'TODAY', label: 'اليوم' },
    { id: 'THIS_WEEK', label: 'هذا الأسبوع' },
    { id: 'THIS_MONTH', label: 'هذا الشهر' },
    { id: 'THIS_YEAR', label: 'هذا العام' }
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Date Pickers */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
          <Calendar className="w-4 h-4 text-cyan-500" />
          <span>{label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">من:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">إلى:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {(fromDate || toDate) && (
          <button
            type="button"
            onClick={() => {
              onFromDateChange('');
              onToDateChange('');
              if (onReset) onReset();
              if (onShortcutSelect) onShortcutSelect('ALL');
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="إلغاء فلترة التاريخ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Preset Quick Shortcuts */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {shortcuts.map((sc) => {
          const isActive = activeShortcut === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleShortcutClick(sc.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sc.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
