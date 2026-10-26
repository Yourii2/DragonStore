import React, { useState } from 'react';
import { 
  Building2, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  Upload, 
  Download, 
  HardDrive, 
  RefreshCw, 
  Sparkles,
  Layers,
  MapPin,
  Phone,
  FileText,
  Boxes,
  Coins,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { systemAuthStore } from '../store/systemAuthStore';
import { compressImageFile } from '../utils/imageCompressor';
import { showWarning, showError, showSuccess } from '../utils/swal';

interface InstallationWizardProps {
  onComplete: () => void;
}

export const InstallationWizard: React.FC<InstallationWizardProps> = ({ onComplete }) => {
  // Steps:
  // 1: Database Setup & Backup Restore
  // 2: Company Profile
  // 3: Default Warehouse & Treasury
  // 4: Admin Account
  // 5: Activation & Launch
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  // STEP 1: Database Setup State
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: 3306,
    database: 'dragon_erp_production',
    username: 'root',
    password: ''
  });
  const [testingDb, setTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Backup upload during step 1
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [backupRestoreMsg, setBackupRestoreMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // STEP 2: Company Profile State
  const [companyConfig, setCompanyConfig] = useState({
    logo: '',
    company_name: '',
    address: '',
    phones: '',
    invoice_footer: ''
  });

  // STEP 3: Warehouse & Treasury State
  const [defaultsConfig, setDefaultsConfig] = useState({
    warehouseName: '',
    treasuryName: '',
    openingBalance: '0'
  });

  // STEP 4: Admin Account State
  const [adminData, setAdminData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // STEP 5: Activation & Progress State
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Pre-configured invoice footer suggestions
  const FOOTER_EXAMPLES = [
    'شكراً لتعاملكم معنا - نسعد دائماً بخدمتكم ورضاكم غايتنا.',
    'البضاعة المباعة ترد وتستبدل خلال 14 يوماً من تاريخ الفاتورة مع إحضار أصل الفاتورة.',
    'الضمان يسري على عيوب الصناعة فقط ولا يشمل سوء الاستخدام أو الكسر أو الحروق الكهربائية.',
    'خدمات الصيانة والبرمجيات مكفولة بضمان تجريبي لمدة 30 يوماً من تاريخ التسليم.'
  ];

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 250, 0.85);
      setCompanyConfig(prev => ({ ...prev, logo: compressed }));
    } catch (err) {
      console.error('Failed to compress logo:', err);
    }
  };

  // Test Database Connection
  const handleTestDatabase = async (): Promise<boolean> => {
    if (!dbConfig.database.trim()) {
      setDbStatus({ type: 'error', text: 'يرجى إدخال اسم قاعدة البيانات أولاً' });
      return false;
    }
    setTestingDb(true);
    setDbStatus(null);
    try {
      const res = await fetch('/api/settings/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus({ type: 'success', text: data.message || 'تم اختبار الاتصال بقاعدة البيانات بنجاح ومطابقة المعايير!' });
        return true;
      } else {
        setDbStatus({ type: 'error', text: data.message || 'تعذر الاتصال بقاعدة البيانات' });
        return false;
      }
    } catch (err: any) {
      setDbStatus({ type: 'error', text: 'خطأ بالخادم: ' + err.message });
      return false;
    } finally {
      setTestingDb(false);
    }
  };

  // Import Backup and immediately finish setup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoringBackup(true);
    setBackupRestoreMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        if (!jsonContent.data) {
          throw new Error('الملف لا يحتوي على بيانات نسخة احتياطية صالحة');
        }

        // Send to installation endpoint with backupData
        const res = await fetch('/api/system/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            databaseConfig: dbConfig,
            backupData: jsonContent
          })
        });

        const data = await res.json();
        if (data.success) {
          setBackupRestoreMsg({
            type: 'success',
            text: 'تم استرجاع النسخة الاحتياطية بنجاح واكتمال تهيئة النظام بالكامل! جاري نقلك للنظام...'
          });
          await systemAuthStore.checkStatusFromServer();
          setTimeout(() => {
            onComplete();
          }, 1800);
        } else {
          setBackupRestoreMsg({ type: 'error', text: data.message || 'فشل استرجاع النسخة الاحتياطية' });
        }
      } catch (err: any) {
        setBackupRestoreMsg({ type: 'error', text: 'خطأ أثناء قراءة واسترجاع الملف: ' + err.message });
      } finally {
        setRestoringBackup(false);
      }
    };
    reader.readAsText(file);
  };

  // Step 1 Validation & Proceed
  const proceedStep1 = async () => {
    if (!dbStatus || dbStatus.type !== 'success') {
      const ok = await handleTestDatabase();
      if (!ok) return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation & Proceed
  const proceedStep2 = () => {
    if (!companyConfig.company_name.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى كتابة اسم الشركة أو المنشأة للمتابعة');
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 Validation & Proceed
  const proceedStep3 = () => {
    if (!defaultsConfig.warehouseName.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى تحديد اسم المخزن الافتراضي للمتابعة');
      return;
    }
    if (!defaultsConfig.treasuryName.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى تحديد اسم الخزينة الافتراضية للمتابعة');
      return;
    }
    setCurrentStep(4);
  };

  // Step 4 Validation & Proceed
  const proceedStep4 = () => {
    if (!adminData.fullName.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال الاسم الكامل للمدير');
      return;
    }
    if (!adminData.username.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال اسم المستخدم');
      return;
    }
    if (!adminData.password) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال كلمة المرور');
      return;
    }
    if (adminData.password !== adminData.confirmPassword) {
      showWarning('خطأ في كلمة المرور', 'كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }
    setCurrentStep(5);
  };

  // Final Step: Complete Installation
  const handleFinalInstall = async () => {
    setIsInstalling(true);
    setInstallError(null);

    try {
      const res = await fetch('/api/system/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseConfig: dbConfig,
          companyConfig: companyConfig,
          defaultsConfig: defaultsConfig,
          adminAccount: {
            fullName: adminData.fullName,
            username: adminData.username,
            passwordHash: adminData.password,
            email: `${adminData.username}@dragon.local`,
            phone: companyConfig.phones || ''
          }
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'فشلت عملية تثبيت النظام');
      }

      setInstallSuccess(true);
      await systemAuthStore.checkStatusFromServer();
    } catch (err: any) {
      setInstallError(err.message || 'حدث خطأ أثناء حفظ الإعدادات وتثبيت النظام');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
      
      {/* Wizard Card Container */}
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-500/40 overflow-hidden">
                <img 
                  src="/dragon-logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">معالج تثبيت وإعداد المنظومة</h1>
                <p className="text-xs text-cyan-400 font-bold mt-1">DragonStore Enterprise Edition • تهيئة احترافية كاملة</p>
              </div>
            </div>

            {/* Step Counter Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400">الخطوة</span>
              <span className="text-base font-black text-cyan-400 font-mono">{currentStep}</span>
              <span className="text-xs text-slate-500">من {totalSteps}</span>
            </div>
          </div>

          {/* Progress Bar & Steps Tabs */}
          <div className="mt-6 space-y-2">
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-5 gap-1 pt-2 text-[10px] sm:text-xs text-center font-bold">
              <span className={currentStep >= 1 ? 'text-cyan-400' : 'text-slate-600'}>1. قاعدة البيانات</span>
              <span className={currentStep >= 2 ? 'text-cyan-400' : 'text-slate-600'}>2. بيانات الشركة</span>
              <span className={currentStep >= 3 ? 'text-cyan-400' : 'text-slate-600'}>3. المخزن والخزينة</span>
              <span className={currentStep >= 4 ? 'text-cyan-400' : 'text-slate-600'}>4. بيانات المستخدم</span>
              <span className={currentStep >= 5 ? 'text-cyan-400' : 'text-slate-600'}>5. تفعيل المنظومة</span>
            </div>
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 sm:p-8 flex-1">
          
          {/* STEP 1: Database Setup & Backup Import */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <span>إعدادات الاتصال بقاعدة البيانات MySQL</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    يمكنك ربط قاعدة بيانات جديدة أو استرجاع نسخة احتياطية سابقة مباشرة للعمل فوراً
                  </p>
                </div>
              </div>

              {/* Backup Import Option */}
              <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">لديك نسخة احتياطية سابقة (Backup File)؟</h4>
                      <p className="text-xs text-slate-400">استرجع بياناتك بالكامل بضغطة زر وتجاوز خطوات الإدخال اليدوي</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/40 cursor-pointer transition-all">
                    {restoringBackup ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{restoringBackup ? 'جاري الاسترجاع...' : 'استرجاع نسخة احتياطية'}</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportBackup} 
                      disabled={restoringBackup}
                      className="hidden" 
                    />
                  </label>
                </div>

                {backupRestoreMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    backupRestoreMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {backupRestoreMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{backupRestoreMsg.text}</span>
                  </div>
                )}
              </div>

              <div className="relative flex items-center justify-center">
                <hr className="w-full border-slate-800" />
                <span className="absolute px-3 bg-slate-900 text-xs text-slate-500 font-bold">أو إعداد قاعدة بيانات جديدة</span>
              </div>

              {/* DB Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الخادم (Host):</label>
                  <input
                    type="text"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="localhost"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">المنفذ (Port):</label>
                  <input
                    type="number"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="3306"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم قاعدة البيانات:</label>
                  <input
                    type="text"
                    value={dbConfig.database}
                    onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="اكتب اسم قاعدة البيانات (مثال: my_store_db)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المستخدم (User):</label>
                  <input
                    type="text"
                    value={dbConfig.username}
                    onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="root"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة مرور قاعدة البيانات:</label>
                  <input
                    type="password"
                    value={dbConfig.password}
                    onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="اتركه فارغاً إذا لم تكن هناك كلمة مرور"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    إذا كان خادم MySQL لديك محمي بكلمة مرور (مثل السيرفر المثبت مسبقاً)، يرجى كتابتها هنا. إذا كنت تستخدم XAMPP الافتراضي فغالباً ما يكون فارغاً.
                  </p>
                </div>
              </div>

              {/* Status & Test Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleTestDatabase}
                  disabled={testingDb}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                >
                  {testingDb ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> : <Server className="w-4 h-4 text-cyan-400" />}
                  <span>{testingDb ? 'جاري فحص الاتصال...' : 'اختبار الاتصال بالخادم'}</span>
                </button>

                {dbStatus && (
                  <div className={`text-xs flex items-center gap-2 font-medium ${
                    dbStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {dbStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{dbStatus.text}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Company Profile */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span>بيانات وهوية الشركة أو المؤسسة</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  أدخل الشعار والبيانات الأساسية وتذييل الفاتورة لطباعة الفواتير والسندات الرسمية
                </p>
              </div>

              {/* Logo Section */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {companyConfig.logo ? (
                    <img src={companyConfig.logo} alt="Company Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-600" />
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-right">
                  <h4 className="text-xs font-bold text-slate-200">شعار المنشأة / اللوجو</h4>
                  <p className="text-[11px] text-slate-400">يظهر اللوجو في ترويسة الفواتير المطبوعة وسندات القبض والصرف (PNG, JPG)</p>
                  
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>اختيار لوجو</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>

                    {companyConfig.logo && (
                      <button
                        type="button"
                        onClick={() => setCompanyConfig(prev => ({ ...prev, logo: '' }))}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                      >
                        إزالة اللوجو
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الشركة / المؤسسة *:</label>
                  <input
                    type="text"
                    value={companyConfig.company_name}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, company_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    placeholder="مثال: شركة دراجون للأنظمة والتجارة"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">أرقام الهاتف والتواصل:</label>
                  <input
                    type="text"
                    value={companyConfig.phones}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, phones: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    placeholder="مثال: 01012345678 - 0123456789"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">العنوان والمقر الرئيسي:</label>
                  <input
                    type="text"
                    value={companyConfig.address}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    placeholder="مثال: القاهرة - مصر الجديدة - شارع النزهة"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-300">سطر تذييل الفاتورة (ملاحظات وشروط الضمان):</label>
                  <textarea
                    rows={2}
                    value={companyConfig.invoice_footer}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, invoice_footer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none leading-relaxed"
                    placeholder="اكتب العبارة التي ترغب بظهورها أسفل كل فاتورة..."
                  />

                  {/* Suggestions pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-bold self-center">نماذج مقترحة:</span>
                    {FOOTER_EXAMPLES.map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCompanyConfig(prev => ({ ...prev, invoice_footer: ex }))}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700/60 transition-all cursor-pointer text-right"
                      >
                        {ex.slice(0, 38)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Default Warehouse & Treasury */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-cyan-400" />
                  <span>إعداد المخزن الافتراضي والخزينة النقدية الأولية</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تحديد نقاط الانطلاق للعمليات المخزنية والمالية وحركات الأرصدة
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Warehouse setup card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3 text-cyan-400 pb-2 border-b border-slate-800">
                    <Boxes className="w-6 h-6" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">المخزن الافتراضي</h4>
                      <p className="text-[10px] text-slate-400">المخزن الرئيسي لاستقبال المشتريات والمبيعات</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المخزن الافتراضي *:</label>
                    <input
                      type="text"
                      value={defaultsConfig.warehouseName}
                      onChange={(e) => setDefaultsConfig({ ...defaultsConfig, warehouseName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                      placeholder="مثال: المخزن الرئيسي"
                    />
                  </div>
                </div>

                {/* Treasury & Opening Cash setup card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3 text-emerald-400 pb-2 border-b border-slate-800">
                    <Coins className="w-6 h-6" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">الخزينة النقدية الافتراضية</h4>
                      <p className="text-[10px] text-slate-400">الصندوق النقدي الرئيسي وحساب النقدية</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الخزينة الافتراضية *:</label>
                    <input
                      type="text"
                      value={defaultsConfig.treasuryName}
                      onChange={(e) => setDefaultsConfig({ ...defaultsConfig, treasuryName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                      placeholder="مثال: الخزينة الرئيسية / درج الكاشير"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">المبلغ الموجود في الخزينة (رصيد افتتاحي):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={defaultsConfig.openingBalance}
                        onChange={(e) => setDefaultsConfig({ ...defaultsConfig, openingBalance: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج.م</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Admin Account Credentials */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>بيانات حساب المدير العام (Super Admin)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  الحساب الرئيسي الذي سيمتلك الصلاحيات الكاملة للوصول إلى كافة أقسام المنظومة
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">الاسم الكامل *:</label>
                    <input
                      type="text"
                      value={adminData.fullName}
                      onChange={(e) => setAdminData({ ...adminData, fullName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                      placeholder="مثال: ممدوح المصري"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المستخدم لتسجيل الدخول *:</label>
                    <input
                      type="text"
                      value={adminData.username}
                      onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      placeholder="admin"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة المرور *:</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminData.password}
                        onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">تأكيد كلمة المرور *:</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminData.confirmPassword}
                        onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3.5 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
                  <span className="text-xs text-purple-300">
                    سيتم تخزين كلمة المرور بصيغة مشفرة وآمنة تماماً داخل قاعدة البيانات MySQL.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Activation & Launch */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span>تفعيل المنظومة وبدء التشغيل</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  مرحلة تثبيت الجداول، إعداد الحساب، وربط المنظومة
                </p>
              </div>

              {!installSuccess ? (
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-200">البيانات جاهزة للتثبيت والاعتماد النهائي</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      سيتم الآن بناء جداول قاعدة البيانات MySQL، وتعيين بيانات الشركة، وإنشاء المخزن والخزينة الافتراضية وحساب المدير العام.
                    </p>
                  </div>

                  {/* Summary preview */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 grid grid-cols-2 gap-3 text-right max-w-lg mx-auto">
                    <div>
                      <span className="text-slate-500 block text-[10px]">الشركة:</span>
                      <strong className="text-slate-100">{companyConfig.company_name || 'غير محدد'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">المدير العام:</span>
                      <strong className="text-slate-100">{adminData.fullName} ({adminData.username})</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">المخزن:</span>
                      <strong className="text-slate-100">{defaultsConfig.warehouseName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">الخزينة النقدية:</span>
                      <strong className="text-emerald-400">{defaultsConfig.treasuryName} ({defaultsConfig.openingBalance} ج.م)</strong>
                    </div>
                  </div>

                  {installError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 justify-center">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{installError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleFinalInstall}
                    disabled={isInstalling}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/40 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    {isInstalling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>{isInstalling ? 'جاري تثبيت وحفظ البيانات...' : 'اعتماد التثبيت وبدء التشغيل 🚀'}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>

                  <h3 className="text-lg font-black text-slate-100">تم تثبيت وتهيئة المنظومة بالكامل وبنجاح! 🎉</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    تم إنشاء الجداول وتخزين كافة البيانات على خادم MySQL. يمكنك الآن الانتقال لتسجيل الدخول بحسابك الجديد.
                  </p>

                  <button
                    type="button"
                    onClick={onComplete}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-900/40 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>الانتقال لصفحة تسجيل الدخول 🔐</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation Buttons */}
        <div className="bg-slate-950 border-t border-slate-800 p-6 flex items-center justify-between">
          <div>
            {currentStep > 1 && !installSuccess && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={proceedStep1}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/30 transition-all cursor-pointer"
              >
                <span>متابعة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={proceedStep2}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/30 transition-all cursor-pointer"
              >
                <span>متابعة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={proceedStep3}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/30 transition-all cursor-pointer"
              >
                <span>متابعة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={proceedStep4}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/30 transition-all cursor-pointer"
              >
                <span>متابعة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
