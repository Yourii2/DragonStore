import React, { useState } from 'react';
import { BUSINESS_LIFECYCLE_FLOWS, BusinessLifecycleFlow } from '../data/dataFlows';
import { 
  GitFork, 
  ArrowLeft, 
  Database, 
  User, 
  FileSpreadsheet, 
  CheckCircle, 
  Play,
  Layers,
  Laptop,
  Code2,
  Scale
} from 'lucide-react';

export const DataFlowExplorer: React.FC = () => {
  const [selectedFlow, setSelectedFlow] = useState<BusinessLifecycleFlow>(BUSINESS_LIFECYCLE_FLOWS[0]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">مخطط تدفق البيانات والدورات المستندية (End-to-End Information Flows)</h2>
            <p className="text-xs text-slate-400">تتبع مسار البيانات عبر الوحدات الـ 23 وتوليد القيود المحاسبية التلقائية وتحديثات الجداول الذرية.</p>
          </div>
        </div>
      </div>

      {/* Flow Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {BUSINESS_LIFECYCLE_FLOWS.map((flow) => {
          const isSelected = selectedFlow.id === flow.id;
          return (
            <button
              key={flow.id}
              onClick={() => {
                setSelectedFlow(flow);
                setActiveStepIndex(0);
              }}
              className={`p-4 rounded-xl text-right border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    flow.unit === 'store' ? 'bg-amber-500/20 text-amber-300' :
                    flow.unit === 'freelance' ? 'bg-indigo-500/20 text-indigo-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {flow.unit === 'store' ? 'متجر وورش' : flow.unit === 'freelance' ? 'برمجيات حرة' : 'مشترك مالي'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {flow.steps.length} خطوات
                  </span>
                </div>
                <h3 className="font-bold text-xs leading-snug">{flow.titleAr}</h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Flow Inspection Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
        
        {/* Flow Header */}
        <div className="border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold">{selectedFlow.titleEn}</span>
              <h3 className="text-lg font-bold text-white mt-0.5">{selectedFlow.titleAr}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">الخطوة الحالية:</span>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {activeStepIndex + 1} / {selectedFlow.steps.length}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedFlow.description}</p>
        </div>

        {/* Step-by-Step Interactive Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Steps List (Left Side) */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 block mb-1">تسلسل الخطوات التشغيلية:</span>
            {selectedFlow.steps.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`w-full text-right p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step.stepNumber}
                  </span>
                  <div>
                    <span className="text-xs font-bold block text-slate-200">{step.actionAr}</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                      {step.sourceModule} ➔ {step.targetModule}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step Deep Dive (Right 2 Columns) */}
          <div className="lg:col-span-2 bg-slate-950/80 rounded-xl border border-cyan-500/30 p-5 space-y-5">
            {selectedFlow.steps[activeStepIndex] && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      #{selectedFlow.steps[activeStepIndex].stepNumber}
                    </span>
                    <h4 className="font-bold text-base text-white">
                      {selectedFlow.steps[activeStepIndex].actionAr}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    المسؤول: <strong className="text-slate-200">{selectedFlow.steps[activeStepIndex].actor}</strong>
                  </span>
                </div>

                {/* Source & Target Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1">الوحدة المصدرة (Source):</span>
                    <span className="text-cyan-400 font-bold">{selectedFlow.steps[activeStepIndex].sourceModule}</span>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1">الوحدة المستقبلة (Target):</span>
                    <span className="text-indigo-400 font-bold">{selectedFlow.steps[activeStepIndex].targetModule}</span>
                  </div>
                </div>

                {/* Data Payload */}
                <div className="bg-slate-900 rounded-lg p-3.5 border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 block mb-1.5">حزمة البيانات المرسلة (Data Payload):</span>
                  <code className="text-xs font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded block border border-slate-800/80 overflow-x-auto">
                    {selectedFlow.steps[activeStepIndex].dataPayload}
                  </code>
                </div>

                {/* Database Tables Impact */}
                <div className="bg-slate-900 rounded-lg p-3.5 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">الجداول المتأثرة في MySQL (ACID Transactions):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFlow.steps[activeStepIndex].databaseTablesAffected.map((table, tIdx) => (
                      <span key={tIdx} className="text-xs font-mono px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {table}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Accounting Impact */}
                <div className="bg-slate-900 rounded-lg p-3.5 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">الأثر على القيد المحاسبي والأستاذ العام:</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {selectedFlow.steps[activeStepIndex].accountingImpact}
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    disabled={activeStepIndex === 0}
                    onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    الخطوة السابقة
                  </button>
                  <button
                    disabled={activeStepIndex === selectedFlow.steps.length - 1}
                    onClick={() => setActiveStepIndex(Math.min(selectedFlow.steps.length - 1, activeStepIndex + 1))}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    الخطوة التالية
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
