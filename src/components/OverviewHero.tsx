import React from 'react';
import { 
  Laptop, 
  Code2, 
  Database, 
  Layers, 
  ShieldCheck, 
  CheckCircle2,
  Boxes,
  Users,
  ShoppingCart,
  Landmark,
  TrendingUp,
  Warehouse
} from 'lucide-react';

export const OverviewHero: React.FC<{ onSelectSection: (id: string) => void }> = ({ onSelectSection }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-8 shadow-xl transition-colors duration-200">
      
      {/* Background Dragon Glow Decorations (cyan and steel-blue) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        
        {/* Top Header Row with Dragon Logo & System Identity */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 p-1.5 flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-500/10 shrink-0">
              <img 
                src="/dragon-logo.png" 
                alt="Dragon Logo" 
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-1">
                <span>شركه دراجون للأنظمه الامنيه • م . ممدوح المصرى</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                متجر دراجون للاليكترونيات و الاعمال الحره
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                نظام إدارة العمليات التجارية، نقاط البيع، والمشاريع الميدانية مع التكامل المحاسبي على قاعدة بيانات MySQL
              </p>
            </div>
          </div>
        </div>

        {/* Dual Business Units Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
          
          {/* Unit 1: Electronics & Computer Shop */}
          <div 
            onClick={() => onSelectSection('sales')}
            className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-cyan-500/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-500 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    1. متجر التقنية ونقاط البيع (Shop & POS)
                  </h3>
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
                    أجهزة، لابتوبات، صيانة، كاميرات مراقبة، وشبكات
                  </span>
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span>إدارة الفواتير ونقاط البيع السريعة</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span>مراقبة المخزون وتنبيهات النواقص</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span>حسابات العملاء والديون والتحصيل</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span>مشاريع التمديدات وخدمات الصيانة</span>
              </li>
            </ul>
          </div>

          {/* Unit 2: Freelance Software & Digital Services */}
          <div 
            onClick={() => onSelectSection('finance')}
            className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-blue-500/30 p-5 shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    2. نشاط الأعمال الحرة والبرمجيات (Freelance Work)
                  </h3>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                    تطوير أنظمة، تطبيقات، استشارات تقنية، وعقود
                  </span>
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>تتبع عقود المشاريع والدفعات المرحلية</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>المصاريف المباشرة والسيرفرات السحابية</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>توزيع المصروفات المشتركة العادلة</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>تقارير صافي الأرباح المستقلة</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Quick Shortcut Buttons for Main System Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button 
            onClick={() => onSelectSection('sales')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-cyan-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer text-right group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-cyan-500">نقطة البيع POS</div>
              <div className="text-[10px] text-slate-500">فواتير ومبيعات سريعة</div>
            </div>
          </button>
          
          <button 
            onClick={() => onSelectSection('products')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer text-right group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-500">إدارة المنتجات</div>
              <div className="text-[10px] text-slate-500">الأصناف والأسعار</div>
            </div>
          </button>

          <button 
            onClick={() => onSelectSection('customers')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer text-right group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-500">سجل العملاء</div>
              <div className="text-[10px] text-slate-500">المديونيات والتحصيل</div>
            </div>
          </button>

          <button 
            onClick={() => onSelectSection('reports')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer text-right group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-500">التقارير المالية</div>
              <div className="text-[10px] text-slate-500">الأرباح والخسائر P&L</div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};
