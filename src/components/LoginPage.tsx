import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Key, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { systemAuthStore, CurrentUser } from '../store/systemAuthStore';

interface LoginPageProps {
  onLoginSuccess: (user: CurrentUser) => void;
  onReinstall?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>(() => {
    try {
      return localStorage.getItem('dragon_erp_remembered_username') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState<string>(() => {
    try {
      return localStorage.getItem('dragon_erp_remembered_password') || '';
    } catch {
      return '';
    }
  });
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dragon_erp_remember_me');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'بيانات الدخول غير صحيحة');
      }

      // Handle "Remember Me"
      try {
        if (rememberMe) {
          localStorage.setItem('dragon_erp_remember_me', 'true');
          localStorage.setItem('dragon_erp_remembered_username', username);
          localStorage.setItem('dragon_erp_remembered_password', password);
        } else {
          localStorage.setItem('dragon_erp_remember_me', 'false');
          localStorage.removeItem('dragon_erp_remembered_username');
          localStorage.removeItem('dragon_erp_remembered_password');
        }
      } catch (err) {
        console.error('Failed to store rememberMe settings in localStorage', err);
      }

      systemAuthStore.login(data.user, rememberMe);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تسجيل الدخول، يرجى التحقق من صحة البيانات المسجلة بقاعدة البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-8 text-center border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/20 mx-auto mb-3 border border-cyan-500/40 overflow-hidden">
            <img 
              src="/dragon-logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain p-1"
            />
          </div>
          
          <h1 className="text-lg font-black text-slate-100">متجر دراجون للاليكترونيات و الاعمال الحره</h1>
          <p className="text-xs text-cyan-400 font-bold mt-1">شركه دراجون للأنظمه الامنيه • م . ممدوح المصرى</p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          
          {errorMessage && (
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-400 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username / Email */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>اسم المستخدم أو البريد الرسمي:</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم أو البريد"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>كلمة المرور:</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Remember Me & Security */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <span>تذكر جلستي</span>
              </label>

              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>اتصال مشفر 256-bit</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>تسجيل الدخول للنظام</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
};
