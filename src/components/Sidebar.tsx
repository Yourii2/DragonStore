import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Package, 
  Users, 
  Truck, 
  UserCheck, 
  ShoppingCart, 
  FileSpreadsheet, 
  Landmark, 
  ArrowLeftRight, 
  ShieldCheck, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronLeft,
  Warehouse,
  Tags,
  Receipt,
  CircleDollarSign,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Key,
  History,
  Radio,
  Building,
  CheckCircle,
  Download,
  TrendingUp,
  FileText,
  Wifi,
  Printer,
  Wrench,
  Code,
  Boxes,
  Globe
} from 'lucide-react';

interface SubMenuItem {
  id: string;
  label: string;
  icon?: any;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  isDropdown?: boolean;
  children?: SubMenuItem[];
}

import { CurrentUser, hasPermission } from '../store/systemAuthStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onLogout: () => void;
  currentUser?: CurrentUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  isDarkMode,
  onLogout,
  currentUser
}) => {
  const [showNetworkPage, setShowNetworkPage] = useState<boolean>(false);
  const [showSoftwareFeatures, setShowSoftwareFeatures] = useState<boolean>(true);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const res = await fetch('/api/settings/company');
        const data = await res.json();
        if (data.success && data.data) {
          setShowNetworkPage(Boolean(data.data.show_network_page));
          if (data.data.show_software_features !== undefined) {
            setShowSoftwareFeatures(Boolean(data.data.show_software_features));
          }
        }
      } catch (e) {
        console.error('Failed to load company profile for sidebar', e);
      }
    };
    fetchCompanyProfile();

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        if (typeof e.detail.show_network_page === 'boolean') {
          setShowNetworkPage(e.detail.show_network_page);
        }
        if (typeof e.detail.show_software_features === 'boolean') {
          setShowSoftwareFeatures(e.detail.show_software_features);
        }
      } else {
        fetchCompanyProfile();
      }
    };

    window.addEventListener('company-settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('company-settings-updated', handleSettingsUpdated);
    };
  }, [activeTab]);

  // Navigation structure requested by user with collapsible dropdowns
  const salesChildren: SubMenuItem[] = [
    { id: 'sales_pos', label: 'اداره المبيعات', icon: ShoppingCart },
    { id: 'quotations', label: 'عروض الاسعار', icon: FileText }
  ];

  if (showNetworkPage) {
    salesChildren.push({ id: 'network_page', label: 'الشبكه', icon: Wifi });
  }

  const reportsChildren: SubMenuItem[] = [
    { id: 'reports_sales', label: 'تقرير المبيعات والارباح', icon: Receipt },
    { id: 'reports_physical', label: 'تقرير مبيعات السلع المادية', icon: Boxes },
    { id: 'reports_maintenance', label: 'تقرير أرباح الصيانة', icon: Wrench },
    ...(showSoftwareFeatures ? [{ id: 'reports_software', label: 'تقرير مبيعات البرمجيات', icon: Code }] : []),
    ...(showNetworkPage ? [{ id: 'reports_network', label: 'تقرير أرباح وخسائر الشبكة', icon: Globe }] : []),
    { id: 'reports_inventory', label: 'تقرير تقييم المخزون والنواقص', icon: Warehouse },
    { id: 'reports_treasury', label: 'تقرير حركات الخزائن والسيوله', icon: Coins },
    { id: 'reports_customers', label: 'تقرير ارصده العملاء والديون', icon: Users },
    { id: 'reports_suppliers', label: 'تقرير ارصده ومستحقات الموردين', icon: Truck },
    { id: 'reports_expenses', label: 'تقرير سجل وتحليل المصروفات', icon: CircleDollarSign },
    { id: 'reports_pnl', label: 'قائمه الارباح والخسائر (P&L)', icon: TrendingUp }
  ];

  const menuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      label: 'الصفحه الرئيسيه', 
      icon: Home, 
      isDropdown: false 
    },
    { 
      id: 'products_group', 
      label: 'اداره المنتجات', 
      icon: Package, 
      isDropdown: true,
      children: [
        { id: 'warehouses', label: 'اداره المخازن', icon: Warehouse },
        { id: 'categories', label: 'اداه التصنيفات', icon: Tags },
        { id: 'products', label: 'اداره المنتجات', icon: Package }
      ]
    },
    { 
      id: 'customers_group', 
      label: 'اداره العملاء', 
      icon: Users, 
      isDropdown: true,
      children: [
        { id: 'customers', label: 'اداره العملاء', icon: Users },
        { id: 'customer_transactions', label: 'معاملات العملاء', icon: Receipt }
      ]
    },
    { 
      id: 'suppliers_group', 
      label: 'اداره الموردين', 
      icon: Truck, 
      isDropdown: true,
      children: [
        { id: 'suppliers', label: 'اداره الموردين', icon: Truck },
        { id: 'supplier_transactions', label: 'معاملات الموردين', icon: Receipt }
      ]
    },
    { 
      id: 'employees_group', 
      label: 'اداره الموظفين', 
      icon: UserCheck, 
      isDropdown: true,
      children: [
        { id: 'employees', label: 'اداره الموظفين', icon: UserCheck },
        { id: 'employee_transactions', label: 'معاملات الموظفين', icon: CircleDollarSign }
      ]
    },
    { 
      id: 'sales_group', 
      label: 'اداره المبيعات', 
      icon: ShoppingCart, 
      isDropdown: true,
      children: salesChildren
    },
    { 
      id: 'reports_group', 
      label: 'اداره تقارير', 
      icon: FileSpreadsheet, 
      isDropdown: true,
      children: reportsChildren
    },
    { 
      id: 'finance_group', 
      label: 'اداره الماليات', 
      icon: Landmark, 
      isDropdown: true,
      children: [
        { id: 'treasury', label: 'اداره الخزائن', icon: Landmark },
        { id: 'financial_transactions', label: 'المعاملات الماليه', icon: Coins },
        { id: 'finance', label: 'الماليات', icon: CircleDollarSign }
      ]
    },
    { 
      id: 'stock_movement_group', 
      label: 'حركه المخزون', 
      icon: ArrowLeftRight, 
      isDropdown: true,
      children: [
        { id: 'stock_in', label: 'استلام بضائع من مورد', icon: ArrowDownLeft },
        { id: 'stock_return', label: 'ارتجاع بضائع الى مورد', icon: ArrowUpRight },
        { id: 'stock_transfer', label: 'نقل من مخزن الى اخر', icon: RefreshCw }
      ]
    },
    { 
      id: 'users_group', 
      label: 'اداره المستخدمين', 
      icon: ShieldCheck, 
      isDropdown: true,
      children: [
        { id: 'profile', label: 'الملف الشخصي وكلمة المرور', icon: UserCheck },
        { id: 'users_management', label: 'اداره المستخدمين', icon: Users },
        { id: 'user_permissions', label: 'صلاحيات المستخدمين', icon: Key },
        { id: 'activity_log', label: 'سجل الحركات', icon: History }
      ]
    },
    { 
      id: 'settings_group', 
      label: 'الاعدادات', 
      icon: Settings, 
      isDropdown: true,
      children: [
        { id: 'settings_connection', label: 'اعدادات الاتصال', icon: Radio },
        { id: 'settings_company', label: 'اعدادات الشركه', icon: Building },
        { id: 'settings_print', label: 'اعدادات الطباعه', icon: Printer },
        { id: 'settings_activation', label: 'اعدادات التفعيل', icon: CheckCircle },
        { id: 'settings_update', label: 'اعدادات التحديث', icon: Download }
      ]
    }
  ];

  // Filter menu items by user permissions
  const visibleMenuItems = menuItems.map(item => {
    if (!item.isDropdown) {
      const allowed = hasPermission(currentUser || null, item.id, 'view');
      return allowed ? item : null;
    }
    const filteredChildren = item.children?.filter(child => 
      hasPermission(currentUser || null, child.id, 'view')
    ) || [];
    if (filteredChildren.length === 0) return null;
    return {
      ...item,
      children: filteredChildren
    };
  }).filter(Boolean) as MenuItem[];

  // Helper to determine which group is currently active
  const isGroupActive = (item: MenuItem) => {
    if (!item.isDropdown) return activeTab === item.id;
    return item.children?.some(c => c.id === activeTab) || false;
  };

  // State to track open/collapsed dropdowns (open the active one by default)
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    visibleMenuItems.forEach(item => {
      if (item.isDropdown && isGroupActive(item)) {
        initial[item.id] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 sm:w-80 flex flex-col transition-transform duration-300 ease-in-out border-l shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-xl'
        }`}
        dir="rtl"
      >
        {/* Sidebar Header Brand with Enlarged Centered Logo & App Name */}
        <div className={`flex flex-col items-center justify-center p-5 pb-4 border-b shrink-0 text-center ${
          isDarkMode ? 'border-slate-800/80 bg-slate-950/40 backdrop-blur-md' : 'border-slate-200/80 bg-slate-50/80 backdrop-blur-md'
        }`}>

          {/* Centered Large Dragon Logo */}
          <div className="w-20 h-20 flex items-center justify-center mb-2 drop-shadow-xl relative">
            <img 
              src="/dragon-logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain filter hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Centered App Title & Company Info */}
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
            متجر دراجون للاليكترونيات و الاعمال الحره
          </h2>
          <span className="text-[11px] text-cyan-500 dark:text-cyan-400 font-bold mt-0.5">
            شركه دراجون للأنظمه الامنيه
          </span>
        </div>

        {/* Navigation Items List with Accordion / Dropdowns */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            القائمة الرئيسية للنظام
          </div>

          {visibleMenuItems.length === 0 ? (
            <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs font-bold leading-relaxed">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-500" />
              <span>لا توجد شاشات مصرح بها لحسابك حالياً.</span>
            </div>
          ) : (
            visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isGroup = item.isDropdown;
            const hasActiveChild = isGroupActive(item);
            const isExpanded = openGroups[item.id] ?? hasActiveChild;

            if (!isGroup) {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'bg-gradient-to-l from-cyan-500/20 via-cyan-500/10 to-transparent text-cyan-400 border border-cyan-500/30 shadow-xs font-black'
                        : 'bg-cyan-50 text-cyan-700 border border-cyan-300 font-black'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs">{item.label}</span>
                  </div>

                  <ChevronLeft className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                </button>
              );
            }

            // Dropdown Group Item
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    hasActiveChild
                      ? isDarkMode
                        ? 'bg-slate-800/80 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-100 text-cyan-700 border border-slate-300'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      hasActiveChild 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-cyan-400' : 'text-slate-500'
                    }`} />
                  </div>
                </button>

                {/* Submenu Dropdown List */}
                {isExpanded && item.children && (
                  <div className="pr-4 pl-1 space-y-1 border-r-2 border-cyan-500/30 mr-4 my-1 animate-fadeIn">
                    {item.children.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      const SubIcon = sub.icon || ChevronLeft;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab(sub.id);
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                            isSubActive
                              ? isDarkMode
                                ? 'bg-cyan-500/20 text-cyan-400 font-black shadow-xs'
                                : 'bg-cyan-50 text-cyan-700 font-black'
                              : isDarkMode
                                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span>{sub.label}</span>
                          </div>
                          {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
          )}

          {/* Logout Action Item */}
          <div className="pt-2 border-t border-slate-800/60 mt-3">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
                onLogout();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-rose-500 ${
                isDarkMode 
                  ? 'hover:bg-rose-950/30 hover:text-rose-400' 
                  : 'hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-xs font-black">تسجيل خروج</span>
              </div>
              <ChevronLeft className="w-3.5 h-3.5 text-rose-500" />
            </button>
          </div>

        </div>

      </aside>
    </>
  );
};
