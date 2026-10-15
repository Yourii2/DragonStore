import React, { useState } from 'react';
import { 
  Code2, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Server, 
  Globe, 
  Bot, 
  Plus, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { globalErpStore, FreelanceProject } from '../store/erpStore';

export const FreelanceDevView: React.FC = () => {
  const [projects, setProjects] = useState<FreelanceProject[]>([...globalErpStore.freelanceProjects]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'projects' | 'expenses' | 'clients'>('projects');

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const toggleMilestonePayment = (projId: string, milestoneIndex: number) => {
    const updated = projects.map(proj => {
      if (proj.id === projId) {
        const newMilestones = [...proj.milestones];
        const m = newMilestones[milestoneIndex];
        const prevPaid = m.is_paid;
        m.is_paid = !prevPaid;

        const delta = prevPaid ? -m.amount : m.amount;
        const newPaidAmount = proj.paid_amount + delta;
        const newRemaining = proj.contract_value - newPaidAmount;

        return {
          ...proj,
          milestones: newMilestones,
          paid_amount: newPaidAmount,
          remaining_amount: newRemaining
        };
      }
      return proj;
    });

    setProjects(updated);
    globalErpStore.freelanceProjects = updated;
  };

  const totalContractValues = projects.reduce((s, p) => s + p.contract_value, 0);
  const totalCollected = projects.reduce((s, p) => s + p.paid_amount, 0);
  const totalRemaining = projects.reduce((s, p) => s + p.remaining_amount, 0);
  const totalDirectExpenses = projects.reduce((s, p) => s + p.direct_expenses, 0);
  const totalNetProfit = totalContractValues - totalDirectExpenses;

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Code2 className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-black text-slate-100">إدارة مشاريع تطوير البرمجيات والعمل الحر (Freelance Software)</h2>
            <p className="text-xs text-slate-400 mt-0.5">عقود البرمجة، دفعات مراحل الإنجاز، مصروفات السيرفرات والتراخيص المعزولة تماماً</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Business Unit ID: 2 (Freelance)
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">إجمالي قيمة العقود</span>
          <span className="text-lg font-bold text-slate-100 font-mono">{totalContractValues.toLocaleString()} ج.م</span>
          <span className="text-[10px] text-slate-500 block mt-1">{projects.length} مشاريع مسجلة</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">المحصل الفعلي</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">{totalCollected.toLocaleString()} ج.م</span>
          <span className="text-[10px] text-emerald-500 block mt-1">نسبة التحصيل {Math.round((totalCollected / totalContractValues) * 100)}%</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">مستحقات معلقة</span>
          <span className="text-lg font-bold text-amber-400 font-mono">{totalRemaining.toLocaleString()} ج.م</span>
          <span className="text-[10px] text-amber-500 block mt-1">دفعات ختامية ومراحل</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">تكاليف مباشرة (سيرفرات/AI)</span>
          <span className="text-lg font-bold text-rose-400 font-mono">{totalDirectExpenses.toLocaleString()} ج.م</span>
          <span className="text-[10px] text-slate-500 block mt-1">استضافات ونطاقات</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">صافي ربح البرمجيات</span>
          <span className="text-lg font-bold text-purple-300 font-mono">{totalNetProfit.toLocaleString()} ج.م</span>
          <span className="text-[10px] text-purple-400 block mt-1">هامش ربح {Math.round((totalNetProfit / totalContractValues) * 100)}%</span>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Projects List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200">سجل المشاريع البرمجية الحالية</h3>
            <span className="text-xs text-purple-400 font-mono">({projects.length} مشاريع)</span>
          </div>

          <div className="space-y-3">
            {projects.map(proj => {
              const isSelected = proj.id === selectedProjectId;

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-950/30'
                      : 'bg-slate-950 border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-100">{proj.project_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      proj.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {proj.status === 'COMPLETED' ? 'مكتمل ومسلم' : 'قيد التطوير'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 block mb-2">{proj.client_name}</span>

                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-900">
                    <span className="text-slate-400">العقد: {proj.contract_value.toLocaleString()} ج.م</span>
                    <span className="text-emerald-400 font-bold">المحصل: {proj.paid_amount.toLocaleString()} ج.م</span>
                    {proj.remaining_amount > 0 && (
                      <span className="text-amber-400">المتبقي: {proj.remaining_amount.toLocaleString()} ج.م</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Project Detailed Milestones & Direct Costs */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          {selectedProject ? (
            <>
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-100">{selectedProject.project_name}</h3>
                  <span className="text-xs text-purple-400 font-bold font-mono">
                    صافي ربح المشروع: +{selectedProject.net_profit.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span>العميل: {selectedProject.client_name}</span>
                  <span>•</span>
                  <span>البدء: {selectedProject.start_date}</span>
                  <span>•</span>
                  <span>التسليم المتوقع: {selectedProject.expected_end_date}</span>
                </div>
              </div>

              {/* Milestones Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">دفعات ومراحل إنجاز العقد (Contract Milestones):</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    المتبقي: {selectedProject.remaining_amount.toLocaleString()} ج.م
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedProject.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        m.is_paid 
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' 
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleMilestonePayment(selectedProject.id, idx)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            m.is_paid ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {m.is_paid && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="text-xs font-bold">{m.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">تاريخ الاستحقاق: {m.due_date}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold">{m.amount.toLocaleString()} ج.م</span>
                        <span className={`text-[10px] block ${m.is_paid ? 'text-emerald-400 font-bold' : 'text-amber-400'}`}>
                          {m.is_paid ? 'تم التحصيل' : 'مستحق'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Expenses for Project */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-slate-200">التكاليف المباشرة المحملة على المشروع</h4>
                  </div>
                  <span className="text-xs font-mono text-rose-400 font-bold">
                    -{selectedProject.direct_expenses.toLocaleString()} ج.م
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span>خادم سحابي VPS (Hetzner)</span>
                    <span className="block text-slate-200 font-mono font-bold mt-0.5">1,800 ج.م</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span>نطاق وشهادة SSL (Cloudflare)</span>
                    <span className="block text-slate-200 font-mono font-bold mt-0.5">600 ج.م</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span>اشتراك OpenAI / Anthropic API</span>
                    <span className="block text-slate-200 font-mono font-bold mt-0.5">3,000 ج.م</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">اختر مشروعاً من القائمة لعرض تفاصيله</div>
          )}
        </div>

      </div>

    </div>
  );
};
