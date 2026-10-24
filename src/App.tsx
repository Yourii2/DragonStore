import React, { useState, useEffect } from 'react';
import { TopHeader } from './components/TopHeader';
import { Sidebar } from './components/Sidebar';
import { FooterBar } from './components/FooterBar';
import { OverviewHero } from './components/OverviewHero';
import { ModernDashboardView } from './components/ModernDashboardView';
import { ProductsManagementView } from './components/ProductsManagementView';
import { CustomersManagementView } from './components/CustomersManagementView';
import { CustomerTransactionsView } from './components/CustomerTransactionsView';
import { SuppliersManagementView } from './components/SuppliersManagementView';
import { SupplierTransactionsView } from './components/SupplierTransactionsView';
import { EmployeesManagementView } from './components/EmployeesManagementView';
import { EmployeeTransactionsView } from './components/EmployeeTransactionsView';
import { SalesAndPosView } from './components/SalesAndPosView';
import { AccountingReportsView } from './components/AccountingReportsView';
import { TreasuryAndExpensesView } from './components/TreasuryAndExpensesView';
import { TreasuryManagementView } from './components/TreasuryManagementView';
import { FinancialTransactionsView } from './components/FinancialTransactionsView';
import { WarehousesManagementView } from './components/WarehousesManagementView';
import { StockInView } from './components/StockInView';
import { StockReturnView } from './components/StockReturnView';
import { StockTransferView } from './components/StockTransferView';
import { CategoriesManagementView } from './components/CategoriesManagementView';
import { NetworkManagementView } from './components/NetworkManagementView';
import { SettingsManagementView } from './components/SettingsManagementView';
import { ConnectionSettingsView } from './components/ConnectionSettingsView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { PrintSettingsView } from './components/PrintSettingsView';
import { ActivationSettingsView } from './components/ActivationSettingsView';
import { UpdateSettingsView } from './components/UpdateSettingsView';
import { UsersManagementView } from './components/UsersManagementView';
import { UserProfileView } from './components/UserProfileView';
import { ActivityLogView } from './components/ActivityLogView';
import { ModuleViewer } from './components/ModuleViewer';
import { FinancialCalculator } from './components/FinancialCalculator';
import { DataFlowExplorer } from './components/DataFlowExplorer';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { RoadmapTimeline } from './components/RoadmapTimeline';
import { ExportModal } from './components/ExportModal';
import { InstallationWizard } from './components/InstallationWizard';
import { LoginPage } from './components/LoginPage';
import { LiveSystemVerificationHub } from './components/LiveSystemVerificationHub';
import { UserPermissionsView } from './components/UserPermissionsView';
import { MinimalDashboardView } from './components/MinimalDashboardView';
import { systemAuthStore, CurrentUser, hasPermission } from './store/systemAuthStore';
import { Database, Zap, Lock } from 'lucide-react';
import { showConfirm } from './utils/swal';

export default function App() {
  const [isInstalled, setIsInstalled] = useState<boolean>(systemAuthStore.installationState.isInstalled);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(systemAuthStore.currentUser);
  const [isReady, setIsReady] = useState<boolean>(systemAuthStore.getIsLoaded());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = systemAuthStore.subscribe(() => {
      setIsInstalled(systemAuthStore.installationState.isInstalled);
      setCurrentUser(systemAuthStore.currentUser);
      setIsReady(systemAuthStore.getIsLoaded());
    });

    systemAuthStore.checkStatusFromServer().then(() => {
      setIsInstalled(systemAuthStore.installationState.isInstalled);
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        if (e.detail.show_network_page === false && (activeTab === 'network_page' || activeTab === 'reports_network')) {
          setActiveTab('dashboard');
        }
        if (e.detail.show_software_features === false && activeTab === 'reports_software') {
          setActiveTab('dashboard');
        }
      }
    };
    window.addEventListener('company-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('company-settings-updated', handleSettingsUpdated);
  }, [activeTab]);

  const handleInstallationComplete = () => {
    setIsInstalled(true);
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    systemAuthStore.logout();
    setCurrentUser(null);
  };

  const handleReinstall = async () => {
    const confirmed = await showConfirm(
      'إعادة تشغيل معالج التثبيت',
      'هل أنت متأكد من رغبتك في إعادة تشغيل معالج التثبيت من البداية؟',
      { isDanger: true, confirmText: 'نعم، إعادة التثبيت', cancelText: 'تراجع' }
    );
    if (confirmed) {
      systemAuthStore.resetInstallation();
      setIsInstalled(false);
      setCurrentUser(null);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 0. While checking server installation state, render sleek loader
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center animate-pulse">
            <Database className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
          <div className="text-sm font-bold text-slate-300">جاري التحقق من اتصال قاعدة البيانات وحالة التثبيت...</div>
        </div>
      </div>
    );
  }

  // 1. If system is not installed, render the Installation Wizard
  if (!isInstalled) {
    return <InstallationWizard onComplete={handleInstallationComplete} />;
  }

  // 2. If system is installed but user is not logged in, render the Login Page
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        onReinstall={handleReinstall}
      />
    );
  }

  // 3. Main Authenticated Application with Requested Sidebar and Views
  return (
    <div className={`min-h-screen transition-colors duration-200 font-['Cairo',sans-serif] flex flex-col ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`} dir="rtl">
      
      {/* Sidebar Navigation with exact requested items */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          scrollToTop();
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDarkMode={isDarkMode}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      {/* Main Content Area: Responsive to Sidebar state on Desktop & Mobile */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isSidebarOpen ? 'lg:mr-72 xl:mr-80' : 'mr-0'
      }`}>
        
        {/* Top Header Bar */}
        <TopHeader
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onLogout={handleLogout}
          onReinstall={handleReinstall}
          onOpenExport={() => setIsExportModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            scrollToTop();
          }}
          onUpdateUser={(updated) => setCurrentUser(updated)}
        />

        {/* Main Body Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {(!currentUser || (currentUser.role !== 'SUPER_ADMIN' && activeTab !== 'dashboard' && activeTab !== 'profile' && !hasPermission(currentUser, activeTab, 'view'))) ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 shadow-sm max-w-lg mx-auto my-12 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">غير مصرح لك بالوصول إلى هذه الشاشة</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                تم حظر صلاحية عرض هذه الصفحة لحسابك بواسطة مسؤول النظام. يرجى مراجعة إدارة النظام لتفعيل الصلاحية لك.
              </p>
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  scrollToTop();
                }}
                className="mt-6 px-6 py-2.5 rounded-2xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-black text-xs transition-all cursor-pointer shadow-md"
              >
                العودة إلى الصفحة الرئيسية
              </button>
            </div>
          ) : (
            /* Render Active View according to exact requested items */
            <div className="transition-all duration-300">
            
            {/* 1. الصفحه الرئيسيه */}
            {activeTab === 'dashboard' && (
              hasPermission(currentUser, 'dashboard', 'view') ? (
                <ModernDashboardView onNavigate={(tab) => {
                  setActiveTab(tab);
                  scrollToTop();
                }} />
              ) : (
                <MinimalDashboardView currentUser={currentUser} />
              )
            )}

            {/* 2. اداره المنتجات و المخازن و التصنيفات */}
            {activeTab === 'products' && (
              <ProductsManagementView />
            )}

            {activeTab === 'categories' && (
              <CategoriesManagementView />
            )}

            {activeTab === 'warehouses' && (
              <WarehousesManagementView />
            )}

            {/* 3. اداره العملاء ومعاملاتهم */}
            {activeTab === 'customers' && (
              <CustomersManagementView />
            )}

            {activeTab === 'customer_transactions' && (
              <CustomerTransactionsView />
            )}

            {/* 4. اداره الموردين ومعاملاتهم */}
            {activeTab === 'suppliers' && (
              <SuppliersManagementView />
            )}

            {activeTab === 'supplier_transactions' && (
              <SupplierTransactionsView />
            )}

            {/* 5. اداره الموظفين ومعاملاتهم */}
            {activeTab === 'employees' && (
              <EmployeesManagementView />
            )}

            {activeTab === 'employee_transactions' && (
              <EmployeeTransactionsView />
            )}

            {/* 6. اداره المبيعات */}
            {(activeTab === 'sales' || activeTab === 'sales_pos') && (
              <SalesAndPosView initialMode="SALE" />
            )}

            {activeTab === 'quotations' && (
              <SalesAndPosView initialMode="QUOTATION" />
            )}

            {activeTab === 'network_page' && (
              <NetworkManagementView />
            )}

            {/* 7. اداره تقارير */}
            {activeTab === 'reports' && (
              <AccountingReportsView initialReport="sales" />
            )}

            {activeTab === 'reports_sales' && (
              <AccountingReportsView initialReport="sales" />
            )}

            {activeTab === 'reports_physical' && (
              <AccountingReportsView initialReport="physical" />
            )}

            {activeTab === 'reports_maintenance' && (
              <AccountingReportsView initialReport="maintenance" />
            )}

            {activeTab === 'reports_software' && (
              <AccountingReportsView initialReport="software" />
            )}

            {activeTab === 'reports_network' && (
              <AccountingReportsView initialReport="network" />
            )}

            {activeTab === 'reports_inventory' && (
              <AccountingReportsView initialReport="inventory" />
            )}

            {activeTab === 'reports_treasury' && (
              <AccountingReportsView initialReport="treasury" />
            )}

            {activeTab === 'reports_customers' && (
              <AccountingReportsView initialReport="customers" />
            )}

            {activeTab === 'reports_suppliers' && (
              <AccountingReportsView initialReport="suppliers" />
            )}

            {activeTab === 'reports_expenses' && (
              <AccountingReportsView initialReport="expenses" />
            )}

            {activeTab === 'reports_pnl' && (
              <AccountingReportsView initialReport="pnl" />
            )}

            {/* 8. اداره الماليات و الخزائن والمعاملات */}
            {activeTab === 'treasury' && (
              <TreasuryManagementView />
            )}

            {activeTab === 'financial_transactions' && (
              <FinancialTransactionsView />
            )}

            {activeTab === 'finance' && (
              <TreasuryAndExpensesView />
            )}

            {/* 9. حركه المخزون (استلام بضائع، ارتجاع، نقل) */}
            {activeTab === 'stock_in' && (
              <StockInView />
            )}

            {activeTab === 'stock_return' && (
              <StockReturnView />
            )}

            {activeTab === 'stock_transfer' && (
              <StockTransferView />
            )}

            {/* 10. اداره المستخدمين والصلاحيات وسجل الحركات */}
            {activeTab === 'profile' && (
              <UserProfileView 
                currentUser={currentUser} 
                onUpdateUser={(updated) => setCurrentUser(updated)} 
              />
            )}

            {activeTab === 'users_management' && (
              <UsersManagementView />
            )}

            {activeTab === 'activity_log' && (
              <ActivityLogView />
            )}

            {activeTab === 'user_permissions' && (
              <UserPermissionsView />
            )}

            {/* 11. الاعدادات (اتصال، شركه، تفعيل، تحديث) */}
            {activeTab === 'settings_connection' && (
              <ConnectionSettingsView />
            )}

            {activeTab === 'settings_company' && (
              <CompanySettingsView />
            )}

            {activeTab === 'settings_print' && (
              <PrintSettingsView />
            )}

            {activeTab === 'settings_activation' && (
              <ActivationSettingsView />
            )}

            {activeTab === 'settings_update' && (
              <UpdateSettingsView onFactoryReset={handleReinstall} />
            )}

            {activeTab === 'settings' && (
              <SettingsManagementView onReinstall={handleReinstall} />
            )}

            {/* Secondary/Detailed tabs if accessed from quick links */}
            {activeTab === 'architecture' && (
              <ModuleViewer searchQuery={searchQuery} />
            )}

            {activeTab === 'database' && (
              <DatabaseSchemaViewer />
            )}

            {activeTab === 'dataflows' && (
              <DataFlowExplorer />
            )}

            {activeTab === 'financials' && (
              <FinancialCalculator />
            )}

            {activeTab === 'roadmap' && (
              <RoadmapTimeline />
            )}

          </div>
          )}

        </main>

        {/* Footer Bar with Software branding & Contact */}
        <FooterBar
          isDarkMode={isDarkMode}
          onReinstall={handleReinstall}
          onScrollToTop={scrollToTop}
        />

      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

    </div>
  );
}
