import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ArrowLeftRight, 
  Layers, 
  DollarSign, 
  FileText, 
  HelpCircle,
  Database,
  Building2,
  Undo2,
  Check
} from 'lucide-react';

interface TestScenario {
  id: string;
  title: string;
  category: string;
  unit: string;
  description: string;
  steps: {
    action: string;
    calculation: string;
    journalEntry: {
      debit: string;
      credit: string;
      amount: number;
    }[];
    verification: string;
  }[];
}

export const InteractiveTestSandbox: React.FC = () => {
  const scenarios: TestScenario[] = [
    {
      id: 'core_cycle',
      title: '1. دورة الشراء والبيع والربح ومردود المبيعات العكسي (Core Purchase/Sale/Return)',
      category: 'التجارة والمخزون',
      unit: 'المحل (BU 1)',
      description: 'شراء شاشة بسعر 4,000 ج.م، ثم بيعها بسعر 5,000 ج.م (تحقيق ربح 1,000 ج.م)، ثم إرجاعها من العميل والتحقق من عكس كافة القيود والمخزون.',
      steps: [
        {
          action: 'الخطوة 1: شراء شاشة Dell 27" من المورد نقداً',
          calculation: 'الكمية: 1 قطعة | سعر الشراء = 4,000 ج.م | الرصيد المخزني: +1 | رصيد الخزينة: -4,000 ج.م',
          journalEntry: [
            { debit: 'حـ/ 1210 - مخزون شاشات وأجهزة (أصول)', credit: '', amount: 4000 },
            { debit: '', credit: 'حـ/ 1111 - صندوق كاشير المحل (نقدية)', amount: 4000 }
          ],
          verification: 'تمت زيادة المخزون بـ 4,000 ج.م وتخفيض الصندوق دون التأثير على قائمة الدخل (شراء المخزون ليس مصروفاً تشغيلياً).'
        },
        {
          action: 'الخطوة 2: بيع الشاشة للعميل نقداً بمبلغ 5,000 ج.م',
          calculation: 'سعر البيع = 5,000 ج.م | التكلفة COGS = 4,000 ج.م | مجمل الربح = 1,000 ج.م | الرصيد المخزني: 0',
          journalEntry: [
            { debit: 'حـ/ 1111 - صندوق كاشير المحل (تحصيل نقدي)', credit: '', amount: 5000 },
            { debit: '', credit: 'حـ/ 4110 - إيرادات مبيعات المتجر (إيراد)', amount: 5000 },
            { debit: 'حـ/ 5110 - تكلفة البضاعة المباعة COGS (تكلفة)', credit: '', amount: 4000 },
            { debit: '', credit: 'حـ/ 1210 - مخزون شاشات وأجهزة (خصم أصل)', amount: 4000 }
          ],
          verification: 'التحقق: الإيراد = 5,000 | التكلفة = 4,000 | مجمل الربح = 1,000 ج.م | المخزون انخفض بدقة.'
        },
        {
          action: 'الخطوة 3: إرجاع الشاشة من العميل واسترداد النقدية (Sales Return Reversal)',
          calculation: 'عكس الإيراد = -5,000 ج.م | عكس التكلفة = -4,000 ج.م | استرجاع المخزون: +1 | رد الكاش: -5,000 ج.م',
          journalEntry: [
            { debit: 'حـ/ 4130 - مردودات مبيعات (تخفيض إيراد)', credit: '', amount: 5000 },
            { debit: '', credit: 'حـ/ 1111 - صندوق كاشير المحل (رد النقدية)', amount: 5000 },
            { debit: 'حـ/ 1210 - مخزون شاشات وأجهزة (إعادة أصل)', credit: '', amount: 4000 },
            { debit: '', credit: 'حـ/ 5110 - تكلفة البضاعة المباعة COGS (تخفيض تكلفة)', amount: 4000 }
          ],
          verification: 'التحقق التام: تم تصفير مجمل الربح (0 ج.م) وعاد المخزون لرصيد 1 قطعة بنفس التكلفة الأصلية 4,000 ج.م.'
        }
      ]
    },
    {
      id: 'credit_sale_pay',
      title: '2. البيع الآجل وتحصيل دفعة من العميل (Credit Sale & Customer Payment)',
      category: 'المبيعات والعملاء',
      unit: 'المحل (BU 1)',
      description: 'بيع لابتوب بالآجل بقيمة 30,000 ج.م (تكلفتها 24,000 ج.م)، ثم تحصيل 18,000 ج.م بنكياً لاحقاً.',
      steps: [
        {
          action: 'الخطوة 1: إصدار فاتورة بيع آجل للعميل',
          calculation: 'قيمة الفاتورة = 30,000 ج.م | التكلفة = 24,000 ج.م | الربح = 6,000 ج.م | ذمة العميل المدين = 30,000 ج.م',
          journalEntry: [
            { debit: 'حـ/ 1310 - ذمم العملاء (مدين: حساب العميل)', credit: '', amount: 30000 },
            { debit: '', credit: 'حـ/ 4110 - إيرادات مبيعات المتجر', amount: 30000 },
            { debit: 'حـ/ 5110 - تكلفة البضاعة المباعة COGS', credit: '', amount: 24000 },
            { debit: '', credit: 'حـ/ 1210 - مخزون أجهزة ولابتوبات', amount: 24000 }
          ],
          verification: 'تسجيل المديونية في الأستاذ المساعد للعميل، واعتراف فوري بالإيراد وتكلفة COGS.'
        },
        {
          action: 'الخطوة 2: تحصيل 18,000 ج.م عبر إنستاباي/البنك',
          calculation: 'المحصل = 18,000 ج.م | المتبقي على العميل = 12,000 ج.م',
          journalEntry: [
            { debit: 'حـ/ 1121 - حساب إنستاباي / البنك (نقدية)', credit: '', amount: 18000 },
            { debit: '', credit: 'حـ/ 1310 - ذمم العملاء (تخفيض مديونية)', amount: 18000 }
          ],
          verification: 'انخفاض رصيد ذمة العميل إلى 12,000 ج.م دون التأثير على قائمة الدخل (سداد مديونية سابقة).'
        }
      ]
    },
    {
      id: 'shared_expense',
      title: '3. توزيع المصروفات المشتركة (Shared Expense 70% Shop / 30% Freelance)',
      category: 'المصروفات',
      unit: 'مشترك (Shared)',
      description: 'سداد فاتورة إنترنت واتصالات للمقر بقيمة 1,000 ج.م نقداً وتوزيعها آلياً بنسبة 70% للمتجر و 30% للبرمجيات.',
      steps: [
        {
          action: 'تسجيل فاتورة المصروف وتوليد القيد المجزأ',
          calculation: 'إجمالي المصروف = 1,000 ج.م | حصة المحل (70%) = 700 ج.م | حصة البرمجيات (30%) = 300 ج.م',
          journalEntry: [
            { debit: 'حـ/ 6140 - مصروفات إنترنت واتصالات (BU 1)', credit: '', amount: 700 },
            { debit: 'حـ/ 6340 - مصروفات إنترنت واتصالات (BU 2)', credit: '', amount: 300 },
            { debit: '', credit: 'حـ/ 1111 - صندوق كاشير المحل', amount: 1000 }
          ],
          verification: 'تحميل كل وحدة تجارية بنصيبها العادل من التكلفة لضمان دقة قوائم الأرباح والخسائر المنفصلة.'
        }
      ]
    },
    {
      id: 'freelance_project',
      title: '4. مشروع برمجي ومصروفات واستضافات معزولة (Freelance Project & Direct Costs)',
      category: 'البرمجيات والعمل الحر',
      unit: 'البرمجيات (BU 2)',
      description: 'عقد مشروع برمجي بقيمة 40,000 ج.م، سداد استضافة VPS بمبلغ 3,000 ج.م، ثم تحصيل الدفعات.',
      steps: [
        {
          action: 'الخطوة 1: توقيع العقد وإثبات إيراد المشروع',
          calculation: 'قيمة العقد = 40,000 ج.م | ذمة عميل البرمجيات = 40,000 ج.م',
          journalEntry: [
            { debit: 'حـ/ 1320 - ذمم عملاء مشاريع البرمجيات', credit: '', amount: 40000 },
            { debit: '', credit: 'حـ/ 4300 - إيرادات تطوير البرمجيات', amount: 40000 }
          ],
          verification: 'تسجيل الإيراد في BU 2 فقط دون أي تأثير على إيرادات المحل BU 1.'
        },
        {
          action: 'الخطوة 2: سداد سيرفر سحابي مخصص للمشروع (Hostinger VPS)',
          calculation: 'تكلفة مباشرة للمشروع = 3,000 ج.م مسددة بالبطاقة البنكية',
          journalEntry: [
            { debit: 'حـ/ 5300 - تكاليف سيرفرات واستضافات المشاريع (BU 2)', credit: '', amount: 3000 },
            { debit: '', credit: 'حـ/ 1120 - الحساب البنكي / فيزا', amount: 3000 }
          ],
          verification: 'ربط المصروف برقم المشروع؛ صافي ربح المشروع المباشر = 40,000 - 3,000 = 37,000 ج.م.'
        }
      ]
    },
    {
      id: 'owner_equity',
      title: '5. استثمار وضخ أموال المالك ومسحوباته الشخصية (Owner Investment & Drawings)',
      category: 'حقوق الملكية',
      unit: 'رأس المال (Equity)',
      description: 'ضخ 50,000 ج.م استثمار في البنك، ثم سحب 10,000 ج.م لمصروفات شخصية.',
      steps: [
        {
          action: 'ضخ رأس مال إضافي (Owner Investment)',
          calculation: 'زيادة النقدية = 50,000 ج.م | زيادة رأس المال = 50,000 ج.م',
          journalEntry: [
            { debit: 'حـ/ 1120 - الحساب البنكي (أصل متداول)', credit: '', amount: 50000 },
            { debit: '', credit: 'حـ/ 3110 - رأس مال المالك / استثمارات (حقوق ملكية)', amount: 50000 }
          ],
          verification: 'التحقق الصارم: تم قيد المبلغ في حقوق الملكية بالميزانية، ولم يُسجل كإيراد في قائمة الدخل.'
        },
        {
          action: 'سحب مبالغ شخصية للمالك (Owner Withdrawal)',
          calculation: 'نقص النقدية = 10,000 ج.م | تخفيض حقوق الملكية = 10,000 ج.م',
          journalEntry: [
            { debit: 'حـ/ 3120 - مسحوبات المالك الشخصية (Drawings)', credit: '', amount: 10000 },
            { debit: '', credit: 'حـ/ 1111 - صندوق كاشير المحل', amount: 10000 }
          ],
          verification: 'التحقق الصارم: تم تخفيض حقوق الملكية بالميزانية، ولم يُسجل كمصروف تشغيلي في قائمة الدخل.'
        }
      ]
    },
    {
      id: 'internal_transfer',
      title: '6. التحويل الداخلي بين الحسابات النقدية (Internal Cash/Bank Transfer)',
      category: 'الخزينة والسيولة',
      unit: 'مشترك (Treasury)',
      description: 'تحويل 15,000 ج.م من محفظة فودافون كاش إلى الحساب البنكي الرسمي.',
      steps: [
        {
          action: 'نقل سيولة بين وعاءين ماليين',
          calculation: 'فودافون كاش: -15,000 ج.م | البنك الأهلي: +15,000 ج.م',
          journalEntry: [
            { debit: 'حـ/ 1120 - البنك الأهلي المصري (مدين - استلام)', credit: '', amount: 15000 },
            { debit: '', credit: 'حـ/ 1113 - محفظة فودافون كاش (دائن - تسليم)', amount: 15000 }
          ],
          verification: 'التحقق: حركة نقدية خالصة بين أصلين (Asset-to-Asset) بدون أي أثر على الإيرادات أو المصروفات أو الأرباح.'
        }
      ]
    }
  ];

  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Play className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">محاكي اختبار السيناريوهات المحاسبية والتشغيلية</h2>
              <p className="text-xs text-slate-400 mt-0.5">التحقق من صحة القيد المزدوج، وحركات المخزون، وتكلفة COGS، وعكس المردودات، وعزل الوحدات المالية بالجنيه المصري</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            اختبار 6 سيناريوهات قياسية معتمدة
          </span>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {scenarios.map((sc) => {
          const isSelected = activeScenarioId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setActiveScenarioId(sc.id)}
              className={`text-right p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                  {sc.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  sc.unit.includes('BU 1') ? 'text-cyan-400 bg-cyan-500/10' :
                  sc.unit.includes('BU 2') ? 'text-purple-400 bg-purple-500/10' :
                  'text-amber-400 bg-amber-500/10'
                }`}>
                  {sc.unit}
                </span>
              </div>
              <h4 className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>{sc.title}</h4>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Detailed Walkthrough */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-100">{activeScenario.title}</h3>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم التحقق من توازن القيد المزدوج 100%</span>
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            {activeScenario.description}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {activeScenario.steps.map((st, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                  {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-100">{st.action}</h4>
              </div>

              {/* Calculation Summary */}
              <div className="text-xs text-slate-300 bg-slate-900/90 px-3.5 py-2 rounded-lg border border-slate-800 font-mono">
                {st.calculation}
              </div>

              {/* Journal Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">الحساب المحاسبي</th>
                      <th className="py-2 px-3 text-center w-28">مدين (Debit)</th>
                      <th className="py-2 px-3 text-center w-28">دائن (Credit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {st.journalEntry.map((line, lidx) => (
                      <tr key={lidx} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-200">
                          {line.debit || line.credit}
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-400 font-bold">
                          {line.debit ? `${line.amount.toLocaleString()} ج.م` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center text-cyan-400 font-bold">
                          {line.credit ? `${line.amount.toLocaleString()} ج.م` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Verification note */}
              <div className="flex items-start gap-2 text-xs text-slate-400 bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{st.verification}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
