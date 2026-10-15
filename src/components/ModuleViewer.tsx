import React, { useState } from 'react';
import { 
  ArchitectureModule, 
  ARCHITECTURE_MODULES 
} from '../data/architectureData';
import { 
  Layers, 
  Grid, 
  Split, 
  BookOpen, 
  Package, 
  ShoppingCart, 
  Truck, 
  Users, 
  Building2, 
  Wrench, 
  Video, 
  Network, 
  Wifi, 
  Code, 
  Receipt, 
  Landmark, 
  UserCheck, 
  ShieldAlert, 
  BarChart3, 
  PieChart, 
  KeyRound, 
  History, 
  DatabaseBackup,
  ChevronDown,
  ChevronUp,
  Table,
  FileSpreadsheet,
  CheckCircle,
  ArrowRightLeft,
  Share2
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Layers, Grid, Split, BookOpen, Package, ShoppingCart, Truck, Users, 
  Building2, Wrench, Video, Network, Wifi, Code, Receipt, Landmark, 
  UserCheck, ShieldAlert, BarChart3, PieChart, KeyRound, History, DatabaseBackup
};

interface ModuleViewerProps {
  searchQuery: string;
}

export const ModuleViewer: React.FC<ModuleViewerProps> = ({ searchQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(1);

  const categories = [
    { id: 'all', label: 'كافة الركائز (23)' },
    { id: 'core', label: 'النواة والعزل الهيكلي' },
    { id: 'store', label: 'المتجر والورش والشبكات' },
    { id: 'freelance', label: 'البرمجيات والعمل الحر' },
    { id: 'finance', label: 'المحاسبة والخزينة والأصول' },
    { id: 'admin', label: 'الأمان والرقابة والنسخ' },
  ];

  const filteredModules = ARCHITECTURE_MODULES.filter((mod) => {
    const matchesCategory = selectedCategory === 'all' || mod.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesSearch = 
      mod.title.toLowerCase().includes(query) ||
      mod.titleEn.toLowerCase().includes(query) ||
      mod.summary.toLowerCase().includes(query) ||
      mod.businessRules.some(r => r.toLowerCase().includes(query)) ||
      mod.keyEntities.some(e => e.table.toLowerCase().includes(query) || e.name.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id: number) => {
    setExpandedModuleId(expandedModuleId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      
      {/* Category Pills Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          عرض <span className="text-cyan-400 font-bold">{filteredModules.length}</span> من أصل 23 ركيزة معمارية
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {filteredModules.map((module) => {
          const Icon = iconMap[module.icon] || Layers;
          const isExpanded = expandedModuleId === module.id;

          return (
            <div
              key={module.id}
              id={module.slug}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded 
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-xl shadow-cyan-950/20' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Header Accordion Bar */}
              <div
                onClick={() => toggleExpand(module.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${
                    isExpanded ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-300'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-bold text-base sm:text-lg text-slate-100">{module.title}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        module.category === 'store' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                        module.category === 'freelance' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                        module.category === 'finance' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                        module.category === 'admin' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                        'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {module.category === 'store' ? 'متجر وخدمات' :
                         module.category === 'freelance' ? 'برمجيات حرة' :
                         module.category === 'finance' ? 'مالية ومحاسبة' :
                         module.category === 'admin' ? 'أمان ورقابة' : 'نواة النظام'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono tracking-tight">{module.titleEn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-block text-xs font-mono text-slate-500">#{String(module.id).padStart(2, '0')}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 transition-transform ${isExpanded ? 'bg-slate-800 text-cyan-400' : ''}`}>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Content Body */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-6">
                  
                  {/* Summary */}
                  <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">الوصف المعماري والهدف التشغيلي:</h3>
                    <p className="text-sm text-slate-200 leading-relaxed">{module.summary}</p>
                  </div>

                  {/* Two Column Grid: Business Rules & Data Flow */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Business Rules */}
                    <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-bold text-sm text-slate-100">قواعد وضوابط الأعمال (Business Rules):</h3>
                      </div>
                      <ul className="space-y-2.5">
                        {module.businessRules.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Data Flow & Integrations */}
                    <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                          <h3 className="font-bold text-sm text-slate-100">مسار تدفق البيانات (Information Flow):</h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-4">{module.dataFlowDescription}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1.5">نقاط التكامل مع باقي المنظومة:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {module.integrationPoints.map((point, idx) => (
                            <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {point}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Accounting Ledger Impact */}
                  {module.accountingImpact.length > 0 && (
                    <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-bold text-sm text-slate-100">الأثر المحاسبي وحركة القيد المزدوج (Double-Entry Impact):</h3>
                      </div>
                      <div className="space-y-2">
                        {module.accountingImpact.map((impact, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                            <div>
                              <span className="text-emerald-400 font-bold block mb-0.5">طرف المدين (Debit):</span>
                              <span className="text-slate-200">{impact.debit}</span>
                            </div>
                            <div>
                              <span className="text-cyan-400 font-bold block mb-0.5">طرف الدائن (Credit):</span>
                              <span className="text-slate-200">{impact.credit}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block mb-0.5">التوجيه المحاسبي:</span>
                              <span className="text-slate-300">{impact.notes}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key MySQL Database Tables */}
                  {module.keyEntities.length > 0 && (
                    <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Table className="w-4 h-4 text-indigo-400" />
                        <h3 className="font-bold text-sm text-slate-100">جداول MySQL الأساسية للوحدة:</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.keyEntities.map((entity, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-white">{entity.name}</span>
                              <code className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                                {entity.table}
                              </code>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-2">{entity.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {entity.columns.map((col, cIdx) => (
                                <span key={cIdx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                  {col}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
