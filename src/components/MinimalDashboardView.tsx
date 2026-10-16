import React from 'react';
import { CurrentUser } from '../store/systemAuthStore';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface MinimalDashboardViewProps {
  currentUser?: CurrentUser | null;
}

export const MinimalDashboardView: React.FC<MinimalDashboardViewProps> = ({ currentUser }) => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute w-80 h-80 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-2xl pointer-events-none -z-10 translate-y-12" />

      {/* Main Container Card */}
      <div className="flex flex-col items-center max-w-lg w-full">
        
        {/* Dragon Logo with Glowing Frame */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-700 animate-pulse" />
          
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xl flex items-center justify-center backdrop-blur-xl transition-transform duration-300 transform group-hover:scale-105">
            <img 
              src="/dragon-logo.png" 
              alt="شعار دراجون ستور" 
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>

        {/* Software Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          متجر دراجون للأنظمة الأمنية والحلول البرمجية
        </h1>

        <div className="text-sm sm:text-base font-bold text-cyan-600 dark:text-cyan-400 font-mono tracking-wide mb-6">
          Dragon Store ERP & POS Management System
        </div>

        {/* User Greeting Pill */}
        {currentUser && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              مرحباً بك: <strong className="text-slate-900 dark:text-slate-100">{currentUser.name}</strong>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-black">
              {currentUser.roleTitleAr || currentUser.role}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
