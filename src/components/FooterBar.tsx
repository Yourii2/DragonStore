import React from 'react';
import { 
  Phone, 
  ArrowUp, 
  MessageCircle
} from 'lucide-react';

interface FooterBarProps {
  isDarkMode: boolean;
  onReinstall?: () => void;
  onScrollToTop: () => void;
}

export const FooterBar: React.FC<FooterBarProps> = ({
  isDarkMode,
  onScrollToTop
}) => {
  return (
    <footer className={`border-t transition-colors duration-200 mt-auto shrink-0 z-30 ${
      isDarkMode 
        ? 'bg-slate-900/90 border-slate-800/80 text-slate-400 backdrop-blur-md' 
        : 'bg-white/90 border-slate-200/80 text-slate-600 backdrop-blur-md shadow-xs'
    }`} dir="rtl">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 text-xs">
          
          {/* Right side: Developer & Company identity */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-right">
            <div className="flex items-center gap-2">
              <img 
                src="/dragon-logo.png" 
                alt="Logo" 
                className="w-5 h-5 object-contain drop-shadow"
              />
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                شركه دراجون للأنظمه الامنيه
              </span>
            </div>

            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="font-black text-cyan-500 dark:text-cyan-400 text-xs">
              م . ممدوح المصرى
            </span>

            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
              متجر دراجون للاليكترونيات و الاعمال الحره
            </span>
          </div>

          {/* Center: Contact Numbers with ICON-ONLY buttons (Phone & WhatsApp) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {/* Number 1: 01150006289 */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px]">
              <span className="text-slate-300 font-mono font-bold" dir="ltr">01150006289</span>
              <a 
                href="tel:01150006289" 
                className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition-colors flex items-center justify-center"
                title="اتصال هاتفي: 01150006289"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://wa.me/201150006289" 
                target="_blank" 
                rel="noreferrer" 
                className="p-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/25 transition-colors flex items-center justify-center"
                title="محادثة واتساب: 01150006289"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Number 2: 01050016289 */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px]">
              <span className="text-slate-300 font-mono font-bold" dir="ltr">01050016289</span>
              <a 
                href="tel:01050016289" 
                className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/25 transition-colors flex items-center justify-center"
                title="اتصال هاتفي: 01050016289"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://wa.me/201050016289" 
                target="_blank" 
                rel="noreferrer" 
                className="p-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/25 transition-colors flex items-center justify-center"
                title="محادثة واتساب: 01050016289"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Left side: Scroll to top only */}
          <div className="flex items-center gap-2">
            <button
              onClick={onScrollToTop}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-slate-800/60 hover:bg-slate-700 text-cyan-400 border-slate-700/60' 
                  : 'bg-slate-100 hover:bg-slate-200 text-cyan-600 border-slate-200'
              }`}
              title="العودة للأعلى"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
};
