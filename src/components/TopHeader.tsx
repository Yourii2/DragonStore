import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Menu, 
  X, 
  Database, 
  RefreshCcw, 
  FileDown, 
  Package, 
  CreditCard, 
  ChevronLeft, 
  CheckCheck, 
  ExternalLink,
  Plus,
  Warehouse,
  Code2,
  Boxes,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Radio,
  Wifi
} from 'lucide-react';
import { CurrentUser } from '../store/systemAuthStore';
import { alertsStore, SystemAlert, AlertCategory } from '../store/alertsStore';

interface TopHeaderProps {
  currentUser: CurrentUser;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onLogout: () => void;
  onReinstall: () => void;
  onOpenExport: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  isDarkMode,
  setIsDarkMode,
  searchQuery,
  setSearchQuery,
  onLogout,
  onReinstall,
  onOpenExport,
  onToggleSidebar,
  isSidebarOpen,
  onNavigateTab
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>(alertsStore.getAlerts());
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'LOW_STOCK' | 'OVERDUE_MILESTONE'>('ALL');
  const [floatingToast, setFloatingToast] = useState<SystemAlert | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(alertsStore.getIsConnected());
  const [lastSync, setLastSync] = useState(alertsStore.getLastSyncTime());

  const notifContainerRef = useRef<HTMLDivElement>(null);
  const userMenuContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to reactive alertsStore state updates (SSE / Polling)
  useEffect(() => {
    const unsubscribe = alertsStore.subscribe(() => {
      const updated = alertsStore.getAlerts();
      setAlerts(updated);
      setIsConnected(alertsStore.getIsConnected());
      setLastSync(alertsStore.getLastSyncTime());

      // Check if there is a fresh unread alert to display in floating toast
      const latestUnread = updated.find(a => !a.isRead && (a.category === 'LOW_STOCK' || a.category === 'OVERDUE_MILESTONE'));
      if (latestUnread && !showNotifications) {
        setFloatingToast(latestUnread);
      }
    });

    return () => unsubscribe();
  }, [showNotifications]);

  // Handle clicking outside of dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuContainerRef.current && !userMenuContainerRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alertsStore.getUnreadCount();
  const lowStockCount = alertsStore.getLowStockCount();
  const overdueCount = alertsStore.getOverdueMilestonesCount();

  // Filter list
  const filteredAlerts = alerts.filter(a => {
    if (filterCategory === 'ALL') return true;
    return a.category === filterCategory;
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await alertsStore.fetchAlertsFromBackend();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleMarkAllRead = () => {
    alertsStore.markAllAsRead();
    setFloatingToast(null);
  };

  const handleAlertClick = (alert: SystemAlert) => {
    alertsStore.markAsRead(alert.id);
    setShowNotifications(false);
    setFloatingToast(null);
    if (onNavigateTab && alert.targetTab) {
      onNavigateTab(alert.targetTab);
    }
  };

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b backdrop-blur-xl ${
      isDarkMode 
        ? 'bg-slate-900/80 border-slate-800/80 text-slate-100 shadow-sm' 
        : 'bg-white/80 border-slate-200/80 text-slate-800 shadow-xs'
    }`} dir="rtl">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* Right: Sidebar Toggle Button + Quick Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 border-slate-700/60 hover:border-cyan-500/40' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={isSidebarOpen ? 'إخفاء القائمة الجانبية' : 'إظهار القائمة الجانبية'}
            >
              {isSidebarOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Application Title in Header for clarity when sidebar is collapsed */}
            <div className="flex items-center gap-2">
              <img 
                src="/dragon-logo.png" 
                alt="Dragon Logo" 
                className="w-7 h-7 object-contain drop-shadow"
              />
              <span className="text-xs sm:text-sm font-black tracking-tight bg-gradient-to-l from-cyan-400 to-blue-500 bg-clip-text text-transparent hidden sm:inline-block">
                متجر دراجون للاليكترونيات و الاعمال الحره
              </span>
            </div>

            {/* Quick Search Bar */}
            <div className="relative hidden md:flex items-center w-60 lg:w-72 mr-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث سريع في النظام..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl pr-8 pl-3 py-1.5 text-xs transition-all focus:outline-none focus:ring-1 border ${
                  isDarkMode 
                    ? 'bg-slate-950/60 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-cyan-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Left: Actions, Theme Switcher, Notifications & User Menu */}
          <div className="flex items-center gap-2">
            
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800/60 hover:bg-slate-700 text-amber-300 border-slate-700/60' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={isDarkMode ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* REAL-TIME NOTIFICATIONS POPPING BELL */}
            <div className="relative" ref={notifContainerRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                  setFloatingToast(null);
                }}
                className={`p-2 rounded-xl border relative transition-all cursor-pointer group ${
                  unreadCount > 0
                    ? isDarkMode
                      ? 'bg-slate-800 text-cyan-400 border-cyan-500/40 shadow-xs'
                      : 'bg-cyan-50 text-cyan-700 border-cyan-300 shadow-xs'
                    : isDarkMode 
                      ? 'bg-slate-800/60 hover:bg-slate-700 text-slate-200 border-slate-700/60' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="مركز التنبيهات"
              >
                <Bell className={`w-4 h-4 transition-transform duration-300 ${
                  unreadCount > 0 ? 'animate-bounce text-amber-400' : ''
                }`} />

                {/* Pulsating Red Unread Badge */}
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-rose-950/60 ring-2 ring-slate-900 animate-pulse">
                      {unreadCount}
                    </span>
                    <span className="absolute -top-1 -right-1 w-[19px] h-[19px] rounded-full bg-rose-500 animate-ping opacity-60 pointer-events-none" />
                  </>
                )}
              </button>

              {/* FLOATING TOAST POPUP */}
              {floatingToast && !showNotifications && (
                <div 
                  onClick={() => handleAlertClick(floatingToast)}
                  className={`absolute left-0 mt-3 w-80 sm:w-96 p-3.5 rounded-2xl border shadow-2xl z-50 cursor-pointer animate-fadeIn flex items-start gap-3 backdrop-blur-md ${
                    floatingToast.category === 'LOW_STOCK'
                      ? 'bg-amber-950/95 border-amber-500/60 text-amber-100 shadow-amber-950/80'
                      : 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-950/80'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold ${
                    floatingToast.category === 'LOW_STOCK'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {floatingToast.category === 'LOW_STOCK' ? <Package className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black truncate">{floatingToast.title}</span>
                      <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono font-bold">تنبيه فوري من MySQL</span>
                    </div>
                    <p className="text-[11px] opacity-90 mt-1 line-clamp-2 leading-relaxed">
                      {floatingToast.description}
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                      <span>انقر للانتقال واتخاذ الإجراء</span>
                      <ChevronLeft className="w-3 h-3" />
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloatingToast(null);
                    }}
                    className="text-slate-400 hover:text-white text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Notifications Dropdown Panel (Popping upon clicking the bell) */}
              {showNotifications && (
                <div className={`absolute left-0 mt-3 w-80 sm:w-[460px] rounded-3xl border shadow-2xl overflow-hidden z-50 animate-fadeIn ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/90' 
                    : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                }`}>
                  {/* Panel Header */}
                  <div className={`p-4 border-b ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-900/40">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black flex items-center gap-1.5">
                            <span>مستودع التنبيهات المباشر (MySQL Engine)</span>
                            {unreadCount > 0 && (
                              <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
                                {unreadCount} غير مقروء
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                            <span>SSE / Polling 6s • آخر تحديث: {lastSync}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                          title="تحديث يدوي فوري من MySQL"
                        >
                          <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>

                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer bg-cyan-950/40 px-2.5 py-1.5 rounded-lg border border-cyan-800/40 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>تحديد الكل</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metric Cards Banner */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-[11px] font-mono">
                      <div className={`p-2 rounded-xl border flex items-center justify-between ${
                        lowStockCount > 0 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-amber-400" />
                          <span>نواقص المخازن:</span>
                        </span>
                        <strong className="text-xs font-black">{lowStockCount} أصناف</strong>
                      </div>

                      <div className={`p-2 rounded-xl border flex items-center justify-between ${
                        overdueCount > 0 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 font-bold' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                          <span>دفعات برمجية:</span>
                        </span>
                        <strong className="text-xs font-black">{overdueCount} متأخرة</strong>
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs Strip */}
                  <div className={`px-4 py-2 border-b flex items-center gap-1.5 text-xs overflow-x-auto ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/60 border-slate-100'
                  }`}>
                    <button
                      onClick={() => setFilterCategory('ALL')}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        filterCategory === 'ALL'
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      جميع التنبيهات ({alerts.length})
                    </button>
                    <button
                      onClick={() => setFilterCategory('LOW_STOCK')}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        filterCategory === 'LOW_STOCK'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-amber-400'
                      }`}
                    >
                      <Package className="w-3 h-3" />
                      <span>نواقص المخازن ({alerts.filter(a => a.category === 'LOW_STOCK').length})</span>
                    </button>
                    <button
                      onClick={() => setFilterCategory('OVERDUE_MILESTONE')}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        filterCategory === 'OVERDUE_MILESTONE'
                          ? 'bg-rose-500 text-white font-black shadow-xs'
                          : 'text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>دفعات العمل الحر ({alerts.filter(a => a.category === 'OVERDUE_MILESTONE').length})</span>
                    </button>
                  </div>

                  {/* Alerts List */}
                  <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                    {filteredAlerts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70 mb-2" />
                        <div className="font-bold text-slate-200">لا توجد تنبيهات جديدة في هذا القسم!</div>
                        <div className="text-[10px]">كافة مستويات المخزون آمنة والدفعات البرمجية مسددة بانتظام</div>
                      </div>
                    ) : (
                      filteredAlerts.map((item) => {
                        const isStock = item.category === 'LOW_STOCK';
                        const isOverdue = item.category === 'OVERDUE_MILESTONE';
                        const isIsp = item.category === 'ISP_RENEWAL';

                        return (
                          <div 
                            key={item.id} 
                            onClick={() => handleAlertClick(item)}
                            className={`p-3.5 hover:bg-slate-500/5 transition-all flex items-start gap-3 cursor-pointer group relative ${
                              !item.isRead ? (isDarkMode ? 'bg-cyan-950/20' : 'bg-cyan-50/50') : ''
                            }`}
                          >
                            {/* Unread indicator dot */}
                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-cyan-500 absolute top-4 right-2 animate-ping" />
                            )}

                            {/* Category Icon Badge */}
                            <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold ${
                              isOverdue
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : isStock
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : isIsp
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isOverdue && <CreditCard className="w-4 h-4" />}
                              {isStock && <Package className="w-4 h-4" />}
                              {isIsp && <Clock className="w-4 h-4" />}
                              {!isOverdue && !isStock && !isIsp && <CheckCircle2 className="w-4 h-4" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black truncate text-slate-100 group-hover:text-cyan-400 transition-colors">
                                  {item.title}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                  {item.timeAgo}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                {item.description}
                              </p>

                              {/* Metadata Badges & Action Link */}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono">
                                {item.metadata.currentStock !== undefined && (
                                  <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md font-bold border border-amber-500/20 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    <span>المخزون: {item.metadata.currentStock} / الحد الأدنى: {item.metadata.minStock}</span>
                                  </span>
                                )}
                                {item.metadata.amount !== undefined && (
                                  <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-md font-bold border border-rose-500/20">
                                    المستحق: {item.metadata.amount.toLocaleString()} ج.م
                                  </span>
                                )}
                                {item.actionLabel && (
                                  <span className="text-cyan-400 font-bold flex items-center gap-0.5 mr-auto group-hover:underline">
                                    <span>{item.actionLabel}</span>
                                    <ChevronLeft className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer with Live Triggers for MySQL Simulation */}
                  <div className={`p-3 border-t flex flex-wrap items-center justify-between gap-2 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alertsStore.simulateRandomLowStockAlert()}
                        className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1 font-bold transition-all cursor-pointer"
                        title="محاكاة نزول كمية صنف بالمخزن عن حد الأمان وإرسالها للباك إند"
                      >
                        <Package className="w-3 h-3" />
                        <span>+ محاكاة عجز مخزني</span>
                      </button>

                      <button
                        onClick={() => alertsStore.simulateRandomOverdueMilestoneAlert()}
                        className="text-[10px] text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1 font-bold transition-all cursor-pointer"
                        title="محاكاة تأخر دفعة مشروع برمجي وإرسالها للباك إند"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>+ محاكاة دفعة متأخرة</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      <span>MySQL Engine Live</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Card & Menu */}
            <div className="relative" ref={userMenuContainerRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700' 
                    : 'bg-slate-100 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl ${currentUser.avatarColor || 'bg-cyan-600'} text-white font-bold flex items-center justify-center text-xs shadow-md`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-extrabold truncate max-w-[130px] leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-cyan-500 font-bold flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{currentUser.roleTitleAr}</span>
                  </div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className={`absolute left-0 mt-3 w-64 rounded-2xl border shadow-2xl p-2 z-50 animate-fadeIn ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className={`p-3 rounded-xl mb-1 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="text-xs font-black">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{currentUser.email}</div>
                    <div className="text-[10px] text-cyan-500 font-bold mt-1">
                      الصلاحية: {currentUser.role}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onReinstall();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-amber-500" />
                    <span>إعادة تشغيل معالج التثبيت</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-rose-500 ${
                      isDarkMode ? 'hover:bg-rose-950/30' : 'hover:bg-rose-50'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج من النظام</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
