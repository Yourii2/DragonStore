import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  RefreshCw,
  Trash2,
  X,
  CreditCard
} from 'lucide-react';
import { globalErpStore, FreelanceProject } from '../store/erpStore';

export const FreelanceDevView: React.FC = () => {
  const [projects, setProjects] = useState<FreelanceProject[]>([...globalErpStore.freelanceProjects]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'projects' | 'expenses' | 'clients'>('projects');
  const [loading, setLoading] = useState<boolean>(false);

  // Modal State
  const [showAddProject, setShowAddProject] = useState<boolean>(false);
  const [projectForm, setProjectForm] = useState({
    project_name: '',
    client_name: '',
    client_country: 'مصر',
    contract_value: 50000,
    direct_expenses: 3500,
    start_date: new Date().toISOString().slice(0, 10),
    expected_end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    milestones: [
      { name: 'الدفعة المقدمة واعتماد التصاميم والمعمارية', amount: 15000, is_paid: true, due_date: new Date().toISOString().slice(0, 10) },
      { name: 'إنجاز الواجهات الخلفية وربط قواعد البيانات', amount: 20000, is_paid: false, due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
      { name: 'التسليم النهائي، النشر على السيرفر، وتدريب العميل', amount: 15000, is_paid: false, due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }
    ]
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/freelance/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data);
        globalErpStore.freelanceProjects = data.data;
        if (!selectedProjectId && data.data.length > 0) {
          setSelectedProjectId(data.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Using offline store fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const toggleMilestonePayment = async (projId: string, milestoneIndex: number) => {
    try {
      const res = await fetch(`/api/freelance/projects/${projId}/milestones/${milestoneIndex}/toggle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        const updated = projects.map(proj => {
          if (proj.id === projId) {
            return {
              ...proj,
              milestones: data.milestones,
              paid_amount: data.paid_amount,
              remaining_amount: data.remaining_amount
            };
          }
          return proj;
        });
        setProjects(updated);
        globalErpStore.freelanceProjects = updated;
        return;
      }
    } catch (e) {
      console.warn('Backend toggle failed, falling back to local store:', e);
    }

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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/freelance/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProject(false);
        loadProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProject = async (projId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشروع البرمجي نهائياً؟')) return;
    try {
      await fetch(`/api/freelance/projects/${projId}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    const updated = projects.filter(p => p.id !== projId);
    setProjects(updated);
    globalErpStore.freelanceProjects = updated;
    if (selectedProjectId === projId) {
      setSelectedProjectId(updated[0]?.id || '');
    }
  };

  const addMilestoneRow = () => {
    setProjectForm({
      ...projectForm,
      milestones: [
        ...projectForm.milestones,
        {
          name: `المرحلة ${projectForm.milestones.length + 1}`,
          amount: 10000,
          is_paid: false,
          due_date: new Date().toISOString().slice(0, 10)
        }
      ]
    });
  };

  const removeMilestoneRow = (idx: number) => {
    if (projectForm.milestones.length <= 1) return;
    const newM = [...projectForm.milestones];
    newM.splice(idx, 1);
    setProjectForm({ ...projectForm, milestones: newM });
  };

  const updateMilestoneRow = (idx: number, field: string, val: any) => {
    const newM = [...projectForm.milestones];
    newM[idx] = { ...newM[idx], [field]: val };
    setProjectForm({ ...projectForm, milestones: newM });
  };

  const totalContractValues = projects.reduce((s, p) => s + Number(p.contract_value || 0), 0);
  const totalCollected = projects.reduce((s, p) => s + Number(p.paid_amount || 0), 0);
  const totalRemaining = projects.reduce((s, p) => s + Number(p.remaining_amount || 0), 0);
  const totalDirectExpenses = projects.reduce((s, p) => s + Number(p.direct_expenses || 0), 0);
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-100">إدارة مشاريع تطوير البرمجيات والعمل الحر (Freelance Software)</h2>
              <button 
                onClick={loadProjects} 
                className="p-1 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-all"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">عقود البرمجة، دفعات مراحل الإنجاز، مصروفات السيرفرات والتراخيص المعزولة تماماً — متصلة بـ MySQL</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مشروع برمجي جديد</span>
          </button>
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
          <span className="text-[10px] text-emerald-500 block mt-1">
            نسبة التحصيل {totalContractValues > 0 ? Math.round((totalCollected / totalContractValues) * 100) : 0}%
          </span>
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
          <span className="text-[10px] text-purple-400 block mt-1">
            هامش ربح {totalContractValues > 0 ? Math.round((totalNetProfit / totalContractValues) * 100) : 0}%
          </span>
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

          {projects.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">لا توجد مشاريع برمجية مسجلة</div>
          ) : (
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
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          proj.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {proj.status === 'COMPLETED' ? 'مكتمل ومسلم' : 'قيد التطوير'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(proj.id);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="حذف المشروع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 block mb-2">{proj.client_name}</span>

                    <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-900">
                      <span className="text-slate-400">العقد: {Number(proj.contract_value || 0).toLocaleString()} ج.م</span>
                      <span className="text-emerald-400 font-bold">المحصل: {Number(proj.paid_amount || 0).toLocaleString()} ج.م</span>
                      {Number(proj.remaining_amount || 0) > 0 && (
                        <span className="text-amber-400">المتبقي: {Number(proj.remaining_amount || 0).toLocaleString()} ج.م</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Project Detailed Milestones & Direct Costs */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          {selectedProject ? (
            <>
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-black text-slate-100">{selectedProject.project_name}</h3>
                  <span className="text-xs text-purple-400 font-bold font-mono bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-lg">
                    صافي ربح المشروع: +{Number(selectedProject.net_profit || 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                  <span>العميل: {selectedProject.client_name}</span>
                  <span>•</span>
                  <span>البدء: {selectedProject.start_date}</span>
                  <span>•</span>
                  <span>التسليم المتوقع: {selectedProject.expected_end_date || 'غير محدد'}</span>
                </div>
              </div>

              {/* Milestones Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">دفعات ومراحل إنجاز العقد (Contract Milestones):</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    المتبقي: {Number(selectedProject.remaining_amount || 0).toLocaleString()} ج.م
                  </span>
                </div>

                <div className="space-y-2">
                  {(selectedProject.milestones || []).map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        m.is_paid 
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' 
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleMilestonePayment(selectedProject.id, idx)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            m.is_paid ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500'
                          }`}
                          title={m.is_paid ? 'تعيين كغير محصل' : 'تعيين كمحصل'}
                        >
                          {m.is_paid && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="text-xs font-bold">{m.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">تاريخ الاستحقاق: {m.due_date}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold">{Number(m.amount || 0).toLocaleString()} ج.م</span>
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
                    -{Number(selectedProject.direct_expenses || 0).toLocaleString()} ج.م
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span>خادم سحابي VPS (Hetzner)</span>
                    <span className="block text-slate-200 font-mono font-bold mt-0.5">
                      {Math.round(Number(selectedProject.direct_expenses || 0) * 0.4).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span>نطاق وشهادة SSL (Cloudflare)</span>
                    <span className="block text-slate-200 font-mono font-bold mt-0.5">
                      {Math.round(Number(selectedProject.direct_expenses || 0) * 0.2).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span>اشتراك خدمات الذكاء الاصطناعي AI</span>
                    <span className="block text-slate-200 font-mono font-bold mt-0.5">
                      {Math.round(Number(selectedProject.direct_expenses || 0) * 0.4).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">اختر مشروعاً من القائمة لعرض تفاصيله</div>
          )}
        </div>

      </div>

      {/* Modal: Add Freelance Project */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-400" />
                إضافة مشروع تطوير برمجيات وسحابي جديد
              </h3>
              <button onClick={() => setShowAddProject(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">اسم المشروع البرمجي *</label>
                <input
                  type="text"
                  required
                  value={projectForm.project_name}
                  onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  placeholder="مثال: تطبيق توصيل طلبات مع لوحة تحكم"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم العميل / الشركة *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.client_name}
                    onChange={(e) => setProjectForm({ ...projectForm, client_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">دولة العميل</label>
                  <input
                    type="text"
                    value={projectForm.client_country}
                    onChange={(e) => setProjectForm({ ...projectForm, client_country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">قيمة العقد الإجمالية (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={projectForm.contract_value}
                    onChange={(e) => setProjectForm({ ...projectForm, contract_value: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">المصروفات المباشرة (سيرفرات/AI)</label>
                  <input
                    type="number"
                    value={projectForm.direct_expenses}
                    onChange={(e) => setProjectForm({ ...projectForm, direct_expenses: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">تاريخ التسليم المتوقع</label>
                  <input
                    type="date"
                    value={projectForm.expected_end_date}
                    onChange={(e) => setProjectForm({ ...projectForm, expected_end_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Milestones dynamic list */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">مراحل ودفعات العقد (Milestones)</label>
                  <button
                    type="button"
                    onClick={addMilestoneRow}
                    className="px-2 py-1 rounded bg-purple-950/60 text-purple-400 hover:bg-purple-900 border border-purple-800/40 text-[11px] font-bold"
                  >
                    + إضافة مرحلة
                  </button>
                </div>

                <div className="space-y-2">
                  {projectForm.milestones.map((m, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="اسم المرحلة"
                        value={m.name}
                        onChange={(e) => updateMilestoneRow(idx, 'name', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 text-[11px]"
                      />
                      <input
                        type="number"
                        placeholder="المبلغ"
                        value={m.amount}
                        onChange={(e) => updateMilestoneRow(idx, 'amount', Number(e.target.value))}
                        className="w-24 bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 text-[11px] font-mono"
                      />
                      <input
                        type="date"
                        value={m.due_date}
                        onChange={(e) => updateMilestoneRow(idx, 'due_date', e.target.value)}
                        className="w-32 bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 text-[11px]"
                      />
                      <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.is_paid}
                          onChange={(e) => updateMilestoneRow(idx, 'is_paid', e.target.checked)}
                          className="rounded text-purple-600"
                        />
                        <span>محصل</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeMilestoneRow(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="حذف المرحلة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30"
                >
                  حفظ المشروع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
