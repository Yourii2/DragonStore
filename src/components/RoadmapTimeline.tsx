import React, { useState } from 'react';
import { IMPLEMENTATION_ROADMAP, RoadmapPhase } from '../data/roadmapData';
import { 
  Compass, 
  Clock, 
  CheckCircle2, 
  Database, 
  ShieldCheck, 
  Layers, 
  ChevronRight,
  Sparkles,
  ArrowDown
} from 'lucide-react';

export const RoadmapTimeline: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<RoadmapPhase>(IMPLEMENTATION_ROADMAP[0]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">خارطة الطريق الهندسية لتنفيذ النظام (10 مراحل تطويرية)</h2>
            <p className="text-xs text-slate-400">خطة تنفيذية متسلسلة تعتمد منهجية البناء التدريجي والتأكد من توازن القيود وقواعد البيانات في كل مرحلة.</p>
          </div>
        </div>
      </div>

      {/* Main Roadmap Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: 10 Phase Cards List */}
        <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {IMPLEMENTATION_ROADMAP.map((phase) => {
            const isSelected = selectedPhase.phaseNumber === phase.phaseNumber;
            return (
              <button
                key={phase.phaseNumber}
                onClick={() => setSelectedPhase(phase)}
                className={`w-full text-right p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}>
                  {phase.phaseNumber}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-amber-400">{phase.durationWeeks}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      Phase {phase.phaseNumber}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs leading-snug text-slate-100">{phase.titleAr}</h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Selected Phase Deep Dive */}
        <div className="lg:col-span-2 space-y-5">
          {selectedPhase && (
            <div className="bg-slate-900/90 rounded-2xl border border-amber-500/40 p-6 space-y-6 shadow-xl">
              
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {selectedPhase.titleEn}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    المدة المتوقعة: {selectedPhase.durationWeeks}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white leading-snug">{selectedPhase.titleAr}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <strong className="text-amber-400">الهدف الاستراتيجي للمرحلة: </strong>
                  {selectedPhase.goalAr}
                </p>
              </div>

              {/* Functional Deliverables */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-sm text-white">المخرجات والوظائف المطلوبة (Deliverables):</h4>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedPhase.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Database Tasks */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-sm text-white">مهام قاعدة بيانات MySQL والـ DDL:</h4>
                </div>
                <div className="bg-slate-950/80 rounded-xl p-4 border border-indigo-900/40 space-y-2">
                  {selectedPhase.databaseTasks.map((task, idx) => (
                    <p key={idx} className="text-xs font-mono text-indigo-300 flex items-center gap-2">
                      <span className="text-indigo-500">▶</span>
                      <span>{task}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Testing & QA Acceptance Criteria */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm text-white">معايير القبول والاختبار (Acceptance Gates):</h4>
                </div>
                <div className="bg-slate-950/80 rounded-xl p-4 border border-amber-900/40 space-y-2 text-xs text-slate-300">
                  {selectedPhase.testCriteria.map((crit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">●</span>
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
