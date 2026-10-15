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
import { SettingsManagementView } from './components/SettingsManagementView';
import { ConnectionSettingsView } from './components/ConnectionSettingsView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { UpdateSettingsView } from './components/UpdateSettingsView';
import { UsersManagementView } from './components/UsersManagementView';
import { ActivityLogView } from './components/ActivityLogView';
import { InteractiveTestSandbox } from './components/InteractiveTestSandbox';
import { ModuleViewer } from './components/ModuleViewer';
import { FinancialCalculator } from './components/FinancialCalculator';
import { DataFlowExplorer } from './components/DataFlowExplorer';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { RoadmapTimeline } from './components/RoadmapTimeline';
import { ExportModal } from './components/ExportModal';
import { InstallationWizard } from './components/InstallationWizard';
import { LoginPage } from './components/LoginPage';
import { LiveSystemVerificationHub } from './components/LiveSystemVerificationHub';
import { systemAuthStore, CurrentUser } from './store/systemAuthStore';
import { Database, Zap } from 'lucide-react';

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

  const handleReinstall = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة تشغيل معالج التثبيت من البداية؟')) {
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
        />

        {/* Main Body Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          
          {/* Top Clean Context Bar */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">مرحباً بك،</span>
              <strong className="text-xs font-black text-cyan-400">{currentUser.name}</strong>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                {currentUser.roleTitleAr}
              </span>
            </div>

            <div className="text-[11px] font-bold text-slate-400">
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Render Active View according to exact requested items */}
          <div className="transition-all duration-300">
            
            {/* 1. الصفحه الرئيسيه */}
            {activeTab === 'dashboard' && (
              <ModernDashboardView onNavigate={(tab) => {
                setActiveTab(tab);
                scrollToTop();
              }} />
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
            {activeTab === 'sales' && (
              <SalesAndPosView />
            )}

            {/* 7. اداره تقارير */}
            {activeTab === 'reports' && (
              <div className="space-y-8">
                <AccountingReportsView />
                <InteractiveTestSandbox />
              </div>
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
            {activeTab === 'users_management' && (
              <UsersManagementView />
            )}

            {activeTab === 'activity_log' && (
              <ActivityLogView />
            )}

            {activeTab === 'user_permissions' && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">صلاحيات المستخدمين</h3>
                <p className="text-xs text-slate-500 mt-1">سيتم تفعيل شاشة الصلاحيات لاحقاً بعد استكمال باقي الأقسام.</p>
              </div>
            )}

            {/* 11. الاعدادات (اتصال، شركه، تفعيل، تحديث) */}
            {activeTab === 'settings_connection' && (
              <ConnectionSettingsView />
            )}

            {activeTab === 'settings_company' && (
              <CompanySettingsView />
            )}

            {activeTab === 'settings_activation' && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">إعدادات التفعيل</h3>
                <p className="text-xs text-slate-500 mt-1">سيتم إنشاء وتفعيل شاشة التفعيل لاحقاً.</p>
              </div>
            )}

            {activeTab === 'settings_update' && (
              <UpdateSettingsView />
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
