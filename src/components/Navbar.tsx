import React from 'react';
import { 
  Building2, 
  Layers, 
  Database, 
  FileDown, 
  Search,
  Activity,
  Play,
  ShoppingCart,
  Wrench,
  Code2,
  Landmark,
  FileSpreadsheet,
  LogOut,
  User,
  Shield
} from 'lucide-react';
import { CurrentUser } from '../store/systemAuthStore';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenExport: () => void;
  currentUser?: CurrentUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenExport,
  currentUser,
  onLogout
}) => {
  const navItems = [
    { id: 'dashboard', label: 'لوحة القيادة المزدوجة', icon: Activity },
    { id: 'pos', label: 'نقطة البيع والمبيعات (POS)', icon: ShoppingCart },
    { id: 'services', label: 'الصيانة والشبكات و ISP', icon: Wrench },
    { id: 'freelance', label: 'البرمجيات والعمل الحر', icon: Code2 },
    { id: 'treasury', label: 'الخزينة والمصروفات المشتركة', icon: Landmark },
    { id: 'accounting', label: 'الحسابات والقوائم (P&L)', icon: FileSpreadsheet },
    { id: 'scenarios', label: 'محاكي الـ 15 اختباراً', icon: Play },
    { id: 'architecture', label: 'مصفوفة الـ 38 وحدة', icon: Layers },
    { id: 'database', label: 'قاعدة بيانات MySQL (55 DDL)', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-100 tracking-tight">منظومة الإدارة المحاسبية والتشغيلية المزدوجة</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  MySQL 8.0+ Core
                </span>
              </div>
              <p className="text-xs text-slate-400">متجر الحواسيب والشبكات (BU 1) + تطوير البرمجيات والعمل الحر (BU 2)</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden lg:flex items-center relative w-60">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث في الوحدات والعمليات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-700/70 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Actions & User Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenExport}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>تصدير الوثيقة</span>
            </button>

            {/* Current User Badge & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-r border-slate-800 pr-2">
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor || 'bg-cyan-600'} flex items-center justify-center text-white text-xs font-bold`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{currentUser.name}</div>
                    <div className="text-[10px] text-cyan-400 font-medium flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" />
                      <span>{currentUser.roleTitleAr}</span>
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="تسجيل الخروج"
                    className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 space-x-reverse overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
