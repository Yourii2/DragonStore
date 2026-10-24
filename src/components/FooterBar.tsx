import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  ArrowUp, 
  MessageCircle,
  Building2
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
  const [companyInfo, setCompanyInfo] = useState<{ name: string; phones: string[] }>({
    name: '',
    phones: []
  });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch('/api/settings/company');
        const data = await res.json();
        if (data.success && data.data) {
          const rawPhones = (data.data.phones || '')
            .split(/[-–,/|]/)
            .map((p: string) => p.trim())
            .filter((p: string) => p.length >= 7);

          setCompanyInfo({
            name: data.data.company_name || '',
            phones: rawPhones
          });
        }
      } catch (e) {
        console.error('Failed to load company info for footer', e);
      }
    };
    fetchInfo();

    const handleUpdate = () => fetchInfo();
    window.addEventListener('company-settings-updated', handleUpdate);
    return () => window.removeEventListener('company-settings-updated', handleUpdate);
  }, []);

  return (
    <footer className={`border-t transition-colors duration-200 mt-auto shrink-0 z-30 ${
      isDarkMode 
        ? 'bg-slate-900/90 border-slate-800/80 text-slate-400 backdrop-blur-md' 
        : 'bg-white/90 border-slate-200/80 text-slate-600 backdrop-blur-md shadow-xs'
    }`} dir="rtl">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 text-xs">
          
          {/* Right side: Dynamic Company Identity */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-right">
            <div className="flex items-center gap-2">
              <img 
                src="/dragon-logo.png" 
                alt="Logo" 
                className="w-5 h-5 object-contain drop-shadow"
              />
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                {companyInfo.name || 'نظام إدارة المتاجر والمشاريع'}
              </span>
            </div>
          </div>

          {/* Center: Dynamic Contact Numbers from Database */}
          {companyInfo.phones.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {companyInfo.phones.map((phoneNum, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px]">
                  <span className="text-slate-300 font-mono font-bold" dir="ltr">{phoneNum}</span>
                  <a 
                    href={`tel:${phoneNum}`} 
                    className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition-colors flex items-center justify-center"
                    title={`اتصال هاتفي: ${phoneNum}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a 
                    href={`https://wa.me/${phoneNum.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/25 transition-colors flex items-center justify-center"
                    title={`محادثة واتساب: ${phoneNum}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}

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
