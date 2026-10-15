import React, { useState } from 'react';
import { 
  User, 
  Key, 
  Mail, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  UserCheck,
  Calendar,
  BadgeCheck,
  ShieldAlert
} from 'lucide-react';
import { CurrentUser } from '../store/systemAuthStore';

interface UserProfileViewProps {
  currentUser: CurrentUser;
  onUpdateUser: (updatedUser: CurrentUser) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  onUpdateUser
}) => {
  const [fullName, setFullName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف أو أرقام على الأقل' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          currentPassword,
          newPassword: newPassword || undefined,
          fullName,
          email
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'فشل تحديث البيانات أو كلمة المرور');
      }

      setFeedback({ type: 'success', message: 'تم تحديث الملف الشخصي وكلمة المرور بنجاح!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      onUpdateUser({
        ...currentUser,
        name: fullName,
        email: email
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'حدث خطأ بالاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" dir="rtl">
      
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${currentUser.avatarColor || 'bg-gradient-to-tr from-cyan-600 to-blue-600'} text-white font-black flex items-center justify-center text-2xl shadow-xl shadow-cyan-950/20`}>
            {currentUser.name ? currentUser.name.charAt(0) : 'م'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{currentUser.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>{currentUser.roleTitleAr}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              اسم المستخدم: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">@{currentUser.username}</span> • البريد: <span className="font-mono text-slate-700 dark:text-slate-300">{currentUser.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] font-bold">مستوى الأمان:</span>
            <span className="font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مشفر ومحمي (Argon2/Bcrypt)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form & User Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-500" />
                <span>البيانات الأساسية ومعلومات الحساب</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                قم بتحديث اسمك وبريدك الإلكتروني الذي يظهر في الفواتير والعمليات
              </p>
            </div>

            {feedback && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
                feedback.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الاسم الكامل:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                    placeholder="الاسم الكامل"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  البريد الإلكتروني الرسمي:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                    placeholder="name@dragon.com"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-500" />
                  <span>تغيير كلمة المرور وتأمين الحساب</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اترك الحقول التالية فارغة إذا كنت ترغب بتحديث بيانات الاسم والبريد فقط دون تغيير كلمة المرور
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  كلمة المرور الحالية (مطلوبة لتأكيد الهوية):
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                    placeholder="أدخل كلمة المرور الحالية لتأكيد التعديل"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    كلمة المرور الجديدة:
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                      placeholder="6 أحرف أو أرقام على الأقل"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    تأكيد كلمة المرور الجديدة:
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                      placeholder="أعد كتابة كلمة المرور الجديدة"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-cyan-950/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات وتحديث كلمة المرور</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Roles & Privileges Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>الصلاحيات والوحدات المتاحة</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">الدور الوظيفي:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{currentUser.roleTitleAr}</span>
                <span className="font-mono text-[10px] text-cyan-500 block mt-0.5">Role Code: {currentUser.role}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">نطاق الوصول والتشغيل:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {currentUser.accessibleUnits?.includes('BOTH') ? 'كافة الوحدات (المتجر والأنظمة الأمنية + البرمجيات الحرة)' : 'وحدة مخصصة'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">حالة الحساب:</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1.5 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>نشط ومفعل مع التشفير الكامل</span>
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
